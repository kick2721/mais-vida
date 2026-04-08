'use client'

// app/affiliate/dashboard/AffiliateDashboardCharts.tsx

import { useState, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'

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

// Format label for X axis based on groupBy
function formatLabel(key: string, groupBy: 'day' | 'week' | 'month', index: number, total: number): string {
  if (groupBy === 'month') {
    // key = 'YYYY-MM'
    const [year, month] = key.split('-')
    const date = new Date(Number(year), Number(month) - 1, 1)
    return date.toLocaleDateString('pt-AO', { month: 'short' })
  }
  // groupBy === 'day' — key = 'YYYY-MM-DD'
  const [, month, day] = key.split('-')
  return `${day}/${month}`
}

// Format tooltip label (more verbose)
function formatTooltipLabel(key: string, groupBy: 'day' | 'week' | 'month'): string {
  if (groupBy === 'month') {
    const [year, month] = key.split('-')
    const date = new Date(Number(year), Number(month) - 1, 1)
    return date.toLocaleDateString('pt-AO', { month: 'long', year: 'numeric' })
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

// ─── BarChart component ────────────────────────────────────────────────────

function BarChart({
  data, color, label, unit, groupBy,
}: {
  data: { key: string; total: number }[]
  color: string
  label: string
  unit: string
  groupBy: 'day' | 'week' | 'month'
}) {
  const max = Math.max(...data.map(d => d.total))

  // Decide which labels to show to avoid overcrowding
  // For months: always show all. For days: show every N
  const total = data.length
  let step = 1
  if (groupBy === 'day') {
    if (total > 25) step = 7
    else if (total > 14) step = 5
    else if (total > 7) step = 2
  }

  return (
    <div className="card">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">{label}</p>
      <div className="flex items-end gap-px h-40 mb-2">
        {data.map(({ key, total }) => {
          const hasValue = total > 0
          const heightPct = max > 0 ? (total / max) * 100 : 0

          return (
            <div key={key} className="flex-1 flex flex-col items-center justify-end group relative h-full">
              {hasValue && (
                <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 z-10
                  opacity-0 group-hover:opacity-100 transition-opacity
                  bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap pointer-events-none">
                  {formatTooltipLabel(key, groupBy)}: {total.toLocaleString()} {unit}
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

      {/* X axis labels — smart spacing */}
      <div className="flex gap-px" style={{ minHeight: groupBy === 'day' && total > 14 ? '32px' : '20px' }}>
        {data.map(({ key }, i) => {
          const showLabel = groupBy === 'month' || i % step === 0
          return (
            <div key={key} className="flex-1 relative" style={{ minWidth: 0 }}>
              {showLabel && (
                <span
                  className="text-xs text-gray-400 block leading-tight"
                  style={
                    groupBy === 'day' && total > 14
                      ? {
                          position: 'absolute',
                          left: '50%',
                          top: 0,
                          transform: 'translateX(-50%) rotate(-35deg)',
                          transformOrigin: 'top center',
                          whiteSpace: 'nowrap',
                          fontSize: '10px',
                        }
                      : { textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }
                  }
                >
                  {formatLabel(key, groupBy, i, total)}
                </span>
              )}
            </div>
          )
        })}
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
  const { salesChartData, commissionsChartData, periodLabel } = useMemo(() => {
    if (groupBy === 'month') {
      const months = getMonthRange(startDate, endDate)
      return {
        salesChartData: buildMonthCountData(filteredSales, months),
        commissionsChartData: buildMonthAmountData(filteredCommissions, months),
        periodLabel: `${months[0].split('-').reverse().join('/')} – hoje`,
      }
    } else {
      const days = getDayRange(startDate, endDate)
      const fmt = (d: Date) => d.toLocaleDateString('pt-AO', { day: '2-digit', month: 'short' })
      return {
        salesChartData: buildDayCountData(filteredSales, days),
        commissionsChartData: buildDayAmountData(filteredCommissions, days),
        periodLabel: `${fmt(startDate)} – ${fmt(endDate)}`,
      }
    }
  }, [groupBy, startDate, endDate, filteredSales, filteredCommissions])

  return (
    <>
      {/* Period selector — shared, above both charts */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <p className="text-xs text-gray-400 font-medium">{periodLabel}</p>
        <PeriodSelector value={period} onChange={setPeriod} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Sales chart */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-lg font-bold text-gray-900">
              Vendas Referidas ({filteredSales.length})
            </h2>
            <button
              onClick={() => setModal('sales')}
              disabled={sales.length === 0}
              className="text-xs px-3 py-1.5 rounded-xl font-semibold disabled:opacity-40"
              style={{ background: 'var(--color-primary)', color: 'white' }}
            >
              Ver detalhes
            </button>
          </div>
          <BarChart
            data={salesChartData}
            color="var(--color-primary)"
            label={`vendas · ${PERIODS[period].label}`}
            unit="vendas"
            groupBy={groupBy}
          />
        </div>

        {/* Commissions chart */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-lg font-bold text-gray-900">
              Comissões ({filteredCommissions.length})
            </h2>
            <button
              onClick={() => setModal('commissions')}
              disabled={commissions.length === 0}
              className="text-xs px-3 py-1.5 rounded-xl font-semibold disabled:opacity-40"
              style={{ background: '#7c3aed', color: 'white' }}
            >
              Ver detalhes
            </button>
          </div>
          <BarChart
            data={commissionsChartData}
            color="#7c3aed"
            label={`AOA · ${PERIODS[period].label}`}
            unit="AOA"
            groupBy={groupBy}
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
