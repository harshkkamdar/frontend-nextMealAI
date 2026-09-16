import type { Metadata, Viewport } from 'next'
import { Archivo } from 'next/font/google'
import { Toaster } from 'sonner'
import './globals.css'

const archivo = Archivo({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-archivo', display: 'swap' })

export const metadata: Metadata = { title: 'FIQR', description: 'Food, training and weekly check-ins with Geo, your coach.' }
export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover', themeColor: '#FDF6EC' }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={archivo.variable}>
      <body>
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  )
}
