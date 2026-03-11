import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get('nextmealai-token')?.value

  // Allow public auth routes
  if (pathname.startsWith('/login') || pathname.startsWith('/signup')) {
    if (token) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    return NextResponse.next()
  }

  // Require auth for all other routes
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // For onboarding routes: redirect to dashboard if already complete
  if (pathname.startsWith('/onboarding')) {
    const onboardingCookie = request.cookies.get('nextmealai-onboarded')?.value
    if (onboardingCookie) {
      // Already onboarded — send to dashboard and clear the cache cookie
      const res = NextResponse.redirect(new URL('/dashboard', request.url))
      res.cookies.set('nextmealai-onboarded', '', { path: '/', maxAge: 0 })
      return res
    }
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_CORE_API_URL}/v1/profile/onboarding`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      if (response.ok) {
        const data = await response.json()
        if (data.can_use_app) {
          return NextResponse.redirect(new URL('/dashboard', request.url))
        }
      }
    } catch {
      // If check fails, allow through
    }
    return NextResponse.next()
  }

  // For app routes: check if onboarding is complete (with cache)
  if (
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/chat') ||
    pathname.startsWith('/settings') ||
    pathname.startsWith('/plans') ||
    pathname.startsWith('/logs')
  ) {
    const onboardingCookie = request.cookies.get('nextmealai-onboarded')?.value

    if (!onboardingCookie) {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_CORE_API_URL}/v1/profile/onboarding`,
          { headers: { Authorization: `Bearer ${token}` } }
        )
        if (response.ok) {
          const data = await response.json()
          if (!data.can_use_app) {
            return NextResponse.redirect(new URL('/onboarding/personal', request.url))
          }
          // Cache onboarding status for 5 minutes
          const res = NextResponse.next()
          res.cookies.set('nextmealai-onboarded', 'true', { path: '/', maxAge: 300 })
          return res
        }
      } catch {
        // allow through on error
      }
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.svg$).*)',
  ],
}
