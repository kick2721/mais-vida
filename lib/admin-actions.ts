'use server'

// lib/admin-actions.ts
// Server Actions exclusivas do painel do admin

import { createServerSupabaseClient } from './supabase-server'
import { revalidatePath } from 'next/cache'
import { sendEmail } from './email/send-email'

// ─── CONFIRMAR VENDA ─────────────────────────────────────────────────────────
export async function confirmSale(saleId: string, adminId: string) {
  const supabase = await createServerSupabaseClient()

  // Verificar que o utilizador é admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', adminId)
    .single()

  if (!profile || profile.role !== 'admin') {
    return { error: 'Sem permissão.' }
  }

  // Confirmar a venda — os triggers do Supabase fazem o resto:
  // 1. Activa a membresía
  // 2. Cria o cartão pendente
  // 3. Cria a comissão para o afiliado
  const { data: sale, error } = await supabase
    .from('sales')
    .update({
      status: 'confirmed',
      confirmed_at: new Date().toISOString(),
      confirmed_by: adminId,
    })
    .eq('id', saleId)
    .select(`
      id, amount, currency,
      customers (
        id,
        profiles ( full_name, phone )
      )
    `)
    .single()

  if (error) {
    return { error: 'Erro ao confirmar venda: ' + error.message }
  }

  // Enviar email de confirmação ao cliente
  try {
    const customerProfile = (sale.customers as any)?.profiles
    if (customerProfile) {
      // Buscar email do utilizador pelo customer_id
      const { data: customer } = await supabase
        .from('customers')
        .select('profile_id')
        .eq('id', (sale.customers as any)?.id)
        .single()

      if (customer) {
        const { data: authUser } = await supabase.auth.admin.getUserById(customer.profile_id)
        if (authUser?.user?.email) {
          await sendEmail({
            to: authUser.user.email,
            template: 'purchase_confirmed',
            data: {
              customerName: customerProfile.full_name,
              amount: sale.amount,
              currency: sale.currency,
            },
          })
        }
      }
    }
  } catch (emailError) {
    // Não bloquear a confirmação por falha de email
    console.error('Email error:', emailError)
  }

  revalidatePath('/admin/dashboard')
  return { success: true }
}

// ─── CANCELAR VENDA ──────────────────────────────────────────────────────────
export async function cancelSale(saleId: string, reason?: string) {
  const supabase = await createServerSupabaseClient()

  const { error } = await supabase
    .from('sales')
    .update({
      status: 'cancelled',
      notes: reason || null,
    })
    .eq('id', saleId)
    .not('status', 'in', '("cancelled","refunded")')

  if (error) {
    return { error: 'Erro ao cancelar venda: ' + error.message }
  }

  revalidatePath('/admin/dashboard')
  return { success: true }
}

// ─── EMITIR CARTÃO ───────────────────────────────────────────────────────────
export async function issueCard(cardId: string, adminId: string) {
  const supabase = await createServerSupabaseClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', adminId)
    .single()

  if (!profile || profile.role !== 'admin') {
    return { error: 'Sem permissão.' }
  }

  const { data: card, error } = await supabase
    .from('member_cards')
    .update({
      status: 'issued',
      issued_at: new Date().toISOString(),
      issued_by: adminId,
    })
    .eq('id', cardId)
    .eq('status', 'pending')
    .select(`
      id, card_number,
      customers (
        id, profile_id,
        profiles ( full_name, phone )
      )
    `)
    .single()

  if (error) {
    return { error: 'Erro ao emitir cartão: ' + error.message }
  }

  // Enviar notificação de cartão emitido
  try {
    const customerData = card.customers as any
    if (customerData?.profile_id) {
      const { data: authUser } = await supabase.auth.admin.getUserById(customerData.profile_id)
      if (authUser?.user?.email) {
        await sendEmail({
          to: authUser.user.email,
          template: 'card_issued',
          data: {
            customerName: customerData.profiles?.full_name,
            cardNumber: card.card_number,
          },
        })
      }
    }
  } catch (emailError) {
    console.error('Email error:', emailError)
  }

  revalidatePath('/admin/dashboard')
  return { success: true, cardNumber: card.card_number }
}

// ─── TOGGLE AFILIADO ─────────────────────────────────────────────────────────
export async function toggleAffiliateStatus(affiliateId: string, isActive: boolean) {
  const supabase = await createServerSupabaseClient()

  const { error } = await supabase
    .from('affiliates')
    .update({ is_active: isActive })
    .eq('id', affiliateId)

  if (error) {
    return { error: 'Erro ao actualizar afiliado: ' + error.message }
  }

  revalidatePath('/admin/dashboard')
  return { success: true }
}

// ─── APROVAR COMISSÃO ────────────────────────────────────────────────────────
export async function approveCommission(commissionId: string) {
  const supabase = await createServerSupabaseClient()

  const { error } = await supabase
    .from('commissions')
    .update({
      status: 'approved',
      approved_at: new Date().toISOString(),
    })
    .eq('id', commissionId)
    .eq('status', 'pending')

  if (error) {
    return { error: 'Erro ao aprovar comissão: ' + error.message }
  }

  revalidatePath('/admin/dashboard')
  return { success: true }
}

// ─── PAGAR COMISSÃO ──────────────────────────────────────────────────────────
export async function payCommission(commissionId: string) {
  const supabase = await createServerSupabaseClient()

  // Buscar comissão e afiliado
  const { data: commission } = await supabase
    .from('commissions')
    .select('id, amount, affiliate_id, status')
    .eq('id', commissionId)
    .single()

  if (!commission || commission.status !== 'approved') {
    return { error: 'Comissão não encontrada ou ainda não aprovada.' }
  }

  // Marcar como paga
  const { error: commError } = await supabase
    .from('commissions')
    .update({
      status: 'paid',
      paid_at: new Date().toISOString(),
    })
    .eq('id', commissionId)

  if (commError) {
    return { error: 'Erro ao pagar comissão: ' + commError.message }
  }

  // Descontar do balance do afiliado
  // NOTA: O trigger handle_commission_paid() já deve fazer isto automaticamente
  // Esta função existe como fallback manual

  revalidatePath('/admin/dashboard')
  return { success: true }
}

// ─── APROVAR CANDIDATURA DE AFILIADO ────────────────────────────────────────
export async function approveApplication(applicationId: string) {
  const supabase = await createServerSupabaseClient()

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', (await supabase.auth.getUser()).data.user?.id || '').single()
  if (!profile || profile.role !== 'admin') return { error: 'Sem permissão.' }

  const { error } = await supabase
    .from('affiliate_applications')
    .update({
      status: 'approved',
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', applicationId)
    .eq('status', 'pending')

  if (error) return { error: 'Erro ao aprovar: ' + error.message }

  revalidatePath('/admin/dashboard')
  return { success: true }
}

// ─── REJEITAR CANDIDATURA DE AFILIADO ───────────────────────────────────────
export async function rejectApplication(applicationId: string, reason?: string) {
  const supabase = await createServerSupabaseClient()

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', (await supabase.auth.getUser()).data.user?.id || '').single()
  if (!profile || profile.role !== 'admin') return { error: 'Sem permissão.' }

  const { error } = await supabase
    .from('affiliate_applications')
    .update({
      status: 'rejected',
      reject_reason: reason || null,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', applicationId)
    .eq('status', 'pending')

  if (error) return { error: 'Erro ao rejeitar: ' + error.message }

  revalidatePath('/admin/dashboard')
  return { success: true }
}
