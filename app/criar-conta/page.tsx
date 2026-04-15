'use client'

// app/criar-conta/page.tsx

import { useState, useTransition, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import AuthLayout from '@/app/components/layout/AuthLayout'
import BtnSpinner from '@/app/components/ui/BtnSpinner'
import LoadingOverlay from '@/app/components/ui/LoadingOverlay'
import { resolveLoginIdentifier } from '@/lib/actions'
import { createBrowserSupabaseClient } from '@/lib/supabase-client'
import { Eye, EyeOff } from 'lucide-react'

function CriarContaForm() {
  const router       = useRouter()
  const searchParams = useSearchParams()

  const [identifier, setIdentifier] = useState(decodeURIComponent(searchParams.get('id') || ''))
  const [password, setPassword]         = useState('')
  const [confirmPassword, setConfirm]   = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError]               = useState('')
  const [isPending, startTransition]    = useTransition()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!identifier.trim()) { setError('Por favor introduza o seu telefone, BI ou email.'); return }
    if (!password) { setError('Por favor crie uma palavra-passe.'); return }
    if (password.length < 6) { setError('A palavra-passe deve ter no mínimo 6 caracteres.'); return }
    if (password !== confirmPassword) { setError('As palavras-passe não coincidem.'); return }

    startTransition(async () => {
      const resolved = await resolveLoginIdentifier(identifier.trim())
      if (resolved.error || !resolved.email) {
        setError(resolved.error || 'Não encontrámos nenhuma conta aprovada com esses dados.')
        return
      }

      const res = await fetch('/api/affiliate/set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: identifier.trim(), email: resolved.email, newPassword: password }),
      })
      const data = await res.json()
      if (!res.ok || data.error) {
        setError(data.error || 'Erro ao definir palavra-passe. Tente novamente.')
        return
      }

      const supabase = createBrowserSupabaseClient()
      const { error: loginError } = await supabase.auth.signInWithPassword({ email: resolved.email, password })
      if (loginError) {
        setError('Palavra-passe definida! Mas houve um erro no login automático. Por favor entre em /login.')
        return
      }
      router.push('/affiliate/dashboard')
    })
  }

  return (
    <AuthLayout backHref="/candidatura-estado" backLabel="Voltar ao estado da candidatura" imageIndex={2}>
      {isPending && <LoadingOverlay message="A configurar a sua conta…" />}

      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-5" style={{ background: 'rgba(74,140,63,0.10)' }}>
          <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--color-primary)' }}>
            🔑 Criar conta de afiliado
          </span>
        </div>

        <h1 className="font-serif text-3xl font-bold mb-2" style={{ color: 'var(--color-primary-dark)' }}>
          Defina a sua palavra-passe
        </h1>
        <p className="text-sm mb-8" style={{ color: 'var(--color-text-muted)' }}>
          A sua candidatura foi aprovada! Crie agora a palavra-passe para aceder ao painel de afiliado.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="input-label" htmlFor="identifier">Telefone, BI / Passaporte ou Email</label>
            <input
              id="identifier" type="text" required
              value={identifier} onChange={e => setIdentifier(e.target.value)}
              className="input-field" placeholder="9XX XXX XXX · 005847…AN014 · email@…"
              disabled={isPending} autoComplete="username"
            />
            <p className="text-xs mt-1.5" style={{ color: 'var(--color-text-muted)' }}>
              Os mesmos dados que usou na candidatura.
            </p>
          </div>

          <div>
            <label className="input-label" htmlFor="password">Nova palavra-passe</label>
            <div className="relative">
              <input
                id="password" type={showPassword ? 'text' : 'password'} required
                value={password} onChange={e => setPassword(e.target.value)}
                className="input-field pr-12" placeholder="Mínimo 6 caracteres"
                disabled={isPending} autoComplete="new-password"
              />
              <button type="button" onClick={() => setShowPassword(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: 'var(--color-text-muted)' }}>
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </div>

          <div>
            <label className="input-label" htmlFor="confirm">Confirmar palavra-passe</label>
            <input
              id="confirm" type={showPassword ? 'text' : 'password'} required
              value={confirmPassword} onChange={e => setConfirm(e.target.value)}
              className="input-field" placeholder="Repita a palavra-passe"
              disabled={isPending} autoComplete="new-password"
            />
          </div>

          {error && (
            <div className="rounded-xl p-3.5 bg-red-50 border border-red-200">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <button type="submit" disabled={isPending} className="btn-primary w-full text-base">
            {isPending ? <><BtnSpinner />A configurar conta…</> : 'Confirmar e entrar no painel →'}
          </button>

          <p className="text-xs text-center" style={{ color: 'var(--color-text-muted)' }}>
            Já tem palavra-passe?{' '}
            <Link href="/login" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>Entrar →</Link>
          </p>
        </form>
      </div>
    </AuthLayout>
  )
}

export default function CriarContaPage() {
  return <Suspense fallback={null}><CriarContaForm /></Suspense>
}
