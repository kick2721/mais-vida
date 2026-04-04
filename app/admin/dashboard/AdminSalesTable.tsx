'use client'

// app/admin/dashboard/AdminSalesTable.tsx
// v2 — Visor de comprovativo melhorado (modal + badge destacado)

import { useState, useTransition } from 'react'
import { confirmSale, cancelSale } from '@/lib/admin-actions'

function BtnSpinner({ white = true }: { white?: boolean }) {
  return (
    <svg className="animate-spin" width="14" height="14" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6" stroke={white ? 'white' : 'currentColor'} strokeOpacity="0.3" strokeWidth="2"/>
      <path d="M14 8A6 6 0 0 0 8 2" stroke={white ? 'white' : 'currentColor'} strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}

// ─── MODAL DE COMPROVATIVO ───────────────────────────────────────────────────
function ProofModal({ url, onClose }: { url: string; onClose: () => void }) {
  const isPdf = url.toLowerCase().includes('.pdf') || url.toLowerCase().includes('application/pdf')

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)' }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: '#fff', maxHeight: '90vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header do modal */}
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: '#e5e7eb' }}>
          <div className="flex items-center gap-2">
            <span className="text-lg">📎</span>
            <span className="font-semibold text-gray-800">Comprovativo de Pagamento</span>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs px-3 py-1.5 rounded-lg font-medium border"
              style={{ color: 'var(--color-primary)', borderColor: 'var(--color-primary)' }}
            >
              ↗ Abrir em nova aba
            </a>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-xl font-bold leading-none px-2"
            >
              ×
            </button>
          </div>
        </div>

        {/* Conteúdo */}
        <div className="overflow-auto" style={{ maxHeight: 'calc(90vh - 72px)' }}>
          {isPdf ? (
            <iframe
              src={url}
              className="w-full"
              style={{ height: '70vh', border: 'none' }}
              title="Comprovativo PDF"
            />
          ) : (
            <div className="flex items-center justify-center p-4 bg-gray-50">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt="Comprovativo de pagamento"
                className="max-w-full rounded-lg shadow-md"
                style={{ maxHeight: '70vh', objectFit: 'contain' }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── BOTÃO VER COMPROVATIVO (badge laranja chamativo) ────────────────────────
function ProofButton({ url }: { url: string }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold shadow-sm transition-all hover:scale-105 active:scale-95"
        style={{ background: '#fef3c7', color: '#92400e', border: '1.5px solid #fbbf24' }}
        title="Ver comprovativo de pagamento"
      >
        📎 Ver Comprovativo
      </button>
      {open && <ProofModal url={url} onClose={() => setOpen(false)} />}
    </>
  )
}

// ─── COMPONENTE PRINCIPAL ────────────────────────────────────────────────────
export default function AdminSalesTable({ sales, adminId }: { sales: any[]; adminId: string }) {
  const [filter, setFilter] = useState<string>('all')
  const [search, setSearch] = useState('')

  const filtered = sales.filter((sale: any) => {
    const matchesFilter = filter === 'all' || sale.status === filter
    const customers = Array.isArray(sale.customers) ? sale.customers[0] : sale.customers
    const profiles = Array.isArray(customers?.profiles) ? customers?.profiles[0] : customers?.profiles
    const customerName = (sale.customer_name || profiles?.full_name || '').toLowerCase()
    const customerPhone = sale.customer_phone || profiles?.phone || ''
    const customerEmail = sale.customer_email || ''
    const matchesSearch = search === '' ||
      customerName.includes(search.toLowerCase()) ||
      customerPhone.includes(search) ||
      customerEmail.includes(search.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const statusMap: Record<string, { label: string; color: string; bg: string }> = {
    confirmed:      { label: '✓ Confirmada',   color: '#166534', bg: '#dcfce7' },
    pending_review: { label: '⏳ Em revisão',   color: '#92400e', bg: '#fef3c7' },
    pending:        { label: '⏳ Pendente',     color: '#6b7280', bg: '#f3f4f6' },
    cancelled:      { label: '✗ Cancelada',    color: '#991b1b', bg: '#fee2e2' },
    refunded:       { label: '↩ Reembolsada',  color: '#6b7280', bg: '#f3f4f6' },
  }

  const paymentMethodLabel: Record<string, string> = {
    transfer:   '🏦 Transferência',
    multicaixa: '💳 Multicaixa Express',
    cash:       '💵 Numerário',
  }

  // Contar pendentes com comprovativo (para alerta)
  const pendingWithProof = sales.filter(s =>
    ['pending', 'pending_review'].includes(s.status) && s.payment_proof_url
  ).length

  return (
    <div>
      {/* Alerta de pendentes com comprovativo */}
      {pendingWithProof > 0 && (
        <div
          className="flex items-center gap-3 p-4 rounded-xl mb-4 text-sm font-medium"
          style={{ background: '#fef3c7', color: '#92400e', border: '1.5px solid #fbbf24' }}
        >
          <span className="text-xl">🔔</span>
          <span>
            <strong>{pendingWithProof} pedido{pendingWithProof > 1 ? 's' : ''}</strong> com comprovativo
            aguarda{pendingWithProof === 1 ? '' : 'm'} verificação
          </span>
          <button
            className="ml-auto text-xs underline"
            onClick={() => setFilter('pending_review')}
          >
            Ver agora →
          </button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input type="text" placeholder="Pesquisar por nome ou telefone..."
          value={search} onChange={e => setSearch(e.target.value)} className="input-field flex-1" />
        <select value={filter} onChange={e => setFilter(e.target.value)} className="input-field sm:w-48">
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
          const canCancel  = !['cancelled', 'refunded'].includes(sale.status)

          const resolvedName  = sale.customer_name  || customerProfile?.full_name  || '—'
          const resolvedPhone = sale.customer_phone || customerProfile?.phone       || '—'
          const resolvedBI    = sale.national_id    || customerProfile?.national_id || '—'
          const resolvedEmail = sale.customer_email || '—'

          // Destaque visual para pedidos em revisão com comprovativo
          const isUrgent = sale.status === 'pending_review' && !!sale.payment_proof_url
          const cardStyle = isUrgent
            ? { border: '2px solid #fbbf24', background: '#fffbeb' }
            : {}

          return (
            <div key={sale.id} className="card" style={cardStyle}>
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className="font-semibold text-gray-800">{resolvedName}</p>
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{ background: st.bg, color: st.color }}>
                      {st.label}
                    </span>
                    {isUrgent && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-bold"
                        style={{ background: '#fee2e2', color: '#991b1b' }}>
                        🔴 Aguarda revisão
                      </span>
                    )}
                  </div>
                  <div className="flex gap-4 flex-wrap text-xs text-gray-500">
                    <span>📞 {resolvedPhone}</span>
                    <span>📧 {resolvedEmail}</span>
                    <span>🪪 BI: {resolvedBI}</span>
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

                {/* Lado direito: valor + comprovativo */}
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <p className="font-bold text-gray-800 text-lg">
                    {sale.amount?.toLocaleString()} {sale.currency}
                  </p>
                  {sale.payment_proof_url ? (
                    <ProofButton url={sale.payment_proof_url} />
                  ) : (
                    <span className="text-xs text-gray-400 italic">Sem comprovativo</span>
                  )}
                </div>
              </div>

              {/* Acções */}
              {(canConfirm || canCancel) && (
                <div className="flex gap-2 mt-4 pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
                  {canConfirm && <ConfirmSaleButton saleId={sale.id} adminId={adminId} />}
                  {canCancel  && <CancelSaleButton saleId={sale.id} />}
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

// ─── BOTÃO CONFIRMAR ─────────────────────────────────────────────────────────
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
    <button onClick={handleConfirm} disabled={isPending}
      className="btn-primary text-sm py-2 px-4 disabled:opacity-50 flex items-center gap-2">
      {isPending ? <><BtnSpinner />A confirmar…</> : '✓ Confirmar Pagamento'}
    </button>
  )
}

// ─── BOTÃO CANCELAR ──────────────────────────────────────────────────────────
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
    <span className="text-xs text-red-700 font-semibold px-3 py-2 bg-red-50 rounded-xl">✗ Cancelado</span>
  )

  return (
    <button onClick={handleCancel} disabled={isPending}
      className="btn-outline text-sm py-2 px-4 disabled:opacity-50 border-red-300 text-red-600 hover:bg-red-50 flex items-center gap-2">
      {isPending ? <><BtnSpinner white={false} />A cancelar…</> : 'Cancelar'}
    </button>
  )
}
