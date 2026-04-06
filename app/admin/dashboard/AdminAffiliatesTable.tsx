'use client'

// app/admin/dashboard/AdminAffiliatesTable.tsx

import { useState, useTransition, useMemo } from 'react'
import { toggleAffiliateStatus } from '@/lib/admin-actions'

interface Affiliate {
  id: string
  referral_code: string
  total_sales: number
  total_earned: number
  total_paid: number
  balance: number
  is_active: boolean
  joined_at: string
  profiles?: { full_name: string; phone: string; national_id: string }
  monthly_sales?: { month: string; count: number }[]
}

const PAGE_SIZE = 50

// Meses abreviados em português
const MONTH_PT: Record<string, string> = {
  '01': 'Jan', '02': 'Fev', '03': 'Mar', '04': 'Abr',
  '05': 'Mai', '06': 'Jun', '07': 'Jul', '08': 'Ago',
  '09': 'Set', '10': 'Out', '11': 'Nov', '12': 'Dez',
}

// ─── Mini gráfico de linha para a coluna Vendas ───────────────────────────────
// Linha com pontos e seta no fim, escala automática

function MiniLineChart({ data, up }: { data: number[]; up: boolean }) {
  const W = 58
  const H = 24
  const max = Math.max(...data, 1)
  const color = up ? '#16a34a' : '#dc2626'

  const pts = data.map((v, i) => ({
    x: 3 + (i / (data.length - 1 || 1)) * (W - 10),
    y: (H - 4) - (v / max) * (H - 8),
  }))

  const polyline = pts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  const last = pts[pts.length - 1]
  const prev = pts.length >= 2 ? pts[pts.length - 2] : { x: last.x - 6, y: last.y }
  const angle = Math.atan2(last.y - prev.y, last.x - prev.x) * (180 / Math.PI)

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ overflow: 'visible' }}>
      <polyline
        points={polyline}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {/* Pontos */}
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={1.8} fill={color} />
      ))}
      {/* Seta no último ponto */}
      <g transform={`translate(${last.x.toFixed(1)},${last.y.toFixed(1)}) rotate(${angle})`}>
        <polygon points="6,0 -2,-3 -2,3" fill={color} />
      </g>
    </svg>
  )
}

// ─── Gráfico de barras expandido: altura fixa, labels PT, escala automática ───

function ExpandedBarChart({ data, months, up }: { data: number[]; months: string[]; up: boolean }) {
  const BAR_H_MAX = 52  // altura máxima das barras em px — nunca ultrapassa
  const BAR_W    = 22
  const max      = Math.max(...data, 1)
  const color    = up ? '#16a34a' : '#dc2626'
  const colorLt  = up ? '#86efac' : '#fca5a5'

  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 5 }}>
      {data.map((v, i) => {
        const barH  = Math.max((v / max) * BAR_H_MAX, v > 0 ? 4 : 2)
        const [, m] = months[i].split('-')
        const label = MONTH_PT[m] || m
        const isLast = i === data.length - 1

        return (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div
              style={{
                width: BAR_W,
                height: barH,
                background: isLast ? color : colorLt,
                borderRadius: '3px 3px 0 0',
              }}
            />
            {/* Label debaixo, nunca tapada pelas barras */}
            <span style={{ fontSize: 10, color: '#9ca3af', lineHeight: 1, whiteSpace: 'nowrap' }}>
              {label}
            </span>
          </div>
        )
      })}
    </div>
  )
}

// ─── Seta de tendência estilo gráfico de mercado ──────────────────────────────

function TrendArrow({ current, previous }: { current: number; previous: number }) {
  if (previous === 0 && current === 0)
    return <span style={{ color: '#d1d5db', fontSize: 14, lineHeight: 1 }}>—</span>

  const up = previous === 0 ? true : current >= previous
  const color = up ? '#16a34a' : '#dc2626'

  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      {up ? (
        <>
          {/* Linha zigzag a subir */}
          <polyline
            points="2,17 7,11 11,14 19,4"
            stroke={color} strokeWidth="2.2"
            strokeLinejoin="round" strokeLinecap="round"
          />
          {/* Cabeça da seta */}
          <polyline
            points="14,3 19,4 18,9"
            stroke={color} strokeWidth="2.2"
            strokeLinejoin="round" strokeLinecap="round"
          />
        </>
      ) : (
        <>
          {/* Linha zigzag a descer */}
          <polyline
            points="2,5 7,11 11,8 19,18"
            stroke={color} strokeWidth="2.2"
            strokeLinejoin="round" strokeLinecap="round"
          />
          {/* Cabeça da seta */}
          <polyline
            points="14,19 19,18 18,13"
            stroke={color} strokeWidth="2.2"
            strokeLinejoin="round" strokeLinecap="round"
          />
        </>
      )}
    </svg>
  )
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(date: string | null) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('pt-AO', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

function lastNMonths(n: number): string[] {
  const months: string[] = []
  const now = new Date()
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }
  return months
}

function getMonthlyCounts(affiliate: Affiliate): number[] {
  const months = lastNMonths(6)
  if (!affiliate.monthly_sales?.length) {
    return months.map((_, i) => (i === months.length - 1 ? affiliate.total_sales || 0 : 0))
  }
  const map: Record<string, number> = {}
  for (const { month, count } of affiliate.monthly_sales) map[month] = count
  return months.map(m => map[m] || 0)
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function AdminAffiliatesTable({ affiliates }: { affiliates: Affiliate[] }) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [page, setPage]     = useState(1)

  const activeCount   = useMemo(() => affiliates.filter(a => a.is_active).length, [affiliates])
  const inactiveCount = affiliates.length - activeCount

  const filtered = useMemo(() => {
    let list = affiliates
    if (filter === 'active')   list = list.filter(a => a.is_active)
    if (filter === 'inactive') list = list.filter(a => !a.is_active)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(a =>
        a.profiles?.full_name?.toLowerCase().includes(q) ||
        a.referral_code?.toLowerCase().includes(q) ||
        a.profiles?.phone?.includes(q)
      )
    }
    return list
  }, [affiliates, filter, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  function handleSearch(v: string) { setSearch(v); setPage(1) }
  function handleFilter(f: typeof filter) { setFilter(f); setPage(1) }

  return (
    <div>
      {/* Controlos */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex gap-1 bg-white rounded-xl p-1 border" style={{ borderColor: 'var(--color-border)' }}>
          {([
            { key: 'all',      label: 'Todos',       count: affiliates.length },
            { key: 'active',   label: '🟢 Activos',   count: activeCount },
            { key: 'inactive', label: '🔴 Inactivos', count: inactiveCount },
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

        <div className="relative flex-1 min-w-0">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            value={search}
            onChange={e => handleSearch(e.target.value)}
            placeholder="Pesquisar por nome, código ou telefone…"
            className="w-full pl-9 pr-4 py-2 rounded-xl border text-sm bg-white outline-none"
            style={{ borderColor: 'var(--color-border)' }}
          />
          {search && (
            <button onClick={() => handleSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700">
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Tabela */}
      {filtered.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-4xl mb-3">👥</p>
          <p className="text-gray-500 text-sm">Sem afiliados encontrados.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--color-border)' }}>
          <div
            className="hidden sm:grid text-xs font-semibold text-gray-500 uppercase tracking-wide px-4 py-2.5 border-b"
            style={{
              borderColor: 'var(--color-border)',
              background: '#fafafa',
              gridTemplateColumns: '2fr 1fr 80px 1fr 1fr 1fr 80px 80px',
            }}
          >
            <span>Afiliado</span>
            <span>Código</span>
            <span>Membro desde</span>
            <span className="text-right">Vendas</span>
            <span className="text-right">Ganho Kz</span>
            <span className="text-right">Saldo Kz</span>
            <span className="text-center">Tend.</span>
            <span className="text-center">Estado</span>
          </div>

          <div className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
            {paginated.map(aff => (
              <AffiliateRow key={aff.id} affiliate={aff} />
            ))}
          </div>
        </div>
      )}

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-xs text-gray-500">
            {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} de{' '}
            <span className="font-semibold">{filtered.length}</span> afiliados
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

function AffiliateRow({ affiliate }: { affiliate: Affiliate }) {
  const [isPending, startTransition] = useTransition()
  const [isActive, setIsActive]      = useState(affiliate.is_active)
  const [expanded, setExpanded]      = useState(false)

  const months6       = lastNMonths(6)
  const monthlyCounts = getMonthlyCounts(affiliate)
  const currentMonth  = monthlyCounts[monthlyCounts.length - 1]
  const prevMonth     = monthlyCounts[monthlyCounts.length - 2]
  const trendUp       = prevMonth === 0 ? true : currentMonth >= prevMonth

  const handleToggle = () => {
    const action = isActive ? 'desactivar' : 'activar'
    if (!confirm(`Tem a certeza que quer ${action} este afiliado?`)) return
    startTransition(async () => {
      const result = await toggleAffiliateStatus(affiliate.id, !isActive)
      if (result.success) setIsActive(!isActive)
      else alert(result.error || `Erro ao ${action} afiliado.`)
    })
  }

  return (
    <>
      <div
        className="grid items-center px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors group"
        style={{ gridTemplateColumns: '2fr 1fr 80px 1fr 1fr 1fr 80px 80px' }}
        onClick={() => setExpanded(e => !e)}
      >
        {/* Nome */}
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-800 truncate">
            {affiliate.profiles?.full_name || '—'}
          </p>
          <p className="text-xs text-gray-400 truncate">{affiliate.profiles?.phone || ''}</p>
        </div>

        {/* Código */}
        <div>
          <span className="text-xs font-mono bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded">
            {affiliate.referral_code}
          </span>
        </div>

        {/* Data entrada */}
        <div>
          <p className="text-xs text-gray-500">{fmt(affiliate.joined_at)}</p>
        </div>

        {/* Vendas: linha com seta + número */}
        <div className="flex items-center justify-end gap-2">
          <MiniLineChart data={monthlyCounts} up={trendUp} />
          <p className="text-sm font-bold text-gray-800 w-6 text-right tabular-nums">
            {affiliate.total_sales || 0}
          </p>
        </div>

        {/* Ganho */}
        <div className="text-right">
          <p className="text-sm font-semibold tabular-nums" style={{ color: 'var(--color-primary)' }}>
            {(affiliate.total_earned || 0).toLocaleString()}
          </p>
        </div>

        {/* Saldo */}
        <div className="text-right">
          <p className="text-sm font-semibold text-blue-600 tabular-nums">
            {(affiliate.balance || 0).toLocaleString()}
          </p>
        </div>

        {/* Tendência */}
        <div className="flex justify-center">
          <TrendArrow current={currentMonth} previous={prevMonth} />
        </div>

        {/* Estado + expand */}
        <div className="flex items-center justify-center gap-2">
          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isActive ? 'bg-green-500' : 'bg-red-400'}`} />
          <svg
            width="12" height="12" viewBox="0 0 24 24" fill="none"
            stroke="#9ca3af" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            className="group-hover:stroke-gray-600 transition-colors"
            style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </div>
      </div>

      {/* Painel expandido */}
      {expanded && (
        <div className="px-4 pb-4 pt-3 border-t bg-gray-50" style={{ borderColor: 'var(--color-border)' }}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
            <DetailItem label="Nome completo"  value={affiliate.profiles?.full_name} />
            <DetailItem label="Telefone"       value={affiliate.profiles?.phone} />
            <DetailItem label="BI / NIF"       value={affiliate.profiles?.national_id} />
            <DetailItem label="Membro desde"   value={fmt(affiliate.joined_at)} />
            <DetailItem label="Total vendas"   value={String(affiliate.total_sales || 0)} />
            <DetailItem label="Total ganho"    value={`${(affiliate.total_earned || 0).toLocaleString()} Kz`} />
            <DetailItem label="Total pago"     value={`${(affiliate.total_paid || 0).toLocaleString()} Kz`} />
            <DetailItem label="Saldo actual"   value={`${(affiliate.balance || 0).toLocaleString()} Kz`} />
          </div>

          <div className="flex justify-between items-end gap-4">
            {/* Gráfico de barras: altura fixa, labels PT, nunca tapa as letras */}
            <div>
              <p className="text-xs text-gray-400 mb-2">Vendas últimos 6 meses</p>
              <ExpandedBarChart data={monthlyCounts} months={months6} up={trendUp} />
            </div>

            {/* Botão toggle */}
            <button
              onClick={e => { e.stopPropagation(); handleToggle() }}
              disabled={isPending}
              className="flex-shrink-0 text-xs px-4 py-2 rounded-xl font-semibold transition-all disabled:opacity-50"
              style={
                isActive
                  ? { background: '#fee2e2', color: '#b91c1c' }
                  : { background: '#dcfce7', color: '#15803d' }
              }
            >
              {isPending ? '…' : isActive ? 'Desactivar afiliado' : 'Activar afiliado'}
            </button>
          </div>
        </div>
      )}
    </>
  )
}

function DetailItem({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-xs text-gray-400 mb-0.5">{label}</p>
      <p className="text-sm font-medium text-gray-800">{value || <span className="text-gray-300">—</span>}</p>
    </div>
  )
}
