'use client'

// app/reset-password/page.tsx

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserSupabaseClient } from '@/lib/supabase-client'
import AuthLayout from '@/app/components/layout/AuthLayout'
import LoadingOverlay from '@/app/components/ui/LoadingOverlay'
import BtnSpinner from '@/app/components/ui/BtnSpinner'
import { CheckCircle2 } from 'lucide-react'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [ready, setReady] = useState(false)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    const supabase = createBrowserSupabaseClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true)
      if (event === 'SIGNED_IN') setReady(true)
    })
    return () => subscription.unsubscribe()
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password.length < 8) { setError('A palavra-passe deve ter pelo menos 8 caracteres.'); return }
    if (password !== confirm) { setError('As palavras-passe não coincidem.'); return }

    startTransition(async () => {
      const supabase = createBrowserSupabaseClient()
      const { error: updateError } = await supabase.auth.updateUser({ password })
      if (updateError) {
        setError('Erro ao actualizar palavra-passe. O link pode ter expirado. Tente novamente.')
        return
      }
      setSuccess(true)
      setTimeout(() => router.push('/login'), 3000)
    })
  }

  if (success) {
    return (
      <AuthLayout backHref="/login" backLabel="Ir para o login" imageIndex={3}>
        <div className="text-center py-8">
          <div style={{
            width: '64px', height: '64px', borderRadius: '20px',
            background: 'rgba(74,140,63,0.10)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1.5rem',
          }}>
            <CheckCircle2 size={32} style={{ color: 'var(--color-primary)' }} />
          </div>
          <h2 className="font-serif text-2xl font-bold mb-2" style={{ color: 'var(--color-primary-dark)' }}>
            Palavra-passe actualizada!
          </h2>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            A redirecionar para o login...
          </p>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout backHref="/login" backLabel="Voltar ao login" imageIndex={3}>
      {isPending && <LoadingOverlay message="A guardar nova palavra-passe…" />}

      <div>
        <h1 className="font-serif text-3xl font-bold mb-2" style={{ color: 'var(--color-primary-dark)' }}>
          Nova palavra-passe
        </h1>
        <p className="text-sm mb-8" style={{ color: 'var(--color-text-muted)' }}>
          Escolha uma palavra-passe segura com pelo menos 8 caracteres.
        </p>

        {!ready && (
          <div className="rounded-xl p-4 bg-amber-50 border border-amber-200 mb-5">
            <p className="text-sm text-amber-700">
              A verificar o link de recuperação... Se esta mensagem persistir, o link pode ter expirado.{' '}
              <a href="/forgot-password" style={{ color: 'var(--color-primary)' }} className="underline">
                Pedir novo link
              </a>
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="input-label" htmlFor="password">Nova palavra-passe</label>
            <input id="password" type="password" autoComplete="new-password" required minLength={8}
              value={password} onChange={e => setPassword(e.target.value)}
              className="input-field" placeholder="Mínimo 8 caracteres" disabled={isPending} />
          </div>
          <div>
            <label className="input-label" htmlFor="confirm">Confirmar palavra-passe</label>
            <input id="confirm" type="password" autoComplete="new-password" required
              value={confirm} onChange={e => setConfirm(e.target.value)}
              className="input-field" placeholder="Repetir palavra-passe" disabled={isPending} />
          </div>

          {error && (
            <div className="rounded-xl p-3.5 bg-red-50 border border-red-200">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <button type="submit" disabled={isPending || !ready} className="btn-primary w-full text-base">
            {isPending ? <><BtnSpinner />A guardar…</> : 'Guardar nova palavra-passe'}
          </button>
        </form>
      </div>
    </AuthLayout>
  )
}
