// middleware.ts
// Protecção de rotas por role usando Supabase Auth + Next.js Middleware
// Colocar na raiz do projecto (mesmo nível que app/ e lib/)

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

// Rotas protegidas por role
const ROLE_ROUTES: Record<string, string[]> = {
  admin: ['/admin'],
  affiliate: ['/affiliate'],
  customer: ['/dashboard'],
}

// Rotas que requerem autenticação (qualquer role)
const AUTH_ROUTES = ['/dashboard', '/affiliate', '/admin']

// Rotas públicas que devem redirecionar para o dashboard se já autenticado
const GUEST_ONLY_ROUTES = ['/login', '/register', '/forgot-password', '/reset-password']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Criar response mutável para o Supabase poder actualizar cookies
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Criar cliente Supabase para o middleware
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

  // Verificar sessão
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // ── 1. Rotas de autenticação: redirecionar se já logado ──────────────────
  if (GUEST_ONLY_ROUTES.some(route => pathname.startsWith(route))) {
    if (user) {
      // Buscar role para redirecionar correctamente
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      const role = profile?.role
      const redirectMap: Record<string, string> = {
        admin: '/admin/dashboard',
        affiliate: '/affiliate/dashboard',
        customer: '/dashboard',
      }

      return NextResponse.redirect(
        new URL(redirectMap[role] || '/dashboard', request.url),
      )
    }
    return response
  }

  // ── 2. Rotas protegidas: requerem autenticação ───────────────────────────
  if (AUTH_ROUTES.some(route => pathname.startsWith(route))) {
    if (!user) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }

    // Verificar role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const userRole = profile?.role

    // Verificar se o role tem acesso à rota
    for (const [role, routes] of Object.entries(ROLE_ROUTES)) {
      if (routes.some(route => pathname.startsWith(route))) {
        if (userRole !== role) {
          // Redirecionar para o dashboard correcto
          const redirectMap: Record<string, string> = {
            admin: '/admin/dashboard',
            affiliate: '/affiliate/dashboard',
            customer: '/dashboard',
          }
          return NextResponse.redirect(
            new URL(redirectMap[userRole || ''] || '/', request.url),
          )
        }
      }
    }
  }

  return response
}

export const config = {
  matcher: [
    // Aplicar a todas as rotas excepto _next, static files e favicon
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
