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
// Usa o cliente normal do servidor — RLS permite leitura anon via política criada
export async function consultarCandidatura(phone: string, nationalId: string) {
  if (!phone || !nationalId) return { error: 'Dados em falta.' }

  // Remove tudo que não seja dígito para comparar telefones
  const digitsOnly = (v: string) => v.replace(/\D/g, '')
  // Normaliza BI: sem espaços, maiúsculas
  const normalizeId = (v: string) => v.replace(/\s/g, '').toUpperCase()

  try {
    const supabase = await createServerSupabaseClient()

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

// ─── RESOLVER EMAIL POR TELEFONE / BI (para login flexível) ──────────────────
// Usa a Service Role para aceder a auth.users e encontrar o email associado
// ao telefone ou BI que o utilizador introduziu
export async function resolveLoginIdentifier(identifier: string): Promise<{ email?: string; error?: string }> {
  if (!identifier || identifier.trim().length < 3) {
    return { error: 'Introduza o seu telefone, BI ou email.' }
  }

  const val = identifier.trim()

  // Se parece um email, devolvê-lo directamente
  if (val.includes('@')) {
    return { email: val }
  }

  try {
    const supabase = await createServerSupabaseAdminClient()

    const digitsOnly  = (v: string) => v.replace(/\D/g, '')
    const normalizeId = (v: string) => v.replace(/\s/g, '').toUpperCase()

    // Estratégia 1: Procurar por telefone na tabela profiles
    // (profiles.phone é guardado no registo)
    const phoneVal = digitsOnly(val)
    if (phoneVal.length >= 7) {
      // Buscar todos os profiles e comparar dígitos
      const { data: allProfiles } = await supabase
        .from('profiles')
        .select('id, phone')
        .not('phone', 'is', null)

      const matchProfile = allProfiles?.find(p =>
        p.phone && digitsOnly(p.phone) === phoneVal
      )

      if (matchProfile) {
        // Buscar email via auth admin
        const { data: authData } = await supabase.auth.admin.getUserById(matchProfile.id)
        if (authData?.user?.email) {
          return { email: authData.user.email }
        }
      }
    }

    // Estratégia 2: Procurar por BI/Passaporte em user_metadata de auth.users
    // Supabase não tem um índice em metadata, então usamos listUsers com filtro
    const idNorm = normalizeId(val)
    if (idNorm.length >= 5) {
      // Listar utilizadores em lotes e procurar por national_id em metadata
      const { data: { users } } = await supabase.auth.admin.listUsers({ perPage: 1000 })

      const matchUser = users?.find(u =>
        u.user_metadata?.national_id &&
        normalizeId(u.user_metadata.national_id) === idNorm
      )

      if (matchUser?.email) {
        return { email: matchUser.email }
      }
    }

    return { error: 'Não encontrámos nenhuma conta com esses dados. Verifique o telefone, BI ou email.' }
  } catch {
    return { error: 'Erro ao verificar os dados. Tente novamente.' }
  }
}
