'use client'

// app/admin/dashboard/AdminCommissionsActions.tsx

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { payCommission } from '@/lib/admin-actions'

function BtnSpinner() {
  return (
    <svg className="animate-spin" width="14" height="14" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeOpacity="0.3" strokeWidth="2"/>
      <path d="M14 8A6 6 0 0 0 8 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}

interface Props {
  commissionId: string
  status: 'approved'
  amount: number
  currency: string
  affiliateName: string
}

export default function AdminCommissionsActions({
  commissionId, amount, currency, affiliateName,
}: Props) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handlePay = () => {
    if (!confirm(`Confirmar pagamento de ${amount.toLocaleString()} ${currency} a ${affiliateName}?\n\nVerifique que a transferência foi efectuada antes de confirmar.`)) return
    startTransition(async () => {
      const result = await payCommission(commissionId)
      if (result.success) router.refresh()
      else alert(result.error || 'Erro ao registar pagamento.')
    })
  }

  return (
    <button onClick={handlePay} disabled={isPending}
      className="text-xs px-3 py-1.5 rounded-xl font-semibold bg-purple-100 text-purple-700 hover:bg-purple-200 disabled:opacity-50 transition-all flex items-center gap-1">
      {isPending ? <><BtnSpinner />A processar…</> : '💰 Marcar como Paga'}
    </button>
  )
}
