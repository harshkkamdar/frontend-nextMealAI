import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'app.fiqr.mobile',
  appName: 'FIQR',
  webDir: 'out',
  backgroundColor: '#FDF6EC',
  server: { iosScheme: 'https', androidScheme: 'https' },
  ios: { contentInset: 'never', scrollEnabled: true },
  plugins: {
    SplashScreen: { launchAutoHide: false, backgroundColor: '#FDF6EC', showSpinner: false },
    Keyboard: { resize: 'native', resizeOnFullScreen: true },
    PushNotifications: { presentationOptions: ['badge', 'sound', 'alert'] },
  },
}

export default config
