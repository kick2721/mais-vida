'use client'

// app/admin/dashboard/AdminCardsSection.tsx
// Componente extraído de page.tsx — tabela compacta com paginação para escala alta

import { useState, useMemo } from 'react'
import IssueCardButton from './IssueCardButton'

interface CardData {
  id: string
  card_number: string
  status: 'pending' | 'issued'
  issued_at: string | null
  issued_by: string | null
  created_at: string
  sale_id: string | null
  sale_data?: {
    customer_name: string
    customer_phone?: string
    customer_email?: string
    national_id?: string
  } | null
}

const PAGE_SIZE = 50

function fmt(date: string | null) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('pt-AO', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

export default function AdminCardsSection({
  cards,
  adminId,
}: {
  cards: CardData[]
  adminId: string
}) {
  const [search, setSearch]     = useState('')
  const [filter, setFilter]     = useState<'all' | 'pending' | 'issued'>('all')
  const [page, setPage]         = useState(1)

  const pendingCount = useMemo(() => cards.filter(c => c.status === 'pending').length, [cards])

  const filtered = useMemo(() => {
    let list = cards

    if (filter !== 'all') list = list.filter(c => c.status === filter)

    if (search.trim()) {
      const q = search.toLowerCase().trim()
      list = list.filter(c =>
        c.card_number?.toLowerCase().includes(q) ||
        c.sale_data?.customer_name?.toLowerCase().includes(q) ||
        c.sale_data?.customer_phone?.includes(q) ||
        c.sale_data?.national_id?.toLowerCase().includes(q)
      )
    }

    return list
  }, [cards, filter, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  function handleSearch(v: string) {
    setSearch(v)
    setPage(1)
  }

  function handleFilter(f: typeof filter) {
    setFilter(f)
    setPage(1)
  }

  return (
    <div>
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <h2 className="font-display text-lg font-bold text-gray-900">
          Cartões{' '}
          <span className="text-gray-400 font-normal text-base">({cards.length})</span>
        </h2>
        {pendingCount > 0 && (
          <span className="text-sm text-yellow-700 bg-yellow-50 px-3 py-1 rounded-full font-medium border border-yellow-200 self-start sm:self-auto">
            ⚠️ {pendingCount} pendente{pendingCount !== 1 ? 's' : ''} de emissão
          </span>
        )}
      </div>

      {/* Banner informativo */}
      <div className="rounded-2xl p-4 mb-5 border border-yellow-200 bg-yellow-50">
        <p className="text-sm font-semibold text-yellow-800">📋 Processo de emissão de cartão</p>
        <p className="text-xs text-yellow-700 mt-1">
          O cartão digital é preparado manualmente e enviado ao cliente via WhatsApp ou email.
          Após enviar, marque como &ldquo;Emitido&rdquo; para registar a emissão no sistema.
        </p>
      </div>

      {/* Filtros + Pesquisa */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        {/* Filtro de estado */}
        <div className="flex gap-1 bg-white rounded-xl p-1 border" style={{ borderColor: 'var(--color-border)' }}>
          {([
            { key: 'all',     label: 'Todos',    count: cards.length },
            { key: 'pending', label: '⚠️ Pendentes', count: pendingCount },
            { key: 'issued',  label: '✅ Emitidos',  count: cards.length - pendingCount },
          ] as const).map(f => (
            <button
              key={f.key}
              onClick={() => handleFilter(f.key)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap"
              style={
                filter === f.key
                  ? { background: 'var(--color-primary)', color: 'white' }
                  : { color: '#6b7280' }
              }
            >
              {f.label} <span className="opacity-70">({f.count})</span>
            </button>
          ))}
        </div>

        {/* Pesquisa */}
        <div className="relative flex-1 min-w-0">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            value={search}
            onChange={e => handleSearch(e.target.value)}
            placeholder="Pesquisar por nome, nº cartão, telefone, BI…"
            className="w-full pl-9 pr-4 py-2 rounded-xl border text-sm bg-white outline-none focus:ring-2"
            style={{
              borderColor: 'var(--color-border)',
              // @ts-ignore
              '--tw-ring-color': 'var(--color-primary)',
            }}
          />
          {search && (
            <button onClick={() => handleSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors">
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Tabela */}
      {filtered.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-4xl mb-3">🪪</p>
          <p className="text-gray-500 text-sm">
            {search || filter !== 'all' ? 'Nenhum cartão encontrado.' : 'Ainda não há cartões gerados.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--color-border)' }}>
          {/* Cabeçalho da tabela */}
          <div className="grid text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-2.5 border-b"
            style={{
              borderColor: 'var(--color-border)',
              gridTemplateColumns: '2fr 1.5fr 1.5fr 1fr 1fr auto',
              background: '#fafafa',
            }}>
            <span>Cliente</span>
            <span>Nº Cartão</span>
            <span>Telefone</span>
            <span>Criado</span>
            <span>Estado</span>
            <span></span>
          </div>

          {/* Linhas */}
          <div className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
            {paginated.map(card => (
              <CardTableRow key={card.id} card={card} adminId={adminId} />
            ))}
          </div>
        </div>
      )}

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-xs text-gray-500">
            {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} de{' '}
            <span className="font-semibold">{filtered.length}</span> cartões
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-sm transition-all disabled:opacity-30 border hover:bg-gray-50"
              style={{ borderColor: 'var(--color-border)' }}>
              ‹
            </button>

            {/* Páginas visíveis */}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let p: number
              if (totalPages <= 5) p = i + 1
              else if (page <= 3) p = i + 1
              else if (page >= totalPages - 2) p = totalPages - 4 + i
              else p = page - 2 + i
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-medium transition-all border"
                  style={
                    page === p
                      ? { background: 'var(--color-primary)', color: 'white', borderColor: 'var(--color-primary)' }
                      : { borderColor: 'var(--color-border)', color: '#374151' }
                  }>
                  {p}
                </button>
              )
            })}

            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-sm transition-all disabled:opacity-30 border hover:bg-gray-50"
              style={{ borderColor: 'var(--color-border)' }}>
              ›
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Linha da tabela ──────────────────────────────────────────────────────────

function CardTableRow({ card, adminId }: { card: CardData; adminId: string }) {
  const [expanded, setExpanded] = useState(false)
  const sd = card.sale_data

  const isPending = card.status === 'pending'

  return (
    <>
      <div
        className="grid items-center px-4 py-3 cursor-pointer transition-colors hover:bg-gray-50 group"
        style={{
          gridTemplateColumns: '2fr 1.5fr 1.5fr 1fr 1fr auto',
          background: isPending ? '#fffbeb' : undefined,
        }}
        onClick={() => setExpanded(e => !e)}
      >
        {/* Cliente */}
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-800 truncate">
            {sd?.customer_name || <span className="text-gray-400 font-normal italic">Sem nome</span>}
          </p>
        </div>

        {/* Nº Cartão */}
        <div>
          <p className="text-xs font-mono text-gray-600 truncate">{card.card_number || '—'}</p>
        </div>

        {/* Telefone */}
        <div>
          <p className="text-xs text-gray-500 truncate">{sd?.customer_phone || '—'}</p>
        </div>

        {/* Data de criação */}
        <div>
          <p className="text-xs text-gray-500">{fmt(card.created_at)}</p>
        </div>

        {/* Estado */}
        <div>
          {isPending ? (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-yellow-700 bg-yellow-100 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse inline-block" />
              Pendente
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
              Emitido
            </span>
          )}
        </div>

        {/* Expand chevron */}
        <div className="text-gray-400 group-hover:text-gray-600 transition-colors pl-2">
          <svg
            width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </div>
      </div>

      {/* Painel expandido */}
      {expanded && (
        <div
          className="px-4 pb-4 pt-2 border-t"
          style={{
            borderColor: 'var(--color-border)',
            background: isPending ? '#fffbeb' : '#fafafa',
          }}
        >
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
            <DetailItem label="Nome completo"  value={sd?.customer_name} />
            <DetailItem label="Telefone"       value={sd?.customer_phone} />
            <DetailItem label="Email"          value={sd?.customer_email} />
            <DetailItem label="BI / NIF"       value={sd?.national_id} />
            <DetailItem label="Nº Cartão"      value={card.card_number} mono />
            <DetailItem label="Emitido em"     value={fmt(card.issued_at)} />
            <DetailItem label="Criado em"      value={fmt(card.created_at)} />
          </div>

          {/* Acção */}
          {isPending && (
            <div className="flex justify-end">
              <IssueCardButton
                cardId={card.id}
                adminId={adminId}
                customerName={sd?.customer_name || 'Cliente'}
                customerPhone={sd?.customer_phone}
              />
            </div>
          )}
        </div>
      )}
    </>
  )
}

function DetailItem({
  label,
  value,
  mono = false,
}: {
  label: string
  value?: string | null
  mono?: boolean
}) {
  return (
    <div>
      <p className="text-xs text-gray-400 mb-0.5">{label}</p>
      <p className={`text-sm text-gray-800 ${mono ? 'font-mono' : 'font-medium'}`}>
        {value || <span className="text-gray-300">—</span>}
      </p>
    </div>
  )
}
