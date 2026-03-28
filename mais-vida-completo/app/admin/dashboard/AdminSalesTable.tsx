'use client'

// app/admin/dashboard/AdminSalesTable.tsx
// Tabela de vendas com acções de confirmação e cancelamento

import { useState, useTransition } from 'react'
import { confirmSale, cancelSale } from '@/lib/admin-actions'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function AdminSalesTable({ sales, adminId }: { sales: any[]; adminId: string }) {
  const [filter, setFilter] = useState<string>('all')
  const [search, setSearch] = useState('')

  const filtered = sales.filter((sale: any) => {
    const matchesFilter = filter === 'all' || sale.status === filter
    const customers = Array.isArray(sale.customers) ? sale.customers[0] : sale.customers
    const profiles = Array.isArray(customers?.profiles) ? customers?.profiles[0] : customers?.profiles
    const customerName = profiles?.full_name?.toLowerCase() || ''
    const customerPhone = profiles?.phone || ''
    const matchesSearch = search === '' ||
      customerName.includes(search.toLowerCase()) ||
      customerPhone.includes(search)
    return matchesFilter && matchesSearch
  })

  const statusMap: Record<string, { label: string; color: string; bg: string }> = {
    confirmed: { label: '✓ Confirmada', color: '#166534', bg: '#dcfce7' },
    pending_review: { label: '⏳ Em revisão', color: '#92400e', bg: '#fef3c7' },
    pending: { label: '⏳ Pendente', color: '#6b7280', bg: '#f3f4f6' },
    cancelled: { label: '✗ Cancelada', color: '#991b1b', bg: '#fee2e2' },
    refunded: { label: '↩ Reembolsada', color: '#6b7280', bg: '#f3f4f6' },
  }

  const paymentMethodLabel: Record<string, string> = {
    transfer: '🏦 Transferência',
    multicaixa: '💳 Multicaixa Express',
    cash: '💵 Numerário',
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input
          type="text"
          placeholder="Pesquisar por nome ou telefone..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input-field flex-1"
        />
        <select
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="input-field sm:w-48"
        >
          <option value="all">Todos os estados</option>
          <option value="pending_review">Em revisão</option>
          <option value="pending">Pendente</option>
          <option value="confirmed">Confirmadas</option>
          <option value="cancelled">Canceladas</option>
        </select>
      </div>

      <p className="text-xs text-gray-500 mb-3">{filtered.length} resultados</p>

      <div className="space-y-3">
        {filtered.map((sale: any) => {
          const st = statusMap[sale.status] || { label: sale.status, color: '#374151', bg: '#f3f4f6' }
          const customers = Array.isArray(sale.customers) ? sale.customers[0] : sale.customers
          const customerProfile = Array.isArray(customers?.profiles) ? customers?.profiles[0] : customers?.profiles
          const affiliates = Array.isArray(sale.affiliates) ? sale.affiliates[0] : sale.affiliates
          const affiliateProfile = Array.isArray(affiliates?.profiles) ? affiliates?.profiles[0] : affiliates?.profiles
          const canConfirm = ['pending', 'pending_review'].includes(sale.status)
          const canCancel = !['cancelled', 'refunded'].includes(sale.status)

          return (
            <div key={sale.id} className="card">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className="font-semibold text-gray-800">{customerProfile?.full_name || '—'}</p>
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{ background: st.bg, color: st.color }}>
                      {st.label}
                    </span>
                  </div>
                  <div className="flex gap-4 flex-wrap text-xs text-gray-500">
                    <span>📞 {customerProfile?.phone || '—'}</span>
                    <span>🪪 BI: {customerProfile?.national_id || '—'}</span>
                    {affiliateProfile && (
                      <span>👤 Afiliado: <strong>{affiliates?.referral_code}</strong> ({affiliateProfile.full_name})</span>
                    )}
                  </div>
                  <div className="flex gap-4 flex-wrap text-xs text-gray-400 mt-1">
                    <span>{paymentMethodLabel[sale.payment_method || ''] || sale.payment_method}</span>
                    <span>{new Date(sale.created_at).toLocaleDateString('pt-AO', {
                      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
                    })}</span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-bold text-gray-800 text-lg">
                    {sale.amount?.toLocaleString()} {sale.currency}
                  </p>
                  {sale.payment_proof_url && (
                    <a href={sale.payment_proof_url} target="_blank" rel="noopener noreferrer"
                      className="text-xs underline mt-1 block"
                      style={{ color: 'var(--color-primary)' }}>
                      Ver comprovativo ↗
                    </a>
                  )}
                </div>
              </div>

              {/* Actions */}
              {(canConfirm || canCancel) && (
                <div className="flex gap-2 mt-4 pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
                  {canConfirm && (
                    <ConfirmSaleButton saleId={sale.id} adminId={adminId} />
                  )}
                  {canCancel && (
                    <CancelSaleButton saleId={sale.id} />
                  )}
                </div>
              )}
            </div>
          )
        })}

        {filtered.length === 0 && (
          <div className="card text-center py-10">
            <p className="text-4xl mb-3">🔍</p>
            <p className="text-gray-500 text-sm">Sem resultados para os filtros seleccionados.</p>
          </div>
        )}
      </div>
    </div>
  )
}

function ConfirmSaleButton({ saleId, adminId }: { saleId: string; adminId: string }) {
  const [isPending, startTransition] = useTransition()
  const [done, setDone] = useState(false)

  const handleConfirm = () => {
    if (!confirm('Confirmar este pagamento? Isto irá activar a membresía e criar a comissão do afiliado.')) return
    startTransition(async () => {
      const result = await confirmSale(saleId, adminId)
      if (result.success) setDone(true)
      else alert(result.error || 'Erro ao confirmar venda.')
    })
  }

  if (done) return (
    <span className="text-xs text-green-700 font-semibold px-3 py-2 bg-green-50 rounded-xl">
      ✓ Confirmado!
    </span>
  )

  return (
    <button
      onClick={handleConfirm}
      disabled={isPending}
      className="btn-primary text-sm py-2 px-4 disabled:opacity-50"
    >
      {isPending ? 'A confirmar...' : '✓ Confirmar Pagamento'}
    </button>
  )
}

function CancelSaleButton({ saleId }: { saleId: string }) {
  const [isPending, startTransition] = useTransition()
  const [done, setDone] = useState(false)

  const handleCancel = () => {
    const reason = prompt('Motivo do cancelamento (opcional):')
    if (reason === null) return
    startTransition(async () => {
      const result = await cancelSale(saleId, reason || undefined)
      if (result.success) setDone(true)
      else alert(result.error || 'Erro ao cancelar venda.')
    })
  }

  if (done) return (
    <span className="text-xs text-red-700 font-semibold px-3 py-2 bg-red-50 rounded-xl">
      ✗ Cancelado
    </span>
  )

  return (
    <button
      onClick={handleCancel}
      disabled={isPending}
      className="btn-outline text-sm py-2 px-4 disabled:opacity-50 border-red-300 text-red-600 hover:bg-red-50"
    >
      {isPending ? 'A cancelar...' : 'Cancelar'}
    </button>
  )
}
