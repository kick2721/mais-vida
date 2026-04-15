'use client'

// app/login/page.tsx

import { useState, useTransition, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createBrowserSupabaseClient } from '@/lib/supabase-client'
import { resolveLoginIdentifier } from '@/lib/actions'
import AuthLayout from '@/app/components/layout/AuthLayout'
import LoadingOverlay from '@/app/components/ui/LoadingOverlay'
import BtnSpinner from '@/app/components/ui/BtnSpinner'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword]     = useState('')
  const [error, setError]           = useState(
    searchParams.get('erro') === 'conta-inactiva'
      ? 'A sua conta de afiliado está desactivada. Contacte a clínica para mais informações.'
      : ''
  )
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!identifier.trim()) { setError('Por favor introduza o seu telefone, BI ou email.'); return }
    if (!password)           { setError('Por favor introduza a sua palavra-passe.'); return }

    startTransition(async () => {
      const resolved = await resolveLoginIdentifier(identifier.trim())
      if (resolved.error || !resolved.email) {
        setError(resolved.error || 'Conta não encontrada.')
        return
      }

      const supabase = createBrowserSupabaseClient()
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: resolved.email,
        password,
      })
      if (authError) {
        setError('Palavra-passe incorrecta. Verifique e tente novamente.')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single()

      if (profile?.role === 'admin') {
        router.push('/admin/dashboard')
      } else if (profile?.role === 'receptionist') {
        router.push('/recepcao')
      } else if (profile?.role === 'affiliate') {
        const { data: affiliate } = await supabase
          .from('affiliates')
          .select('is_active')
          .eq('profile_id', data.user.id)
          .single()
        if (!affiliate?.is_active) {
          await supabase.auth.signOut()
          setError('A sua conta de afiliado está desactivada. Contacte a clínica para mais informações.')
          return
        }
        router.push('/affiliate/dashboard')
      } else {
        router.push('/dashboard')
      }
    })
  }

  return (
    <AuthLayout backHref="/" backLabel="Voltar ao início" imageIndex={0}>
      {isPending && <LoadingOverlay message="A verificar credenciais…" />}

      <div>
        <h1 className="font-serif text-3xl font-bold mb-2" style={{ color: 'var(--color-primary-dark)' }}>
          Bem-vindo de volta
        </h1>
        <p className="text-sm mb-8" style={{ color: 'var(--color-text-muted)' }}>
          Aceda à sua área pessoal de cliente ou afiliado.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
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
            <p className="text-xs mt-1.5" style={{ color: 'var(--color-text-muted)' }}>
              Pode usar qualquer um dos três.
            </p>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="input-label mb-0" htmlFor="password">Palavra-passe</label>
              <Link href="/forgot-password" className="text-xs" style={{ color: 'var(--color-primary)' }}>
                Esqueci a palavra-passe
              </Link>
            </div>
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

          {error && (
            <div className="rounded-xl p-3.5 bg-red-50 border border-red-200">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <button type="submit" disabled={isPending} className="btn-primary w-full text-base">
            {isPending ? <><BtnSpinner />A entrar…</> : 'Entrar na conta'}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t text-center" style={{ borderColor: 'var(--color-border)' }}>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            Quer ser afiliado?{' '}
            <Link href="/afiliado-candidatura" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
              Submeter candidatura →
            </Link>
          </p>
        </div>
      </div>
    </AuthLayout>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
