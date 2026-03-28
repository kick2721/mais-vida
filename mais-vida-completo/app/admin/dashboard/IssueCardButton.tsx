'use client'

// app/admin/dashboard/IssueCardButton.tsx
// Botão para emitir cartão digital — abre modal de confirmação

import { useState, useTransition } from 'react'
import { issueCard } from '@/lib/admin-actions'

interface Props {
  cardId: string
  adminId: string
  customerName: string
  customerPhone?: string
}

export default function IssueCardButton({ cardId, adminId, customerName, customerPhone }: Props) {
  const [isPending, startTransition] = useTransition()
  const [done, setDone] = useState(false)
  const [cardNumber, setCardNumber] = useState('')
  const [showModal, setShowModal] = useState(false)

  const handleIssue = () => {
    setShowModal(true)
  }

  const confirmIssue = () => {
    startTransition(async () => {
      const result = await issueCard(cardId, adminId)
      if (result.success) {
        setCardNumber(result.cardNumber || '')
        setDone(true)
        setShowModal(false)
      } else {
        alert(result.error || 'Erro ao emitir cartão.')
        setShowModal(false)
      }
    })
  }

  if (done) {
    return (
      <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium">
        ✅ Emitido{cardNumber ? ` — Nº ${cardNumber}` : ''}
      </span>
    )
  }

  return (
    <>
      <button
        onClick={handleIssue}
        disabled={isPending}
        className="btn-primary text-sm py-2 px-4 disabled:opacity-50"
      >
        {isPending ? 'A emitir...' : '🪪 Marcar como Emitido'}
      </button>

      {/* Modal de confirmação */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="font-display text-lg font-bold text-gray-900 mb-2">
              Confirmar emissão do cartão
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              Confirme que o cartão digital de <strong>{customerName}</strong> foi preparado e enviado.
            </p>
            {customerPhone && (
              <div className="bg-green-50 rounded-xl p-3 mb-4 text-sm">
                <p className="text-green-700 font-medium">📱 WhatsApp do cliente:</p>
                <p className="text-green-800 font-mono font-bold">{customerPhone}</p>
              </div>
            )}
            <p className="text-xs text-gray-400 mb-6">
              Esta acção vai registar a emissão no sistema e notificar o cliente por email.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 btn-outline text-sm py-2"
              >
                Cancelar
              </button>
              <button
                onClick={confirmIssue}
                disabled={isPending}
                className="flex-1 btn-primary text-sm py-2 disabled:opacity-50"
              >
                {isPending ? 'A registar...' : 'Confirmar emissão'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
