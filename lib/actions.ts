'use server'

import { createServerSupabaseClient, createServerSupabaseAdminClient } from './supabase-server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { sendEmail } from './email/send-email'

export async function logoutUser() {
  const supabase = await createServerSupabaseClient()
  await supabase.auth.signOut()
  redirect('/login')
}

// ─── RECUPERAÇÃO DE PASSWORD via Resend ──────────────────────────────────────
// Substitui o email do Supabase (que tem limite muito baixo no plano gratuito)
// Gera o link de reset via Admin API e envia pelo Resend
export async function sendPasswordResetEmail(email: string): Promise<{ error?: string }> {
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: 'Email inválido.' }
  }

  try {
    const adminSupabase = await createServerSupabaseAdminClient()
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://mais-vida.com'
    const redirectTo = `${siteUrl}/reset-password`

    // Gerar o link de reset via Admin API
    const { data, error } = await adminSupabase.auth.admin.generateLink({
      type: 'recovery',
      email: email.toLowerCase().trim(),
      options: { redirectTo },
    })

    if (error) {
      // Não revelar se o email existe ou não (segurança)
      console.error('[PasswordReset] generateLink error:', error.message)
      // Devolvemos sucesso na mesma para não expor se o email existe
      return {}
    }

    if (!data?.properties?.action_link) {
      return {}
    }

    // Enviar via Resend
    await sendEmail({
      to: email,
      template: 'password_reset',
      data: { resetUrl: data.properties.action_link },
    })

    return {}
  } catch (err) {
    console.error('[PasswordReset] Unexpected error:', err)
    return {}
  }
}

// ─── CONVERTER CLIENTE EM AFILIADO ───────────────────────────────────────────
export async function becomeAffiliate() {
  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado.' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile) return { error: 'Perfil não encontrado.' }
  if (profile.role === 'affiliate') return { error: 'Já é afiliado.' }
  if (profile.role === 'admin') return { error: 'Conta de administrador.' }

  const referralCode = 'VIDA-' + user.id.replace(/-/g, '').substring(0, 6).toUpperCase()

  const { data: existingAffiliate } = await supabase
    .from('affiliates')
    .select('id')
    .eq('profile_id', user.id)
    .maybeSingle()

  if (!existingAffiliate) {
    const { error: affError } = await supabase
      .from('affiliates')
      .insert({ profile_id: user.id, referral_code: referralCode })

    if (affError) return { error: 'Erro ao criar conta de afiliado: ' + affError.message }
  }

  const { error: profileError } = await supabase
    .from('profiles')
    .update({ role: 'affiliate', referral_code: referralCode })
    .eq('id', user.id)

  if (profileError) return { error: 'Erro ao actualizar perfil: ' + profileError.message }

  revalidatePath('/dashboard')
  revalidatePath('/affiliate/dashboard')
  redirect('/affiliate/dashboard')
}

// ─── CONSULTA PÚBLICA DE CANDIDATURA ─────────────────────────────────────────
export async function consultarCandidatura(identifier: string) {
  if (!identifier || identifier.trim().length < 3) return { error: 'Dados em falta.' }

  const digitsOnly  = (v: string) => v.replace(/\D/g, '')
  const normalizeId = (v: string) => v.replace(/\s/g, '').toUpperCase()
  const normalizePhone = (v: string) => {
    const d = digitsOnly(v)
    if (d.startsWith('244') && d.length === 12) return d.slice(3)
    return d
  }

  try {
    const supabase = await createServerSupabaseClient()

    const { data, error } = await supabase
      .from('affiliate_applications')
      .select('full_name, phone, status, reject_reason, created_at, national_id, email')
      .order('created_at', { ascending: false })

    if (error) return { error: 'Erro ao consultar. Tente novamente.' }
    if (!data || data.length === 0) return { notFound: true }

    const val         = identifier.trim()
    const phoneDigits = normalizePhone(val)
    const idNorm      = normalizeId(val)
    const emailNorm   = val.toLowerCase()

    const match = data.find(row => {
      if (val.includes('@') && row.email) return row.email.toLowerCase() === emailNorm
      if (phoneDigits.length >= 7 && row.phone) {
        if (normalizePhone(row.phone) === phoneDigits) return true
      }
      if (idNorm.length >= 5 && row.national_id) {
        if (normalizeId(row.national_id) === idNorm) return true
      }
      return false
    })

    if (!match) return { notFound: true }

    return {
      result: {
        full_name:     match.full_name,
        phone:         match.phone,
        status:        match.status as 'pending' | 'approved' | 'rejected',
        reject_reason: match.reject_reason,
        created_at:    match.created_at,
      }
    }
  } catch {
    return { error: 'Erro inesperado. Tente novamente.' }
  }
}

// ─── CONSULTAR CANDIDATURA COM SENHA ─────────────────────────────────────────
export async function consultarCandidaturaComSenha(identifier: string, password: string) {
  if (!identifier || identifier.trim().length < 3) return { error: 'Dados em falta.' }
  if (!password) return { error: 'Introduza a sua palavra-passe.' }

  const consultaRes = await consultarCandidatura(identifier)

  if (consultaRes.error) return { error: consultaRes.error }
  if (consultaRes.notFound) return { notFound: true }

  const result = consultaRes.result!

  if (result.status !== 'approved') return { result }

  const resolved = await resolveLoginIdentifier(identifier.trim())
  if (resolved.error || !resolved.email) return { result, noAccount: true }

  return { result, email: resolved.email }
}

// ─── RESOLVER EMAIL POR TELEFONE / BI ────────────────────────────────────────
export async function resolveLoginIdentifier(identifier: string): Promise<{ email?: string; error?: string }> {
  if (!identifier || identifier.trim().length < 3) {
    return { error: 'Introduza o seu telefone, BI ou email.' }
  }

  const val = identifier.trim()
  if (val.includes('@')) return { email: val }

  try {
    const supabase = await createServerSupabaseAdminClient()

    const digitsOnly     = (v: string) => v.replace(/\D/g, '')
    const normalizeId    = (v: string) => v.replace(/\s/g, '').toUpperCase()
    const normalizePhone = (v: string) => {
      const d = digitsOnly(v)
      if (d.startsWith('244') && d.length === 12) return d.slice(3)
      return d
    }

    const phoneVal = normalizePhone(val)
    const idNorm   = normalizeId(val)

    const { data: allProfiles } = await supabase
      .from('profiles')
      .select('id, phone, national_id')

    if (phoneVal.length >= 7) {
      const matchPhone = allProfiles?.find(p =>
        p.phone && normalizePhone(p.phone) === phoneVal
      )
      if (matchPhone) {
        const supabaseAdmin = await createServerSupabaseAdminClient()
        const { data: authData } = await supabaseAdmin.auth.admin.getUserById(matchPhone.id)
        if (authData?.user?.email) return { email: authData.user.email }
      }
    }

    if (idNorm.length >= 5) {
      const matchId = allProfiles?.find(p =>
        p.national_id && normalizeId(p.national_id) === idNorm
      )
      if (matchId) {
        const supabaseAdmin = await createServerSupabaseAdminClient()
        const { data: authData } = await supabaseAdmin.auth.admin.getUserById(matchId.id)
        if (authData?.user?.email) return { email: authData.user.email }
      }
    }

    const supabaseAdmin2 = await createServerSupabaseAdminClient()
    const { data: { users } } = await supabaseAdmin2.auth.admin.listUsers({ perPage: 1000 })

    if (phoneVal.length >= 7) {
      const matchMeta = users?.find(u =>
        u.user_metadata?.phone && normalizePhone(u.user_metadata.phone) === phoneVal
      )
      if (matchMeta?.email) return { email: matchMeta.email }
    }

    if (idNorm.length >= 5) {
      const matchMeta = users?.find(u =>
        u.user_metadata?.national_id && normalizeId(u.user_metadata.national_id) === idNorm
      )
      if (matchMeta?.email) return { email: matchMeta.email }
    }

    return { error: 'Não encontrámos nenhuma conta com esses dados. Verifique o telefone, BI ou email.' }
  } catch {
    return { error: 'Erro ao verificar os dados. Tente novamente.' }
  }
}

// ─── SOLICITAR RETIRO ────────────────────────────────────────────────────────
export async function requestWithdrawal(iban: string, accountHolder: string) {
  'use server'
  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado.' }

  const { data: affiliate } = await supabase
    .from('affiliates')
    .select('id, balance, is_active')
    .eq('profile_id', user.id)
    .single()

  if (!affiliate || !affiliate.is_active) return { error: 'Conta de afiliado não encontrada ou inactiva.' }

  const { COMMISSION } = await import('./constants')
  if ((affiliate.balance || 0) < COMMISSION.withdrawalMinimum) {
    return { error: `Saldo insuficiente. Mínimo para retiro: ${COMMISSION.withdrawalMinimum.toLocaleString()} AOA.` }
  }

  // Verificar se já tem pedido pendente
  const { data: existing } = await supabase
    .from('withdrawal_requests')
    .select('id')
    .eq('affiliate_id', affiliate.id)
    .eq('status', 'pending')
    .maybeSingle()

  if (existing) return { error: 'Já tens um pedido de retiro pendente. Aguarda a aprovação.' }

  const { error } = await supabase
    .from('withdrawal_requests')
    .insert({
      affiliate_id: affiliate.id,
      amount: affiliate.balance,
      currency: 'AOA',
      iban: iban.trim(),
      account_holder: accountHolder.trim(),
    })

  if (error) return { error: 'Erro ao submeter pedido: ' + error.message }

  return { success: true }
}
