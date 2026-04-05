// app/admin/dashboard/page.tsx

import { redirect } from 'next/navigation'
import { createServerSupabaseClient, createServerSupabaseAdminClient } from '@/lib/supabase-server'
import { logoutUser } from '@/lib/actions'
import { BUSINESS } from '@/lib/constants'
import AdminSalesTable from './AdminSalesTable'
import AdminAffiliatesTable from './AdminAffiliatesTable'
import IssueCardButton from './IssueCardButton'
import AdminCommissionsActions from './AdminCommissionsActions'
import WithdrawalActions from './WithdrawalActions'
import AdminApplicationsTable from './AdminApplicationsTable'
import Logo from '@/app/components/ui/Logo'
import { cleanupExpiredReceipts } from '@/lib/receipt-cleanup'

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const params = await searchParams
  const activeTab = params.tab || 'sales'

  // Limpar comprovativos expirados em segundo plano (lazy cleanup)
  // Corre silenciosamente cada vez que o admin abre o painel
  cleanupExpiredReceipts().catch(err =>
    console.error('[Cleanup] Erro no cleanup automático:', err)
  )

  const supabase = await createServerSupabaseClient()
  const supabaseAdmin = await createServerSupabaseAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') redirect('/login')

  // ─── KPIs ─────────────────────────────────────────────────────────────────
  const { count: totalSales } = await supabaseAdmin
    .from('sales')
    .select('id', { count: 'exact', head: true })

  const { count: pendingSales } = await supabaseAdmin
    .from('sales')
    .select('id', { count: 'exact', head: true })
    .in('status', ['pending', 'pending_review'])

  const { count: confirmedSales } = await supabaseAdmin
    .from('sales')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'confirmed')

  const { count: totalAffiliates } = await supabaseAdmin
    .from('affiliates')
    .select('id', { count: 'exact', head: true })
    .eq('is_active', true)

  const { count: pendingCards } = await supabaseAdmin
    .from('member_cards')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'pending')

  const { count: pendingApplications } = await supabaseAdmin
    .from('affiliate_applications')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'pending')

  // ─── COMMISSIONS KPI ──────────────────────────────────────────────────────
  const { count: pendingCommissions } = await supabaseAdmin
    .from('commissions')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'approved')

  const { count: paidCommissions } = await supabaseAdmin
    .from('commissions')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'paid')
  // Query simplificada: sem JOIN a customers (compras anónimas não têm customer_id)
  // Afiliado resolvido por referral_code directamente
  const { data: salesRaw, error: salesError } = await supabaseAdmin
    .from('sales')
    .select(`
      id, amount, currency, status, payment_method,
      payment_proof_url, receipt_path, referral_code,
      customer_name, customer_email, customer_phone, national_id,
      created_at, confirmed_at, notes
    `)
    .order('created_at', { ascending: false })
    .limit(200)

  if (salesError) {
    console.error('[Admin] Erro ao carregar vendas:', salesError)
  }

  // Gerar signed URLs para todos os comprovativos via receipt_path
  const sales = await Promise.all((salesRaw || []).map(async (sale: any) => {
    // Sempre regerar a URL a partir do receipt_path (URL pré-guardada pode expirar)
    if (sale.receipt_path) {
      // O ficheiro no storage tem path 'receipts/filename.jpeg' dentro do bucket 'receipts'
      // Por isso o path para createSignedUrl deve INCLUIR o prefixo 'receipts/'
      const storagePath = sale.receipt_path.startsWith('receipts/')
        ? sale.receipt_path              // já tem o prefixo correcto
        : `receipts/${sale.receipt_path}` // adiciona o prefixo

      const { data: signed, error: signError } = await supabaseAdmin.storage
        .from('receipts')
        .createSignedUrl(storagePath, 60 * 60 * 6) // 6 horas

      if (signError) {
        console.error('[Admin] Erro signed URL:', signError, '| path:', sale.receipt_path)
      }

      return { ...sale, payment_proof_url: signed?.signedUrl || sale.payment_proof_url || null }
    }
    return sale
  }))

  // Enriquecer vendas com dados do afiliado (via referral_code)
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
  const { data: affiliates } = await supabaseAdmin
    .from('affiliates')
    .select(`
      id, referral_code, total_sales, total_earned, total_paid, balance,
      is_active, joined_at,
      profiles ( full_name, phone, national_id )
    `)
    .order('joined_at', { ascending: false })

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
    .limit(50)

  // ─── CARDS DATA ───────────────────────────────────────────────────────────
  // Cartões ligados a vendas — buscar info do cliente via venda
  const { data: cardsRaw } = await supabaseAdmin
    .from('member_cards')
    .select(`
      id, card_number, status, issued_at, issued_by, card_image_url, created_at,
      sale_id
    `)
    .order('created_at', { ascending: false })
    .limit(50)

  // Enriquecer cartões com dados da venda associada
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

  const kpis = [
    { label: 'Vendas Totais',     value: totalSales          || 0, sub: `${pendingSales ?? 0} pendentes`,                              color: 'var(--color-primary)', icon: 'dollar' },
    { label: 'Afiliados Activos', value: totalAffiliates     || 0, sub: 'na plataforma',                                               color: '#1e40af',              icon: '👥' },
    { label: 'Cartões Pendentes', value: pendingCards        || 0, sub: 'para emitir',                                                 color: '#d97706',              icon: 'card' },
    { label: 'Comissões',         value: pendingCommissions  || 0, sub: `${paidCommissions ?? 0} pagas`,                               color: '#7c3aed',              icon: '💰' },
    { label: 'Candidaturas',      value: pendingApplications || 0, sub: 'pendentes de análise',                                        color: '#dc2626',              icon: '📋' },
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
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          {kpis.map(kpi => (
            <div key={kpi.label} className="card">
              <div className="flex items-start justify-between mb-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{kpi.label}</p>
                {kpi.icon === 'card' ? (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="5" width="20" height="14" rx="2"/>
                    <line x1="2" y1="10" x2="22" y2="10"/>
                    <line x1="6" y1="15" x2="10" y2="15"/>
                  </svg>
                ) : kpi.icon === 'dollar' ? (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="1" x2="12" y2="23"/>
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                  </svg>
                ) : (
                  <span className="text-xl">{kpi.icon}</span>
                )}
              </div>
              <p className="font-display text-3xl font-bold" style={{ color: kpi.color }}>
                {kpi.value}
              </p>
              <p className="text-xs text-gray-500 mt-1">{kpi.sub}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-white rounded-2xl p-1 border overflow-x-auto" style={{ borderColor: 'var(--color-border)' }}>
          {[
            { key: 'sales',        label: 'Vendas',       emoji: '💳' },
            { key: 'cards',        label: 'Cartões',      emoji: null },
            { key: 'affiliates',   label: 'Afiliados',    emoji: '👥' },
            { key: 'commissions',  label: 'Comissões',    emoji: '💰' },
            { key: 'applications', label: 'Candidaturas', emoji: '📋' },
          ].map(tab => (
            <a
              key={tab.key}
              href={`/admin/dashboard?tab=${tab.key}`}
              className="flex-shrink-0 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-sm font-semibold transition-all"
              style={
                activeTab === tab.key
                  ? { background: 'var(--color-primary)', color: 'white' }
                  : { color: '#6b7280' }
              }
            >
              {tab.emoji ? (
                <span>{tab.emoji}</span>
              ) : (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="5" width="20" height="14" rx="2"/>
                  <line x1="2" y1="10" x2="22" y2="10"/>
                  <line x1="6" y1="15" x2="10" y2="15"/>
                </svg>
              )}
              <span className="hidden sm:inline">{tab.label}</span>
            </a>
          ))}
        </div>

        {/* Tabs content */}
        {activeTab === 'sales' && (
          <AdminSalesTable sales={salesWithAffiliate} adminId={user.id} />
        )}
        {activeTab === 'cards' && (
          <AdminCardsSection cards={cards} adminId={user.id} />
        )}
        {activeTab === 'affiliates' && (
          <AdminAffiliatesTable affiliates={affiliates || []} />
        )}
        {activeTab === 'commissions' && (
          <AdminCommissionsSection commissions={commissions || []} withdrawals={withdrawals || []} adminId={user.id} />
        )}
        {activeTab === 'applications' && (
          <AdminApplicationsTable applications={(applications as any[]) || []} />
        )}
      </div>
    </div>
  )
}

// ─── CARDS SECTION ────────────────────────────────────────────────────────────
function AdminCardsSection({ cards, adminId }: { cards: any[]; adminId: string }) {
  const pending = cards.filter(c => c.status === 'pending')
  const issued  = cards.filter(c => c.status === 'issued')

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

      <div className="rounded-2xl p-4 mb-6 border border-yellow-200 bg-yellow-50">
        <p className="text-sm font-semibold text-yellow-800">📋 Processo de emissão de cartão</p>
        <p className="text-xs text-yellow-700 mt-1">
          O cartão digital é preparado manualmente e enviado ao cliente via WhatsApp ou email.
          Após enviar, marque como &quot;Emitido&quot; para registar a emissão no sistema.
        </p>
      </div>

      {pending.length > 0 && (
        <div className="mb-8">
          <h3 className="font-semibold text-gray-700 text-sm mb-3 uppercase tracking-wide">
            ⚠️ Pendentes de emissão
          </h3>
          <div className="space-y-3">
            {pending.map(card => <CardRow key={card.id} card={card} adminId={adminId} />)}
          </div>
        </div>
      )}

      {issued.length > 0 && (
        <div>
          <h3 className="font-semibold text-gray-700 text-sm mb-3 uppercase tracking-wide">
            ✅ Cartões emitidos
          </h3>
          <div className="space-y-3">
            {issued.map(card => <CardRow key={card.id} card={card} adminId={adminId} />)}
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
  const saleData = card.sale_data
  return (
    <div className="card flex items-center justify-between gap-4 flex-wrap">
      <div>
        <p className="font-semibold text-gray-800 text-sm">{saleData?.customer_name || 'Cliente'}</p>
        <p className="text-xs text-gray-500">{saleData?.customer_phone}</p>
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
            customerName={saleData?.customer_name || 'Cliente'}
            customerPhone={saleData?.customer_phone}
          />
        )}
      </div>
    </div>
  )
}

// ─── COMMISSIONS SECTION ──────────────────────────────────────────────────────
function AdminCommissionsSection({ commissions, withdrawals, adminId }: { commissions: any[]; withdrawals: any[]; adminId: string }) {
  const pendingWithdrawals = withdrawals.filter(w => w.status === 'pending')
  const doneWithdrawals    = withdrawals.filter(w => w.status !== 'pending')

  // Agrupar comissões por afiliado
  const grouped: Record<string, { name: string; code: string; phone: string; items: any[] }> = {}
  for (const c of commissions) {
    const aff = c.affiliates as any
    const key = aff?.referral_code || 'unknown'
    if (!grouped[key]) {
      grouped[key] = {
        name:  aff?.profiles?.full_name || 'Afiliado',
        code:  aff?.referral_code || '—',
        phone: aff?.profiles?.phone || '',
        items: [],
      }
    }
    grouped[key].items.push(c)
  }

  const groups = Object.values(grouped)
  const totalPending = commissions.filter(c => c.status === 'approved').length
  const totalPaid    = commissions.filter(c => c.status === 'paid').length

  return (
    <div className="space-y-8">

      {/* ── Pedidos de Retiro ── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg font-bold text-gray-900">Pedidos de Retiro</h2>
          {pendingWithdrawals.length > 0 && (
            <span className="text-sm font-medium px-3 py-1 rounded-full bg-orange-100 text-orange-700">
              {pendingWithdrawals.length} pendente{pendingWithdrawals.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {pendingWithdrawals.length > 0 && (
          <div className="space-y-3 mb-4">
            {pendingWithdrawals.map((w: any) => {
              const aff = w.affiliates as any
              const name  = aff?.profiles?.full_name || 'Afiliado'
              const phone = aff?.profiles?.phone || ''
              return (
                <div key={w.id} className="card border-l-4" style={{ borderLeftColor: '#f97316' }}>
                  <div className="flex items-start justify-between gap-4 flex-wrap mb-3">
                    <div>
                      <p className="font-semibold text-gray-800">{name}</p>
                      <p className="text-xs font-mono text-gray-500">{aff?.referral_code}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Pedido em {new Date(w.requested_at).toLocaleDateString('pt-AO')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-800">{w.amount.toLocaleString()} {w.currency}</p>
                      <p className="text-xs text-gray-500 font-mono mt-1">{w.iban}</p>
                    </div>
                  </div>
                  <WithdrawalActions
                    withdrawalId={w.id}
                    adminId={adminId}
                    amount={w.amount}
                    currency={w.currency}
                    iban={w.iban}
                    affiliateName={name}
                    affiliatePhone={phone}
                  />
                </div>
              )
            })}
          </div>
        )}

        {doneWithdrawals.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Histórico</h3>
            <div className="space-y-2">
              {doneWithdrawals.map((w: any) => {
                const aff = w.affiliates as any
                return (
                  <div key={w.id} className="card flex items-center justify-between gap-4 flex-wrap py-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-700">{aff?.profiles?.full_name || 'Afiliado'}</p>
                      <p className="text-xs text-gray-400 font-mono">{w.iban}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-gray-700">{w.amount.toLocaleString()} {w.currency}</span>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                        w.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {w.status === 'paid' ? '✅ Pago' : '✗ Rejeitado'}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {withdrawals.length === 0 && (
          <div className="card text-center py-8">
            <p className="text-3xl mb-2">💸</p>
            <p className="text-gray-500 text-sm">Sem pedidos de retiro.</p>
          </div>
        )}
      </div>

      {/* ── Comissões ── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg font-bold text-gray-900">Comissões por Afiliado</h2>
          <div className="flex gap-3">
            <span className="text-sm font-medium px-3 py-1 rounded-full bg-purple-100 text-purple-700">
              {totalPending} por pagar
            </span>
            <span className="text-sm font-medium px-3 py-1 rounded-full bg-green-100 text-green-700">
              {totalPaid} pagas
            </span>
          </div>
        </div>

        {groups.length > 0 ? (
          <div className="space-y-4">
            {groups.map(group => {
              const pendingItems = group.items.filter(c => c.status === 'approved')
              const paidItems    = group.items.filter(c => c.status === 'paid')
              const totalPendingAmt = pendingItems.reduce((s: number, c: any) => s + c.amount, 0)
              const totalPaidAmt    = paidItems.reduce((s: number, c: any) => s + c.amount, 0)
              const currency = group.items[0]?.currency || 'AOA'

              return (
                <div key={group.code} className="card">
                  <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
                    <div>
                      <p className="font-semibold text-gray-800">{group.name}</p>
                      <p className="text-xs text-gray-500 font-mono">{group.code}</p>
                      {group.phone && <p className="text-xs text-gray-400 mt-0.5">📞 {group.phone}</p>}
                    </div>
                    <div className="flex gap-3 text-right">
                      {totalPendingAmt > 0 && (
                        <div>
                          <p className="text-xs text-gray-400">Por pagar</p>
                          <p className="font-bold text-purple-700">{totalPendingAmt.toLocaleString()} {currency}</p>
                        </div>
                      )}
                      {totalPaidAmt > 0 && (
                        <div>
                          <p className="text-xs text-gray-400">Já pago</p>
                          <p className="font-bold text-green-700">{totalPaidAmt.toLocaleString()} {currency}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    {group.items.map((c: any) => (
                      <div key={c.id} className="flex items-center justify-between gap-3 py-2 border-t flex-wrap"
                        style={{ borderColor: 'var(--color-border)' }}>
                        <div className="flex items-center gap-3">
                          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                            c.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'
                          }`}>
                            {c.status === 'paid' ? '💰 Paga' : '⏳ Por pagar'}
                          </span>
                          <span className="text-xs text-gray-400">
                            {c.status === 'paid'
                              ? `Paga em ${new Date(c.paid_at).toLocaleDateString('pt-AO')}`
                              : `Gerada em ${new Date(c.created_at).toLocaleDateString('pt-AO')}`}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-semibold text-gray-800 text-sm">
                            {c.amount.toLocaleString()} {c.currency}
                          </span>
                          {c.status !== 'paid' && (
                            <AdminCommissionsActions
                              commissionId={c.id}
                              status={c.status}
                              amount={c.amount}
                              currency={c.currency}
                              affiliateName={group.name}
                              affiliatePhone={group.phone}
                            />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="card text-center py-10">
            <p className="text-4xl mb-3">✅</p>
            <p className="text-gray-500 text-sm">Sem comissões registadas.</p>
          </div>
        )}
      </div>
    </div>
  )
}
