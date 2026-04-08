// app/affiliate/dashboard/page.tsx
import AffiliateDashboardCharts from './AffiliateDashboardCharts'
import WithdrawalHistory from './WithdrawalHistory'
// Painel do Afiliado — Etapa 6

import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { logoutUser } from '@/lib/actions'
import { BUSINESS, COMMISSION } from '@/lib/constants'
import CopyButton from './CopyButton'
import WithdrawalButton from './WithdrawalButton'
import Logo from '@/app/components/ui/Logo'

export default async function AffiliateDashboardPage() {
  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'affiliate') redirect('/login')

  const { data: affiliate } = await supabase
    .from('affiliates')
    .select('*')
    .eq('profile_id', user.id)
    .single()

  if (!affiliate) redirect('/login')
  if (!affiliate.is_active) redirect('/login?erro=conta-inactiva')

  const { data: sales } = await supabase
    .from('sales')
    .select(`
      id, amount, currency, status, created_at, confirmed_at,
      customer_name, customer_phone
    `)
    .eq('referral_code', affiliate.referral_code)
    .order('created_at', { ascending: false })

  const { data: commissions } = await supabase
    .from('commissions')
    .select('*')
    .eq('affiliate_id', affiliate.id)
    .order('created_at', { ascending: false })

  // Verificar se tem pedido de retiro pendente
  const { data: pendingWithdrawal } = await supabase
    .from('withdrawal_requests')
    .select('id')
    .eq('affiliate_id', affiliate.id)
    .eq('status', 'pending')
    .maybeSingle()

  // Historial de retiros
  const { data: withdrawals } = await supabase
    .from('withdrawal_requests')
    .select('id, amount, currency, status, requested_at, reviewed_at')
    .eq('affiliate_id', affiliate.id)
    .order('requested_at', { ascending: false })

  const totalSales = sales?.length || 0
  const confirmedSales = sales?.filter(s => s.status === 'confirmed').length || 0
  const pendingSales = sales?.filter(s => ['pending', 'pending_review'].includes(s.status)).length || 0
  const balance = affiliate.balance || 0
  const totalEarned = affiliate.total_earned || 0
  const totalPaid = affiliate.total_paid || 0

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://mais-vida.com'
  const referralLink = `${siteUrl}/?ref=${affiliate.referral_code}`

  const saleStatusMap: Record<string, { label: string; color: string; bg: string }> = {
    confirmed: { label: '✓ Confirmada', color: '#166534', bg: '#dcfce7' },
    pending_review: { label: '⏳ Em revisão', color: '#92400e', bg: '#fef3c7' },
    pending: { label: '⏳ Pendente', color: '#92400e', bg: '#fef3c7' },
    cancelled: { label: '✗ Cancelada', color: '#991b1b', bg: '#fee2e2' },
    refunded: { label: '↩ Reembolsada', color: '#6b7280', bg: '#f3f4f6' },
  }

  const commissionStatusMap: Record<string, { label: string; color: string; bg: string }> = {
    pending: { label: '⏳ Pendente', color: '#92400e', bg: '#fef3c7' },
    approved: { label: '✓ Aprovada', color: '#1e40af', bg: '#dbeafe' },
    paid: { label: '💰 Paga', color: '#166534', bg: '#dcfce7' },
    cancelled: { label: '✗ Cancelada', color: '#991b1b', bg: '#fee2e2' },
  }

  return (
    <div className="min-h-screen" style={{ background: 'rgba(240,247,239,0.6)' }}>
      <header className="bg-white border-b" style={{ borderColor: 'var(--color-border)' }}>
        <div className="section-container flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <Logo size="sm" href="/" />
            <span className="text-xs text-gray-500 hidden sm:inline">Painel do Afiliado</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600 hidden sm:block">{profile.full_name}</span>
            <form action={logoutUser}>
              <button type="submit" className="text-sm text-gray-500 hover:text-gray-800 transition-colors">
                Sair →
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="section-container py-8">
        <div className="mb-8">
          <h1 className="font-display text-2xl font-bold text-gray-900">
            Olá, {profile.full_name?.split(' ')[0]} 👋
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Código:{' '}
            <span className="font-bold font-mono" style={{ color: 'var(--color-primary)' }}>
              {affiliate.referral_code}
            </span>
            {!affiliate.is_active && (
              <span className="ml-2 text-xs text-red-600 font-medium">(Conta inactiva)</span>
            )}
          </p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Vendas', value: totalSales, sub: `${confirmedSales} confirmadas`, color: 'var(--color-primary)' },
            { label: 'Pendentes', value: pendingSales, sub: 'aguardam confirmação', color: '#d97706' },
            { label: 'Saldo (Kz)', value: balance.toLocaleString(), sub: 'disponível para levantamento', color: 'var(--color-primary)' },
            { label: 'Total Ganho', value: totalEarned.toLocaleString(), sub: `${totalPaid.toLocaleString()} Kz pagos`, color: '#374151' },
          ].map(card => (
            <div key={card.label} className="card">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{card.label}</p>
              <p className="font-display text-2xl sm:text-3xl font-bold" style={{ color: card.color }}>{card.value}</p>
              <p className="text-xs text-gray-500 mt-1">{card.sub}</p>
            </div>
          ))}
        </div>

        {/* Referral link */}
        <div className="rounded-2xl p-6 mb-4" style={{ background: 'var(--color-primary)', color: 'white' }}>
          <p className="text-sm font-semibold text-green-200 mb-2">O seu link de afiliado</p>
          <div className="flex items-center gap-3 flex-wrap">
            <code className="flex-1 bg-white/20 rounded-xl px-4 py-2 text-sm font-mono break-all">
              {referralLink}
            </code>
            <CopyButton text={referralLink} />
          </div>
          <p className="text-xs text-green-200 mt-3">
            Cada venda confirmada gera <strong>{COMMISSION.amount.toLocaleString()} Kz</strong> de comissão.
          </p>
        </div>

        {/* Retiro */}
        <div className="mb-8">
          <WithdrawalButton balance={balance} hasPending={!!pendingWithdrawal} />
        </div>

        <AffiliateDashboardCharts sales={sales || []} commissions={commissions || []} saleStatusMap={saleStatusMap} />

        <WithdrawalHistory withdrawals={withdrawals || []} />
      </div>
    </div>
  )
}
