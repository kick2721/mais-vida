'use client'

// app/admin/dashboard/AdminCommissionsActions.tsx
// Botões de aprovar e pagar comissões

import { useState, useTransition } from 'react'
import { approveCommission, payCommission } from '@/lib/admin-actions'

interface Props {
  commissionId: string
  status: 'pending' | 'approved'
  amount: number
  currency: string
  affiliateName: string
}

export default function AdminCommissionsActions({
  commissionId,
  status: initialStatus,
  amount,
  currency,
  affiliateName,
}: Props) {
  const [isPending, startTransition] = useTransition()
  const [status, setStatus] = useState(initialStatus)

  const handleApprove = () => {
    if (!confirm(`Aprovar comissão de ${amount.toLocaleString()} ${currency} para ${affiliateName}?`)) return
    startTransition(async () => {
      const result = await approveCommission(commissionId)
      if (result.success) setStatus('approved')
      else alert(result.error || 'Erro ao aprovar.')
    })
  }

  const handlePay = () => {
    if (!confirm(`Confirmar pagamento de ${amount.toLocaleString()} ${currency} a ${affiliateName}?\n\nVerifique que a transferência foi efectuada antes de confirmar.`)) return
    startTransition(async () => {
      const result = await payCommission(commissionId)
      if (result.success) setStatus('paid' as any)
      else alert(result.error || 'Erro ao registar pagamento.')
    })
  }

  if (status === 'paid' as any) {
    return <span className="text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-full font-medium">💰 Paga</span>
  }

  return (
    <div className="flex gap-2 flex-wrap">
      {status === 'pending' && (
        <button
          onClick={handleApprove}
          disabled={isPending}
          className="text-xs px-3 py-1.5 rounded-xl font-semibold bg-blue-100 text-blue-700 hover:bg-blue-200 disabled:opacity-50 transition-all"
        >
          {isPending ? '...' : '✓ Aprovar'}
        </button>
      )}
      {status === 'approved' && (
        <button
          onClick={handlePay}
          disabled={isPending}
          className="text-xs px-3 py-1.5 rounded-xl font-semibold bg-green-100 text-green-700 hover:bg-green-200 disabled:opacity-50 transition-all"
        >
          {isPending ? '...' : '💰 Marcar como Paga'}
        </button>
      )}
    </div>
  )
}
