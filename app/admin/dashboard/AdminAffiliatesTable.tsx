'use client'

// app/admin/dashboard/AdminAffiliatesTable.tsx
// Tabela de afiliados com toggle de activo/inactivo

import { useState, useTransition } from 'react'
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
}

export default function AdminAffiliatesTable({ affiliates }: { affiliates: Affiliate[] }) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all')

  const filtered = affiliates.filter(aff => {
    const name = aff.profiles?.full_name?.toLowerCase() || ''
    const code = aff.referral_code?.toLowerCase() || ''
    const matchesSearch = search === '' || name.includes(search.toLowerCase()) || code.includes(search.toLowerCase())
    const matchesFilter = filter === 'all' ||
      (filter === 'active' && aff.is_active) ||
      (filter === 'inactive' && !aff.is_active)
    return matchesSearch && matchesFilter
  })

  return (
    <div>
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input
          type="text"
          placeholder="Pesquisar por nome ou código..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input-field flex-1"
        />
        <select
          value={filter}
          onChange={e => setFilter(e.target.value as any)}
          className="input-field sm:w-40"
        >
          <option value="all">Todos</option>
          <option value="active">Activos</option>
          <option value="inactive">Inactivos</option>
        </select>
      </div>

      <p className="text-xs text-gray-500 mb-3">{filtered.length} afiliados</p>

      <div className="space-y-3">
        {filtered.map(aff => (
          <AffiliateRow key={aff.id} affiliate={aff} />
        ))}
        {filtered.length === 0 && (
          <div className="card text-center py-10">
            <p className="text-4xl mb-3">👥</p>
            <p className="text-gray-500 text-sm">Sem afiliados encontrados.</p>
          </div>
        )}
      </div>
    </div>
  )
}

function AffiliateRow({ affiliate }: { affiliate: Affiliate }) {
  const [isPending, startTransition] = useTransition()
  const [isActive, setIsActive] = useState(affiliate.is_active)

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
    <div className="card">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <p className="font-semibold text-gray-800">{affiliate.profiles?.full_name || '—'}</p>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              {isActive ? 'Activo' : 'Inactivo'}
            </span>
          </div>
          <div className="flex gap-4 flex-wrap text-xs text-gray-500">
            <span>📞 {affiliate.profiles?.phone || '—'}</span>
            <span>🔑 <span className="font-mono font-bold">{affiliate.referral_code}</span></span>
            <span>📅 {new Date(affiliate.joined_at).toLocaleDateString('pt-AO')}</span>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="grid grid-cols-3 gap-4 text-center mb-3">
            <div>
              <p className="font-bold text-gray-800 text-sm">{affiliate.total_sales || 0}</p>
              <p className="text-xs text-gray-400">vendas</p>
            </div>
            <div>
              <p className="font-bold text-sm" style={{ color: 'var(--color-primary)' }}>
                {(affiliate.total_earned || 0).toLocaleString()}
              </p>
              <p className="text-xs text-gray-400">ganho Kz</p>
            </div>
            <div>
              <p className="font-bold text-sm text-blue-600">{(affiliate.balance || 0).toLocaleString()}</p>
              <p className="text-xs text-gray-400">saldo Kz</p>
            </div>
          </div>
          <button
            onClick={handleToggle}
            disabled={isPending}
            className={`text-xs px-3 py-1.5 rounded-xl font-semibold transition-all disabled:opacity-50 ${
              isActive
                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                : 'bg-green-100 text-green-700 hover:bg-green-200'
            }`}
          >
            {isPending ? '...' : isActive ? 'Desactivar' : 'Activar'}
          </button>
        </div>
      </div>
    </div>
  )
}
