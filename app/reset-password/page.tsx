'use client'

// app/reset-password/page.tsx
// Formulário para definir nova palavra-passe (após clicar no link do email)

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserSupabaseClient } from '@/lib/supabase-client'
import { BUSINESS } from '@/lib/constants'
import Logo from '@/app/components/ui/Logo'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [ready, setReady] = useState(false)
  const [isPending, startTransition] = useTransition()

  // Verificar que há uma sessão válida via hash do URL (Supabase envia token no URL fragment)
  useEffect(() => {
    const supabase = createBrowserSupabaseClient()
    
    // Supabase Auth com PKCE / token no URL — listener detecta automaticamente
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setReady(true)
      }
      if (event === 'SIGNED_IN') {
        // Sessão activa — pode ter vindo do link de reset
        setReady(true)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('A palavra-passe deve ter pelo menos 8 caracteres.')
      return
    }
    if (password !== confirm) {
      setError('As palavras-passe não coincidem.')
      return
    }

    startTransition(async () => {
      const supabase = createBrowserSupabaseClient()
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      })

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
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--color-surface)' }}>
        <div className="w-full max-w-md card text-center py-10">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="font-display text-xl font-bold text-gray-900 mb-2">Palavra-passe actualizada!</h2>
          <p className="text-gray-500 text-sm">A redirecionar para o login...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--color-surface)' }}>
      <div className="w-full max-w-md">
        {/* Logo oficial */}
        <div className="flex justify-center mb-8">
          <Logo size="lg" href="/" />
        </div>

        <div className="card">
          <h2 className="font-display text-xl font-bold text-gray-900 mb-2">
            Definir nova palavra-passe
          </h2>
          <p className="text-gray-500 text-sm mb-6">
            Escolha uma palavra-passe segura com pelo menos 8 caracteres.
          </p>

          {!ready && (
            <div className="rounded-xl p-4 bg-yellow-50 border border-yellow-200 mb-4">
              <p className="text-sm text-yellow-700">
                A verificar o link de recuperação... Se esta mensagem persistir, o link pode ter expirado.{' '}
                <a href="/forgot-password" style={{ color: 'var(--color-primary)' }} className="underline">
                  Pedir novo link
                </a>
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="input-label" htmlFor="password">Nova palavra-passe</label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="input-field"
                placeholder="Mínimo 8 caracteres"
                disabled={isPending}
              />
            </div>

            <div>
              <label className="input-label" htmlFor="confirm">Confirmar palavra-passe</label>
              <input
                id="confirm"
                type="password"
                autoComplete="new-password"
                required
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                className="input-field"
                placeholder="Repetir palavra-passe"
                disabled={isPending}
              />
            </div>

            {error && (
              <div className="rounded-xl p-3 bg-red-50 border border-red-200">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isPending || !ready}
              className="btn-primary w-full disabled:opacity-50"
            >
              {isPending ? 'A actualizar...' : 'Guardar nova palavra-passe'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
