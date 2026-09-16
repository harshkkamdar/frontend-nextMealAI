import { registerDevice, unregisterDevice } from '@/lib/api/devices.api'
import { APP_VERSION, isNative, platform } from './index'
import { kvGet, kvRemove, kvSet } from './storage'

interface ListenerHandle {
  remove: () => Promise<void>
}

let pushActionListenerPromise: Promise<void> | null = null

export interface ReminderPlan {
  mealReminderTime?: string
  workoutToday?: boolean
  checkInToday?: boolean
}

export function buildReminderPlan(input: {
  notificationsEnabled: boolean
  notificationTime: string | null
  nextWorkoutIsToday: boolean
  checkInIsToday: boolean
}): ReminderPlan | null {
  if (!input.notificationsEnabled) return null
  return {
    ...(input.notificationTime ? { mealReminderTime: input.notificationTime } : {}),
    workoutToday: input.nextWorkoutIsToday,
    checkInToday: input.checkInIsToday,
  }
}

export async function pushPermissionState(): Promise<
  'granted' | 'denied' | 'prompt' | 'unsupported'
> {
  if (!isNative()) return 'unsupported'
  const { PushNotifications } = await import('@capacitor/push-notifications')
  const { receive } = await PushNotifications.checkPermissions()
  if (receive === 'granted' || receive === 'denied') return receive
  return 'prompt'
}

export async function registerPush(): Promise<boolean> {
  if (!isNative()) return false

  try {
    const { PushNotifications } = await import('@capacitor/push-notifications')
    const permission = await PushNotifications.requestPermissions()
    if (permission.receive !== 'granted') return false

    if (!pushActionListenerPromise) {
      pushActionListenerPromise = PushNotifications.addListener(
        'pushNotificationActionPerformed',
        ({ notification }) => {
          const route = notification.data?.route
          if (typeof route === 'string' && route.startsWith('/')) {
            window.location.assign(route)
          }
        }
      )
        .then(() => undefined)
        .catch((error: unknown) => {
          pushActionListenerPromise = null
          throw error
        })
    }
    await pushActionListenerPromise

    return await new Promise<boolean>((resolve) => {
      let settled = false
      let registration: ListenerHandle | undefined
      let registrationError: ListenerHandle | undefined
      const finish = (result: boolean) => {
        if (settled) return
        settled = true
        void registration?.remove()
        void registrationError?.remove()
        resolve(result)
      }

      void (async () => {
        registration = await PushNotifications.addListener('registration', ({ value }) => {
          void (async () => {
            try {
              await registerDevice({ token: value, platform: platform(), app_version: APP_VERSION })
              await kvSet('fiqr:push-token', value)
              finish(true)
            } catch {
              finish(false)
            }
          })()
        })
        registrationError = await PushNotifications.addListener('registrationError', () => {
          finish(false)
        })
        await PushNotifications.register()
      })().catch(() => finish(false))
    })
  } catch {
    return false
  }
}

export async function unregisterPush(): Promise<void> {
  if (!isNative()) return
  const token = await kvGet('fiqr:push-token')
  if (!token) return
  try {
    await unregisterDevice(token)
  } finally {
    await kvRemove('fiqr:push-token')
  }
}

export async function scheduleLocalReminders(plan: ReminderPlan): Promise<void> {
  if (!isNative()) return
  const { LocalNotifications } = await import('@capacitor/local-notifications')
  const permission = await LocalNotifications.requestPermissions()
  if (permission.display !== 'granted') return

  await LocalNotifications.cancel({
    notifications: [{ id: 1001 }, { id: 1002 }, { id: 1003 }],
  })

  const notifications = []
  if (plan.mealReminderTime) {
    const [hour, minute] = plan.mealReminderTime.split(':').map(Number)
    notifications.push({
      id: 1001,
      title: 'Time to log',
      body: 'A quick meal log keeps Geo accurate.',
      schedule: { on: { hour, minute }, repeats: true },
    })
  }
  if (plan.workoutToday) {
    const at = new Date()
    at.setHours(7, 0, 0, 0)
    notifications.push({
      id: 1002,
      title: 'Training day',
      body: 'Your next session is ready in Train.',
      schedule: { at },
    })
  }
  if (plan.checkInToday) {
    const at = new Date()
    at.setHours(9, 0, 0, 0)
    notifications.push({
      id: 1003,
      title: 'Check-in day',
      body: 'Geo has read your week. Open FIQR to see the verdict.',
      schedule: { at },
    })
  }

  if (notifications.length > 0) {
    await LocalNotifications.schedule({ notifications })
  }
}
