'use client'

// app/forgot-password/page.tsx
// Recuperação de password via Resend (bypass ao limite do Supabase)
// Fluxo: email → Server Action gera token Supabase → Resend envia o link formatado

import { useState, useTransition } from 'react'
import Link from 'next/link'
import Logo from '@/app/components/ui/Logo'
import LoadingOverlay from '@/app/components/ui/LoadingOverlay'
import BtnSpinner from '@/app/components/ui/BtnSpinner'
import { sendPasswordResetEmail } from '@/lib/actions'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Por favor insira um email válido.')
      return
    }

    startTransition(async () => {
      const result = await sendPasswordResetEmail(email)
      if (result.error) {
        setError(result.error)
        return
      }
      setSent(true)
    })
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'rgba(240,247,239,0.6)' }}
    >
      {isPending && <LoadingOverlay message="A enviar link de recuperação…" />}

      <div className="w-full max-w-md">
        <Link href="/login" className="btn-back mb-6 inline-flex">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Voltar ao login
        </Link>

        <div className="flex justify-center mb-8">
          <Logo size="lg" href="/" />
        </div>

        <div className="card">
          {!sent ? (
            <>
              <h2 className="font-display text-xl font-bold text-gray-900 mb-2">
                Recuperar palavra-passe
              </h2>
              <p className="text-gray-500 text-sm mb-6">
                Introduza o seu email e enviaremos um link para redefinir a palavra-passe.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="input-label" htmlFor="email">Email</label>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="input-field"
                    placeholder="o-seu-email@exemplo.com"
                    disabled={isPending}
                  />
                </div>

                {error && (
                  <div className="rounded-xl p-3 bg-red-50 border border-red-200">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}

                <button type="submit" disabled={isPending}
                  className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50">
                  {isPending ? <><BtnSpinner />A enviar…</> : 'Enviar link de recuperação'}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="text-5xl mb-4">📧</div>
              <h2 className="font-display text-xl font-bold text-gray-900 mb-2">Email enviado!</h2>
              <p className="text-gray-500 text-sm mb-2">
                Se o email <strong>{email}</strong> estiver registado, receberá um link para redefinir a palavra-passe.
              </p>
              <p className="text-gray-400 text-xs mb-6">
                Verifique também a pasta de spam. O link expira em 1 hora.
              </p>
              <button
                onClick={() => { setSent(false); setEmail('') }}
                className="btn-outline text-sm"
              >
                Tentar com outro email
              </button>
            </div>
          )}

          <div className="mt-6 pt-4 border-t text-center" style={{ borderColor: 'var(--color-border)' }}>
            <Link href="/login" className="text-sm" style={{ color: 'var(--color-primary)' }}>
              ← Voltar ao login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
