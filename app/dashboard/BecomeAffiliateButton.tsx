'use client'

// app/dashboard/BecomeAffiliateButton.tsx
// Botão para converter conta de cliente em afiliado

import { useState, useTransition } from 'react'
import { becomeAffiliate } from '@/lib/actions'

export default function BecomeAffiliateButton() {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [showConfirm, setShowConfirm] = useState(false)

  const handleClick = () => {
    setShowConfirm(true)
  }

  const handleConfirm = () => {
    setError('')
    startTransition(async () => {
      const result = await becomeAffiliate()
      if (result?.error) {
        setError(result.error)
        setShowConfirm(false)
      }
      // Se não há erro, o redirect é feito na server action
    })
  }

  if (showConfirm) {
    return (
      <div className="rounded-xl p-4 border" style={{ borderColor: 'var(--color-border)', background: '#fff' }}>
        <p className="text-sm font-semibold text-gray-800 mb-1">Tem a certeza?</p>
        <p className="text-xs mb-4" style={{ color: 'var(--color-text-muted)' }}>
          A sua conta passará a ter acesso ao painel de afiliado com o seu link único de referido. 
          A sua membresía actual não será afectada.
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => setShowConfirm(false)}
            disabled={isPending}
            className="btn-outline text-sm py-2 px-4"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={isPending}
            className="btn-primary text-sm py-2 px-4 disabled:opacity-50"
          >
            {isPending ? 'A processar...' : 'Sim, tornar-me afiliado'}
          </button>
        </div>
        {error && (
          <p className="text-xs text-red-600 mt-3">{error}</p>
        )}
      </div>
    )
  }

  return (
    <button
      onClick={handleClick}
      className="btn-primary text-sm py-2 px-5"
    >
      🤝 Tornar-me Afiliado →
    </button>
  )
}
