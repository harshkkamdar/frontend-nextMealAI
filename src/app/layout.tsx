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
          // left/right 0: sonner's phone layout is 100% wide from its side offset, which pushed a long capsule (and Undo) 16 px off screen.
          mobileOffset={{ top: 'calc(64px + var(--safe-top))', left: 0, right: 0 }}
          // The status capsule (mock "Status capsule"): toasts share the offline band's glass capsule and ink dot (a ring
          // for errors), so every message lives in one place under the header. Our dot replaces sonner's type icons.
          icons={{ success: null, error: null, info: null, warning: null }}
          toastOptions={{
            unstyled: true,
            classNames: {
              toast: "glass flex items-center gap-2.5 rounded-[24px] py-0.5 pl-4 pr-0.5 text-body-sm font-semibold leading-[1.35] text-ink before:size-2 before:shrink-0 before:rounded-full before:bg-ink before:content-['']",
              error: 'before:bg-transparent before:shadow-[inset_0_0_0_2px_#111C35]',
              content: 'min-w-0 flex-1 py-[13px] pr-3.5',
              actionButton: 'relative h-11 min-w-11 shrink-0 rounded-[20px] bg-ink-08 px-3.5 font-bold text-ink',
            },
            // height auto: sonner pins the measured first-paint height, which clips text that wraps once the font loads.
            // left/right 0 with auto margins and fit-content: the capsule hugs its words and stays centred.
            style: { height: 'auto', minHeight: 48, left: 0, right: 0, marginInline: 'auto', width: 'fit-content', maxWidth: 'calc(100% - 32px)', fontFamily: 'var(--font-archivo)', boxShadow: 'inset 0 1px 0 #fff, 0 0 0 .5px rgba(17,28,53,.1), 0 16px 34px -14px rgba(17,28,53,.4)' },
          }}
        />
        <SplashHider />
      </body>
    </html>
  )
}
