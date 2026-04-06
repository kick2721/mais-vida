'use client'

// app/admin/dashboard/AdminApplicationsTable.tsx

import { useState, useTransition, useMemo } from 'react'
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

const EXPIRY_HOURS = 12

function BtnSpinner() {
  return (
    <svg className="animate-spin inline-block mr-1" width="14" height="14" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeOpacity="0.3" strokeWidth="2"/>
      <path d="M14 8A6 6 0 0 0 8 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}

// Devolve quantos minutos/horas faltam até expirar (negativo = já expirou)
function timeUntilExpiry(createdAt: string): { expired: boolean; label: string } {
  const created  = new Date(createdAt).getTime()
  const expireAt = created + EXPIRY_HOURS * 60 * 60 * 1000
  const diffMs   = expireAt - Date.now()
  if (diffMs <= 0) return { expired: true, label: 'Expirada' }
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 60) return { expired: false, label: `${diffMin}m restantes` }
  const diffH = Math.floor(diffMin / 60)
  const rem   = diffMin % 60
  return { expired: false, label: rem > 0 ? `${diffH}h ${rem}m restantes` : `${diffH}h restantes` }
}

export default function AdminApplicationsTable({ applications }: { applications: Application[] }) {
  // Filtrar: pendentes não expiradas + todas as já analisadas (aprovadas/rejeitadas)
  const { active, expired, reviewed } = useMemo(() => {
    const active:   Application[] = []
    const expired:  Application[] = []
    const reviewed: Application[] = []
    for (const a of applications) {
      if (a.status !== 'pending') {
        reviewed.push(a)
      } else {
        const { expired: exp } = timeUntilExpiry(a.created_at)
        if (exp) expired.push(a)
        else active.push(a)
      }
    }
    return { active, expired, reviewed }
  }, [applications])

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-lg font-bold text-gray-900">
          Candidaturas a Afiliado
        </h2>
        {active.length > 0 && (
          <span className="text-sm text-yellow-700 bg-yellow-50 px-3 py-1 rounded-full font-medium border border-yellow-200">
            ⏳ {active.length} pendente{active.length !== 1 ? 's' : ''} — expiram em {EXPIRY_HOURS}h
          </span>
        )}
      </div>

      {/* Banner explicativo */}
      <div className="rounded-2xl p-4 mb-5 border border-blue-100 bg-blue-50">
        <p className="text-sm font-semibold text-blue-800">ℹ️ Como funciona</p>
        <p className="text-xs text-blue-700 mt-1">
          As candidaturas pendentes estão disponíveis para análise durante <strong>{EXPIRY_HOURS} horas</strong> após a submissão.
          Após esse tempo desaparecem automaticamente desta lista. Os afiliados aprovados podem ser activados ou desactivados a qualquer momento no separador <strong>Afiliados</strong>.
        </p>
      </div>

      {/* Pendentes activas */}
      {active.length > 0 && (
        <div className="mb-8">
          <h3 className="font-semibold text-gray-700 text-sm mb-3 uppercase tracking-wide">
            ⏳ Pendentes de análise ({active.length})
          </h3>
          <div className="space-y-4">
            {active.map(app => (
              <ApplicationCard key={app.id} application={app} />
            ))}
          </div>
        </div>
      )}

      {/* Aprovadas / rejeitadas */}
      {reviewed.length > 0 && (
        <div className="mb-6">
          <h3 className="font-semibold text-gray-700 text-sm mb-3 uppercase tracking-wide">
            Já analisadas ({reviewed.length})
          </h3>
          <div className="space-y-3">
            {reviewed.map(app => (
              <ApplicationCard key={app.id} application={app} reviewedOnly />
            ))}
          </div>
        </div>
      )}

      {/* Expiradas (colapsadas) */}
      {expired.length > 0 && (
        <ExpiredSection count={expired.length} apps={expired} />
      )}

      {applications.length === 0 && (
        <div className="card text-center py-10">
          <p className="text-4xl mb-3">📋</p>
          <p className="text-gray-500 text-sm">Ainda não há candidaturas submetidas.</p>
        </div>
      )}

      {active.length === 0 && reviewed.length === 0 && expired.length === 0 && applications.length > 0 && (
        <div className="card text-center py-10">
          <p className="text-4xl mb-3">✅</p>
          <p className="text-gray-500 text-sm">Não há candidaturas pendentes de análise.</p>
        </div>
      )}
    </div>
  )
}

// ─── Secção de expiradas colapsável ──────────────────────────────────────────

function ExpiredSection({ count, apps }: { count: number; apps: Application[] }) {
  const [open, setOpen] = useState(false)
  return (
    <div>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-600 transition-colors mb-3"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
          <polyline points="6 9 12 15 18 9"/>
        </svg>
        {count} candidatura{count !== 1 ? 's' : ''} expirada{count !== 1 ? 's' : ''} (sem acção tomada)
      </button>
      {open && (
        <div className="space-y-3 opacity-60">
          {apps.map(app => (
            <ApplicationCard key={app.id} application={app} expiredView />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Card de candidatura ──────────────────────────────────────────────────────

function ApplicationCard({
  application: app,
  reviewedOnly = false,
  expiredView  = false,
}: {
  application: Application
  reviewedOnly?: boolean
  expiredView?: boolean
}) {
  const [isPending, startTransition]    = useTransition()
  const [status, setStatus]             = useState(app.status)
  const [showRejectModal, setShowModal] = useState(false)
  const [rejectReason, setReason]       = useState(app.reject_reason || '')
  const [actionError, setActionError]   = useState('')

  const { expired, label: timeLabel } = timeUntilExpiry(app.created_at)

  const statusBadge = {
    pending:  { label: '⏳ Pendente', color: '#92400e', bg: '#fef3c7' },
    approved: { label: '✅ Aprovada', color: '#166534', bg: '#dcfce7' },
    rejected: { label: '✗ Rejeitada', color: '#991b1b', bg: '#fee2e2' },
  }[status]

  const handleApprove = () => {
    if (!confirm(`Aprovar candidatura de ${app.full_name}?\n\nIsto irá criar uma conta de afiliado.`)) return
    setActionError('')
    startTransition(async () => {
      const result = await approveApplication(app.id)
      if (result.success) setStatus('approved')
      else setActionError(result.error || 'Erro ao aprovar.')
    })
  }

  const handleReject = () => {
    setActionError('')
    startTransition(async () => {
      const result = await rejectApplication(app.id, rejectReason)
      if (result.success) { setStatus('rejected'); setShowModal(false) }
      else setActionError(result.error || 'Erro ao rejeitar.')
    })
  }

  return (
    <div className="card" style={expiredView ? { borderColor: '#e5e7eb' } : undefined}>

      {/* Cabeçalho */}
      <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <p className="font-semibold text-gray-800">{app.full_name}</p>
            <span className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ background: statusBadge.bg, color: statusBadge.color }}>
              {statusBadge.label}
            </span>
            {status === 'pending' && (
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                expired ? 'bg-gray-100 text-gray-400' : 'bg-orange-50 text-orange-600'
              }`}>
                🕐 {timeLabel}
              </span>
            )}
          </div>
          <div className="flex gap-4 flex-wrap text-xs text-gray-500">
            <span>📞 {app.phone}</span>
            <span>🪪 {app.national_id}</span>
            {app.occupation   && <span>💼 {app.occupation}</span>}
            {app.network_size && <span>👥 {app.network_size}</span>}
            <span>📅 {new Date(app.created_at).toLocaleDateString('pt-AO')}</span>
          </div>
        </div>
      </div>

      {/* Motivação */}
      <div className="rounded-xl p-3 mb-4"
        style={{ background: 'var(--color-surface)', borderLeft: '3px solid var(--color-primary)' }}>
        <p className="text-xs font-semibold text-gray-600 mb-1">Motivação:</p>
        <p className="text-sm text-gray-700 leading-relaxed">{app.motivation}</p>
      </div>

      {/* Redes sociais */}
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

      {/* Motivo de rejeição */}
      {status === 'rejected' && rejectReason && (
        <div className="rounded-xl p-3 mb-4 bg-red-50 border border-red-100">
          <p className="text-xs font-semibold text-red-700 mb-1">Motivo de rejeição:</p>
          <p className="text-sm text-red-600">{rejectReason}</p>
        </div>
      )}

      {/* Erro inline */}
      {actionError && (
        <div className="rounded-xl p-3 mb-3 bg-red-50 border border-red-200">
          <p className="text-sm text-red-700">⚠️ {actionError}</p>
        </div>
      )}

      {/* Botões — só para pendentes não expiradas e não em modo reviewedOnly */}
      {!reviewedOnly && !expiredView && status === 'pending' && !expired && (
        <div className="flex gap-2 pt-3 border-t" style={{ borderColor: 'var(--color-border)' }}>
          <button onClick={handleApprove} disabled={isPending}
            className="btn-primary text-sm py-2 px-5 disabled:opacity-50 flex items-center gap-1">
            {isPending ? <><BtnSpinner />A processar…</> : '✅ Aprovar'}
          </button>
          <button onClick={() => setShowModal(true)} disabled={isPending}
            className="btn-outline text-sm py-2 px-4 disabled:opacity-50"
            style={{ borderColor: '#fca5a5', color: '#dc2626' }}>
            ✗ Rejeitar
          </button>
        </div>
      )}

      {/* Modal de rejeição */}
      {showRejectModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.5)', padding: '1rem',
        }}>
          <div style={{
            background: '#fff', borderRadius: '1rem', padding: '1.5rem',
            maxWidth: '400px', width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
          }}>
            <h3 className="font-display text-lg font-bold text-gray-900 mb-2">Rejeitar candidatura</h3>
            <p className="text-sm text-gray-600 mb-1 font-medium">{app.full_name}</p>
            <p className="text-sm text-gray-500 mb-4">Indique o motivo (opcional):</p>
            <textarea
              value={rejectReason}
              onChange={e => setReason(e.target.value)}
              rows={3}
              className="input-field resize-none mb-4"
              placeholder="Ex: Perfil não adequado ao programa..."
            />
            <div className="flex gap-3">
              <button onClick={() => setShowModal(false)}
                className="flex-1 btn-outline text-sm py-2">Cancelar</button>
              <button onClick={handleReject} disabled={isPending}
                className="flex-1 text-sm py-2 px-4 rounded-xl font-semibold disabled:opacity-50 flex items-center justify-center gap-1"
                style={{ background: '#fee2e2', color: '#b91c1c' }}>
                {isPending ? <><BtnSpinner />A processar…</> : 'Confirmar rejeição'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
