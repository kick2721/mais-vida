'use server'

// lib/admin-actions.ts
// Server Actions exclusivas do painel do admin

import { createServerSupabaseClient, createServerSupabaseAdminClient } from './supabase-server'
import { revalidatePath } from 'next/cache'
import { sendEmail } from './email/send-email'
import { COMMISSION } from './constants'
import { scheduleReceiptDeletion } from './receipt-cleanup'

// ─── CONFIRMAR VENDA ─────────────────────────────────────────────────────────
export async function confirmSale(saleId: string, adminId: string) {
  const supabase = await createServerSupabaseClient()
  const supabaseAdmin = await createServerSupabaseAdminClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', adminId)
    .single()

  if (!profile || profile.role !== 'admin') return { error: 'Sem permissão.' }

  // Buscar dados completos da venda
  const { data: sale } = await supabaseAdmin
    .from('sales')
    .select('id, amount, currency, status, customer_name, customer_email, referral_code')
    .eq('id', saleId)
    .single()

  if (!sale) return { error: 'Venda não encontrada.' }
  if (sale.status === 'confirmed') return { error: 'Venda já confirmada.' }

  // Confirmar a venda
  const { error } = await supabaseAdmin
    .from('sales')
    .update({
      status: 'confirmed',
      confirmed_at: new Date().toISOString(),
      confirmed_by: adminId,
    })
    .eq('id', saleId)

  if (error) return { error: 'Erro ao confirmar venda: ' + error.message }

  // ── Criar cartão pendente (evitar duplicados) ──
  const { data: existingCard } = await supabaseAdmin
    .from('member_cards')
    .select('id')
    .eq('sale_id', saleId)
    .maybeSingle()

  if (!existingCard) {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase()
    const cardNumber = `MV-${dateStr}-${randomSuffix}`

    await supabaseAdmin
      .from('member_cards')
      .insert({ sale_id: saleId, card_number: cardNumber, status: 'pending' })
  }

  // ── Criar comissão para o afiliado (se houver referral_code) ──
  if (sale.referral_code) {
    const { data: affiliate } = await supabaseAdmin
      .from('affiliates')
      .select('id, total_sales, total_earned, balance')
      .eq('referral_code', sale.referral_code)
      .maybeSingle()

    if (affiliate) {
      // Verificar se já existe comissão para esta venda (evitar duplicados)
      const { data: existingCommission } = await supabaseAdmin
        .from('commissions')
        .select('id')
        .eq('sale_id', saleId)
        .maybeSingle()

      if (!existingCommission) {
        await supabaseAdmin
          .from('commissions')
          .insert({
            affiliate_id: affiliate.id,
            sale_id: saleId,
            amount: COMMISSION.amount,
            currency: COMMISSION.currency,
            status: 'pending',
          })

        // Actualizar contadores do afiliado
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

  // ── Email ao cliente ──
  try {
    if (sale.customer_email) {
      await sendEmail({
        to: sale.customer_email,
        template: 'purchase_confirmed',
        data: {
          customerName: sale.customer_name || 'Cliente',
          amount: sale.amount,
          currency: sale.currency,
        },
      })
    }
  } catch (emailError) {
    console.error('[Email] confirmSale error:', emailError)
  }

  // ── Agendar borrado do comprovativo em 60 minutos ──
  try {
    await scheduleReceiptDeletion(saleId)
  } catch (cleanupError) {
    console.error('[Cleanup] Erro ao agendar borrado:', cleanupError)
  }

  revalidatePath('/admin/dashboard')
  return { success: true }
}

// ─── CANCELAR VENDA ──────────────────────────────────────────────────────────
export async function cancelSale(saleId: string, reason?: string) {
  const supabaseAdmin = await createServerSupabaseAdminClient()

  // Buscar dados da venda antes de cancelar
  const { data: sale } = await supabaseAdmin
    .from('sales')
    .select('id, status, referral_code')
    .eq('id', saleId)
    .single()

  if (!sale) return { error: 'Venda não encontrada.' }
  if (sale.status === 'cancelled') return { error: 'Venda já cancelada.' }

  const wasConfirmed = sale.status === 'confirmed'

  const { error } = await supabaseAdmin
    .from('sales')
    .update({ status: 'cancelled', notes: reason || null })
    .eq('id', saleId)

  if (error) return { error: 'Erro ao cancelar venda: ' + error.message }

  // ── Se estava confirmada: reverter comissão e cartão ──
  if (wasConfirmed && sale.referral_code) {
    // Buscar comissão pendente/aprovada desta venda
    const { data: commission } = await supabaseAdmin
      .from('commissions')
      .select('id, affiliate_id, amount, status')
      .eq('sale_id', saleId)
      .maybeSingle()

    if (commission && commission.status !== 'paid') {
      // Cancelar comissão
      await supabaseAdmin
        .from('commissions')
        .update({ status: 'cancelled' })
        .eq('id', commission.id)

      // Reverter contadores do afiliado
      const { data: affiliate } = await supabaseAdmin
        .from('affiliates')
        .select('total_sales, total_earned, balance')
        .eq('id', commission.affiliate_id)
        .single()

      if (affiliate) {
        await supabaseAdmin
          .from('affiliates')
          .update({
            total_sales:  Math.max(0, (affiliate.total_sales  || 0) - 1),
            total_earned: Math.max(0, (affiliate.total_earned || 0) - commission.amount),
            balance:      Math.max(0, (affiliate.balance      || 0) - commission.amount),
          })
          .eq('id', commission.affiliate_id)
      }
    }
  }

  // ── Cancelar cartão pendente se existir ──
  if (wasConfirmed) {
    await supabaseAdmin
      .from('member_cards')
      .update({ status: 'cancelled' })
      .eq('sale_id', saleId)
      .eq('status', 'pending')
  }

  // ── Agendar borrado do comprovativo em 60 minutos ──
  try {
    await scheduleReceiptDeletion(saleId)
  } catch (cleanupError) {
    console.error('[Cleanup] Erro ao agendar borrado:', cleanupError)
  }

  revalidatePath('/admin/dashboard')
  return { success: true }
}

// ─── REATIVAR VENDA (desfazer cancelamento) ───────────────────────────────────
export async function reactivateSale(saleId: string, adminId: string) {
  const supabase = await createServerSupabaseClient()
  const supabaseAdmin = await createServerSupabaseAdminClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', adminId)
    .single()

  if (!profile || profile.role !== 'admin') return { error: 'Sem permissão.' }

  const { data: sale } = await supabaseAdmin
    .from('sales')
    .select('status')
    .eq('id', saleId)
    .single()

  if (!sale) return { error: 'Venda não encontrada.' }
  if (sale.status !== 'cancelled') return { error: 'Só é possível reativar vendas canceladas.' }

  const { error } = await supabaseAdmin
    .from('sales')
    .update({ status: 'pending_review', notes: null, confirmed_at: null, confirmed_by: null })
    .eq('id', saleId)

  if (error) return { error: 'Erro ao reativar venda: ' + error.message }

  revalidatePath('/admin/dashboard')
  return { success: true }
}

// ─── EMITIR CARTÃO ───────────────────────────────────────────────────────────
export async function issueCard(cardId: string, adminId: string) {
  const supabase = await createServerSupabaseClient()
  const supabaseAdmin = await createServerSupabaseAdminClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', adminId)
    .single()

  if (!profile || profile.role !== 'admin') return { error: 'Sem permissão.' }

  const { data: card, error } = await supabaseAdmin
    .from('member_cards')
    .update({
      status: 'issued',
      issued_at: new Date().toISOString(),
      issued_by: adminId,
    })
    .eq('id', cardId)
    .eq('status', 'pending')
    .select('id, card_number, sale_id')
    .single()

  if (error) return { error: 'Erro ao emitir cartão: ' + error.message }

  // Buscar dados do cliente via sale_id
  try {
    if (card.sale_id) {
      const { data: sale } = await supabaseAdmin
        .from('sales')
        .select('customer_name, customer_email, amount, currency')
        .eq('id', card.sale_id)
        .single()

      if (sale?.customer_email) {
        await sendEmail({
          to: sale.customer_email,
          template: 'card_issued',
          data: {
            customerName: sale.customer_name || 'Cliente',
            cardNumber: card.card_number,
          },
        })
      }
    }
  } catch (emailError) {
    console.error('[Email] issueCard error:', emailError)
  }

  revalidatePath('/admin/dashboard')
  return { success: true, cardNumber: card.card_number }
}

// ─── TOGGLE AFILIADO (activar / desactivar) ───────────────────────────────────
// Envia email ao afiliado conforme a acção
export async function toggleAffiliateStatus(affiliateId: string, isActive: boolean) {
  const supabase = await createServerSupabaseClient()

  // Buscar dados do afiliado antes de alterar (para o email)
  const { data: affiliate, error: fetchError } = await supabase
    .from('affiliates')
    .select(`
      id, referral_code, profile_id,
      profiles ( full_name )
    `)
    .eq('id', affiliateId)
    .single()

  if (fetchError || !affiliate) return { error: 'Afiliado não encontrado.' }

  const { error } = await supabase
    .from('affiliates')
    .update({ is_active: isActive })
    .eq('id', affiliateId)

  if (error) return { error: 'Erro ao actualizar afiliado: ' + error.message }

  // Email ao afiliado
  try {
    const supabaseAdmin = await createServerSupabaseAdminClient()
    const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(affiliate.profile_id)
    const affiliateName = (affiliate.profiles as any)?.full_name || 'Afiliado'
    const email = authUser?.user?.email

    if (email) {
      await sendEmail({
        to: email,
        template: isActive ? 'affiliate_reactivated' : 'affiliate_deactivated',
        data: {
          affiliateName,
          referralCode: affiliate.referral_code,
        },
      })
    }
  } catch (emailError) {
    // Não bloquear a acção por falha de email
    console.error('[Email] toggleAffiliateStatus error:', emailError)
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

  if (error) return { error: 'Erro ao aprovar comissão: ' + error.message }

  revalidatePath('/admin/dashboard')
  return { success: true }
}

// ─── PAGAR COMISSÃO ──────────────────────────────────────────────────────────
export async function payCommission(commissionId: string) {
  const supabase = await createServerSupabaseClient()

  const { data: commission } = await supabase
    .from('commissions')
    .select(`
      id, amount, currency, status, affiliate_id,
      affiliates (
        profile_id, referral_code,
        profiles ( full_name )
      )
    `)
    .eq('id', commissionId)
    .single()

  if (!commission || commission.status !== 'approved') {
    return { error: 'Comissão não encontrada ou ainda não aprovada.' }
  }

  const { error: commError } = await supabase
    .from('commissions')
    .update({ status: 'paid', paid_at: new Date().toISOString() })
    .eq('id', commissionId)

  if (commError) return { error: 'Erro ao pagar comissão: ' + commError.message }

  // Email ao afiliado
  try {
    const affiliateData = commission.affiliates as any
    if (affiliateData?.profile_id) {
      const supabaseAdmin = await createServerSupabaseAdminClient()
      const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(affiliateData.profile_id)
      if (authUser?.user?.email) {
        await sendEmail({
          to: authUser.user.email,
          template: 'commission_paid',
          data: {
            affiliateName: affiliateData.profiles?.full_name || 'Afiliado',
            amount: commission.amount,
            currency: commission.currency,
            paidAt: new Date().toLocaleDateString('pt-AO'),
          },
        })
      }
    }
  } catch (emailError) {
    console.error('[Email] payCommission error:', emailError)
  }

  revalidatePath('/admin/dashboard')
  return { success: true }
}

// ─── APROVAR CANDIDATURA DE AFILIADO ────────────────────────────────────────
// Cria conta + envia email de aprovação (um único email)
export async function approveApplication(applicationId: string) {
  const supabase = await createServerSupabaseClient()

  const currentUser = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', currentUser.data.user?.id || '')
    .single()

  if (!profile || profile.role !== 'admin') return { error: 'Sem permissão.' }

  // Buscar dados da candidatura
  const { data: app, error: fetchError } = await supabase
    .from('affiliate_applications')
    .select('id, full_name, phone, national_id, email, password_temp')
    .eq('id', applicationId)
    .single()

  if (fetchError || !app) return { error: 'Candidatura não encontrada.' }

  const loginEmail = app.email
    ? app.email.toLowerCase().trim()
    : `${app.phone.replace(/\D/g, '')}@mais-vida.ao`

  const password = app.password_temp
  if (!password) return { error: 'Candidatura sem palavra-passe definida. O candidato deve resubmeter.' }

  const adminSupabase = await createServerSupabaseAdminClient()
  const { data: { users } } = await adminSupabase.auth.admin.listUsers({ perPage: 1000 })
  const existingUser = users?.find(u => u.email === loginEmail)

  let referralCode = ''

  if (!existingUser) {
    const { data: newUser, error: createError } = await adminSupabase.auth.admin.createUser({
      email: loginEmail,
      password,
      email_confirm: true,
      user_metadata: {
        full_name:   app.full_name,
        phone:       app.phone,
        national_id: app.national_id,
        role:        'affiliate',
      },
    })

    if (createError) return { error: 'Erro ao criar conta: ' + createError.message }

    if (newUser?.user) {
      referralCode = 'VIDA-' + newUser.user.id.replace(/-/g, '').substring(0, 6).toUpperCase()

      await new Promise(r => setTimeout(r, 500))

      await adminSupabase
        .from('profiles')
        .update({
          role:          'affiliate',
          phone:         app.phone,
          national_id:   app.national_id,
          referral_code: referralCode,
        })
        .eq('id', newUser.user.id)

      await adminSupabase
        .from('affiliates')
        .upsert({
          profile_id:    newUser.user.id,
          referral_code: referralCode,
          is_active:     true,
        }, { onConflict: 'profile_id' })
    }
  } else {
    // Conta já existe — buscar o código de referido
    const { data: existingAffiliate } = await adminSupabase
      .from('affiliates')
      .select('referral_code')
      .eq('profile_id', existingUser.id)
      .single()
    referralCode = existingAffiliate?.referral_code || ''
  }

  // Marcar candidatura como aprovada e limpar password_temp
  const { error } = await supabase
    .from('affiliate_applications')
    .update({
      status:        'approved',
      reviewed_at:   new Date().toISOString(),
      reject_reason: null,
      password_temp: null,
    })
    .eq('id', applicationId)

  if (error) return { error: 'Erro ao aprovar: ' + error.message }

  // Email de aprovação — um único email com código + instruções
  try {
    await sendEmail({
      to: loginEmail,
      template: 'affiliate_approved',
      data: {
        affiliateName:    app.full_name,
        referralCode:     referralCode,
        commissionAmount: COMMISSION.amount.toLocaleString(),
      },
    })
  } catch (emailError) {
    // Não bloquear a aprovação por falha de email
    console.error('[Email] approveApplication error:', emailError)
  }

  revalidatePath('/admin/dashboard')
  return { success: true }
}

// ─── REJEITAR CANDIDATURA DE AFILIADO ───────────────────────────────────────
export async function rejectApplication(applicationId: string, reason?: string) {
  const supabase = await createServerSupabaseClient()

  const currentUser = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', currentUser.data.user?.id || '')
    .single()

  if (!profile || profile.role !== 'admin') return { error: 'Sem permissão.' }

  // Buscar dados do candidato para o email
  const { data: app } = await supabase
    .from('affiliate_applications')
    .select('full_name, email, phone')
    .eq('id', applicationId)
    .single()

  const { error } = await supabase
    .from('affiliate_applications')
    .update({
      status:        'rejected',
      reject_reason: reason || null,
      reviewed_at:   new Date().toISOString(),
    })
    .eq('id', applicationId)

  if (error) return { error: 'Erro ao rejeitar: ' + error.message }

  // Email de rejeição
  if (app) {
    const recipientEmail = app.email
      || `${app.phone?.replace(/\D/g, '')}@mais-vida.ao`

    try {
      await sendEmail({
        to: recipientEmail,
        template: 'affiliate_rejected',
        data: {
          affiliateName: app.full_name,
          rejectReason:  reason || null,
        },
      })
    } catch (emailError) {
      console.error('[Email] rejectApplication error:', emailError)
    }
  }

  revalidatePath('/admin/dashboard')
  return { success: true }
}
