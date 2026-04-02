'use client'

// app/login/page.tsx
// Página de login — logo oficial + autenticação Supabase

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createBrowserSupabaseClient } from '@/lib/supabase-client'
import Logo from '@/app/components/ui/Logo'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    startTransition(async () => {
      const supabase = createBrowserSupabaseClient()
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        setError('Email ou palavra-passe incorrectos.')
        return
      }

      // Redirecionar conforme role (middleware garante protecção)
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
      {/* ── Overlay de carregamento ── */}
      {isPending && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4"
          style={{ background: 'rgba(240,247,239,0.85)', backdropFilter: 'blur(4px)' }}
        >
          {/* Spinner */}
          <svg
            className="animate-spin"
            width="48"
            height="48"
            viewBox="0 0 48 48"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle
              cx="24" cy="24" r="20"
              stroke="var(--color-primary)"
              strokeOpacity="0.2"
              strokeWidth="4"
            />
            <path
              d="M44 24c0-11.046-8.954-20-20-20"
              stroke="var(--color-primary)"
              strokeWidth="4"
              strokeLinecap="round"
            />
          </svg>

          <p
            className="text-sm font-medium"
            style={{ color: 'var(--color-primary)' }}
          >
            A verificar credenciais…
          </p>
        </div>
      )}

      <div className="w-full max-w-md">

        {/* Botão voltar */}
        <Link href="/" className="btn-back mb-6 inline-flex">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Voltar ao início
        </Link>

        {/* Logo oficial */}
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
              {isPending ? (
                <>
                  <svg
                    className="animate-spin"
                    width="16" height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                  >
                    <circle cx="8" cy="8" r="6" stroke="white" strokeOpacity="0.3" strokeWidth="2"/>
                    <path d="M14 8A6 6 0 0 0 8 2" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                  A entrar…
                </>
              ) : 'Entrar'}
            </button>
          </form>

          <div
            className="mt-6 pt-4 border-t text-center space-y-2"
            style={{ borderColor: 'var(--color-border)' }}
          >
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              Ainda não tem conta?{' '}
              <Link href="/register" style={{ color: 'var(--color-primary)' }}>
                Registar como cliente
              </Link>
            </p>
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
