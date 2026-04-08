// app/admin/dashboard/page.tsx

import { redirect } from 'next/navigation'
import { createServerSupabaseClient, createServerSupabaseAdminClient } from '@/lib/supabase-server'
import { logoutUser } from '@/lib/actions'
import { BUSINESS } from '@/lib/constants'
import AdminTabsClient from './AdminTabsClient'
import Logo from '@/app/components/ui/Logo'
import { cleanupExpiredReceipts } from '@/lib/receipt-cleanup'

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const params = await searchParams
  const activeTab = params.tab || 'sales'

  cleanupExpiredReceipts().catch(err =>
    console.error('[Cleanup] Erro no cleanup automático:', err)
  )

  const supabase      = await createServerSupabaseClient()
  const supabaseAdmin = await createServerSupabaseAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') redirect('/login')

  // ─── Datas para comparação mês actual vs mês anterior ─────────────────────
  const now            = new Date()
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()
  const prevMonthEnd   = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString()

  // ─── KPIs — totais ────────────────────────────────────────────────────────
  const [
    { count: totalSales },
    { count: pendingSales },
    { count: confirmedSales },
    { count: totalAffiliates },
    { count: pendingCards },
    { count: pendingApplications },
    { count: totalCommissions },
    { count: paidWithdrawals },
  ] = await Promise.all([
    supabaseAdmin.from('sales').select('id', { count: 'exact', head: true }),
    supabaseAdmin.from('sales').select('id', { count: 'exact', head: true }).in('status', ['pending', 'pending_review']),
    supabaseAdmin.from('sales').select('id', { count: 'exact', head: true }).eq('status', 'confirmed'),
    supabaseAdmin.from('affiliates').select('id', { count: 'exact', head: true }).eq('is_active', true),
    supabaseAdmin.from('member_cards').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabaseAdmin.from('affiliate_applications').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    supabaseAdmin.from('commissions').select('id', { count: 'exact', head: true }),
    supabaseAdmin.from('withdrawal_requests').select('id', { count: 'exact', head: true }).eq('status', 'paid'),
  ])

  // ─── Receita total (vendas confirmadas) ───────────────────────────────────
  const { data: revenueData } = await supabaseAdmin
    .from('sales')
    .select('amount')
    .eq('status', 'confirmed')

  const totalRevenue = (revenueData || []).reduce((sum: number, s: any) => sum + (s.amount || 0), 0)

  // ─── KPIs — variação mês actual vs mês anterior ───────────────────────────
  const [
    { count: salesThisMonth },
    { count: salesPrevMonth },
    { data: revenueThisMonthData },
    { data: revenuePrevMonthData },
  ] = await Promise.all([
    supabaseAdmin.from('sales').select('id', { count: 'exact', head: true }).gte('created_at', thisMonthStart),
    supabaseAdmin.from('sales').select('id', { count: 'exact', head: true }).gte('created_at', prevMonthStart).lte('created_at', prevMonthEnd),
    supabaseAdmin.from('sales').select('amount').eq('status', 'confirmed').gte('created_at', thisMonthStart),
    supabaseAdmin.from('sales').select('amount').eq('status', 'confirmed').gte('created_at', prevMonthStart).lte('created_at', prevMonthEnd),
  ])

  const revenueThisMonth = (revenueThisMonthData || []).reduce((s: number, r: any) => s + (r.amount || 0), 0)
  const revenuePrevMonth = (revenuePrevMonthData || []).reduce((s: number, r: any) => s + (r.amount || 0), 0)

  // ─── SALES DATA ───────────────────────────────────────────────────────────
  // Sem limit — paginação feita no cliente (AdminSalesTable)
  const { data: salesRaw, error: salesError } = await supabaseAdmin
    .from('sales')
    .select(`
      id, amount, currency, status, payment_method,
      payment_proof_url, receipt_path, referral_code,
      customer_name, customer_email, customer_phone, national_id,
      created_at, confirmed_at, notes
    `)
    .order('created_at', { ascending: false })

  if (salesError) {
    console.error('[Admin] Erro ao carregar vendas:', salesError)
  }

  // Signed URLs para comprovativos
  const sales = await Promise.all((salesRaw || []).map(async (sale: any) => {
    if (sale.receipt_path) {
      const storagePath = sale.receipt_path.startsWith('receipts/')
        ? sale.receipt_path
        : `receipts/${sale.receipt_path}`

      const { data: signed, error: signError } = await supabaseAdmin.storage
        .from('receipts')
        .createSignedUrl(storagePath, 60 * 60 * 6)

      if (signError) {
        console.error('[Admin] Erro signed URL:', signError, '| path:', sale.receipt_path)
      }

      return { ...sale, payment_proof_url: signed?.signedUrl || sale.payment_proof_url || null }
    }
    return sale
  }))

  // Enriquecer vendas com dados do afiliado
  const salesWithAffiliate = await Promise.all(sales.map(async (sale: any) => {
    if (!sale.referral_code) return sale
    const { data: aff } = await supabaseAdmin
      .from('affiliates')
      .select('id, referral_code, profiles(full_name)')
      .eq('referral_code', sale.referral_code)
      .single()
    return { ...sale, affiliate_data: aff || null }
  }))

  // ─── AFFILIATES DATA ──────────────────────────────────────────────────────
  const { data: affiliatesRaw } = await supabaseAdmin
    .from('affiliates')
    .select(`
      id, referral_code, total_sales, total_earned, total_paid, balance,
      is_active, joined_at,
      profiles ( full_name, phone, national_id )
    `)
    .order('total_sales', { ascending: false })

  // Vendas mensais por afiliado (últimos 6 meses) para mini-gráfico e tendência
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1).toISOString()

  const { data: monthlySalesRaw } = await supabaseAdmin
    .from('sales')
    .select('referral_code, created_at')
    .gte('created_at', sixMonthsAgo)
    .not('referral_code', 'is', null)

  // Agrupar por afiliado e mês
  const monthlySalesByCode: Record<string, Record<string, number>> = {}
  for (const s of (monthlySalesRaw || []) as any[]) {
    if (!s.referral_code) continue
    const month = s.created_at.slice(0, 7) // 'YYYY-MM'
    if (!monthlySalesByCode[s.referral_code]) monthlySalesByCode[s.referral_code] = {}
    monthlySalesByCode[s.referral_code][month] = (monthlySalesByCode[s.referral_code][month] || 0) + 1
  }

  const affiliates = (affiliatesRaw || []).map((aff: any) => {
    const byMonth = monthlySalesByCode[aff.referral_code] || {}
    const monthly_sales = Object.entries(byMonth).map(([month, count]) => ({ month, count: count as number }))
    return { ...aff, monthly_sales }
  })

  // ─── COMMISSIONS DATA ─────────────────────────────────────────────────────
  const { data: commissions } = await supabaseAdmin
    .from('commissions')
    .select(`
      id, amount, currency, status, created_at, paid_at,
      affiliates (
        referral_code,
        profiles ( full_name, phone )
      )
    `)
    .in('status', ['approved', 'paid'])
    .order('created_at', { ascending: false })

  // ─── WITHDRAWAL REQUESTS ──────────────────────────────────────────────────
  const { data: withdrawals } = await supabaseAdmin
    .from('withdrawal_requests')
    .select(`
      id, amount, currency, iban, status, requested_at, reviewed_at,
      affiliates (
        referral_code,
        profiles ( full_name, phone )
      )
    `)
    .order('requested_at', { ascending: false })
    .limit(200)

  // ─── CARDS DATA ───────────────────────────────────────────────────────────
  const { data: cardsRaw } = await supabaseAdmin
    .from('member_cards')
    .select(`
      id, card_number, status, issued_at, issued_by, card_image_url, created_at,
      sale_id
    `)
    .order('created_at', { ascending: false })

  const cards = await Promise.all((cardsRaw || []).map(async (card: any) => {
    if (!card.sale_id) return card
    const { data: sale } = await supabaseAdmin
      .from('sales')
      .select('customer_name, customer_phone, customer_email, national_id')
      .eq('id', card.sale_id)
      .single()
    return { ...card, sale_data: sale || null }
  }))

  // ─── APPLICATIONS DATA ────────────────────────────────────────────────────
  const { data: applications } = await supabaseAdmin
    .from('affiliate_applications')
    .select('*')
    .order('created_at', { ascending: false })

  // ─── KPI helpers ──────────────────────────────────────────────────────────
  function trendPct(current: number, previous: number): number | null {
    if (previous === 0) return null
    return Math.round(((current - previous) / previous) * 100)
  }

  const salesTrend   = trendPct(salesThisMonth || 0, salesPrevMonth || 0)
  const revenueTrend = trendPct(revenueThisMonth, revenuePrevMonth)

  // Badge counts para tabs
  const tabBadges: Record<string, number> = {
    sales:        pendingSales        || 0,
    cards:        pendingCards        || 0,
    applications: pendingApplications || 0,
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-surface)' }}>

      {/* Header */}
      <header className="bg-white border-b" style={{ borderColor: 'var(--color-border)' }}>
        <div className="section-container flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <Logo size="sm" href="/" />
            <span className="text-xs font-semibold text-white px-2 py-0.5 rounded-full"
              style={{ background: 'var(--color-highlight)' }}>
              ADMIN
            </span>
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
          <h1 className="font-display text-2xl font-bold text-gray-900">Painel Administrativo</h1>
          <p className="text-gray-500 text-sm mt-1">Gestão de vendas, afiliados, cartões e comissões</p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">

          {/* Receita total */}
          <KpiCard
            label="Receita Total"
            value={`${totalRevenue.toLocaleString()} Kz`}
            sub={`este mês: ${revenueThisMonth.toLocaleString()} Kz`}
            trend={revenueTrend}
            color="var(--color-primary)"
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="1" x2="12" y2="23"/>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
              </svg>
            }
          />

          {/* Vendas totais */}
          <KpiCard
            label="Vendas Totais"
            value={String(totalSales || 0)}
            sub={`este mês: ${salesThisMonth || 0}`}
            trend={salesTrend}
            color="var(--color-primary)"
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
              </svg>
            }
          />

          {/* Pendentes */}
          <KpiCard
            label="Pendentes"
            value={String(pendingSales || 0)}
            sub="para rever"
            color="#d97706"
            urgent={!!(pendingSales && pendingSales > 0)}
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
            }
          />

          {/* Afiliados */}
          <KpiCard
            label="Afiliados Activos"
            value={String(totalAffiliates || 0)}
            sub="na plataforma"
            color="#1e40af"
            icon={<span className="text-lg">👥</span>}
          />

          {/* Cartões pendentes */}
          <KpiCard
            label="Cartões Pendentes"
            value={String(pendingCards || 0)}
            sub="para emitir"
            color="#d97706"
            urgent={!!(pendingCards && pendingCards > 0)}
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="5" width="20" height="14" rx="2"/>
                <line x1="2" y1="10" x2="22" y2="10"/>
                <line x1="6" y1="15" x2="10" y2="15"/>
              </svg>
            }
          />

          {/* Candidaturas */}
          <KpiCard
            label="Candidaturas"
            value={String(pendingApplications || 0)}
            sub="pendentes"
            color="#dc2626"
            urgent={!!(pendingApplications && pendingApplications > 0)}
            icon={<span className="text-lg">📋</span>}
          />
        </div>

        <AdminTabsClient
          initialTab={(activeTab as any) || 'sales'}
          sales={salesWithAffiliate}
          affiliates={affiliates}
          commissions={commissions || []}
          withdrawals={withdrawals || []}
          cards={cards}
          applications={(applications as any[]) || []}
          adminId={user.id}
          tabBadges={tabBadges}
        />
      </div>
    </div>
  )
}

// ─── KPI Card component ───────────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  sub,
  color,
  icon,
  trend,
  urgent = false,
}: {
  label: string
  value: string
  sub: string
  color: string
  icon: React.ReactNode
  trend?: number | null
  urgent?: boolean
}) {
  return (
    <div
      className="card"
      style={urgent ? { borderColor: '#fbbf24', borderWidth: 1.5 } : undefined}
    >
      <div className="flex items-start justify-between mb-2">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide leading-tight">{label}</p>
        {icon}
      </div>
      <p className="font-display text-2xl font-bold truncate" style={{ color }}>
        {value}
      </p>
      <div className="flex items-center gap-2 mt-1">
        <p className="text-xs text-gray-500 truncate">{sub}</p>
        {trend !== null && trend !== undefined && (
          <span
            className="flex-shrink-0 flex items-center gap-0.5 text-xs font-semibold"
            style={{ color: trend >= 0 ? '#16a34a' : '#dc2626' }}
          >
            <svg
              width="9" height="9" viewBox="0 0 10 10" fill="currentColor"
              style={{ transform: trend >= 0 ? 'none' : 'rotate(180deg)' }}
            >
              <path d="M5 1L9 7H1L5 1Z"/>
            </svg>
            {Math.abs(trend)}%
          </span>
        )}
      </div>
    </div>
  )
}
