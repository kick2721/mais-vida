'use server'

import { createServerSupabaseClient, createServerSupabaseAdminClient } from './supabase-server'
import { revalidatePath } from 'next/cache'
import { MEMBERSHIP, COMMISSION } from './constants'

// ─── BUSCAR AFILIADO (por nome, código ou telefone) ──────────────────────────
export async function searchAffiliate(query: string): Promise<{
  results?: { id: string; referral_code: string; full_name: string; phone: string }[]
  error?: string
}> {
  if (!query || query.trim().length < 2) return { results: [] }

  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado.' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'receptionist') return { error: 'Sem permissão.' }

  const supabase2 = await createServerSupabaseAdminClient()

  const { data, error } = await supabase2
    .rpc('search_active_affiliates', { p_query: query.trim() })

  if (error) return { error: 'Erro na pesquisa.' }

  const results = (data || []).map((a: any) => ({
    id:            a.id,
    referral_code: a.referral_code,
    full_name:     a.full_name || '',
    phone:         a.phone || '',
  }))

  return { results }
}

// ─── REGISTAR VENDA MANUAL (recepção) ────────────────────────────────────────
// A venda entra directamente como 'confirmed' + cartão pendente + comissão
// Não precisa de comprovativo — o pagamento foi feito em pessoa
export async function registerManualSale(formData: {
  customer_name:  string
  customer_phone: string
  customer_email: string
  national_id:    string
  payment_method: 'cash' | 'transfer'
  referral_code?: string
}): Promise<{ success?: boolean; saleId?: string; error?: string }> {

  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado.' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'receptionist') return { error: 'Sem permissão.' }

  // Validações básicas
  if (!formData.customer_name?.trim())  return { error: 'Nome do cliente é obrigatório.' }
  if (!formData.customer_phone?.trim()) return { error: 'Telefone do cliente é obrigatório.' }
  if (!formData.national_id?.trim())    return { error: 'BI / Passaporte é obrigatório.' }

  const supabaseAdmin = await createServerSupabaseAdminClient()

  // Verificar se o BI já tem cartão activo ou venda confirmada
  const { data: existing } = await supabaseAdmin
    .from('sales')
    .select('id, status')
    .eq('national_id', formData.national_id.trim().toUpperCase())
    .in('status', ['confirmed', 'pending_review', 'pending'])
    .limit(1)
    .maybeSingle()

  if (existing) return { error: 'Este BI / Passaporte já tem um cartão activo ou pedido em curso.' }

  // Verificar afiliado se foi fornecido código
  let validReferralCode: string | null = null
  if (formData.referral_code?.trim()) {
    const { data: affiliate } = await supabaseAdmin
      .from('affiliates')
      .select('id, referral_code')
      .eq('referral_code', formData.referral_code.trim().toUpperCase())
      .eq('is_active', true)
      .maybeSingle()

    if (!affiliate) return { error: 'Código de afiliado não encontrado ou inactivo.' }
    validReferralCode = affiliate.referral_code
  }

  // Criar venda directamente como confirmed
  const now = new Date().toISOString()
  const { data: sale, error: saleError } = await supabaseAdmin
    .from('sales')
    .insert({
      customer_name:  formData.customer_name.trim(),
      customer_phone: formData.customer_phone.trim(),
      customer_email: formData.customer_email?.trim() || null,
      national_id:    formData.national_id.trim().toUpperCase(),
      amount:         MEMBERSHIP.price,
      currency:       MEMBERSHIP.currency,
      payment_method: formData.payment_method,
      referral_code:  validReferralCode,
      status:         'confirmed',
      confirmed_at:   now,
      confirmed_by:   user.id,
      notes:          'Venda registada presencialmente na recepção',
    })
    .select('id')
    .single()

  if (saleError || !sale) return { error: 'Erro ao registar venda: ' + saleError?.message }

  // Criar cartão pendente
  const dateStr      = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase()
  const cardNumber   = `MV-${dateStr}-${randomSuffix}`

  await supabaseAdmin
    .from('member_cards')
    .insert({ sale_id: sale.id, card_number: cardNumber, status: 'pending' })

  // Criar comissão se houver afiliado
  if (validReferralCode) {
    const { data: affiliate } = await supabaseAdmin
      .from('affiliates')
      .select('id, total_sales, total_earned, balance')
      .eq('referral_code', validReferralCode)
      .eq('is_active', true)
      .maybeSingle()

    if (affiliate) {
      // Verificar duplicado
      const { data: existingComm } = await supabaseAdmin
        .from('commissions')
        .select('id')
        .eq('sale_id', sale.id)
        .maybeSingle()

      if (!existingComm) {
        await supabaseAdmin
          .from('commissions')
          .insert({
            affiliate_id: affiliate.id,
            sale_id:      sale.id,
            amount:       COMMISSION.amount,
            currency:     COMMISSION.currency,
            status:       'approved',
          })

        await supabaseAdmin
          .from('affiliates')
          .update({
            total_sales:  (affiliate.total_sales  || 0) + 1,
            total_earned: (affiliate.total_earned || 0) + COMMISSION.amount,
            balance:      (affiliate.balance      || 0) + COMMISSION.amount,
          })
          .eq('id', affiliate.id)
      }
    }
  }

  revalidatePath('/admin/dashboard')
  revalidatePath('/recepcao')
  return { success: true, saleId: sale.id }
}
