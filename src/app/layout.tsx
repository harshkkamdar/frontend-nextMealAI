import type { Metadata, Viewport } from 'next'
import { Archivo } from 'next/font/google'
import { Toaster } from 'sonner'
import { SplashHider } from '@/components/native/splash-hider'
import './globals.css'

// Variable weight plus the width axis: wide titles and hero numbers use font-stretch (FIQR v2).
const archivo = Archivo({ subsets: ['latin'], axes: ['wdth'], variable: '--font-archivo', display: 'swap' })

export const metadata: Metadata = { title: 'FIQR', description: 'Food, training and weekly check-ins with Geo, your coach.' }
export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover', themeColor: '#FDF6EC' }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={archivo.variable}>
      <body>
        {children}
        {/* Opaque strip under the phone's status bar: headers are padded below it, but scrolled content would otherwise slide under the clock and battery. Height is 0 on the web. */}
        <div aria-hidden="true" className="pointer-events-none fixed inset-x-0 top-0 z-[55] bg-cream" style={{ height: 'var(--safe-top)' }} />
        <Toaster
          position="top-center"
          // Below the 60px header row (PushedHeader and LargeTitleHeader) so a toast never covers the back button.
          offset={{ top: 'calc(64px + var(--safe-top))' }}
          mobileOffset={{ top: 'calc(64px + var(--safe-top))' }}
          // height auto: sonner pins the measured first-paint height, which clips text that wraps once the font loads.
          toastOptions={{ style: { height: 'auto', padding: '12px 16px', lineHeight: 1.35, background: '#FFFFFF', color: '#111C35', border: '1px solid rgba(17,28,53,.16)', borderRadius: 16, fontFamily: 'var(--font-archivo)', fontSize: 14.5, fontWeight: 600 } }}
        />
        <SplashHider />
      </body>
    </html>
  )
}
