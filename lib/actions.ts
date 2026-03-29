'use server'

import { createServerSupabaseClient } from './supabase-server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function logoutUser() {
  const supabase = await createServerSupabaseClient()
  await supabase.auth.signOut()
  redirect('/login')
}

// ─── CONVERTER CLIENTE EM AFILIADO ───────────────────────────────────────────
export async function becomeAffiliate() {
  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado.' }

  // Verificar que é cliente
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile) return { error: 'Perfil não encontrado.' }
  if (profile.role === 'affiliate') return { error: 'Já é afiliado.' }
  if (profile.role === 'admin') return { error: 'Conta de administrador.' }

  // Gerar código de referido único
  const referralCode = 'VIDA-' + user.id.replace(/-/g, '').substring(0, 6).toUpperCase()

  // Verificar se já existe registo em affiliates (por algum motivo)
  const { data: existingAffiliate } = await supabase
    .from('affiliates')
    .select('id')
    .eq('profile_id', user.id)
    .maybeSingle()

  if (!existingAffiliate) {
    // Criar registo em affiliates
    const { error: affError } = await supabase
      .from('affiliates')
      .insert({
        profile_id: user.id,
        referral_code: referralCode,
      })

    if (affError) return { error: 'Erro ao criar conta de afiliado: ' + affError.message }
  }

  // Mudar role para affiliate
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ role: 'affiliate', referral_code: referralCode })
    .eq('id', user.id)

  if (profileError) return { error: 'Erro ao actualizar perfil: ' + profileError.message }

  revalidatePath('/dashboard')
  revalidatePath('/affiliate/dashboard')

  // Redirigir ao painel de afiliado
  redirect('/affiliate/dashboard')
}
