'use client'

// app/login/page.tsx
// Login flexível: telefone, BI/Passaporte ou email — todos funcionam

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createBrowserSupabaseClient } from '@/lib/supabase-client'
import { resolveLoginIdentifier } from '@/lib/actions'
import Logo from '@/app/components/ui/Logo'
import LoadingOverlay from '@/app/components/ui/LoadingOverlay'
import BtnSpinner from '@/app/components/ui/BtnSpinner'

export default function LoginPage() {
  const router = useRouter()
  const [identifier, setIdentifier] = useState('')   // telefone, BI ou email
  const [password, setPassword]     = useState('')
  const [error, setError]           = useState('')
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!identifier.trim()) { setError('Por favor introduza o seu telefone, BI ou email.'); return }
    if (!password)           { setError('Por favor introduza a sua palavra-passe.'); return }

    startTransition(async () => {
      // Passo 1 — resolver o email a partir do identificador
      const resolved = await resolveLoginIdentifier(identifier.trim())

      if (resolved.error || !resolved.email) {
        setError(resolved.error || 'Conta não encontrada.')
        return
      }

      // Passo 2 — fazer login com o email encontrado
      const supabase = createBrowserSupabaseClient()
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: resolved.email,
        password,
      })

      if (authError) {
        setError('Palavra-passe incorrecta. Verifique e tente novamente.')
        return
      }

      // Passo 3 — redirecionar conforme role
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single()

      if (profile?.role === 'admin')          router.push('/admin/dashboard')
      else if (profile?.role === 'affiliate') router.push('/affiliate/dashboard')
      else                                    router.push('/dashboard')
    })
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'rgba(240,247,239,0.6)' }}
    >
      {isPending && <LoadingOverlay message="A verificar credenciais…" />}

      <div className="w-full max-w-md">

        <Link href="/" className="btn-back mb-6 inline-flex">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Voltar ao início
        </Link>

        <div className="flex justify-center mb-8">
          <Logo size="lg" href="/" />
        </div>

        <div className="card">
          <h2 className="font-display text-xl font-bold text-gray-900 mb-1">
            Entrar na conta
          </h2>
          <p className="text-sm mb-6" style={{ color: 'var(--color-text-muted)' }}>
            Aceda à sua área pessoal de cliente ou afiliado.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Identificador flexível */}
            <div>
              <label className="input-label" htmlFor="identifier">
                Telefone, BI / Passaporte ou Email
              </label>
              <input
                id="identifier"
                type="text"
                autoComplete="username"
                required
                value={identifier}
                onChange={e => setIdentifier(e.target.value)}
                className="input-field"
                placeholder="9XX XXX XXX · 005847…AN014 · email@…"
                disabled={isPending}
              />
              <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                Pode usar qualquer um dos três.
              </p>
            </div>

            {/* Palavra-passe */}
            <div>
              <label className="input-label" htmlFor="password">Palavra-passe</label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="input-field"
                placeholder="••••••••"
                disabled={isPending}
              />
            </div>

            <div className="text-right">
              <Link
                href="/forgot-password"
                className="text-xs hover:opacity-70"
                style={{ color: 'var(--color-primary)' }}
              >
                Esqueci a palavra-passe
              </Link>
            </div>

            {error && (
              <div className="rounded-xl p-3 bg-red-50 border border-red-200">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="btn-primary w-full disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isPending ? <><BtnSpinner />A entrar…</> : 'Entrar'}
            </button>
          </form>

          <div
            className="mt-6 pt-4 border-t text-center"
            style={{ borderColor: 'var(--color-border)' }}
          >
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              Quer ser afiliado?{' '}
              <Link href="/afiliado-candidatura" style={{ color: 'var(--color-primary)' }}>
                Submeter candidatura
              </Link>
            </p>
          </div>
        </div>

      </div>
    </div>
  )
}
