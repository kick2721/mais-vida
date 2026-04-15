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
    .select('full_name, role')
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
    .limit(500)

  const { data: commissions } = await supabase
    .from('commissions')
    .select('id, amount, currency, status, created_at, paid_at, approved_at')
    .eq('affiliate_id', affiliate.id)
    .order('created_at', { ascending: false })
    .limit(500)

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
    <div className="min-h-screen" style={{ background: 'var(--color-surface)' }}>
      {/* Header */}
      <header style={{
        background: '#fff',
        borderBottom: '1px solid var(--color-border)',
        boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
        position: 'sticky', top: 0, zIndex: 40,
      }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between" style={{ height: '64px' }}>
          <div className="flex items-center gap-3">
            <Logo size="sm" href="/" />
            <div style={{ width: '1px', height: '24px', background: 'var(--color-border)' }} className="hidden sm:block" />
            <span className="text-xs font-semibold uppercase tracking-widest hidden sm:inline" style={{ color: 'var(--color-primary)' }}>
              Painel do Afiliado
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2">
              <div style={{
                width: '32px', height: '32px', borderRadius: '50%',
                background: 'rgba(74,140,63,0.12)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '14px', fontWeight: 700, color: 'var(--color-primary)',
              }}>
                {profile.full_name?.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>{profile.full_name}</span>
            </div>
            <form action={logoutUser}>
              <button type="submit" className="btn-back text-sm">
                Sair
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Welcome */}
        <div className="mb-8">
          <h1 className="font-serif text-2xl font-bold mb-1" style={{ color: 'var(--color-primary-dark)' }}>
            Olá, {profile.full_name?.split(' ')[0]} 👋
          </h1>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            Código de afiliado:{' '}
            <span className="font-bold font-mono" style={{ color: 'var(--color-primary)' }}>
              {affiliate.referral_code}
            </span>
            {!affiliate.is_active && (
              <span className="ml-2 text-xs text-red-600 font-semibold">(Conta inactiva)</span>
            )}
          </p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Vendas', value: totalSales, sub: `${confirmedSales} confirmadas`, color: 'var(--color-primary)', icon: '📊' },
            { label: 'Pendentes', value: pendingSales, sub: 'aguardam confirmação', color: '#d97706', icon: '⏳' },
            { label: 'Saldo (Kz)', value: balance.toLocaleString(), sub: 'disponível para levantamento', color: 'var(--color-primary)', icon: '💰' },
            { label: 'Total Ganho', value: totalEarned.toLocaleString(), sub: `${totalPaid.toLocaleString()} Kz pagos`, color: 'var(--color-primary-dark)', icon: '📈' },
          ].map(card => (
            <div key={card.label} className="card-premium" style={{ padding: '1.25rem' }}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-muted)' }}>{card.label}</p>
                <span style={{ fontSize: '18px' }}>{card.icon}</span>
              </div>
              <p className="font-serif text-2xl sm:text-3xl font-bold mb-1" style={{ color: card.color }}>{card.value}</p>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{card.sub}</p>
            </div>
          ))}
        </div>

        {/* Referral link */}
        <div className="rounded-2xl p-6 mb-4" style={{
          background: 'linear-gradient(135deg, var(--color-primary-dark) 0%, var(--color-primary) 100%)',
          color: 'white',
          boxShadow: '0 8px 32px rgba(30,61,24,0.30)',
        }}>
          <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.65)' }}>
            O seu link de afiliado
          </p>
          <div className="flex items-center gap-3 flex-wrap mb-3">
            <code className="flex-1 rounded-xl px-4 py-2.5 text-sm font-mono break-all"
              style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)' }}>
              {referralLink}
            </code>
            <CopyButton text={referralLink} />
          </div>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.65)' }}>
            Cada venda confirmada gera <strong style={{ color: '#fff' }}>{COMMISSION.amount.toLocaleString()} Kz</strong> de comissão para si.
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
