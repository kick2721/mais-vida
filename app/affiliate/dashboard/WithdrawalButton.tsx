'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { requestWithdrawal } from '@/lib/actions'
import { COMMISSION } from '@/lib/constants'

interface Props {
  balance: number
  hasPending: boolean
}

function BtnSpinner() {
  return (
    <svg className="animate-spin" width="14" height="14" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeOpacity="0.3" strokeWidth="2"/>
      <path d="M14 8A6 6 0 0 0 8 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}

export default function WithdrawalButton({ balance, hasPending }: Props) {
  const [showModal, setShowModal]   = useState(false)
  const [iban, setIban]             = useState('')
  const [accountHolder, setAccountHolder] = useState('')
  const [error, setError]           = useState('')
  const [success, setSuccess]       = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const canWithdraw = balance >= COMMISSION.withdrawalMinimum
  const missing = COMMISSION.withdrawalMinimum - balance

  const handleSubmit = () => {
    if (!iban.trim())           { setError('Introduza o seu IBAN.'); return }
    if (!accountHolder.trim())  { setError('Introduza o nome do titular da conta.'); return }
    setError('')
    startTransition(async () => {
      const result = await requestWithdrawal(iban, accountHolder)
      if (result.success) {
        setSuccess(true)
        router.refresh()
      } else {
        setError(result.error || 'Erro ao submeter pedido.')
      }
    })
  }

  const handleClose = () => {
    setShowModal(false)
    setError('')
    setSuccess(false)
    setIban('')
    setAccountHolder('')
  }

  // Estado: já tem pedido pendente
  if (hasPending) {
    return (
      <div className="rounded-2xl p-4 flex items-center gap-3"
        style={{ background: '#fef3c7', border: '1px solid #fcd34d' }}>
        <span className="text-xl">⏳</span>
        <div>
          <p className="text-sm font-semibold text-yellow-800">Pedido de retiro pendente</p>
          <p className="text-xs text-yellow-700 mt-0.5">A equipa irá processar em breve.</p>
        </div>
      </div>
    )
  }

  // Estado: saldo insuficiente
  if (!canWithdraw) {
    return (
      <div className="rounded-2xl p-4" style={{ background: '#f3f4f6', border: '1px solid #e5e7eb' }}>
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-semibold text-gray-600">Solicitar Retiro</p>
          <span className="text-xs text-gray-400">Mín. {COMMISSION.withdrawalMinimum.toLocaleString()} AOA</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
          <div className="h-2 rounded-full transition-all"
            style={{
              width: `${Math.min(100, (balance / COMMISSION.withdrawalMinimum) * 100)}%`,
              background: 'var(--color-primary)',
            }}
          />
        </div>
        <p className="text-xs text-gray-500">
          Faltam <strong>{missing.toLocaleString()} AOA</strong> ({Math.ceil(missing / COMMISSION.amount)} venda{Math.ceil(missing / COMMISSION.amount) !== 1 ? 's' : ''}) para atingir o mínimo.
        </p>
      </div>
    )
  }

  // Estado: pode solicitar
  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="w-full rounded-2xl p-4 text-left transition-all hover:opacity-90"
        style={{ background: 'var(--color-primary)', color: 'white' }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold">💸 Solicitar Retiro</p>
            <p className="text-xs mt-0.5" style={{ color: '#c6e4c3' }}>
              {balance.toLocaleString()} AOA disponíveis para levantamento
            </p>
          </div>
          <span className="text-2xl">→</span>
        </div>
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            {success ? (
              <div className="text-center py-4">
                <p className="text-4xl mb-3">✅</p>
                <p className="font-bold text-gray-900 mb-1">Pedido enviado!</p>
                <p className="text-sm text-gray-500 mb-4">
                  A equipa irá processar o seu retiro e enviar o comprovativo via WhatsApp.
                </p>
                <button onClick={handleClose} className="btn-primary text-sm py-2 px-6">
                  Fechar
                </button>
              </div>
            ) : (
              <>
                <h3 className="font-display text-lg font-bold text-gray-900 mb-1">Solicitar Retiro</h3>
                <p className="text-sm text-gray-500 mb-5">
                  Valor a receber: <strong>{balance.toLocaleString()} AOA</strong>
                </p>

                {/* IBAN */}
                <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                  IBAN
                </label>
                <input
                  type="text"
                  value={iban}
                  onChange={e => setIban(e.target.value)}
                  placeholder="Ex: 0060 0140 0100 0000 0000 0"
                  className="input-field w-full mb-4 font-mono text-sm"
                />

                {/* Nome do titular */}
                <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                  Nome do titular da conta
                </label>
                <input
                  type="text"
                  value={accountHolder}
                  onChange={e => setAccountHolder(e.target.value)}
                  placeholder="Ex: João Manuel da Silva"
                  className="input-field w-full mb-1 text-sm"
                />
                <p className="text-xs text-gray-400 mb-5">
                  Tal como aparece associado ao IBAN no banco.
                </p>

                {error && (
                  <div className="bg-red-50 border border-red-100 rounded-xl p-3 mb-4">
                    <p className="text-sm text-red-700">⚠️ {error}</p>
                  </div>
                )}

                <div className="flex gap-3">
                  <button onClick={handleClose} className="flex-1 btn-outline text-sm py-2">
                    Cancelar
                  </button>
                  <button onClick={handleSubmit} disabled={isPending}
                    className="flex-1 btn-primary text-sm py-2 disabled:opacity-50 flex items-center justify-center gap-2">
                    {isPending ? <><BtnSpinner />A enviar…</> : 'Confirmar pedido'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
