// app/api/affiliate/set-password/route.ts
// Permite que um afiliado aprovado defina a sua própria palavra-passe.
// Usa a Admin API server-side para não expor a service role key ao cliente.
// Verificações de segurança:
//   1. Rate limiting por IP: máx 10 tentativas por 15 minutos (via Upstash Redis)
//   2. O email deve corresponder a um utilizador existente
//   3. Esse utilizador deve ter role = 'affiliate' no perfil

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseAdminClient } from '@/lib/supabase-server'
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url:   process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

const RATE_LIMIT_MAX      = 10
const RATE_LIMIT_WINDOW_S = 15 * 60 // 15 minutos

export async function POST(request: NextRequest) {
  try {
    // ── Rate limiting por IP ──────────────────────────────────────────────
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
              || request.headers.get('x-real-ip')
              || 'unknown'

    const key   = `set_password_rate:${ip}`
    const count = await redis.incr(key)

    if (count === 1) {
      await redis.expire(key, RATE_LIMIT_WINDOW_S)
    }

    if (count > RATE_LIMIT_MAX) {
      return NextResponse.json(
        { error: 'Demasiadas tentativas. Por favor aguarde 15 minutos e tente novamente.' },
        { status: 429 }
      )
    }

    // ── Validações básicas ────────────────────────────────────────────────
    const { email, newPassword } = await request.json()

    if (!email || !newPassword) {
      return NextResponse.json({ error: 'Dados em falta.' }, { status: 400 })
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'A palavra-passe deve ter no mínimo 6 caracteres.' },
        { status: 400 }
      )
    }

    const adminSupabase = await createServerSupabaseAdminClient()

    // Verificar que o utilizador existe e tem role affiliate
    const { data: { users } } = await adminSupabase.auth.admin.listUsers({ perPage: 1000 })
    const user = users?.find(u => u.email === email.toLowerCase().trim())

    if (!user) {
      // Resposta genérica — não revelar se o email existe ou não
      return NextResponse.json(
        { error: 'Dados incorrectos. Verifique o email e tente novamente.' },
        { status: 401 }
      )
    }

    // Verificar role na tabela profiles
    const { data: profile } = await adminSupabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'affiliate') {
      // Mesma mensagem genérica — não revelar que a conta existe mas não é afiliado
      return NextResponse.json(
        { error: 'Dados incorrectos. Verifique o email e tente novamente.' },
        { status: 401 }
      )
    }

    // Actualizar a password via Admin API
    const { error: updateError } = await adminSupabase.auth.admin.updateUserById(
      user.id,
      { password: newPassword }
    )

    if (updateError) {
      console.error('[set-password] updateUserById error:', updateError.message)
      return NextResponse.json(
        { error: 'Erro ao definir palavra-passe. Tente novamente.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[set-password] Unexpected error:', err)
    return NextResponse.json(
      { error: 'Erro inesperado. Tente novamente.' },
      { status: 500 }
    )
  }
}
