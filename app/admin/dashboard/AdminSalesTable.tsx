'use client'

// app/admin/dashboard/AdminSalesTable.tsx

import { useState, useTransition, useMemo } from 'react'
import { confirmSale, cancelSale, reactivateSale } from '@/lib/admin-actions'
import { exportToExcel, fmtDate } from '@/lib/export-excel'

const PAGE_SIZE = 50

function BtnSpinner({ white = true }: { white?: boolean }) {
  return (
    <svg className="animate-spin" width="14" height="14" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6" stroke={white ? 'white' : 'currentColor'} strokeOpacity="0.3" strokeWidth="2"/>
      <path d="M14 8A6 6 0 0 0 8 2" stroke={white ? 'white' : 'currentColor'} strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}

function ProofModal({ url, name, onClose }: { url: string; name: string; onClose: () => void }) {
  const isPdf = url.toLowerCase().includes('.pdf') || url.toLowerCase().includes('application%2Fpdf')
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.8)' }} onClick={onClose}>
      <div className="relative w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl bg-white"
        style={{ maxHeight: '92vh' }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: '#e5e7eb' }}>
          <div>
            <p className="font-bold text-gray-800">📎 Comprovativo de Pagamento</p>
            <p className="text-xs text-gray-500 mt-0.5">{name}</p>
          </div>
          <div className="flex items-center gap-2">
            <a href={url} download={`comprovativo-${name.replace(/\s+/g, '-')}`}
              className="text-xs px-3 py-1.5 rounded-lg font-semibold border"
              style={{ color: '#166534', borderColor: '#166534', background: '#dcfce7' }}>
              ⬇ Descarregar
            </a>
            <a href={url} target="_blank" rel="noopener noreferrer"
              className="text-xs px-3 py-1.5 rounded-lg font-semibold border"
              style={{ color: 'var(--color-primary)', borderColor: 'var(--color-primary)' }}>
              ↗ Abrir
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

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  confirmed:      { label: 'Confirmada',  color: '#166534', bg: '#dcfce7' },
  pending_review: { label: 'Em revisão',  color: '#92400e', bg: '#fef3c7' },
  pending:        { label: 'Pendente',    color: '#6b7280', bg: '#f3f4f6' },
  cancelled:      { label: 'Cancelada',   color: '#991b1b', bg: '#fee2e2' },
}

const PAYMENT_LABEL: Record<string, string> = {
  bank_transfer: 'Transferência bancária',
  transfer:      'Transferência',
  multicaixa:    'Multicaixa Express',
  cash:          'Numerário',
}

function fmt(date: string) {
  return new Date(date).toLocaleDateString('pt-AO', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function AdminSalesTable({ sales, adminId }: { sales: any[]; adminId: string }) {
  const [filter, setFilter] = useState<string>('pending_review')
  const [search, setSearch] = useState('')
  const [page, setPage]     = useState(1)

  const pendingCount = useMemo(
    () => sales.filter(s => ['pending', 'pending_review'].includes(s.status)).length,
    [sales]
  )

  const filtered = useMemo(() => {
    let list = sales
    if (filter !== 'all') list = list.filter(s => s.status === filter)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(s =>
        (s.customer_name  || '').toLowerCase().includes(q) ||
        (s.customer_phone || '').includes(q) ||
        (s.customer_email || '').toLowerCase().includes(q) ||
        (s.national_id    || '').toLowerCase().includes(q) ||
        (s.referral_code  || '').toLowerCase().includes(q)
      )
    }
    return list
  }, [sales, filter, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  function handleSearch(v: string) { setSearch(v); setPage(1) }
  function handleFilter(v: string) { setFilter(v); setPage(1) }

  const counts: Record<string, number> = useMemo(() => ({
    all:            sales.length,
    pending_review: sales.filter(s => s.status === 'pending_review').length,
    pending:        sales.filter(s => s.status === 'pending').length,
    confirmed:      sales.filter(s => s.status === 'confirmed').length,
    cancelled:      sales.filter(s => s.status === 'cancelled').length,
  }), [sales])

  function handleExport() {
    const rows = sales.map(s => ({
      'Nome':           s.customer_name   || '—',
      'Telefone':       s.customer_phone  || '—',
      'Email':          s.customer_email  || '—',
      'BI':             s.national_id     || '—',
      'Valor':          s.amount ?? 0,
      'Moeda':          s.currency        || 'Kz',
      'Estado':         STATUS_MAP[s.status]?.label || s.status,
      'Pagamento':      PAYMENT_LABEL[s.payment_method] || s.payment_method || '—',
      'Afiliado':       s.affiliate_data?.profiles?.full_name || s.referral_code || '—',
      'Data':           fmtDate(s.created_at),
      'Confirmada em':  fmtDate(s.confirmed_at),
      'Notas':          s.notes || '—',
    }))
    exportToExcel(rows, `vendas-${new Date().toISOString().slice(0,10)}`)
  }

  return (
    <div>
      {/* Alerta pendentes */}
      {pendingCount > 0 && (
        <div className="flex items-center gap-3 p-4 rounded-xl mb-5 text-sm font-medium"
          style={{ background: '#fef3c7', color: '#92400e', border: '2px solid #f59e0b' }}>
          <span className="text-2xl">🔔</span>
          <div className="flex-1">
            <strong>{pendingCount} pedido{pendingCount > 1 ? 's' : ''} aguarda{pendingCount === 1 ? '' : 'm'} revisão</strong>
          </div>
          <button className="text-xs underline font-bold" onClick={() => handleFilter('pending_review')}>
            Ver agora →
          </button>
        </div>
      )}

      {/* Filtros + pesquisa */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex gap-1 bg-white rounded-xl p-1 border overflow-x-auto flex-shrink-0" style={{ borderColor: 'var(--color-border)' }}>
          {[
            { key: 'pending_review', label: '⏳ Em revisão' },
            { key: 'all',            label: 'Todas' },
            { key: 'confirmed',      label: '✓ Confirmadas' },
            { key: 'cancelled',      label: '✗ Canceladas' },
          ].map(f => (
            <button key={f.key} onClick={() => handleFilter(f.key)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap"
              style={filter === f.key
                ? { background: 'var(--color-primary)', color: 'white' }
                : { color: '#6b7280' }}>
              {f.label} <span className="opacity-70">({counts[f.key]})</span>
            </button>
          ))}
        </div>

        <div className="relative flex-1 min-w-0">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input type="text" value={search} onChange={e => handleSearch(e.target.value)}
            placeholder="Pesquisar por nome, telefone, email, BI ou código afiliado…"
            className="w-full pl-9 pr-4 py-2 rounded-xl border text-sm bg-white outline-none"
            style={{ borderColor: 'var(--color-border)' }} />
          {search && (
            <button onClick={() => handleSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700">✕</button>
          )}
        </div>

        <button
          onClick={handleExport}
          disabled={sales.length === 0}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-all flex-shrink-0 disabled:opacity-40"
          style={{ borderColor: '#16a34a', color: '#16a34a', background: '#f0fdf4' }}
          title="Exportar todas as vendas para Excel"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Excel
        </button>
      </div>

      {/* Tabela */}
      {filtered.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-5xl mb-3">{filter === 'pending_review' ? '✅' : '🔍'}</p>
          <p className="text-gray-500 text-sm">
            {filter === 'pending_review' ? 'Não há pedidos em revisão. Tudo em dia!' : 'Sem resultados.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--color-border)' }}>
          {/* Cabeçalho */}
          <div className="hidden sm:grid text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-2.5 border-b"
            style={{
              borderColor: 'var(--color-border)',
              background: '#fafafa',
              gridTemplateColumns: '2fr 1.2fr 1fr 80px 90px 90px 28px',
            }}>
            <span>Cliente</span>
            <span>Afiliado</span>
            <span>Pagamento</span>
            <span className="text-right">Valor</span>
            <span className="text-center">Data</span>
            <span className="text-center">Estado</span>
            <span></span>
          </div>

          <div className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
            {paginated.map(sale => (
              <SaleRow key={sale.id} sale={sale} adminId={adminId} />
            ))}
          </div>
        </div>
      )}

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-xs text-gray-500">
            {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} de{' '}
            <span className="font-semibold">{filtered.length}</span> vendas
          </p>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-sm border transition-all disabled:opacity-30 hover:bg-gray-50"
              style={{ borderColor: 'var(--color-border)' }}>‹</button>

            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let p: number
              if (totalPages <= 5) p = i + 1
              else if (page <= 3) p = i + 1
              else if (page >= totalPages - 2) p = totalPages - 4 + i
              else p = page - 2 + i
              return (
                <button key={p} onClick={() => setPage(p)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-medium border transition-all"
                  style={page === p
                    ? { background: 'var(--color-primary)', color: 'white', borderColor: 'var(--color-primary)' }
                    : { borderColor: 'var(--color-border)', color: '#374151' }}>
                  {p}
                </button>
              )
            })}

            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-sm border transition-all disabled:opacity-30 hover:bg-gray-50"
              style={{ borderColor: 'var(--color-border)' }}>›</button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Linha da tabela ──────────────────────────────────────────────────────────

function SaleRow({ sale, adminId }: { sale: any; adminId: string }) {
  const [expanded, setExpanded] = useState(false)
  const [proofOpen, setProofOpen] = useState(false)

  const st        = STATUS_MAP[sale.status] || { label: sale.status, color: '#374151', bg: '#f3f4f6' }
  const isUrgent  = sale.status === 'pending_review'
  const canConfirm = ['pending', 'pending_review'].includes(sale.status)
  const canCancel  = !['cancelled', 'refunded'].includes(sale.status)

  return (
    <>
      <div
        className="grid items-center px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors group"
        style={{
          gridTemplateColumns: '2fr 1.2fr 1fr 80px 90px 90px 28px',
          background: isUrgent ? '#fffbeb' : undefined,
        }}
        onClick={() => setExpanded(e => !e)}
      >
        {/* Cliente */}
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-800 truncate">
            {sale.customer_name || <span className="text-gray-400 italic font-normal">Sem nome</span>}
          </p>
          <p className="text-xs text-gray-400 truncate">{sale.customer_phone || ''}</p>
        </div>

        {/* Afiliado */}
        <div className="min-w-0">
          {sale.referral_code ? (
            <>
              <p className="text-xs font-mono text-gray-600 truncate">{sale.referral_code}</p>
              {sale.affiliate_data?.profiles?.full_name && (
                <p className="text-xs text-gray-400 truncate">{sale.affiliate_data.profiles.full_name}</p>
              )}
            </>
          ) : (
            <span className="text-xs text-gray-300">—</span>
          )}
        </div>

        {/* Pagamento */}
        <div>
          <p className="text-xs text-gray-500 truncate">
            {PAYMENT_LABEL[sale.payment_method || ''] || sale.payment_method || '—'}
          </p>
          {/* Indicador comprovativo */}
          {sale.payment_proof_url && (
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 mt-0.5" title="Tem comprovativo" />
          )}
        </div>

        {/* Valor */}
        <div className="text-right">
          <p className="text-sm font-bold text-gray-800 tabular-nums">
            {sale.amount?.toLocaleString()}
          </p>
          <p className="text-xs text-gray-400">{sale.currency}</p>
        </div>

        {/* Data */}
        <div className="text-center">
          <p className="text-xs text-gray-500">{fmt(sale.created_at)}</p>
        </div>

        {/* Estado */}
        <div className="flex justify-center">
          <span className="text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap"
            style={{ background: st.bg, color: st.color }}>
            {st.label}
          </span>
        </div>

        {/* Chevron */}
        <div className="flex justify-center text-gray-400 group-hover:text-gray-600 transition-colors">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </div>
      </div>

      {/* Painel expandido */}
      {expanded && (
        <div className="px-4 pb-4 pt-3 border-t"
          style={{ borderColor: 'var(--color-border)', background: isUrgent ? '#fffbeb' : '#fafafa' }}>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
            <DetailItem label="Nome completo"   value={sale.customer_name} />
            <DetailItem label="Telefone"        value={sale.customer_phone} />
            <DetailItem label="Email"           value={sale.customer_email} />
            <DetailItem label="BI / Passaporte"        value={sale.national_id} mono />
            <DetailItem label="Método pag."     value={PAYMENT_LABEL[sale.payment_method || ''] || sale.payment_method} />
            <DetailItem label="Valor"           value={`${sale.amount?.toLocaleString()} ${sale.currency}`} />
            <DetailItem label="Data"            value={sale.created_at ? new Date(sale.created_at).toLocaleString('pt-AO') : undefined} />
            {sale.confirmed_at && <DetailItem label="Confirmado em" value={new Date(sale.confirmed_at).toLocaleString('pt-AO')} />}
            {sale.referral_code && (
              <DetailItem
                label="Afiliado"
                value={`${sale.referral_code}${sale.affiliate_data?.profiles?.full_name ? ` — ${sale.affiliate_data.profiles.full_name}` : ''}`}
              />
            )}
            {sale.notes && <DetailItem label="Notas" value={sale.notes} />}
          </div>

          {/* Acções */}
          <div className="flex flex-wrap items-center gap-2 pt-3 border-t" style={{ borderColor: 'var(--color-border)' }}>
            {sale.payment_proof_url && (
              <>
                <button onClick={e => { e.stopPropagation(); setProofOpen(true) }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all hover:scale-105"
                  style={{ background: '#fef3c7', color: '#92400e', border: '2px solid #f59e0b' }}>
                  📎 Ver Comprovativo
                </button>
                {proofOpen && (
                  <ProofModal
                    url={sale.payment_proof_url}
                    name={sale.customer_name || 'Cliente'}
                    onClose={() => setProofOpen(false)}
                  />
                )}
              </>
            )}
            {canConfirm  && <ConfirmSaleButton  saleId={sale.id} adminId={adminId} hasProof={!!sale.payment_proof_url} />}
            {canCancel   && <CancelSaleButton   saleId={sale.id} />}
            {sale.status === 'cancelled' && <ReactivateSaleButton saleId={sale.id} adminId={adminId} />}
          </div>
        </div>
      )}
    </>
  )
}

function DetailItem({ label, value, mono = false }: { label: string; value?: string | null; mono?: boolean }) {
  return (
    <div>
      <p className="text-xs text-gray-400 mb-0.5">{label}</p>
      <p className={`text-sm text-gray-800 ${mono ? 'font-mono' : 'font-medium'} break-all`}>
        {value || <span className="text-gray-300">—</span>}
      </p>
    </div>
  )
}

// ─── Botões de acção ──────────────────────────────────────────────────────────

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
