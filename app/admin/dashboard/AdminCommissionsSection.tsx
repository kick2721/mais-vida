'use client'

import { useState, useMemo } from 'react'
import WithdrawalActions from './WithdrawalActions'

interface CommissionItem {
  id: string
  amount: number
  currency: string
  status: string
  created_at: string
  paid_at: string | null
  affiliates: {
    referral_code: string
    profiles: { full_name: string; phone: string } | null
  } | null
}

interface WithdrawalItem {
  id: string
  amount: number
  currency: string
  iban: string
  account_holder?: string
  status: string
  requested_at: string
  reviewed_at: string | null
  affiliates: {
    referral_code: string
    profiles: { full_name: string; phone: string } | null
  } | null
}

interface Props {
  commissions: CommissionItem[]
  withdrawals: WithdrawalItem[]
  adminId: string
}

export default function AdminCommissionsSection({ commissions, withdrawals, adminId }: Props) {
  const [showHistory, setShowHistory]   = useState(false)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState('')

  const pendingWithdrawals = withdrawals.filter(w => w.status === 'pending')
  const doneWithdrawals    = withdrawals.filter(w => w.status !== 'pending')

  // ── Agrupar comissões por afiliado ────────────────────────────────────────
  const grouped = useMemo(() => {
    const map: Record<string, {
      name: string; code: string; phone: string
      items: CommissionItem[]
      totalApproved: number
      totalPaid: number
      currency: string
    }> = {}

    for (const c of commissions) {
      const aff = c.affiliates
      const key = aff?.referral_code || 'unknown'
      if (!map[key]) {
        map[key] = {
          name:          aff?.profiles?.full_name || 'Afiliado',
          code:          aff?.referral_code || '—',
          phone:         aff?.profiles?.phone || '',
          items:         [],
          totalApproved: 0,
          totalPaid:     0,
          currency:      c.currency || 'AOA',
        }
      }
      map[key].items.push(c)
      if (c.status === 'approved') map[key].totalApproved += c.amount
      if (c.status === 'paid')     map[key].totalPaid     += c.amount
    }

    return Object.values(map)
  }, [commissions])

  // ── Filtro de pesquisa ────────────────────────────────────────────────────
  const filteredGroups = useMemo(() => {
    if (!search.trim()) return grouped
    const q = search.toLowerCase()
    return grouped.filter(g =>
      g.name.toLowerCase().includes(q) ||
      g.code.toLowerCase().includes(q)
    )
  }, [grouped, search])

  function toggleGroup(code: string) {
    setExpandedGroups(prev => {
      const next = new Set(prev)
      next.has(code) ? next.delete(code) : next.add(code)
      return next
    })
  }

  return (
    <div className="space-y-8">

      {/* ══ PEDIDOS DE RETIRO ══════════════════════════════════════════════════ */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg font-bold text-gray-900">Pedidos de Retiro</h2>
          <div className="flex items-center gap-2">
            {pendingWithdrawals.length > 0 && (
              <span className="text-sm font-medium px-3 py-1 rounded-full bg-orange-100 text-orange-700">
                {pendingWithdrawals.length} pendente{pendingWithdrawals.length !== 1 ? 's' : ''}
              </span>
            )}
            {doneWithdrawals.length > 0 && (
              <button
                onClick={() => setShowHistory(v => !v)}
                className="text-xs text-gray-500 hover:text-gray-800 border border-gray-200 rounded-lg px-3 py-1.5 transition-colors flex items-center gap-1"
              >
                {showHistory ? '▲ Ocultar' : '▼ Ver'} histórico ({doneWithdrawals.length})
              </button>
            )}
          </div>
        </div>

        {/* Pendentes — sempre visíveis */}
        {pendingWithdrawals.length > 0 && (
          <div className="space-y-3 mb-4">
            {pendingWithdrawals.map((w) => {
              const aff   = w.affiliates
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
                      {w.account_holder && (
                        <p className="text-xs text-gray-500 mt-0.5">👤 {w.account_holder}</p>
                      )}
                    </div>
                  </div>
                  <WithdrawalActions
                    withdrawalId={w.id}
                    adminId={adminId}
                    amount={w.amount}
                    currency={w.currency}
                    iban={w.iban}
                    accountHolder={w.account_holder}
                    affiliateName={name}
                    affiliatePhone={phone}
                  />
                </div>
              )
            })}
          </div>
        )}

        {/* Histórico — colapsado por defeito */}
        {showHistory && doneWithdrawals.length > 0 && (
          <div className="space-y-2 mt-2">
            {doneWithdrawals.map((w) => {
              const aff = w.affiliates
              return (
                <div key={w.id} className="card flex items-center justify-between gap-4 flex-wrap py-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-700">{aff?.profiles?.full_name || 'Afiliado'}</p>
                    <p className="text-xs text-gray-400 font-mono">{w.iban}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(w.requested_at).toLocaleDateString('pt-AO')}
                    </p>
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
        )}

        {withdrawals.length === 0 && (
          <div className="card text-center py-8">
            <p className="text-3xl mb-2">💸</p>
            <p className="text-gray-500 text-sm">Sem pedidos de retiro.</p>
          </div>
        )}
      </div>

      {/* ══ COMISSÕES POR AFILIADO ════════════════════════════════════════════ */}
      <div>
        {/* Header + buscador */}
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <h2 className="font-display text-lg font-bold text-gray-900">Comissões por Afiliado</h2>
            <span className="text-sm font-medium px-3 py-1 rounded-full bg-purple-100 text-purple-700">
              {commissions.length} comissões
            </span>
          </div>
          {grouped.length > 2 && (
            <input
              type="text"
              placeholder="Pesquisar afiliado…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="text-sm border rounded-xl px-3 py-2 w-52 focus:outline-none focus:ring-2 focus:ring-purple-300"
              style={{ borderColor: 'var(--color-border)' }}
            />
          )}
        </div>

        {filteredGroups.length > 0 ? (
          <div className="space-y-3">
            {filteredGroups.map(group => {
              const isExpanded = expandedGroups.has(group.code)
              const hasPending = group.totalApproved > 0

              return (
                <div key={group.code} className="card p-0 overflow-hidden">
                  {/* ── Linha resumo (sempre visível) ── */}
                  <button
                    onClick={() => toggleGroup(group.code)}
                    className="w-full flex items-center justify-between gap-4 p-4 hover:bg-gray-50 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Avatar inicial */}
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                        style={{ background: 'var(--color-primary)' }}>
                        {group.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-800 text-sm truncate">{group.name}</p>
                        <p className="text-xs font-mono text-gray-400">{group.code}</p>
                      </div>
                    </div>

                    {/* Totais resumo */}
                    <div className="flex items-center gap-4 flex-shrink-0">
                      <div className="text-right hidden sm:block">
                        <p className="text-xs text-gray-400">Por pagar</p>
                        <p className={`text-sm font-bold ${hasPending ? 'text-orange-600' : 'text-gray-400'}`}>
                          {group.totalApproved.toLocaleString()} {group.currency}
                        </p>
                      </div>
                      <div className="text-right hidden sm:block">
                        <p className="text-xs text-gray-400">Pagas</p>
                        <p className="text-sm font-bold text-green-600">
                          {group.totalPaid.toLocaleString()} {group.currency}
                        </p>
                      </div>
                      <div className="text-right sm:hidden">
                        <p className="text-xs text-gray-400">Total</p>
                        <p className="text-sm font-bold text-purple-700">
                          {(group.totalApproved + group.totalPaid).toLocaleString()} {group.currency}
                        </p>
                      </div>
                      <span className="text-gray-400 text-sm ml-1">
                        {isExpanded ? '▲' : '▼'}
                      </span>
                    </div>
                  </button>

                  {/* ── Detalhe expandido ── */}
                  {isExpanded && (
                    <div className="border-t px-4 pb-4 pt-3 space-y-2"
                      style={{ borderColor: 'var(--color-border)', background: '#fafafa' }}>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                        {group.items.length} comissão{group.items.length !== 1 ? 'ões' : ''} individuais
                      </p>
                      {group.items.map((c) => (
                        <div key={c.id}
                          className="flex items-center justify-between gap-3 py-2 border-b last:border-b-0"
                          style={{ borderColor: 'var(--color-border)' }}>
                          <span className="text-xs text-gray-400">
                            {new Date(c.created_at).toLocaleDateString('pt-AO')}
                          </span>
                          <div className="flex items-center gap-3">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              c.status === 'paid'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-orange-100 text-orange-700'
                            }`}>
                              {c.status === 'paid' ? 'Paga' : 'Por pagar'}
                            </span>
                            <span className="font-semibold text-gray-800 text-sm">
                              {c.amount.toLocaleString()} {c.currency}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ) : search ? (
          <div className="card text-center py-8">
            <p className="text-3xl mb-2">🔍</p>
            <p className="text-gray-500 text-sm">Nenhum afiliado corresponde a &quot;{search}&quot;.</p>
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
