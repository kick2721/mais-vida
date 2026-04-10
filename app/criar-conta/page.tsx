'use client'

// app/criar-conta/page.tsx
// Página para afiliados aprovados criarem a sua palavra-passe
// Acedida a partir de /candidatura-estado quando a candidatura está aprovada

import { useState, useTransition, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import Logo from '@/app/components/ui/Logo'
import BtnSpinner from '@/app/components/ui/BtnSpinner'
import LoadingOverlay from '@/app/components/ui/LoadingOverlay'
import { resolveLoginIdentifier } from '@/lib/actions'
import { createBrowserSupabaseClient } from '@/lib/supabase-client'

function CriarContaForm() {
  const router       = useRouter()
  const searchParams = useSearchParams()

  // Pré-preencher identifier se vier de /candidatura-estado
  const [identifier, setIdentifier] = useState(
    decodeURIComponent(searchParams.get('id') || '')
  )
  const [password, setPassword]         = useState('')
  const [confirmPassword, setConfirm]   = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError]               = useState('')
  const [isPending, startTransition]    = useTransition()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!identifier.trim()) {
      setError('Por favor introduza o seu telefone, BI ou email.')
      return
    }
    if (!password) {
      setError('Por favor crie uma palavra-passe.')
      return
    }
    if (password.length < 6) {
      setError('A palavra-passe deve ter no mínimo 6 caracteres.')
      return
    }
    if (password !== confirmPassword) {
      setError('As palavras-passe não coincidem.')
      return
    }

    startTransition(async () => {
      // 1. Resolver o email a partir do identificador
      const resolved = await resolveLoginIdentifier(identifier.trim())

      if (resolved.error || !resolved.email) {
        setError(
          resolved.error ||
          'Não encontrámos nenhuma conta aprovada com esses dados. Verifique o telefone, BI ou email.'
        )
        return
      }

      // 2. Fazer login com a password temporária interna não é possível
      //    — usamos updateUser via sessão após signIn com a password temp
      //    Mas como não temos a password temp, usamos o fluxo de admin:
      //    fazemos signIn e se falhar é porque a conta não existe ainda
      //    A solução correcta: fazer signIn e depois updateUser
      //
      //    Como a password temp é aleatória e o afiliado nunca a viu,
      //    usamos a Admin API via Server Action para fazer o update directo.
      const res = await fetch('/api/affiliate/set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: identifier.trim(),
          email: resolved.email,
          newPassword: password,
        }),
      })

      const data = await res.json()

      if (!res.ok || data.error) {
        setError(data.error || 'Erro ao definir palavra-passe. Tente novamente.')
        return
      }

      // 3. Login automático com a nova password
      const supabase = createBrowserSupabaseClient()
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: resolved.email,
        password,
      })

      if (loginError) {
        setError('Palavra-passe definida! Mas houve um erro no login automático. Por favor entre em /login.')
        return
      }

      router.push('/affiliate/dashboard')
    })
  }

  return (
    <div className="min-h-screen px-4 py-10" style={{ background: 'rgba(240,247,239,0.6)' }}>

      {isPending && <LoadingOverlay message="A configurar a sua conta…" />}

      <div className="w-full max-w-md mx-auto">

        <Link href="/candidatura-estado" className="btn-back mb-6 inline-flex">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Voltar ao estado da candidatura
        </Link>

        <div className="flex justify-center mb-8">
          <Logo size="lg" href="/" />
        </div>

        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-3"
            style={{ background: 'rgba(139,26,26,0.08)' }}>
            <span className="text-lg">🔑</span>
            <span className="text-xs font-bold uppercase tracking-widest"
              style={{ color: 'var(--color-accent)' }}>
              Criar conta de afiliado
            </span>
          </div>
          <h1 className="font-display text-2xl font-bold text-gray-900 mb-2">
            Defina a sua palavra-passe
          </h1>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            A sua candidatura foi aprovada. Crie agora a palavra-passe para aceder ao seu painel de afiliado.
          </p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-5">

            <div>
              <label className="input-label" htmlFor="identifier">
                Telefone, BI / Passaporte ou Email <span className="text-red-500">*</span>
              </label>
              <input
                id="identifier"
                type="text"
                required
                value={identifier}
                onChange={e => setIdentifier(e.target.value)}
                className="input-field"
                placeholder="9XX XXX XXX · 005847…AN014 · email@…"
                disabled={isPending}
                autoComplete="username"
              />
              <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                Os mesmos dados que usou na candidatura.
              </p>
            </div>

            <div>
              <label className="input-label" htmlFor="password">
                Nova palavra-passe <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="input-field pr-12"
                  placeholder="Mínimo 6 caracteres"
                  disabled={isPending}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  {showPassword ? 'Ocultar' : 'Mostrar'}
                </button>
              </div>
            </div>

            <div>
              <label className="input-label" htmlFor="confirm">
                Confirmar palavra-passe <span className="text-red-500">*</span>
              </label>
              <input
                id="confirm"
                type={showPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={e => setConfirm(e.target.value)}
                className="input-field"
                placeholder="Repita a palavra-passe"
                disabled={isPending}
                autoComplete="new-password"
              />
            </div>

            {error && (
              <div className="rounded-xl p-3 bg-red-50 border border-red-200">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isPending
                ? <><BtnSpinner />A configurar conta…</>
                : 'Confirmar e entrar no painel →'
              }
            </button>

            <p className="text-xs text-center" style={{ color: 'var(--color-text-muted)' }}>
              Já tem palavra-passe?{' '}
              <Link href="/login" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
                Entrar →
              </Link>
            </p>

          </form>
        </div>

      </div>
    </div>
  )
}

export default function CriarContaPage() {
  return (
    <Suspense fallback={null}>
      <CriarContaForm />
    </Suspense>
  )
}
