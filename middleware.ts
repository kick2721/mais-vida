// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

const ROLE_ROUTES: Record<string, string[]> = {
  admin:        ['/admin'],
  affiliate:    ['/affiliate'],
  receptionist: ['/recepcao'],
}

const AUTH_ROUTES       = ['/affiliate', '/admin', '/recepcao']
const GUEST_ONLY_ROUTES = ['/login', '/forgot-password', '/reset-password']

const ALWAYS_PUBLIC = ['/comprar', '/seguimento', '/afiliado-candidatura', '/candidatura-estado', '/criar-conta', '/']

const REDIRECT_MAP: Record<string, string> = {
  admin:        '/admin/dashboard',
  affiliate:    '/affiliate/dashboard',
  receptionist: '/recepcao',
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

  // Rutas siempre públicas — nunca redirigir aunque haya sesión
  if (ALWAYS_PUBLIC.some(route => pathname === route || pathname.startsWith(route + '?'))) {
    return response
  }

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
      const isServerAction =
        request.method === 'POST' &&
        (request.headers.get('next-action') !== null ||
          request.headers.get('content-type')?.includes('multipart/form-data') ||
          request.headers.get('content-type')?.includes('application/x-www-form-urlencoded'))

      if (isServerAction) {
        return new NextResponse(
          JSON.stringify({ error: 'Sessão expirada. Por favor recarregue a página e faça login novamente.' }),
          { status: 401, headers: { 'content-type': 'application/json' } }
        )
      }

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
