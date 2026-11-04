import type { Metadata, Viewport } from 'next'
import { Archivo } from 'next/font/google'
import { Toaster } from 'sonner'
import { SplashHider } from '@/components/native/splash-hider'
import './globals.css'

// Variable weight plus the width axis: wide titles and hero numbers use font-stretch (FIQR v2).
const archivo = Archivo({ subsets: ['latin'], axes: ['wdth'], variable: '--font-archivo', display: 'swap' })

export const metadata: Metadata = { title: 'FIQR', description: 'Food, training and weekly check-ins with Geo, your coach.' }
// maximumScale 1 stops iOS zooming into inputs under 16px on focus (it still allows pinch zoom).
export const viewport: Viewport = { width: 'device-width', initialScale: 1, maximumScale: 1, viewportFit: 'cover', themeColor: '#FDF6EC' }

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
          // The status capsule (DESIGN.md component 12): a navy pill with cream text, a cream dot (a ring for errors), the
          // same capsule as the offline band, so every message lives in one place under the header.
          icons={{ success: null, error: null, info: null, warning: null }}
          toastOptions={{
            unstyled: true,
            classNames: {
              toast: "flex items-center gap-2.5 rounded-[24px] bg-ink py-0.5 pl-4 pr-0.5 text-[14px] font-medium leading-[1.35] text-cream before:size-2 before:shrink-0 before:rounded-full before:bg-cream before:content-['']",
              error: 'before:bg-transparent before:shadow-[inset_0_0_0_2px_#FDF6EC]',
              content: 'min-w-0 flex-1 py-[13px] pr-3.5',
              actionButton: 'relative h-11 min-w-11 shrink-0 rounded-[20px] px-3.5 text-[14px] font-bold text-cream active:opacity-60',
            },
            // height auto: sonner pins the measured first-paint height, which clips text that wraps once the font loads.
            // left/right 0 with auto margins and fit-content: the capsule hugs its words and stays centred.
            style: { height: 'auto', minHeight: 48, left: 0, right: 0, marginInline: 'auto', width: 'fit-content', maxWidth: 'calc(100% - 44px)', fontFamily: 'var(--font-archivo)' },
          }}
        />
        <SplashHider />
      </body>
    </html>
  )
}
