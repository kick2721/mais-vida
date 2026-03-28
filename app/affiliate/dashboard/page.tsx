// app/affiliate/dashboard/page.tsx
// Painel do Afiliado — Etapa 6

import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { logoutUser } from '@/lib/actions'
import { BUSINESS, COMMISSION } from '@/lib/constants'
import CopyButton from './CopyButton'
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

  const { data: sales } = await supabase
    .from('sales')
    .select(`
      id, amount, currency, status, created_at, confirmed_at,
      customers ( id, profiles ( full_name, phone ) )
    `)
    .eq('affiliate_id', affiliate.id)
    .order('created_at', { ascending: false })

  const { data: commissions } = await supabase
    .from('commissions')
    .select('*')
    .eq('affiliate_id', affiliate.id)
    .order('created_at', { ascending: false })

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
        <div className="rounded-2xl p-6 mb-8" style={{ background: 'var(--color-primary)', color: 'white' }}>
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Vendas */}
          <div>
            <h2 className="font-display text-lg font-bold text-gray-900 mb-4">
              Vendas Referidas ({totalSales})
            </h2>
            {sales && sales.length > 0 ? (
              <div className="space-y-3">
                {sales.map((sale) => {
                  const st = saleStatusMap[sale.status] || { label: sale.status, color: '#374151', bg: '#f3f4f6' }
                  const customerProfile = (sale.customers as any)?.profiles
                  return (
                    <div key={sale.id} className="card flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-800 text-sm truncate">
                          {customerProfile?.full_name || 'Cliente'}
                        </p>
                        <p className="text-xs text-gray-500">{customerProfile?.phone || '—'}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(sale.created_at).toLocaleDateString('pt-AO', {
                            day: '2-digit', month: 'short', year: 'numeric',
                          })}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-bold text-gray-800 text-sm">
                          {sale.amount?.toLocaleString()} {sale.currency}
                        </p>
                        <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{ background: st.bg, color: st.color }}>
                          {st.label}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="card text-center py-10">
                <p className="text-4xl mb-3">📊</p>
                <p className="text-gray-500 text-sm font-medium">Sem vendas referidas ainda.</p>
                <p className="text-gray-400 text-xs mt-1">Partilhe o seu link para começar!</p>
              </div>
            )}
          </div>

          {/* Comissões */}
          <div>
            <h2 className="font-display text-lg font-bold text-gray-900 mb-4">
              Comissões ({commissions?.length || 0})
            </h2>
            {commissions && commissions.length > 0 ? (
              <div className="space-y-3">
                {commissions.map((commission) => {
                  const cs = commissionStatusMap[commission.status] || { label: commission.status, color: '#374151', bg: '#f3f4f6' }
                  return (
                    <div key={commission.id} className="card flex items-center justify-between gap-4">
                      <div>
                        <p className="font-bold text-gray-800">
                          {commission.amount.toLocaleString()} {commission.currency}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {new Date(commission.created_at).toLocaleDateString('pt-AO', {
                            day: '2-digit', month: 'short', year: 'numeric',
                          })}
                        </p>
                        {commission.paid_at && (
                          <p className="text-xs text-gray-400">
                            Pago: {new Date(commission.paid_at).toLocaleDateString('pt-AO')}
                          </p>
                        )}
                      </div>
                      <span className="text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0"
                        style={{ background: cs.bg, color: cs.color }}>
                        {cs.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="card text-center py-10">
                <p className="text-4xl mb-3">💰</p>
                <p className="text-gray-500 text-sm font-medium">Sem comissões geradas.</p>
                <p className="text-gray-400 text-xs mt-1">Aparecem após venda confirmada pelo admin.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
