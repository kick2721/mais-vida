// app/api/affiliate/set-password/route.ts
// Permite que um afiliado aprovado defina a sua própria palavra-passe.
// Usa a Admin API server-side para não expor a service role key ao cliente.
// Verificações de segurança:
//   1. O email deve corresponder a um utilizador existente
//   2. Esse utilizador deve ter role = 'affiliate' no perfil
//   3. Rate limiting implícito pelo Vercel (não é endpoint de uso massivo)

import { NextResponse } from 'next/server'
import { createServerSupabaseAdminClient } from '@/lib/supabase-server'

export async function POST(request: Request) {
  try {
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
      return NextResponse.json(
        { error: 'Conta não encontrada. Verifique os seus dados.' },
        { status: 404 }
      )
    }

    // Verificar role na tabela profiles
    const { data: profile } = await adminSupabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'affiliate') {
      return NextResponse.json(
        { error: 'Esta conta não tem permissão para usar este acesso.' },
        { status: 403 }
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
