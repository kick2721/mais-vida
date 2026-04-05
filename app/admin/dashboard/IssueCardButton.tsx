'use client'

// app/admin/dashboard/IssueCardButton.tsx

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { issueCard } from '@/lib/admin-actions'

interface Props {
  cardId: string
  adminId: string
  customerName: string
  customerPhone?: string
}

function BtnSpinner() {
  return (
    <svg className="animate-spin" width="14" height="14" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6" stroke="white" strokeOpacity="0.3" strokeWidth="2"/>
      <path d="M14 8A6 6 0 0 0 8 2" stroke="white" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}

// Formata número de telefone angolano para WhatsApp internacional
function formatWhatsAppNumber(phone: string): string {
  // Remove tudo que não seja dígito
  const digits = phone.replace(/\D/g, '')
  // Angola: código +244, números locais têm 9 dígitos
  if (digits.startsWith('244')) return digits          // já tem código país
  if (digits.startsWith('9') && digits.length === 9) return `244${digits}` // 9xxxxxxxx
  if (digits.startsWith('0') && digits.length === 10) return `244${digits.slice(1)}` // 09xxxxxxxx
  return digits // devolve como está se não reconhecer o padrão
}

export default function IssueCardButton({ cardId, adminId, customerName, customerPhone }: Props) {
  const [isPending, startTransition] = useTransition()
  const [showModal, setShowModal]   = useState(false)
  const router = useRouter()

  const whatsappNumber = customerPhone ? formatWhatsAppNumber(customerPhone) : null
  const whatsappUrl = whatsappNumber
    ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(`Olá ${customerName}! O seu cartão de membro +Vida já está pronto. Envio em seguida 🎉`)}`
    : null

  const confirmIssue = () => {
    startTransition(async () => {
      const result = await issueCard(cardId, adminId)
      if (result.success) {
        router.refresh() // recarga dados do servidor — UI actualiza a partir do estado real da BD
        setShowModal(false)
      } else {
        alert(result.error || 'Erro ao emitir cartão.')
        setShowModal(false)
      }
    })
  }

  return (
    <>
      <button onClick={() => setShowModal(true)} disabled={isPending}
        className="btn-primary text-sm py-2 px-4 disabled:opacity-50 flex items-center gap-2">
        {isPending ? <><BtnSpinner />A emitir…</> : '🪪 Marcar como Emitido'}
      </button>

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

            {whatsappUrl ? (
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-xl p-3 mb-4 transition-all hover:opacity-90"
                style={{ background: '#dcfce7', border: '2px solid #22c55e', textDecoration: 'none' }}>
                <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ background: '#16a34a' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-bold" style={{ color: '#166534' }}>Abrir WhatsApp do cliente</p>
                  <p className="text-xs" style={{ color: '#15803d' }}>{customerPhone}</p>
                </div>
                <span className="ml-auto text-lg">↗</span>
              </a>
            ) : (
              <div className="bg-gray-50 rounded-xl p-3 mb-4 text-sm text-gray-500">
                📵 Sem número de telefone registado
              </div>
            )}

            <p className="text-xs text-gray-400 mb-6">
              Após enviar o cartão ao cliente, clique em &ldquo;Confirmar emissão&rdquo; para registar no sistema.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowModal(false)} disabled={isPending}
                className="flex-1 btn-outline text-sm py-2">
                Cancelar
              </button>
              <button onClick={confirmIssue} disabled={isPending}
                className="flex-1 btn-primary text-sm py-2 disabled:opacity-50 flex items-center justify-center gap-2">
                {isPending ? <><BtnSpinner />A registar…</> : '✅ Confirmar emissão'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
