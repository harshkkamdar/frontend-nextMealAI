import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'app.fiqr.mobile',
  appName: 'FIQR',
  webDir: 'out',
  backgroundColor: '#FDF6EC',
  // CAP_SERVER_URL is for local measurement builds only (redesign prototypes on a host server); store builds never set it.
  server: process.env.CAP_SERVER_URL
    ? { url: process.env.CAP_SERVER_URL, cleartext: true, iosScheme: 'https', androidScheme: 'https' }
    : { iosScheme: 'https', androidScheme: 'https' },
  ios: { contentInset: 'never', scrollEnabled: true },
  plugins: {
    SplashScreen: { launchAutoHide: false, backgroundColor: '#FDF6EC', showSpinner: false },
    Keyboard: { resize: 'native', resizeOnFullScreen: true },
    PushNotifications: { presentationOptions: ['badge', 'sound', 'alert'] },
  },
}

export default config
