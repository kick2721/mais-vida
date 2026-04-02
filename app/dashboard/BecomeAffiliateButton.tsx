'use client'

// app/dashboard/BecomeAffiliateButton.tsx

import { useState, useTransition } from 'react'
import { becomeAffiliate } from '@/lib/actions'

function BtnSpinner() {
  return (
    <svg className="animate-spin" width="14" height="14" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6" stroke="white" strokeOpacity="0.3" strokeWidth="2"/>
      <path d="M14 8A6 6 0 0 0 8 2" stroke="white" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}

export default function BecomeAffiliateButton() {
  const [isPending, startTransition] = useTransition()
  const [error, setError]           = useState('')
  const [showConfirm, setShowConfirm] = useState(false)

  const handleConfirm = () => {
    setError('')
    startTransition(async () => {
      const result = await becomeAffiliate()
      if (result?.error) {
        setError(result.error)
        setShowConfirm(false)
      }
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
          <button onClick={() => setShowConfirm(false)} disabled={isPending}
            className="btn-outline text-sm py-2 px-4">
            Cancelar
          </button>
          <button onClick={handleConfirm} disabled={isPending}
            className="btn-primary text-sm py-2 px-4 disabled:opacity-50 flex items-center gap-2">
            {isPending ? <><BtnSpinner />A processar…</> : 'Sim, tornar-me afiliado'}
          </button>
        </div>
        {error && <p className="text-xs text-red-600 mt-3">{error}</p>}
      </div>
    )
  }

  return (
    <button onClick={() => setShowConfirm(true)} className="btn-primary text-sm py-2 px-5">
      🤝 Tornar-me Afiliado →
    </button>
  )
}
