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

// ─── CONSULTA PÚBLICA DE CANDIDATURA ─────────────────────────────────────────
// Usa o cliente admin para bypassar RLS — a página é pública mas a query é segura
// porque só devolve dados se o utilizador souber o telefone E o BI exactos
export async function consultarCandidatura(phone: string, nationalId: string) {
  if (!phone || !nationalId) return { error: 'Dados em falta.' }

  // Remove tudo que não seja dígito para comparar telefones
  const digitsOnly = (v: string) => v.replace(/\D/g, '')
  // Normaliza BI: sem espaços, maiúsculas
  const normalizeId = (v: string) => v.replace(/\s/g, '').toUpperCase()

  try {
    const supabase = await createServerSupabaseAdminClient()

    const { data, error } = await supabase
      .from('affiliate_applications')
      .select('full_name, phone, status, reject_reason, created_at, national_id')
      .order('created_at', { ascending: false })

    if (error) return { error: 'Erro ao consultar. Tente novamente.' }
    if (!data || data.length === 0) return { notFound: true }

    const phoneDigits = digitsOnly(phone.trim())
    const idNorm = normalizeId(nationalId.trim())

    const match = data.find(row =>
      digitsOnly(row.phone) === phoneDigits &&
      normalizeId(row.national_id) === idNorm
    )

    if (!match) return { notFound: true }

    return {
      result: {
        full_name: match.full_name,
        phone: match.phone,
        status: match.status as 'pending' | 'approved' | 'rejected',
        reject_reason: match.reject_reason,
        created_at: match.created_at,
      }
    }
  } catch {
    return { error: 'Erro inesperado. Tente novamente.' }
  }
}
