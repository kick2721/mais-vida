'use client'

// app/affiliate/dashboard/AffiliateDashboardCharts.tsx

import { useState } from 'react'

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

function formatDayLabel(isoDate: string): string {
  const [, month, day] = isoDate.split('-')
  return `${day}/${month}`
}

function buildChartData(items: { created_at: string; amount: number }[], days: string[]) {
  const map: Record<string, number> = {}
  for (const item of items) {
    const day = item.created_at.split('T')[0]
    map[day] = (map[day] || 0) + item.amount
  }
  return days.map(day => ({ day, total: map[day] || 0 }))
}

function BarChart({ data, color, label }: { data: { day: string; total: number }[]; color: string; label: string }) {
  const max = Math.max(...data.map(d => d.total), 1)
  const step = Math.ceil(data.length / 10)

  return (
    <div className="card">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">{label}</p>
      <div className="flex items-end gap-0.5 h-36 mb-2">
        {data.map(({ day, total }, i) => {
          const heightPct = (total / max) * 100
          const hasValue = total > 0
          return (
            <div key={day} className="flex-1 flex flex-col items-center justify-end group relative">
              {hasValue && (
                <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 z-10 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap pointer-events-none">
                  {formatDayLabel(day)}: {total.toLocaleString()} AOA
                </div>
              )}
              <div
                className="w-full rounded-t transition-all"
                style={{
                  height: hasValue ? `${Math.max(heightPct, 3)}%` : '2px',
                  background: hasValue ? color : '#e5e7eb',
                  minHeight: hasValue ? '4px' : '2px',
                }}
              />
            </div>
          )
        })}
      </div>
      <div className="flex gap-0.5">
        {data.map(({ day }, i) => (
          <div key={day} className="flex-1 text-center">
            {i % step === 0 && (
              <span className="text-xs text-gray-400">{formatDayLabel(day)}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function DetailModal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: 'rgba(0,0,0,0.5)' }}
      onClick={onClose}
    >
      <div
        className="bg-white w-full sm:max-w-lg sm:rounded-2xl flex flex-col"
        style={{ maxHeight: '90vh' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b bg-white sm:rounded-t-2xl z-10"
          style={{ borderColor: 'var(--color-border)' }}>
          <h3 className="font-display text-lg font-bold text-gray-900">{title}</h3>
          <button onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 transition-colors text-lg font-bold">
            ✕
          </button>
        </div>
        <div className="overflow-y-auto p-5 flex-1">
          {children}
        </div>
      </div>
    </div>
  )
}

export default function AffiliateDashboardCharts({ sales, commissions, saleStatusMap }: Props) {
  const [modal, setModal] = useState<'sales' | 'commissions' | null>(null)

  const startDate = new Date('2026-04-01')
  const endDate = new Date()
  endDate.setDate(endDate.getDate() + 7)
  const days = getDayRange(startDate, endDate)

  const salesChartData = buildChartData(sales, days)
  const commissionsChartData = buildChartData(commissions, days)
  const endLabel = endDate.toLocaleDateString('pt-AO', { day: '2-digit', month: 'short' })

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-lg font-bold text-gray-900">Vendas Referidas ({sales.length})</h2>
            <button onClick={() => setModal('sales')} disabled={sales.length === 0}
              className="text-xs px-3 py-1.5 rounded-xl font-semibold transition-all disabled:opacity-40"
              style={{ background: 'var(--color-primary)', color: 'white' }}>
              Ver detalhes
            </button>
          </div>
          <BarChart data={salesChartData} color="var(--color-primary)" label={`AOA por dia · 01/abr – ${endLabel}`} />
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-lg font-bold text-gray-900">Comissões ({commissions.length})</h2>
            <button onClick={() => setModal('commissions')} disabled={commissions.length === 0}
              className="text-xs px-3 py-1.5 rounded-xl font-semibold transition-all disabled:opacity-40"
              style={{ background: '#7c3aed', color: 'white' }}>
              Ver detalhes
            </button>
          </div>
          <BarChart data={commissionsChartData} color="#7c3aed" label={`AOA por dia · 01/abr – ${endLabel}`} />
        </div>
      </div>

      {modal === 'sales' && (
        <DetailModal title={`Vendas Referidas (${sales.length})`} onClose={() => setModal(null)}>
          <div className="space-y-0">
            {sales.map((sale) => {
              const st = saleStatusMap[sale.status] || { label: sale.status, color: '#374151', bg: '#f3f4f6' }
              return (
                <div key={sale.id} className="flex items-start justify-between gap-4 py-3 border-b last:border-0"
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
                      style={{ background: st.bg, color: st.color }}>{st.label}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </DetailModal>
      )}

      {modal === 'commissions' && (
        <DetailModal title={`Comissões (${commissions.length})`} onClose={() => setModal(null)}>
          <div className="space-y-0">
            {commissions.map((c) => (
              <div key={c.id} className="flex items-center justify-between gap-4 py-3 border-b last:border-0"
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
