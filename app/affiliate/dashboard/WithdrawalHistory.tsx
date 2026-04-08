'use client'

// app/affiliate/dashboard/WithdrawalHistory.tsx

import { useState } from 'react'

interface Withdrawal {
  id: string
  amount: number
  currency: string
  status: string
  requested_at: string
  reviewed_at?: string | null
}

const PAGE_SIZE = 5

export default function WithdrawalHistory({ withdrawals }: { withdrawals: Withdrawal[] }) {
  const [page, setPage] = useState(1)

  if (!withdrawals || withdrawals.length === 0) return null

  const totalPages = Math.ceil(withdrawals.length / PAGE_SIZE)
  const paginated = withdrawals.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-lg font-bold text-gray-900">
          Histórico de Retiros
        </h2>
        <span className="text-xs text-gray-400">
          {withdrawals.length} {withdrawals.length === 1 ? 'retiro' : 'retiros'} no total
        </span>
      </div>

      <div className="space-y-3">
        {paginated.map((w) => (
          <div key={w.id} className="card flex items-center justify-between gap-4">
            <div>
              <p className="text-xs text-gray-500">
                Solicitado em{' '}
                {new Date(w.requested_at).toLocaleDateString('pt-AO', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}
              </p>
              {w.reviewed_at && (
                <p className="text-xs text-gray-400">
                  {w.status === 'paid' ? 'Pago' : 'Revisto'} em{' '}
                  {new Date(w.reviewed_at).toLocaleDateString('pt-AO')}
                </p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <p className="font-bold text-gray-800">
                {w.amount.toLocaleString()} {w.currency}
              </p>
              <span
                className="text-xs px-2.5 py-1 rounded-full font-medium"
                style={{
                  background:
                    w.status === 'paid'
                      ? '#dcfce7'
                      : w.status === 'rejected' || w.status === 'cancelled'
                      ? '#fee2e2'
                      : '#fef3c7',
                  color:
                    w.status === 'paid'
                      ? '#166534'
                      : w.status === 'rejected' || w.status === 'cancelled'
                      ? '#991b1b'
                      : '#92400e',
                }}
              >
                {w.status === 'paid'
                  ? '✅ Pago'
                  : w.status === 'rejected' || w.status === 'cancelled'
                  ? '✗ Rejeitado'
                  : '⏳ Pendente'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
          <p className="text-xs text-gray-400">
            Página {page} de {totalPages}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              style={{ background: page === 1 ? '#f3f4f6' : 'var(--color-primary)', color: page === 1 ? '#6b7280' : 'white' }}
              aria-label="Página anterior"
            >
              ‹
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1)
              // Show max 5 page buttons, centered around current
              .filter(p => {
                if (totalPages <= 5) return true
                if (p === 1 || p === totalPages) return true
                return Math.abs(p - page) <= 1
              })
              .reduce<(number | '...')[]>((acc, p, idx, arr) => {
                if (idx > 0 && typeof arr[idx - 1] === 'number' && (p as number) - (arr[idx - 1] as number) > 1) {
                  acc.push('...')
                }
                acc.push(p)
                return acc
              }, [])
              .map((p, idx) =>
                p === '...' ? (
                  <span key={`ellipsis-${idx}`} className="w-8 h-8 flex items-center justify-center text-xs text-gray-400">
                    …
                  </span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setPage(p as number)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-all"
                    style={
                      page === p
                        ? { background: 'var(--color-primary)', color: 'white' }
                        : { background: '#f3f4f6', color: '#374151' }
                    }
                  >
                    {p}
                  </button>
                )
              )}

            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              style={{ background: page === totalPages ? '#f3f4f6' : 'var(--color-primary)', color: page === totalPages ? '#6b7280' : 'white' }}
              aria-label="Próxima página"
            >
              ›
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
