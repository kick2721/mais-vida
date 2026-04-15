'use client'

// app/forgot-password/page.tsx

import { useState, useTransition } from 'react'
import Link from 'next/link'
import AuthLayout from '@/app/components/layout/AuthLayout'
import LoadingOverlay from '@/app/components/ui/LoadingOverlay'
import BtnSpinner from '@/app/components/ui/BtnSpinner'
import { sendPasswordResetEmail } from '@/lib/actions'
import { Mail } from 'lucide-react'

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
      if (result.error) { setError(result.error); return }
      setSent(true)
    })
  }

  return (
    <AuthLayout backHref="/login" backLabel="Voltar ao login" imageIndex={1}>
      {isPending && <LoadingOverlay message="A enviar link de recuperação…" />}

      {!sent ? (
        <div>
          <h1 className="font-serif text-3xl font-bold mb-2" style={{ color: 'var(--color-primary-dark)' }}>
            Recuperar palavra-passe
          </h1>
          <p className="text-sm mb-8" style={{ color: 'var(--color-text-muted)' }}>
            Introduza o seu email e enviaremos um link para redefinir a palavra-passe.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="input-label" htmlFor="email">Email</label>
              <input
                id="email" type="email" autoComplete="email" required
                value={email} onChange={e => setEmail(e.target.value)}
                className="input-field" placeholder="o-seu-email@exemplo.com"
                disabled={isPending}
              />
            </div>

            {error && (
              <div className="rounded-xl p-3.5 bg-red-50 border border-red-200">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <button type="submit" disabled={isPending} className="btn-primary w-full text-base">
              {isPending ? <><BtnSpinner />A enviar…</> : 'Enviar link de recuperação'}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t text-center" style={{ borderColor: 'var(--color-border)' }}>
            <Link href="/login" className="text-sm" style={{ color: 'var(--color-primary)' }}>
              ← Voltar ao login
            </Link>
          </div>
        </div>
      ) : (
        <div className="text-center py-4">
          <div style={{
            width: '64px', height: '64px', borderRadius: '20px',
            background: 'rgba(74,140,63,0.10)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1.5rem',
          }}>
            <Mail size={28} style={{ color: 'var(--color-primary)' }} />
          </div>
          <h2 className="font-serif text-2xl font-bold mb-2" style={{ color: 'var(--color-primary-dark)' }}>Email enviado!</h2>
          <p className="text-sm mb-2" style={{ color: 'var(--color-text-muted)' }}>
            Se o email <strong>{email}</strong> estiver registado, receberá um link para redefinir a palavra-passe.
          </p>
          <p className="text-xs mb-8" style={{ color: 'var(--color-text-muted)' }}>
            Verifique também a pasta de spam. O link expira em 1 hora.
          </p>
          <button onClick={() => { setSent(false); setEmail('') }} className="btn-outline text-sm">
            Tentar com outro email
          </button>
        </div>
      )}
    </AuthLayout>
  )
}
