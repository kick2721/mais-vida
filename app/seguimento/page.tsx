'use client'

// app/seguimento/page.tsx
// Seguimento de pedido do cliente — sem conta, sem password
// Identifica o pedido pelo email + BI/Passaporte usados na compra

import { useState, useTransition } from 'react'
import Link from 'next/link'
import Logo from '@/app/components/ui/Logo'
import BtnSpinner from '@/app/components/ui/BtnSpinner'
import LoadingOverlay from '@/app/components/ui/LoadingOverlay'
import { createBrowserSupabaseClient } from '@/lib/supabase-client'
import { BUSINESS } from '@/lib/constants'

interface SaleResult {
  customer_name: string
  customer_phone: string
  amount: number
  currency: string
  status: string
  created_at: string
  confirmed_at: string | null
}

const STATUS_CONFIG: Record<string, { icon: string; label: string; description: string; color: string; bg: string; border: string }> = {
  pending_review: {
    icon: '⏳',
    label: 'Em verificação',
    description: 'Recebemos o seu pedido e o comprovativo de pagamento. A nossa equipa está a verificar o pagamento.',
    color: '#92400e', bg: '#fef9c3', border: '#fde68a',
  },
  confirmed: {
    icon: '✅',
    label: 'Confirmado!',
    description: 'O pagamento foi confirmado. O seu cartão está a ser processado e será enviado por WhatsApp em breve.',
    color: '#166534', bg: '#dcfce7', border: '#86efac',
  },
  cancelled: {
    icon: '✗',
    label: 'Cancelado',
    description: 'O pedido foi cancelado. Para mais informações, contacte-nos pelo WhatsApp.',
    color: '#991b1b', bg: '#fee2e2', border: '#fca5a5',
  },
}

export default function SeguimentoPage() {
  const [email, setEmail]             = useState('')
  const [nationalId, setNationalId]   = useState('')
  const [results, setResults]         = useState<SaleResult[] | null>(null)
  const [notFound, setNotFound]       = useState(false)
  const [error, setError]             = useState('')
  const [isPending, startTransition]  = useTransition()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setNotFound(false)
    setResults(null)

    if (!email.trim() || !nationalId.trim()) {
      setError('Por favor preencha o email e o BI / Passaporte.')
      return
    }

    startTransition(async () => {
      const supabase = createBrowserSupabaseClient()

      const { data, error: dbError } = await supabase
        .from('sales')
        .select('customer_name, customer_phone, amount, currency, status, created_at, confirmed_at')
        .eq('customer_email', email.trim().toLowerCase())
        .eq('national_id', nationalId.trim().toUpperCase())
        .order('created_at', { ascending: false })

      if (dbError) {
        setError('Erro ao consultar. Tente novamente.')
        return
      }

      if (!data || data.length === 0) {
        setNotFound(true)
        return
      }

      setResults(data as SaleResult[])
    })
  }

  return (
    <div className="min-h-screen px-4 py-10" style={{ background: 'rgba(240,247,239,0.6)' }}>

      {isPending && <LoadingOverlay message="A consultar pedido…" />}

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
            <span className="text-lg">📦</span>
            <span className="text-xs font-bold uppercase tracking-widest"
              style={{ color: 'var(--color-primary)' }}>
              Estado do Pedido
            </span>
          </div>
          <h1 className="font-display text-2xl font-bold text-gray-900 mb-2">
            Seguimento do meu pedido
          </h1>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            Introduza o email e o BI / Passaporte que usou ao fazer o pedido.
          </p>
        </div>

        {/* Formulário de consulta */}
        {!results && (
          <div className="card">
            <form onSubmit={handleSearch} className="space-y-4">

              <div>
                <label className="input-label" htmlFor="email">Email do pedido</label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="input-field"
                  placeholder="joao@exemplo.com"
                  disabled={isPending}
                />
              </div>

              <div>
                <label className="input-label" htmlFor="national_id">Nº do BI ou Passaporte</label>
                <input
                  id="national_id"
                  type="text"
                  required
                  value={nationalId}
                  onChange={e => setNationalId(e.target.value)}
                  className="input-field font-mono"
                  placeholder="Ex: 005847291AN014"
                  disabled={isPending}
                  autoComplete="off"
                />
                <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                  Use os mesmos dados que introduziu ao comprar o cartão.
                </p>
              </div>

              {error && (
                <div className="rounded-xl p-3 bg-red-50 border border-red-200">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {notFound && (
                <div className="rounded-xl p-3 bg-yellow-50 border border-yellow-200">
                  <p className="text-sm text-yellow-800 font-medium mb-1">Pedido não encontrado</p>
                  <p className="text-xs text-yellow-700">
                    Verifique se o email e BI / Passaporte são os mesmos que usou ao fazer o pedido.
                    Se precisar de ajuda contacte-nos pelo{' '}
                    <a href={`https://wa.me/${BUSINESS.phone.whatsapp}`}
                      className="underline font-medium">WhatsApp</a>.
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={isPending}
                className="btn-primary w-full disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isPending ? <><BtnSpinner />A consultar…</> : 'Ver estado do pedido →'}
              </button>
            </form>
          </div>
        )}

        {/* Resultados */}
        {results && (
          <div className="space-y-4">

            <p className="text-xs font-bold uppercase tracking-widest text-center"
              style={{ color: 'var(--color-primary)' }}>
              {results.length} cartão{results.length > 1 ? 'ões' : ''} encontrado{results.length > 1 ? 's' : ''}
            </p>

            {results.map((sale, i) => {
              const cfg = STATUS_CONFIG[sale.status] || STATUS_CONFIG['pending_review']
              return (
                <div key={i} className="card border-2" style={{ borderColor: cfg.border }}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="text-3xl">{cfg.icon}</div>
                    <div>
                      <p className="font-semibold text-gray-900">{sale.customer_name}</p>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: cfg.bg, color: cfg.color }}>
                        {cfg.label}
                      </span>
                    </div>
                  </div>

                  <p className="text-sm leading-relaxed mb-4"
                    style={{ color: cfg.color, background: cfg.bg, borderRadius: '0.75rem', padding: '0.75rem' }}>
                    {cfg.description}
                  </p>

                  <div className="space-y-2 text-sm border-t pt-3" style={{ borderColor: 'var(--color-border)' }}>
                    <div className="flex justify-between">
                      <span style={{ color: 'var(--color-text-muted)' }}>Montante</span>
                      <span className="font-semibold">{sale.amount.toLocaleString('pt-AO')} {sale.currency}</span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: 'var(--color-text-muted)' }}>Pedido em</span>
                      <span className="font-medium">
                        {new Date(sale.created_at).toLocaleDateString('pt-AO', {
                          day: '2-digit', month: 'long', year: 'numeric'
                        })}
                      </span>
                    </div>
                    {sale.confirmed_at && (
                      <div className="flex justify-between">
                        <span style={{ color: 'var(--color-text-muted)' }}>Confirmado em</span>
                        <span className="font-medium">
                          {new Date(sale.confirmed_at).toLocaleDateString('pt-AO', {
                            day: '2-digit', month: 'long', year: 'numeric'
                          })}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}

            <button
              onClick={() => { setResults(null); setEmail(''); setNationalId('') }}
              className="btn-outline w-full text-sm"
            >
              ← Nova consulta
            </button>

            <p className="text-xs text-center" style={{ color: 'var(--color-text-muted)' }}>
              Dúvidas? Fale connosco pelo{' '}
              <a href={`https://wa.me/${BUSINESS.phone.whatsapp}`}
                style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
                WhatsApp
              </a>
            </p>
          </div>
        )}

      </div>
    </div>
  )
}
