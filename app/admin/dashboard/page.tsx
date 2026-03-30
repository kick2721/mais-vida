// app/admin/dashboard/page.tsx
// Painel do Admin — Etapa 6

import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { logoutUser } from '@/lib/actions'
import { BUSINESS } from '@/lib/constants'
import AdminSalesTable from './AdminSalesTable'
import AdminAffiliatesTable from './AdminAffiliatesTable'
import IssueCardButton from './IssueCardButton'
import AdminCommissionsActions from './AdminCommissionsActions'
import AdminApplicationsTable from './AdminApplicationsTable'
import Logo from '@/app/components/ui/Logo'

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const params = await searchParams
  const activeTab = params.tab || 'sales'

  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') redirect('/login')

  // ─── KPIs ────────────────────────────────────────────────────
  const { count: totalSales } = await supabase
    .from('sales')
    .select('id', { count: 'exact', head: true })

  const { count: pendingSales } = await supabase
    .from('sales')
    .select('id', { count: 'exact', head: true })
    .in('status', ['pending', 'pending_review'])

  const { count: confirmedSales } = await supabase
    .from('sales')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'confirmed')

  const { count: totalAffiliates } = await supabase
    .from('affiliates')
    .select('id', { count: 'exact', head: true })
    .eq('is_active', true)

  const { count: pendingCards } = await supabase
    .from('member_cards')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'pending')

  // ─── SALES DATA ──────────────────────────────────────────────
  const { data: sales } = await supabase
    .from('sales')
    .select(`
      id, amount, currency, status, payment_method, payment_proof_url,
      created_at, confirmed_at, confirmed_by, notes,
      customers (
        id,
        profiles ( full_name, phone, national_id )
      ),
      affiliates (
        id, referral_code,
        profiles ( full_name )
      )
    `)
    .order('created_at', { ascending: false })
    .limit(100)

  // ─── AFFILIATES DATA ─────────────────────────────────────────
  const { data: affiliates } = await supabase
    .from('affiliates')
    .select(`
      id, referral_code, total_sales, total_earned, total_paid, balance,
      is_active, joined_at,
      profiles ( full_name, phone, national_id )
    `)
    .order('joined_at', { ascending: false })

  // ─── COMMISSIONS DATA ────────────────────────────────────────
  const { data: commissions } = await supabase
    .from('commissions')
    .select(`
      id, amount, currency, status, created_at, paid_at,
      affiliates (
        referral_code,
        profiles ( full_name )
      )
    `)
    .in('status', ['pending', 'approved'])
    .order('created_at', { ascending: false })

  // ─── CARDS DATA ──────────────────────────────────────────────
  const { data: cards } = await supabase
    .from('member_cards')
    .select(`
      id, card_number, status, issued_at, issued_by, card_image_url, created_at,
      customers (
        id,
        profiles ( full_name, phone )
      )
    `)
    .order('created_at', { ascending: false })
    .limit(50)

  // ─── APPLICATIONS DATA ───────────────────────────────────────
  const { data: applications } = await supabase
    .from('affiliate_applications')
    .select('*')
    .order('created_at', { ascending: false })

  const { count: pendingApplications } = await supabase
    .from('affiliate_applications')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'pending')

  const kpis = [
    { label: 'Vendas Totais', value: totalSales || 0, sub: `${pendingSales} pendentes`, color: 'var(--color-primary)', icon: '💳' },
    { label: 'Confirmadas', value: confirmedSales || 0, sub: 'receita validada', color: '#166534', icon: '✅' },
    { label: 'Afiliados Activos', value: totalAffiliates || 0, sub: 'na plataforma', color: '#1e40af', icon: '👥' },
    { label: 'Cartões Pendentes', value: pendingCards || 0, sub: 'para emitir', color: '#d97706', icon: '🪪' },
    { label: 'Candidaturas', value: pendingApplications || 0, sub: 'pendentes de análise', color: '#7c3aed', icon: '📋' },
  ]

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
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {kpis.map(kpi => (
            <div key={kpi.label} className="card">
              <div className="flex items-start justify-between mb-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{kpi.label}</p>
                <span className="text-xl">{kpi.icon}</span>
              </div>
              <p className="font-display text-3xl font-bold" style={{ color: kpi.color }}>
                {kpi.value}
              </p>
              <p className="text-xs text-gray-500 mt-1">{kpi.sub}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-white rounded-2xl p-1 border" style={{ borderColor: 'var(--color-border)' }}>
          {[
            { key: 'sales', label: '💳 Vendas' },
            { key: 'cards', label: '🪪 Cartões' },
            { key: 'affiliates', label: '👥 Afiliados' },
            { key: 'commissions', label: '💰 Comissões' },
            { key: 'applications', label: '📋 Candidaturas' },
          ].map(tab => (
            <a
              key={tab.key}
              href={`/admin/dashboard?tab=${tab.key}`}
              className="flex-1 text-center py-2 px-3 rounded-xl text-sm font-semibold transition-all"
              style={
                activeTab === tab.key
                  ? { background: 'var(--color-primary)', color: 'white' }
                  : { color: '#6b7280' }
              }
            >
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
            </a>
          ))}
        </div>

        {/* Sales Tab */}
        {activeTab === 'sales' && (
          <AdminSalesTable sales={(sales as any[]) || []} adminId={user.id} />
        )}

        {/* Cards Tab */}
        {activeTab === 'cards' && (
          <AdminCardsSection cards={cards || []} adminId={user.id} />
        )}

        {/* Affiliates Tab */}
        {activeTab === 'affiliates' && (
          <AdminAffiliatesTable affiliates={affiliates || []} />
        )}

        {/* Commissions Tab */}
        {activeTab === 'commissions' && (
          <AdminCommissionsSection commissions={commissions || []} adminId={user.id} />
        )}

        {/* Applications Tab */}
        {activeTab === 'applications' && (
          <AdminApplicationsTable applications={(applications as any[]) || []} />
        )}
      </div>
    </div>
  )
}

// ─── CARDS SECTION ──────────────────────────────────────────────────────────
function AdminCardsSection({ cards, adminId }: { cards: any[]; adminId: string }) {
  const pending = cards.filter(c => c.status === 'pending')
  const issued = cards.filter(c => c.status === 'issued')

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-lg font-bold text-gray-900">
          Cartões ({cards.length})
        </h2>
        <span className="text-sm text-yellow-700 bg-yellow-50 px-3 py-1 rounded-full font-medium">
          {pending.length} pendentes de emissão
        </span>
      </div>

      {/* Alerta de processo manual */}
      <div className="rounded-2xl p-4 mb-6 border border-yellow-200 bg-yellow-50">
        <p className="text-sm font-semibold text-yellow-800">📋 Processo de emissão de cartão</p>
        <p className="text-xs text-yellow-700 mt-1">
          O cartão digital é preparado manualmente e enviado ao cliente via WhatsApp ou email.
          Após enviar, marque como "Emitido" para registar a emissão no sistema.
        </p>
      </div>

      {/* Pendentes primeiro */}
      {pending.length > 0 && (
        <div className="mb-8">
          <h3 className="font-semibold text-gray-700 text-sm mb-3 uppercase tracking-wide">
            ⚠️ Pendentes de emissão
          </h3>
          <div className="space-y-3">
            {pending.map(card => (
              <CardRow key={card.id} card={card} adminId={adminId} />
            ))}
          </div>
        </div>
      )}

      {/* Emitidos */}
      {issued.length > 0 && (
        <div>
          <h3 className="font-semibold text-gray-700 text-sm mb-3 uppercase tracking-wide">
            ✅ Cartões emitidos
          </h3>
          <div className="space-y-3">
            {issued.map(card => (
              <CardRow key={card.id} card={card} adminId={adminId} />
            ))}
          </div>
        </div>
      )}

      {cards.length === 0 && (
        <div className="card text-center py-10">
          <p className="text-4xl mb-3">🪪</p>
          <p className="text-gray-500 text-sm">Ainda não há cartões gerados.</p>
        </div>
      )}
    </div>
  )
}

function CardRow({ card, adminId }: { card: any; adminId: string }) {
  const customerProfile = card.customers?.profiles
  return (
    <div className="card flex items-center justify-between gap-4 flex-wrap">
      <div>
        <p className="font-semibold text-gray-800 text-sm">{customerProfile?.full_name || 'Cliente'}</p>
        <p className="text-xs text-gray-500">{customerProfile?.phone}</p>
        <p className="text-xs font-mono text-gray-600 mt-1">Nº {card.card_number}</p>
      </div>
      <div className="flex items-center gap-3">
        {card.status === 'issued' ? (
          <span className="text-xs px-3 py-1 rounded-full font-medium bg-green-100 text-green-700">
            ✅ Emitido {card.issued_at && `— ${new Date(card.issued_at).toLocaleDateString('pt-AO')}`}
          </span>
        ) : (
          <IssueCardButton
            cardId={card.id}
            adminId={adminId}
            customerName={customerProfile?.full_name || 'Cliente'}
            customerPhone={customerProfile?.phone}
          />
        )}
      </div>
    </div>
  )
}

// ─── COMMISSIONS SECTION ────────────────────────────────────────────────────
function AdminCommissionsSection({ commissions, adminId }: { commissions: any[]; adminId: string }) {
  return (
    <div>
      <h2 className="font-display text-lg font-bold text-gray-900 mb-4">
        Comissões a Pagar ({commissions.length})
      </h2>
      {commissions.length > 0 ? (
        <div className="space-y-3">
          {commissions.map(commission => {
            const affiliateProfile = (commission.affiliates as any)?.profiles
            const isPending = commission.status === 'pending'
            return (
              <div key={commission.id} className="card flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <p className="font-semibold text-gray-800 text-sm">
                    {affiliateProfile?.full_name || 'Afiliado'}
                  </p>
                  <p className="text-xs text-gray-500 font-mono">
                    {(commission.affiliates as any)?.referral_code}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(commission.created_at).toLocaleDateString('pt-AO')}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-gray-800">
                    {commission.amount.toLocaleString()} {commission.currency}
                  </span>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                    commission.status === 'approved' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {commission.status === 'approved' ? '✓ Aprovada' : '⏳ Pendente'}
                  </span>
                  <AdminCommissionsActions
                    commissionId={commission.id}
                    status={commission.status}
                    amount={commission.amount}
                    currency={commission.currency}
                    affiliateName={affiliateProfile?.full_name || 'Afiliado'}
                  />
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="card text-center py-10">
          <p className="text-4xl mb-3">✅</p>
          <p className="text-gray-500 text-sm">Sem comissões pendentes de pagamento.</p>
        </div>
      )}
    </div>
  )
}
