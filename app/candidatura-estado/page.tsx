'use client'

// app/candidatura-estado/page.tsx
// Página pública para o candidato consultar o estado da sua candidatura a afiliado

import { useState, useTransition } from 'react'
import Link from 'next/link'
import Logo from '@/app/components/ui/Logo'
import { createBrowserSupabaseClient } from '@/lib/supabase-client'

interface ApplicationResult {
  full_name: string
  phone: string
  status: 'pending' | 'approved' | 'rejected'
  reject_reason: string | null
  created_at: string
}

// Normaliza o telefone: remove espaços, traços e parênteses para comparação
function normalizePhone(value: string) {
  return value.replace(/[\s\-().]/g, '').toLowerCase()
}

// Normaliza o BI: remove espaços e converte para maiúsculas
function normalizeId(value: string) {
  return value.replace(/\s/g, '').toUpperCase()
}

export default function CandidaturaEstadoPage() {
  const [phone, setPhone] = useState('')
  const [nationalId, setNationalId] = useState('')
  const [result, setResult] = useState<ApplicationResult | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setNotFound(false)
    setResult(null)

    if (!phone.trim() || !nationalId.trim()) {
      setError('Por favor preencha o telefone e o número do BI.')
      return
    }

    startTransition(async () => {
      const supabase = createBrowserSupabaseClient()

      // Busca por BI (ilike = case-insensitive), sem .single() para não dar erro se não encontrar
      const { data, error: dbError } = await supabase
        .from('affiliate_applications')
        .select('full_name, phone, status, reject_reason, created_at, national_id')
        .ilike('national_id', normalizeId(nationalId.trim()))
        .order('created_at', { ascending: false })

      if (dbError) {
        setError('Erro ao consultar. Tente novamente.')
        return
      }

      if (!data || data.length === 0) {
        setNotFound(true)
        return
      }

      // Filtra localmente pelo telefone normalizado (ignora espaços/traços)
      const phoneNorm = normalizePhone(phone.trim())
      const match = data.find(
        (row) => normalizePhone(row.phone) === phoneNorm
      )

      if (!match) {
        setNotFound(true)
        return
      }

      setResult(match as ApplicationResult)
    })
  }

  const statusConfig = {
    pending: {
      icon: '⏳',
      label: 'Em análise',
      description: 'A sua candidatura foi recebida e está a ser analisada pela nossa equipa. Entraremos em contacto pelo WhatsApp em breve.',
      color: '#92400e',
      bg: '#fef9c3',
      border: '#fde68a',
    },
    approved: {
      icon: '✅',
      label: 'Aprovada!',
      description: 'Parabéns! A sua candidatura foi aprovada. A nossa equipa irá entrar em contacto pelo WhatsApp para lhe enviar as credenciais de acesso ao painel de afiliado.',
      color: '#166534',
      bg: '#dcfce7',
      border: '#86efac',
    },
    rejected: {
      icon: '✗',
      label: 'Não aprovada',
      description: 'Após análise, a sua candidatura não foi aprovada neste momento. Pode candidatar-se novamente mais tarde.',
      color: '#991b1b',
      bg: '#fee2e2',
      border: '#fca5a5',
    },
  }

  return (
    <div className="min-h-screen px-4 py-10" style={{ background: 'rgba(240,247,239,0.6)' }}>
      <div className="w-full max-w-md mx-auto">

        <Link href="/" className="btn-back mb-6 inline-flex">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Voltar ao início
        </Link>

        <div className="flex justify-center mb-8">
          <Logo size="lg" href="/" />
        </div>

        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-3"
            style={{ background: 'rgba(22,101,52,0.08)' }}>
            <span className="text-lg">🔍</span>
            <span className="text-xs font-bold uppercase tracking-widest"
              style={{ color: 'var(--color-primary)' }}>
              Estado da Candidatura
            </span>
          </div>
          <h1 className="font-display text-2xl font-bold text-gray-900 mb-2">
            Consultar a minha candidatura
          </h1>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            Introduza os mesmos dados que usou ao candidatar-se.
          </p>
        </div>

        {!result && (
          <div className="card">
            <form onSubmit={handleSearch} className="space-y-4">
              <div>
                <label className="input-label">
                  Telefone / WhatsApp <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="input-field"
                  placeholder="+244 9XX XXX XXX"
                  disabled={isPending}
                />
                <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                  Com ou sem espaços — ex: +244923456789 ou +244 923 456 789
                </p>
              </div>
              <div>
                <label className="input-label">
                  Nº do BI ou Passaporte <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={nationalId}
                  onChange={e => setNationalId(e.target.value)}
                  className="input-field"
                  placeholder="Ex: 005847291AN014"
                  disabled={isPending}
                  autoComplete="off"
                />
              </div>

              {error && (
                <div className="rounded-xl p-3 bg-red-50 border border-red-200">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {notFound && (
                <div className="rounded-xl p-3 bg-yellow-50 border border-yellow-200">
                  <p className="text-sm text-yellow-800 font-medium mb-1">Candidatura não encontrada</p>
                  <p className="text-xs text-yellow-700">
                    Verifique se o telefone e o BI são exactamente os que usou ao preencher o formulário.
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={isPending}
                className="btn-primary w-full"
              >
                {isPending ? 'A pesquisar...' : 'Consultar estado →'}
              </button>
            </form>
          </div>
        )}

        {result && (() => {
          const cfg = statusConfig[result.status]
          return (
            <div className="space-y-4">
              <div
                className="card border-2"
                style={{ borderColor: cfg.border, background: cfg.bg }}
              >
                <div className="text-center mb-4">
                  <div className="text-5xl mb-3">{cfg.icon}</div>
                  <h2 className="font-display text-xl font-bold mb-1" style={{ color: cfg.color }}>
                    {cfg.label}
                  </h2>
                  <p className="text-sm leading-relaxed" style={{ color: cfg.color, opacity: 0.85 }}>
                    {cfg.description}
                  </p>
                </div>

                {result.status === 'rejected' && result.reject_reason && (
                  <div className="rounded-xl p-3 bg-red-50 border border-red-200 mt-3">
                    <p className="text-xs font-semibold text-red-700 mb-1">Observação:</p>
                    <p className="text-sm text-red-600">{result.reject_reason}</p>
                  </div>
                )}
              </div>

              <div className="card">
                <p className="text-xs font-bold uppercase tracking-widest mb-3"
                  style={{ color: 'var(--color-primary)' }}>
                  Dados da candidatura
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between gap-4">
                    <span style={{ color: 'var(--color-text-muted)' }}>Nome</span>
                    <span className="font-medium text-right">{result.full_name}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span style={{ color: 'var(--color-text-muted)' }}>Telefone</span>
                    <span className="font-medium">{result.phone}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span style={{ color: 'var(--color-text-muted)' }}>Submetida em</span>
                    <span className="font-medium">
                      {new Date(result.created_at).toLocaleDateString('pt-AO', {
                        day: '2-digit', month: 'long', year: 'numeric'
                      })}
                    </span>
                  </div>
                </div>
              </div>

              {result.status === 'approved' && (
                <Link href="/login" className="btn-primary w-full text-center block">
                  Entrar no painel de afiliado →
                </Link>
              )}

              <button
                onClick={() => { setResult(null); setPhone(''); setNationalId('') }}
                className="btn-outline w-full text-sm"
              >
                ← Nova pesquisa
              </button>
            </div>
          )
        })()}

        {!result && (
          <div className="mt-6 text-center space-y-2">
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              Ainda não se candidatou?{' '}
              <Link href="/afiliado-candidatura" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
                Candidatar-me agora →
              </Link>
            </p>
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              Já foi aprovado?{' '}
              <Link href="/login" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
                Entrar no painel →
              </Link>
            </p>
          </div>
        )}

      </div>
    </div>
  )
}
