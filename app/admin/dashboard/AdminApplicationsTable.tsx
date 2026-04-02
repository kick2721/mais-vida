'use client'

// app/admin/dashboard/AdminApplicationsTable.tsx

import { useState, useTransition } from 'react'
import { approveApplication, rejectApplication } from '@/lib/admin-actions'

interface Application {
  id: string
  full_name: string
  phone: string
  national_id: string
  occupation: string | null
  network_size: string | null
  motivation: string
  instagram: string | null
  facebook: string | null
  tiktok: string | null
  other_social: string | null
  status: 'pending' | 'approved' | 'rejected'
  reject_reason: string | null
  created_at: string
}

function BtnSpinner() {
  return (
    <svg className="animate-spin inline-block mr-1" width="14" height="14" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeOpacity="0.3" strokeWidth="2"/>
      <path d="M14 8A6 6 0 0 0 8 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}

export default function AdminApplicationsTable({ applications }: { applications: Application[] }) {
  const pending  = applications.filter(a => a.status === 'pending')
  const reviewed = applications.filter(a => a.status !== 'pending')

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-lg font-bold text-gray-900">
          Candidaturas a Afiliado ({applications.length})
        </h2>
        {pending.length > 0 && (
          <span className="text-sm text-yellow-700 bg-yellow-50 px-3 py-1 rounded-full font-medium">
            {pending.length} pendentes de análise
          </span>
        )}
      </div>

      {pending.length > 0 && (
        <div className="mb-8">
          <h3 className="font-semibold text-gray-700 text-sm mb-3 uppercase tracking-wide">
            ⏳ Pendentes de análise
          </h3>
          <div className="space-y-4">
            {pending.map(app => <ApplicationCard key={app.id} application={app} />)}
          </div>
        </div>
      )}

      {reviewed.length > 0 && (
        <div>
          <h3 className="font-semibold text-gray-700 text-sm mb-3 uppercase tracking-wide">
            Já analisadas
          </h3>
          <div className="space-y-3">
            {reviewed.map(app => <ApplicationCard key={app.id} application={app} />)}
          </div>
        </div>
      )}

      {applications.length === 0 && (
        <div className="card text-center py-10">
          <p className="text-4xl mb-3">📋</p>
          <p className="text-gray-500 text-sm">Ainda não há candidaturas submetidas.</p>
        </div>
      )}
    </div>
  )
}

function ApplicationCard({ application: app }: { application: Application }) {
  const [isPending, startTransition] = useTransition()
  const [status, setStatus]                   = useState(app.status)
  const [showRejectModal, setShowRejectModal]  = useState(false)
  const [rejectReason, setRejectReason]        = useState(app.reject_reason || '')
  const [actionError, setActionError]          = useState('')

  const handleApprove = () => {
    const msg = status === 'rejected'
      ? `Reverter decisão e APROVAR candidatura de ${app.full_name}?\n\nIsto irá criar uma conta de afiliado.`
      : `Aprovar candidatura de ${app.full_name}?\n\nIsto irá criar uma conta de afiliado.`
    if (!confirm(msg)) return
    setActionError('')
    startTransition(async () => {
      try {
        const result = await approveApplication(app.id)
        if (result.success) setStatus('approved')
        else setActionError(result.error || 'Erro ao aprovar.')
      } catch {
        setActionError('Sessão expirada. Por favor recarregue a página.')
      }
    })
  }

  const handleReject = () => {
    setActionError('')
    startTransition(async () => {
      try {
        const result = await rejectApplication(app.id, rejectReason)
        if (result.success) { setStatus('rejected'); setShowRejectModal(false) }
        else setActionError(result.error || 'Erro ao rejeitar.')
      } catch {
        setActionError('Sessão expirada. Por favor recarregue a página.')
      }
    })
  }

  const statusBadge = {
    pending:  { label: '⏳ Pendente', color: '#92400e', bg: '#fef3c7' },
    approved: { label: '✅ Aprovada', color: '#166534', bg: '#dcfce7' },
    rejected: { label: '✗ Rejeitada', color: '#991b1b', bg: '#fee2e2' },
  }[status]

  return (
    <div className="card">
      <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <p className="font-semibold text-gray-800">{app.full_name}</p>
            <span className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ background: statusBadge.bg, color: statusBadge.color }}>
              {statusBadge.label}
            </span>
          </div>
          <div className="flex gap-4 flex-wrap text-xs text-gray-500">
            <span>📞 {app.phone}</span>
            <span>🪪 {app.national_id}</span>
            {app.occupation && <span>💼 {app.occupation}</span>}
            {app.network_size && <span>👥 {app.network_size}</span>}
            <span>📅 {new Date(app.created_at).toLocaleDateString('pt-AO')}</span>
          </div>
        </div>
      </div>

      <div className="rounded-xl p-3 mb-4"
        style={{ background: 'var(--color-surface)', borderLeft: '3px solid var(--color-primary)' }}>
        <p className="text-xs font-semibold text-gray-600 mb-1">Motivação:</p>
        <p className="text-sm text-gray-700 leading-relaxed">{app.motivation}</p>
      </div>

      {(app.instagram || app.facebook || app.tiktok || app.other_social) && (
        <div className="rounded-xl p-3 mb-4 border" style={{ borderColor: 'var(--color-border)' }}>
          <p className="text-xs font-semibold text-gray-600 mb-2">Redes sociais:</p>
          <div className="flex flex-wrap gap-3">
            {app.instagram && (
              <a href={`https://instagram.com/${app.instagram}`} target="_blank" rel="noopener noreferrer"
                className="text-xs flex items-center gap-1 underline" style={{ color: 'var(--color-primary)' }}>
                📸 instagram.com/{app.instagram}
              </a>
            )}
            {app.facebook && (
              <a href={`https://facebook.com/${app.facebook}`} target="_blank" rel="noopener noreferrer"
                className="text-xs flex items-center gap-1 underline" style={{ color: 'var(--color-primary)' }}>
                👤 facebook.com/{app.facebook}
              </a>
            )}
            {app.tiktok && (
              <a href={`https://tiktok.com/@${app.tiktok}`} target="_blank" rel="noopener noreferrer"
                className="text-xs flex items-center gap-1 underline" style={{ color: 'var(--color-primary)' }}>
                🎵 tiktok.com/@{app.tiktok}
              </a>
            )}
            {app.other_social && <span className="text-xs text-gray-600">🔗 {app.other_social}</span>}
          </div>
        </div>
      )}

      {status === 'rejected' && rejectReason && (
        <div className="rounded-xl p-3 mb-4 bg-red-50 border border-red-100">
          <p className="text-xs font-semibold text-red-700 mb-1">Motivo de rejeição:</p>
          <p className="text-sm text-red-600">{rejectReason}</p>
        </div>
      )}

      {/* Erro inline — mostra mensagem sem crashar a app */}
      {actionError && (
        <div className="rounded-xl p-3 mb-3 bg-red-50 border border-red-200">
          <p className="text-sm text-red-700">⚠️ {actionError}</p>
          {actionError.includes('expirada') && (
            <button onClick={() => window.location.reload()}
              className="text-xs text-red-600 underline mt-1">
              Recarregar página
            </button>
          )}
        </div>
      )}

      {/* Botões — sempre visíveis, permitem reverter decisões */}
      <div className="flex gap-2 pt-3 border-t flex-wrap" style={{ borderColor: 'var(--color-border)' }}>
        {status !== 'approved' && (
          <button onClick={handleApprove} disabled={isPending}
            className="btn-primary text-sm py-2 px-4 disabled:opacity-50 flex items-center gap-1">
            {isPending ? <><BtnSpinner />A processar…</> : '✅ Aprovar'}
          </button>
        )}
        {status === 'approved' ? (
          <button onClick={() => setShowRejectModal(true)} disabled={isPending}
            className="btn-outline text-sm py-2 px-4 disabled:opacity-50"
            style={{ borderColor: '#fca5a5', color: '#dc2626' }}>
            ✗ Revogar aprovação
          </button>
        ) : status !== 'rejected' ? (
          <button onClick={() => setShowRejectModal(true)} disabled={isPending}
            className="btn-outline text-sm py-2 px-4 disabled:opacity-50"
            style={{ borderColor: '#fca5a5', color: '#dc2626' }}>
            ✗ Rejeitar
          </button>
        ) : (
          <button onClick={() => setShowRejectModal(true)} disabled={isPending}
            className="btn-outline text-sm py-2 px-4 disabled:opacity-50 text-xs"
            style={{ borderColor: '#fca5a5', color: '#dc2626' }}>
            ✏️ Alterar motivo / Rejeitar novamente
          </button>
        )}
      </div>

      {/* Modal centrado no viewport com position:fixed */}
      {showRejectModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.5)',
            padding: '1rem',
          }}
        >
          <div style={{
            background: '#fff',
            borderRadius: '1rem',
            padding: '1.5rem',
            maxWidth: '400px',
            width: '100%',
            boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
          }}>
            <h3 className="font-display text-lg font-bold text-gray-900 mb-2">
              {status === 'approved' ? 'Revogar aprovação' : 'Rejeitar candidatura'}
            </h3>
            <p className="text-sm text-gray-600 mb-1 font-medium">{app.full_name}</p>
            <p className="text-sm text-gray-500 mb-4">
              Indique o motivo (opcional — para referência interna):
            </p>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              rows={3}
              className="input-field resize-none mb-4"
              placeholder="Ex: Perfil não adequado ao programa..."
            />
            <div className="flex gap-3">
              <button onClick={() => setShowRejectModal(false)}
                className="flex-1 btn-outline text-sm py-2">
                Cancelar
              </button>
              <button onClick={handleReject} disabled={isPending}
                className="flex-1 text-sm py-2 px-4 rounded-xl font-semibold disabled:opacity-50 flex items-center justify-center gap-1"
                style={{ background: '#fee2e2', color: '#b91c1c' }}>
                {isPending ? <><BtnSpinner />A processar…</> : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
