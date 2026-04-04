'use client'

// app/admin/dashboard/AdminSalesTable.tsx

import { useState, useTransition } from 'react'
import { confirmSale, cancelSale, reactivateSale } from '@/lib/admin-actions'

function BtnSpinner({ white = true }: { white?: boolean }) {
  return (
    <svg className="animate-spin" width="14" height="14" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6" stroke={white ? 'white' : 'currentColor'} strokeOpacity="0.3" strokeWidth="2"/>
      <path d="M14 8A6 6 0 0 0 8 2" stroke={white ? 'white' : 'currentColor'} strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}

function ProofModal({ url, name, onClose }: { url: string; name: string; onClose: () => void }) {
  const lower = url.toLowerCase()
  const isPdf = lower.includes('.pdf') || lower.includes('application%2Fpdf')

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.8)' }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl bg-white"
        style={{ maxHeight: '92vh' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: '#e5e7eb' }}>
          <div>
            <p className="font-bold text-gray-800">📎 Comprovativo de Pagamento</p>
            <p className="text-xs text-gray-500 mt-0.5">{name}</p>
          </div>
          <div className="flex items-center gap-2">
            <a href={url} target="_blank" rel="noopener noreferrer"
              className="text-xs px-3 py-1.5 rounded-lg font-semibold border"
              style={{ color: 'var(--color-primary)', borderColor: 'var(--color-primary)' }}>
              ↗ Abrir em nova aba
            </a>
            <button onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 text-xl font-bold">
              ×
            </button>
          </div>
        </div>
        <div className="overflow-auto bg-gray-50" style={{ maxHeight: 'calc(92vh - 80px)' }}>
          {isPdf ? (
            <iframe src={url} className="w-full" style={{ height: '75vh', border: 'none' }} title="Comprovativo PDF" />
          ) : (
            <div className="flex items-center justify-center p-6">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="Comprovativo" className="max-w-full rounded-xl shadow-lg"
                style={{ maxHeight: '70vh', objectFit: 'contain' }} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ProofButton({ url, name }: { url: string; name: string }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all hover:scale-105"
        style={{ background: '#fef3c7', color: '#92400e', border: '2px solid #f59e0b' }}>
        📎 Ver Comprovativo
      </button>
      {open && <ProofModal url={url} name={name} onClose={() => setOpen(false)} />}
    </>
  )
}

export default function AdminSalesTable({ sales, adminId }: { sales: any[]; adminId: string }) {
  const [filter, setFilter] = useState<string>('pending_review')
  const [search, setSearch] = useState('')

  const filtered = sales.filter((sale: any) => {
    const matchesFilter = filter === 'all' || sale.status === filter
    const q = search.toLowerCase()
    const matchesSearch = !q ||
      (sale.customer_name || '').toLowerCase().includes(q) ||
      (sale.customer_phone || '').includes(q) ||
      (sale.customer_email || '').toLowerCase().includes(q) ||
      (sale.national_id || '').toLowerCase().includes(q)
    return matchesFilter && matchesSearch
  })

  const statusMap: Record<string, { label: string; color: string; bg: string }> = {
    confirmed:      { label: '✓ Confirmada',  color: '#166534', bg: '#dcfce7' },
    pending_review: { label: '⏳ Em revisão',  color: '#92400e', bg: '#fef3c7' },
    pending:        { label: '⏳ Pendente',    color: '#6b7280', bg: '#f3f4f6' },
    cancelled:      { label: '✗ Cancelada',   color: '#991b1b', bg: '#fee2e2' },
  }

  const paymentLabel: Record<string, string> = {
    bank_transfer: '🏦 Transferência bancária',
    transfer:      '🏦 Transferência',
    multicaixa:    '💳 Multicaixa Express',
    cash:          '💵 Numerário',
  }

  const pendingCount = sales.filter(s => ['pending', 'pending_review'].includes(s.status)).length

  return (
    <div>
      {pendingCount > 0 && (
        <div className="flex items-center gap-3 p-4 rounded-xl mb-5 text-sm font-medium"
          style={{ background: '#fef3c7', color: '#92400e', border: '2px solid #f59e0b' }}>
          <span className="text-2xl">🔔</span>
          <div className="flex-1">
            <strong>{pendingCount} pedido{pendingCount > 1 ? 's' : ''} aguarda{pendingCount === 1 ? '' : 'm'} revisão</strong>
          </div>
          <button className="text-xs underline font-bold" onClick={() => setFilter('pending_review')}>
            Ver agora →
          </button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input type="text" placeholder="Pesquisar por nome, telefone, email ou BI…"
          value={search} onChange={e => setSearch(e.target.value)} className="input-field flex-1" />
        <select value={filter} onChange={e => setFilter(e.target.value)} className="input-field sm:w-56">
          <option value="all">Todos ({sales.length})</option>
          <option value="pending_review">⏳ Em revisão ({sales.filter(s => s.status === 'pending_review').length})</option>
          <option value="pending">Pendente ({sales.filter(s => s.status === 'pending').length})</option>
          <option value="confirmed">✓ Confirmadas ({sales.filter(s => s.status === 'confirmed').length})</option>
          <option value="cancelled">✗ Canceladas ({sales.filter(s => s.status === 'cancelled').length})</option>
        </select>
      </div>

      <p className="text-xs text-gray-500 mb-3">{filtered.length} resultado{filtered.length !== 1 ? 's' : ''}</p>

      <div className="space-y-4">
        {filtered.map((sale: any) => {
          const st = statusMap[sale.status] || { label: sale.status, color: '#374151', bg: '#f3f4f6' }
          const canConfirm = ['pending', 'pending_review'].includes(sale.status)
          const canCancel  = !['cancelled', 'refunded'].includes(sale.status)
          const isUrgent   = sale.status === 'pending_review'

          return (
            <div key={sale.id} className="card"
              style={isUrgent ? { borderColor: '#f59e0b', borderWidth: '2px', background: '#fffbeb' } : {}}>

              <div className="flex items-start justify-between gap-4 flex-wrap mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <p className="font-bold text-gray-900 text-base">{sale.customer_name || '—'}</p>
                    <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                      style={{ background: st.bg, color: st.color }}>{st.label}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-xs text-gray-600">
                    <span>📞 <strong>Tel:</strong> {sale.customer_phone || '—'}</span>
                    <span>📧 <strong>Email:</strong> {sale.customer_email || '—'}</span>
                    <span>🪪 <strong>BI:</strong> <span className="font-mono">{sale.national_id || '—'}</span></span>
                    <span>🗓️ {new Date(sale.created_at).toLocaleString('pt-AO', {
                      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    <span>{paymentLabel[sale.payment_method || ''] || sale.payment_method || '—'}</span>
                    {sale.referral_code && (
                      <span>👤 <strong>Afiliado:</strong> <span className="font-mono">{sale.referral_code}</span>
                        {sale.affiliate_data?.profiles?.full_name && (
                          <span className="text-gray-400"> ({sale.affiliate_data.profiles.full_name})</span>
                        )}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <p className="font-bold text-gray-900 text-xl">
                    {sale.amount?.toLocaleString('pt-AO')} {sale.currency}
                  </p>
                  {sale.payment_proof_url
                    ? <ProofButton url={sale.payment_proof_url} name={sale.customer_name || 'Cliente'} />
                    : <span className="text-xs text-gray-400 italic px-3 py-2 rounded-xl bg-gray-100">Sem comprovativo</span>
                  }
                </div>
              </div>

              {sale.notes && (
                <div className="text-xs text-gray-500 mb-3 p-2 bg-gray-50 rounded-lg">📝 {sale.notes}</div>
              )}

              {(canConfirm || canCancel) && (
                <div className="flex gap-2 pt-3 border-t" style={{ borderColor: '#e5e7eb' }}>
                  {canConfirm && <ConfirmSaleButton saleId={sale.id} adminId={adminId} hasProof={!!sale.payment_proof_url} />}
                  {canCancel  && <CancelSaleButton saleId={sale.id} />}
                  {sale.status === 'cancelled' && <ReactivateSaleButton saleId={sale.id} adminId={adminId} />}
                </div>
              )}
            </div>
          )
        })}

        {filtered.length === 0 && (
          <div className="card text-center py-12">
            <p className="text-5xl mb-3">{filter === 'pending_review' ? '✅' : '🔍'}</p>
            <p className="text-gray-500 text-sm">
              {filter === 'pending_review' ? 'Não há pedidos em revisão. Tudo em dia!' : 'Sem resultados.'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function ConfirmSaleButton({ saleId, adminId, hasProof }: { saleId: string; adminId: string; hasProof: boolean }) {
  const [isPending, startTransition] = useTransition()
  const [done, setDone] = useState(false)

  const handleConfirm = () => {
    const msg = hasProof
      ? 'Confirmar pagamento? Isto irá activar a membresía e criar comissão do afiliado.'
      : '⚠️ Este pedido NÃO tem comprovativo. Confirmar mesmo assim?'
    if (!confirm(msg)) return
    startTransition(async () => {
      const result = await confirmSale(saleId, adminId)
      if (result.success) setDone(true)
      else alert(result.error || 'Erro ao confirmar.')
    })
  }

  if (done) return <span className="text-xs text-green-700 font-semibold px-3 py-2 bg-green-50 rounded-xl">✓ Confirmado!</span>

  return (
    <button onClick={handleConfirm} disabled={isPending}
      className="btn-primary text-sm py-2 px-4 disabled:opacity-50 flex items-center gap-2">
      {isPending ? <><BtnSpinner />A confirmar…</> : '✓ Confirmar Pagamento'}
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
      else alert(result.error || 'Erro ao cancelar.')
    })
  }

  if (done) return <span className="text-xs text-red-700 font-semibold px-3 py-2 bg-red-50 rounded-xl">✗ Cancelado</span>

  return (
    <button onClick={handleCancel} disabled={isPending}
      className="btn-outline text-sm py-2 px-4 disabled:opacity-50 border-red-300 text-red-600 hover:bg-red-50 flex items-center gap-2">
      {isPending ? <><BtnSpinner white={false} />A cancelar…</> : '✗ Cancelar'}
    </button>
  )
}

function ReactivateSaleButton({ saleId, adminId }: { saleId: string; adminId: string }) {
  const [isPending, startTransition] = useTransition()
  const [done, setDone] = useState(false)

  const handleReactivate = () => {
    if (!confirm('Reativar esta venda? Voltará ao estado "Em revisão" para poder ser confirmada.')) return
    startTransition(async () => {
      const result = await reactivateSale(saleId, adminId)
      if (result.success) setDone(true)
      else alert(result.error || 'Erro ao reativar.')
    })
  }

  if (done) return <span className="text-xs text-blue-700 font-semibold px-3 py-2 bg-blue-50 rounded-xl">↩ Reativada</span>

  return (
    <button onClick={handleReactivate} disabled={isPending}
      className="btn-outline text-sm py-2 px-4 disabled:opacity-50 border-blue-300 text-blue-600 hover:bg-blue-50 flex items-center gap-2">
      {isPending ? <><BtnSpinner white={false} />A reativar…</> : '↩ Reativar'}
    </button>
  )
}
