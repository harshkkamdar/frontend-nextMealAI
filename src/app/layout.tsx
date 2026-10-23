import type { Metadata, Viewport } from 'next'
import { Archivo } from 'next/font/google'
import { Toaster } from 'sonner'
import { SplashHider } from '@/components/native/splash-hider'
import './globals.css'

const archivo = Archivo({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-archivo', display: 'swap' })

export const metadata: Metadata = { title: 'FIQR', description: 'Food, training and weekly check-ins with Geo, your coach.' }
export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover', themeColor: '#FDF6EC' }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={archivo.variable}>
      <body>
        {children}
        <Toaster
          position="top-center"
          toastOptions={{ style: { background: '#FFFFFF', color: '#111C35', border: '1px solid rgba(17,28,53,.16)', borderRadius: 16, fontFamily: 'var(--font-archivo)', fontSize: 14.5, fontWeight: 600 } }}
        />
        <SplashHider />
      </body>
    </html>
  )
}
