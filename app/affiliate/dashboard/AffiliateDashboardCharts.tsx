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

function groupByDay<T extends { created_at: string; amount: number }>(items: T[]) {
  const map: Record<string, number> = {}
  for (const item of items) {
    const day = new Date(item.created_at).toLocaleDateString('pt-AO', { day: '2-digit', month: 'short' })
    map[day] = (map[day] || 0) + item.amount
  }
  // Return last 14 days that have data, sorted chronologically
  return Object.entries(map)
    .slice(-14)
    .map(([day, total]) => ({ day, total }))
}

function BarChart({ data, color, label }: { data: { day: string; total: number }[]; color: string; label: string }) {
  if (data.length === 0) {
    return (
      <div className="card flex flex-col items-center justify-center py-10 text-center">
        <p className="text-3xl mb-2">📊</p>
        <p className="text-gray-400 text-sm">Sem dados ainda</p>
      </div>
    )
  }

  const max = Math.max(...data.map(d => d.total))

  return (
    <div className="card">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">{label}</p>
      <div className="flex items-end gap-2 h-32">
        {data.map(({ day, total }) => {
          const heightPct = max > 0 ? (total / max) * 100 : 0
          return (
            <div key={day} className="flex-1 flex flex-col items-center gap-1 group">
              {/* Tooltip */}
              <div className="opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold whitespace-nowrap"
                style={{ color }}>
                {total.toLocaleString()}
              </div>
              {/* Bar */}
              <div className="w-full rounded-t-lg transition-all"
                style={{
                  height: `${Math.max(heightPct, 4)}%`,
                  background: color,
                  opacity: 0.85,
                  minHeight: '6px',
                }} />
              {/* Label */}
              <span className="text-xs text-gray-400 truncate w-full text-center">{day}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function AffiliateDashboardCharts({ sales, commissions, saleStatusMap }: Props) {
  const [showSales, setShowSales] = useState(false)
  const [showCommissions, setShowCommissions] = useState(false)

  const salesByDay = groupByDay(sales)
  const commissionsByDay = groupByDay(commissions)

  return (
    <div>
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Sales chart */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-lg font-bold text-gray-900">
              Vendas Referidas ({sales.length})
            </h2>
            <button
              onClick={() => setShowSales(v => !v)}
              className="text-xs px-3 py-1.5 rounded-xl font-semibold transition-all"
              style={{ background: 'var(--color-primary)', color: 'white', opacity: sales.length === 0 ? 0.4 : 1 }}
              disabled={sales.length === 0}
            >
              {showSales ? 'Ocultar' : 'Ver detalhes'}
            </button>
          </div>
          <BarChart
            data={salesByDay}
            color="var(--color-primary)"
            label="AOA por dia (vendas)"
          />
        </div>

        {/* Commissions chart */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-lg font-bold text-gray-900">
              Comissões ({commissions.length})
            </h2>
            <button
              onClick={() => setShowCommissions(v => !v)}
              className="text-xs px-3 py-1.5 rounded-xl font-semibold transition-all"
              style={{ background: '#7c3aed', color: 'white', opacity: commissions.length === 0 ? 0.4 : 1 }}
              disabled={commissions.length === 0}
            >
              {showCommissions ? 'Ocultar' : 'Ver detalhes'}
            </button>
          </div>
          <BarChart
            data={commissionsByDay}
            color="#7c3aed"
            label="AOA por dia (comissões)"
          />
        </div>
      </div>

      {/* Expandable sales list */}
      {showSales && (
        <div className="mb-6">
          <h3 className="font-semibold text-gray-700 mb-3 text-sm">Todas as vendas</h3>
          <div className="space-y-2">
            {sales.map((sale) => {
              const st = saleStatusMap[sale.status] || { label: sale.status, color: '#374151', bg: '#f3f4f6' }
              return (
                <div key={sale.id} className="card flex items-start justify-between gap-4 py-3">
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
        </div>
      )}

      {/* Expandable commissions list */}
      {showCommissions && (
        <div className="mb-6">
          <h3 className="font-semibold text-gray-700 mb-3 text-sm">Todas as comissões</h3>
          <div className="space-y-2">
            {commissions.map((c) => (
              <div key={c.id} className="card flex items-center justify-between gap-4 py-3">
                <p className="text-xs text-gray-400">
                  {new Date(c.created_at).toLocaleDateString('pt-AO', { day: '2-digit', month: 'short', year: 'numeric' })}
                </p>
                <p className="font-bold text-gray-800">{c.amount.toLocaleString()} {c.currency}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
