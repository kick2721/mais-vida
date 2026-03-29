// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

const ROLE_ROUTES: Record<string, string[]> = {
  admin: ['/admin'],
  affiliate: ['/affiliate'],
  customer: ['/dashboard'],
}

const AUTH_ROUTES = ['/dashboard', '/affiliate', '/admin']
const GUEST_ONLY_ROUTES = ['/login', '/register', '/forgot-password', '/reset-password']

const REDIRECT_MAP: Record<string, string> = {
  admin: '/admin/dashboard',
  affiliate: '/affiliate/dashboard',
  customer: '/dashboard',
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const response = NextResponse.next({
    request: { headers: request.headers },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            response.cookies.set(name, value, options)
          })
        },
      },
    },
  )

  const { data: { user } } = await supabase.auth.getUser()

  // ── 1. Rotas guest-only: redirecionar se já logado ──────────────────
  if (GUEST_ONLY_ROUTES.some(route => pathname.startsWith(route))) {
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      const dest = REDIRECT_MAP[profile?.role || '']
      if (dest && !pathname.startsWith(dest)) {
        return NextResponse.redirect(new URL(dest, request.url))
      }
    }
    return response
  }

  // ── 2. Rotas protegidas: requerem autenticação ───────────────────────
  if (AUTH_ROUTES.some(route => pathname.startsWith(route))) {
    if (!user) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const userRole = profile?.role

    if (!userRole) {
      return NextResponse.redirect(new URL('/', request.url))
    }

    for (const [role, routes] of Object.entries(ROLE_ROUTES)) {
      if (routes.some(route => pathname.startsWith(route))) {
        if (userRole !== role) {
          const dest = REDIRECT_MAP[userRole] || '/'
          return NextResponse.redirect(new URL(dest, request.url))
        }
      }
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
