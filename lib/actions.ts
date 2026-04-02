'use server'

import { createServerSupabaseClient, createServerSupabaseAdminClient } from './supabase-server'
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

// ─── CONSULTA PÚBLICA DE CANDIDATURA ─────────────────────────────────────────
// Identificador flexível: telefone, BI/Passaporte ou email
export async function consultarCandidatura(identifier: string) {
  if (!identifier || identifier.trim().length < 3) return { error: 'Dados em falta.' }

  const digitsOnly  = (v: string) => v.replace(/\D/g, '')
  const normalizeId = (v: string) => v.replace(/\s/g, '').toUpperCase()

  try {
    const supabase = await createServerSupabaseClient()

    const { data, error } = await supabase
      .from('affiliate_applications')
      .select('full_name, phone, status, reject_reason, created_at, national_id, email')
      .order('created_at', { ascending: false })

    if (error) return { error: 'Erro ao consultar. Tente novamente.' }
    if (!data || data.length === 0) return { notFound: true }

    const val         = identifier.trim()
    const phoneDigits = digitsOnly(val)
    const idNorm      = normalizeId(val)
    const emailNorm   = val.toLowerCase()

    const match = data.find(row => {
      if (val.includes('@') && row.email) {
        return row.email.toLowerCase() === emailNorm
      }
      if (phoneDigits.length >= 7 && row.phone) {
        if (digitsOnly(row.phone) === phoneDigits) return true
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

// ─── RESOLVER EMAIL POR TELEFONE / BI (para login flexível) ──────────────────
// Busca em profiles (fonte primária) e user_metadata (fallback) para os três identificadores
export async function resolveLoginIdentifier(identifier: string): Promise<{ email?: string; error?: string }> {
  if (!identifier || identifier.trim().length < 3) {
    return { error: 'Introduza o seu telefone, BI ou email.' }
  }

  const val = identifier.trim()

  // Email — devolver directamente
  if (val.includes('@')) {
    return { email: val }
  }

  try {
    const supabase = await createServerSupabaseAdminClient()

    const digitsOnly  = (v: string) => v.replace(/\D/g, '')
    const normalizeId = (v: string) => v.replace(/\s/g, '').toUpperCase()

    const phoneVal = digitsOnly(val)
    const idNorm   = normalizeId(val)

    // ── Buscar em profiles (fonte primária — phone e national_id sincronizados) ──
    const { data: allProfiles } = await supabase
      .from('profiles')
      .select('id, phone, national_id')

    // Por telefone em profiles
    if (phoneVal.length >= 7) {
      const matchPhone = allProfiles?.find(p =>
        p.phone && digitsOnly(p.phone) === phoneVal
      )
      if (matchPhone) {
        const { data: authData } = await supabase.auth.admin.getUserById(matchPhone.id)
        if (authData?.user?.email) return { email: authData.user.email }
      }
    }

    // Por BI/Passaporte em profiles
    if (idNorm.length >= 5) {
      const matchId = allProfiles?.find(p =>
        p.national_id && normalizeId(p.national_id) === idNorm
      )
      if (matchId) {
        const { data: authData } = await supabase.auth.admin.getUserById(matchId.id)
        if (authData?.user?.email) return { email: authData.user.email }
      }
    }

    // ── Fallback: buscar em user_metadata (cobre casos onde profiles ainda não sincronizou) ──
    const { data: { users } } = await supabase.auth.admin.listUsers({ perPage: 1000 })

    if (phoneVal.length >= 7) {
      const matchMeta = users?.find(u =>
        u.user_metadata?.phone && digitsOnly(u.user_metadata.phone) === phoneVal
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
