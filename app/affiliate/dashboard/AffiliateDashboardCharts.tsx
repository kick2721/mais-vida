'use client'

// app/affiliate/dashboard/AffiliateDashboardCharts.tsx

import { useState, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { exportToExcel, fmtDate } from '@/lib/export-excel'

interface Sale {
  id: string
  amount: number
  currency: string
  status: string
  created_at: string
  customer_name?: string
  customer_phone?: string
}

interface Commission {
  id: string
  amount: number
  currency: string
  created_at: string
}

interface Props {
  sales: Sale[]
  commissions: Commission[]
  saleStatusMap: Record<string, { label: string; color: string; bg: string }>
}

// ─── Period config ─────────────────────────────────────────────────────────

type Period = '7d' | '30d' | '6m' | '1y'

interface PeriodConfig {
  label: string
  getDates: () => { startDate: Date; endDate: Date }
  // How to group: 'day' | 'week' | 'month'
  groupBy: 'day' | 'week' | 'month'
}

const PERIODS: Record<Period, PeriodConfig> = {
  '7d': {
    label: '7 dias',
    groupBy: 'day',
    getDates: () => {
      const end = new Date()
      const start = new Date()
      start.setDate(start.getDate() - 6)
      return { startDate: start, endDate: end }
    },
  },
  '30d': {
    label: '30 dias',
    groupBy: 'day',
    getDates: () => {
      const end = new Date()
      const start = new Date()
      start.setDate(start.getDate() - 29)
      return { startDate: start, endDate: end }
    },
  },
  '6m': {
    label: '6 meses',
    groupBy: 'month',
    getDates: () => {
      const end = new Date()
      const start = new Date()
      start.setMonth(start.getMonth() - 5)
      start.setDate(1)
      return { startDate: start, endDate: end }
    },
  },
  '1y': {
    label: '1 ano',
    groupBy: 'month',
    getDates: () => {
      const end = new Date()
      const start = new Date()
      start.setFullYear(start.getFullYear() - 1)
      start.setDate(1)
      return { startDate: start, endDate: end }
    },
  },
}

// ─── Date helpers ──────────────────────────────────────────────────────────

function getDayRange(startDate: Date, endDate: Date): string[] {
  const days: string[] = []
  const current = new Date(startDate)
  current.setHours(0, 0, 0, 0)
  const end = new Date(endDate)
  end.setHours(0, 0, 0, 0)
  while (current <= end) {
    days.push(current.toISOString().split('T')[0])
    current.setDate(current.getDate() + 1)
  }
  return days
}

function getMonthRange(startDate: Date, endDate: Date): string[] {
  const months: string[] = []
  const current = new Date(startDate.getFullYear(), startDate.getMonth(), 1)
  const end = new Date(endDate.getFullYear(), endDate.getMonth(), 1)
  while (current <= end) {
    months.push(`${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`)
    current.setMonth(current.getMonth() + 1)
  }
  return months
}

// Returns week keys like '2026-W01' and a label map for each week
function getWeekRange(startDate: Date, endDate: Date): { keys: string[]; labelMap: Record<string, string> } {
  const keys: string[] = []
  const labelMap: Record<string, string> = {}
  const current = new Date(startDate)
  current.setHours(0, 0, 0, 0)
  const end = new Date(endDate)
  end.setHours(23, 59, 59, 999)
  while (current <= end) {
    const weekStart = new Date(current)
    const weekEnd = new Date(current)
    weekEnd.setDate(weekEnd.getDate() + 6)
    if (weekEnd > end) weekEnd.setTime(end.getTime())
    const key = weekStart.toISOString().split('T')[0]
    if (!keys.includes(key)) {
      keys.push(key)
      const fmtDay = (d: Date) => `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
      labelMap[key] = `${fmtDay(weekStart)}–${fmtDay(weekEnd)}`
    }
    current.setDate(current.getDate() + 7)
  }
  return { keys, labelMap }
}

function getISOWeekKey(dateStr: string, startDate: Date): string {
  // Returns the Monday of the week containing dateStr, clamped to startDate
  const d = new Date(dateStr)
  d.setHours(0, 0, 0, 0)
  const start = new Date(startDate)
  start.setHours(0, 0, 0, 0)
  // Find the Monday on or before d, but not before startDate
  const dayOfWeek = d.getDay() === 0 ? 6 : d.getDay() - 1 // Mon=0
  const monday = new Date(d)
  monday.setDate(d.getDate() - dayOfWeek)
  if (monday < start) monday.setTime(start.getTime())
  return monday.toISOString().split('T')[0]
}

// Format label for X axis based on groupBy
function formatLabel(key: string, groupBy: 'day' | 'week' | 'month', index: number, total: number, weekLabelMap?: Record<string, string>): string {
  if (groupBy === 'month') {
    // key = 'YYYY-MM'
    const [year, month] = key.split('-')
    const date = new Date(Number(year), Number(month) - 1, 1)
    return date.toLocaleDateString('pt-AO', { month: 'short' })
  }
  if (groupBy === 'week') {
    return weekLabelMap?.[key] ?? key
  }
  // groupBy === 'day' — key = 'YYYY-MM-DD'
  const [, month, day] = key.split('-')
  return `${day}/${month}`
}

// Format tooltip label (more verbose)
function formatTooltipLabel(key: string, groupBy: 'day' | 'week' | 'month', weekLabelMap?: Record<string, string>): string {
  if (groupBy === 'month') {
    const [year, month] = key.split('-')
    const date = new Date(Number(year), Number(month) - 1, 1)
    return date.toLocaleDateString('pt-AO', { month: 'long', year: 'numeric' })
  }
  if (groupBy === 'week') {
    return `Semana de ${weekLabelMap?.[key] ?? key}`
  }
  const date = new Date(key)
  return date.toLocaleDateString('pt-AO', { day: '2-digit', month: 'short', year: 'numeric' })
}

// ─── Chart data builders ───────────────────────────────────────────────────

function buildDayCountData(items: { created_at: string }[], days: string[]) {
  const map: Record<string, number> = {}
  for (const item of items) {
    const day = item.created_at.split('T')[0]
    map[day] = (map[day] || 0) + 1
  }
  return days.map(day => ({ key: day, total: map[day] || 0 }))
}

function buildDayAmountData(items: { created_at: string; amount: number }[], days: string[]) {
  const map: Record<string, number> = {}
  for (const item of items) {
    const day = item.created_at.split('T')[0]
    map[day] = (map[day] || 0) + item.amount
  }
  return days.map(day => ({ key: day, total: map[day] || 0 }))
}

function buildMonthCountData(items: { created_at: string }[], months: string[]) {
  const map: Record<string, number> = {}
  for (const item of items) {
    const month = item.created_at.slice(0, 7)
    map[month] = (map[month] || 0) + 1
  }
  return months.map(month => ({ key: month, total: map[month] || 0 }))
}

function buildMonthAmountData(items: { created_at: string; amount: number }[], months: string[]) {
  const map: Record<string, number> = {}
  for (const item of items) {
    const month = item.created_at.slice(0, 7)
    map[month] = (map[month] || 0) + item.amount
  }
  return months.map(month => ({ key: month, total: map[month] || 0 }))
}

function buildWeekCountData(items: { created_at: string }[], weekKeys: string[], startDate: Date) {
  const map: Record<string, number> = {}
  for (const item of items) {
    const wk = getISOWeekKey(item.created_at.split('T')[0], startDate)
    map[wk] = (map[wk] || 0) + 1
  }
  return weekKeys.map(k => ({ key: k, total: map[k] || 0 }))
}

function buildWeekAmountData(items: { created_at: string; amount: number }[], weekKeys: string[], startDate: Date) {
  const map: Record<string, number> = {}
  for (const item of items) {
    const wk = getISOWeekKey(item.created_at.split('T')[0], startDate)
    map[wk] = (map[wk] || 0) + item.amount
  }
  return weekKeys.map(k => ({ key: k, total: map[k] || 0 }))
}

// ─── BarChart component ────────────────────────────────────────────────────

function BarChart({
  data, color, label, unit, groupBy, weekLabelMap,
}: {
  data: { key: string; total: number }[]
  color: string
  label: string
  unit: string
  groupBy: 'day' | 'week' | 'month'
  weekLabelMap?: Record<string, string>
}) {
  const max = Math.max(...data.map(d => d.total))
  const total = data.length

  // For 30-day view (day groupBy with many points): show all bars, label only every 7 days
  const useCompactMode = groupBy === 'day' && total > 14

  if (useCompactMode) {
    return (
      <div className="card">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">{label}</p>
        {/* Bars */}
        <div style={{ display: 'flex', alignItems: 'flex-end', height: '130px', gap: '2px', marginBottom: '4px' }}>
          {data.map(({ key, total: val }) => {
            const hasValue = val > 0
            const heightPct = max > 0 ? (val / max) * 100 : 0
            return (
              <div
                key={key}
                title={`${formatTooltipLabel(key, groupBy, weekLabelMap)}: ${val.toLocaleString()} ${unit}`}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'flex-end',
                  height: '100%',
                  cursor: hasValue ? 'pointer' : 'default',
                }}
              >
                <div
                  style={{
                    width: '100%',
                    height: hasValue ? `${heightPct}%` : '2px',
                    background: hasValue ? color : '#e5e7eb',
                    borderRadius: '3px 3px 0 0',
                    minHeight: hasValue ? '4px' : '2px',
                    transition: 'height 0.3s ease',
                  }}
                />
              </div>
            )
          })}
        </div>
        {/* X-axis labels — every 7 days + last day */}
        <div style={{ display: 'flex', gap: '2px', height: '20px' }}>
          {data.map(({ key }, i) => {
            const showLabel = i === 0 || (i + 1) % 7 === 0 || i === total - 1
            return (
              <div key={key} style={{ flex: 1, position: 'relative' }}>
                {showLabel && (
                  <span
                    style={{
                      position: 'absolute',
                      left: '50%',
                      top: 2,
                      transform: 'translateX(-50%)',
                      whiteSpace: 'nowrap',
                      fontSize: '9px',
                      color: '#9ca3af',
                      lineHeight: 1,
                    }}
                  >
                    {formatLabel(key, groupBy, i, total, weekLabelMap)}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // Normal mode for 7d, 6m, 1y
  return (
    <div className="card">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">{label}</p>
      <div className="flex items-end gap-px h-40 mb-2">
        {data.map(({ key, total: val }) => {
          const hasValue = val > 0
          const heightPct = max > 0 ? (val / max) * 100 : 0

          return (
            <div key={key} className="flex-1 flex flex-col items-center justify-end group relative h-full">
              {hasValue && (
                <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 z-10
                  opacity-0 group-hover:opacity-100 transition-opacity
                  bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap pointer-events-none">
                  {formatTooltipLabel(key, groupBy, weekLabelMap)}: {val.toLocaleString()} {unit}
                </div>
              )}
              <div
                style={{
                  width: '100%',
                  height: hasValue ? `${heightPct}%` : '2px',
                  background: hasValue ? color : '#e5e7eb',
                  borderRadius: '3px 3px 0 0',
                  minHeight: hasValue ? '4px' : '2px',
                  transition: 'height 0.3s ease',
                }}
              />
            </div>
          )
        })}
      </div>

      {/* X axis labels */}
      <div className="flex gap-px" style={{ minHeight: groupBy === 'week' ? '36px' : '20px' }}>
        {data.map(({ key }, i) => (
          <div key={key} className="flex-1 relative" style={{ minWidth: 0 }}>
            <span
              className="text-xs text-gray-400 block leading-tight"
              style={
                groupBy === 'week'
                  ? {
                      position: 'absolute',
                      left: '50%',
                      top: 0,
                      transform: 'translateX(-50%) rotate(-30deg)',
                      transformOrigin: 'top center',
                      whiteSpace: 'nowrap',
                      fontSize: '9px',
                    }
                  : { textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }
              }
            >
              {formatLabel(key, groupBy, i, total, weekLabelMap)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── PeriodSelector ────────────────────────────────────────────────────────

function PeriodSelector({
  value,
  onChange,
}: {
  value: Period
  onChange: (p: Period) => void
}) {
  return (
    <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
      {(Object.keys(PERIODS) as Period[]).map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className="text-xs font-semibold px-2.5 py-1 rounded-lg transition-all"
          style={
            value === p
              ? { background: 'white', color: '#111827', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }
              : { color: '#6b7280' }
          }
        >
          {PERIODS[p].label}
        </button>
      ))}
    </div>
  )
}

// ─── DetailModal ───────────────────────────────────────────────────────────

function DetailModal({
  title, onClose, children,
}: {
  title: string
  onClose: () => void
  children: React.ReactNode
}) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const scrollY = window.scrollY
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
      window.scrollTo({ top: scrollY, behavior: 'instant' as ScrollBehavior })
    }
  }, [])

  if (!mounted) return null

  const modalContent = (
    <div
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        background: 'rgba(0,0,0,0.5)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'white',
          width: '100%',
          maxWidth: '32rem',
          borderRadius: '1rem',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '85vh',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Sticky header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: '1px solid var(--color-border)',
            background: 'white',
            borderRadius: '1rem 1rem 0 0',
            flexShrink: 0,
          }}
        >
          <h3 style={{ fontWeight: 700, fontSize: '1.125rem', color: '#111827', margin: 0 }}>{title}</h3>
          <button
            onClick={onClose}
            style={{
              width: 32, height: 32,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: '50%', border: 'none', background: 'transparent',
              cursor: 'pointer', fontWeight: 700, color: '#6b7280', fontSize: '1rem',
            }}
          >
            ✕
          </button>
        </div>
        {/* Scrollable content */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '20px' }}>
          {children}
        </div>
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}

// ─── Main export ───────────────────────────────────────────────────────────

export default function AffiliateDashboardCharts({ sales, commissions, saleStatusMap }: Props) {
  const [modal, setModal] = useState<'sales' | 'commissions' | null>(null)
  const [period, setPeriod] = useState<Period>('30d')

  function handleExportSales() {
    // Cada fila = venda + comissão correspondente (mesma posição)
    const maxRows = Math.max(sales.length, commissions.length)
    const rows = Array.from({ length: maxRows }, (_, i) => {
      const s = sales[i]
      const c = commissions[i]
      return {
        'Cliente':         s?.customer_name  || '—',
        'Telefone':        s?.customer_phone || '—',
        'Valor Venda':     s?.amount         ?? '',
        'Moeda':           s ? (s.currency || 'Kz') : '',
        'Estado Venda':    s ? (saleStatusMap[s.status]?.label || s.status) : '',
        'Data Venda':      s ? fmtDate(s.created_at) : '',
        'Comissão (AOA)':  c?.amount         ?? '',
        'Data Comissão':   c ? fmtDate(c.created_at) : '',
      }
    })
    exportToExcel(rows, `vendas-comissoes-${new Date().toISOString().slice(0,10)}`)
  }

  const { startDate, endDate, groupBy } = useMemo(() => {
    const cfg = PERIODS[period]
    const { startDate, endDate } = cfg.getDates()
    return { startDate, endDate, groupBy: cfg.groupBy }
  }, [period])

  // Filter items to the selected period
  const filteredSales = useMemo(() =>
    sales.filter(s => new Date(s.created_at) >= startDate && new Date(s.created_at) <= endDate),
    [sales, startDate, endDate]
  )
  const filteredCommissions = useMemo(() =>
    commissions.filter(c => new Date(c.created_at) >= startDate && new Date(c.created_at) <= endDate),
    [commissions, startDate, endDate]
  )

  // Build chart data
  const { salesChartData, commissionsChartData, periodLabel, weekLabelMap } = useMemo(() => {
    if (groupBy === 'month') {
      const months = getMonthRange(startDate, endDate)
      return {
        salesChartData: buildMonthCountData(filteredSales, months),
        commissionsChartData: buildMonthAmountData(filteredCommissions, months),
        periodLabel: `${months[0].split('-').reverse().join('/')} – hoje`,
        weekLabelMap: undefined,
      }
    } else if (groupBy === 'week') {
      const { keys, labelMap } = getWeekRange(startDate, endDate)
      const fmt = (d: Date) => d.toLocaleDateString('pt-AO', { day: '2-digit', month: 'short' })
      return {
        salesChartData: buildWeekCountData(filteredSales, keys, startDate),
        commissionsChartData: buildWeekAmountData(filteredCommissions, keys, startDate),
        periodLabel: `${fmt(startDate)} – ${fmt(endDate)}`,
        weekLabelMap: labelMap,
      }
    } else {
      const days = getDayRange(startDate, endDate)
      const fmt = (d: Date) => d.toLocaleDateString('pt-AO', { day: '2-digit', month: 'short' })
      return {
        salesChartData: buildDayCountData(filteredSales, days),
        commissionsChartData: buildDayAmountData(filteredCommissions, days),
        periodLabel: `${fmt(startDate)} – ${fmt(endDate)}`,
        weekLabelMap: undefined,
      }
    }
  }, [groupBy, startDate, endDate, filteredSales, filteredCommissions])

  return (
    <>
      {/* Period selector + botón Excel compartido */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <p className="text-xs text-gray-400 font-medium">{periodLabel}</p>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportSales}
            disabled={sales.length === 0 && commissions.length === 0}
            className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-xl font-semibold border disabled:opacity-40"
            style={{ borderColor: '#16a34a', color: '#16a34a', background: '#f0fdf4' }}
            title="Exportar vendas e comissões para Excel"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Excel
          </button>
          <PeriodSelector value={period} onChange={setPeriod} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Sales chart */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-lg font-bold text-gray-900">
              Vendas Referidas ({filteredSales.length})
            </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setModal('sales')}
              disabled={sales.length === 0}
              className="text-xs px-3 py-1.5 rounded-xl font-semibold disabled:opacity-40"
              style={{ background: 'var(--color-primary)', color: 'white' }}
            >
              Ver detalhes
            </button>
          </div>
          </div>
          <BarChart
            data={salesChartData}
            color="var(--color-primary)"
            label={`vendas · ${PERIODS[period].label}`}
            unit="vendas"
            groupBy={groupBy}
            weekLabelMap={weekLabelMap}
          />
        </div>

        {/* Commissions chart */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-lg font-bold text-gray-900">
              Comissões ({filteredCommissions.length})
            </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setModal('commissions')}
              disabled={commissions.length === 0}
              className="text-xs px-3 py-1.5 rounded-xl font-semibold disabled:opacity-40"
              style={{ background: '#7c3aed', color: 'white' }}
            >
              Ver detalhes
            </button>
          </div>
          </div>
          <BarChart
            data={commissionsChartData}
            color="#7c3aed"
            label={`AOA · ${PERIODS[period].label}`}
            unit="AOA"
            groupBy={groupBy}
            weekLabelMap={weekLabelMap}
          />
        </div>
      </div>

      {/* Sales modal — always shows all sales, not just filtered */}
      {modal === 'sales' && (
        <DetailModal title={`Vendas Referidas (${sales.length})`} onClose={() => setModal(null)}>
          <div>
            {sales.map((sale) => {
              const st = saleStatusMap[sale.status] || { label: sale.status, color: '#374151', bg: '#f3f4f6' }
              return (
                <div key={sale.id}
                  className="flex items-start justify-between gap-4 py-3 border-b last:border-0"
                  style={{ borderColor: 'var(--color-border)' }}>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 text-sm truncate">{sale.customer_name || 'Cliente'}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(sale.created_at).toLocaleDateString('pt-AO', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-gray-800 text-sm">{sale.amount?.toLocaleString()} {sale.currency}</p>
                    <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{ background: st.bg, color: st.color }}>
                      {st.label}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </DetailModal>
      )}

      {/* Commissions modal */}
      {modal === 'commissions' && (
        <DetailModal title={`Comissões (${commissions.length})`} onClose={() => setModal(null)}>
          <div>
            {commissions.map((c) => (
              <div key={c.id}
                className="flex items-center justify-between gap-4 py-3 border-b last:border-0"
                style={{ borderColor: 'var(--color-border)' }}>
                <p className="text-xs text-gray-400">
                  {new Date(c.created_at).toLocaleDateString('pt-AO', { day: '2-digit', month: 'short', year: 'numeric' })}
                </p>
                <p className="font-bold text-gray-800">{c.amount.toLocaleString()} {c.currency}</p>
              </div>
            ))}
          </div>
        </DetailModal>
      )}
    </>
  )
}
