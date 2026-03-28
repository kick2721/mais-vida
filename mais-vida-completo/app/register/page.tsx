'use client'

// app/register/page.tsx
// Registo de cliente ou afiliado — logo oficial + Supabase Auth
// URL: /register (cliente) | /register?role=affiliate (afiliado)

import { useState, useTransition, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createBrowserSupabaseClient } from '@/lib/supabase-client'
import Logo from '@/app/components/ui/Logo'
import BiInput from '@/app/components/forms/BiInput'
import { REFERRAL } from '@/lib/constants'

function RegisterForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const role = searchParams.get('role') === 'affiliate' ? 'affiliate' : 'customer'

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    national_id: '',
    referral_code: searchParams.get(REFERRAL.urlParam) || '',
  })
  const [biValid, setBiValid] = useState(false)
  const [error, setError]   = useState('')
  const [isPending, startTransition] = useTransition()

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [key]: e.target.value }))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (form.password !== form.confirmPassword) {
      setError('As palavras-passe não coincidem.')
      return
    }
    if (form.password.length < 8) {
      setError('A palavra-passe deve ter pelo menos 8 caracteres.')
      return
    }
    if (!biValid) {
      setError('Por favor introduza um BI válido.')
      return
    }

    startTransition(async () => {
      const supabase = createBrowserSupabaseClient()

      const { data, error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            full_name: form.name,
            phone: form.phone,
            role,
            national_id: form.national_id,
            referral_code: form.referral_code || null,
          },
        },
      })

      if (authError) {
        setError(authError.message === 'User already registered'
          ? 'Este email já está registado.'
          : 'Erro ao criar conta. Tente novamente.')
        return
      }

      // Redirecionar conforme role
      if (role === 'affiliate') router.push('/affiliate/dashboard')
      else router.push('/comprar')
    })
  }

  const isAffiliate = role === 'affiliate'

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-10"
      style={{ background: 'var(--color-surface)' }}
    >
      <div className="w-full max-w-md">

        {/* Logo oficial */}
        <div className="flex justify-center mb-8">
          <Logo size="lg" href="/" />
        </div>

        <div className="card">
          <h2 className="font-display text-xl font-bold text-gray-900 mb-1">
            {isAffiliate ? 'Registar como Afiliado' : 'Criar conta de Cliente'}
          </h2>
          <p className="text-sm mb-6" style={{ color: 'var(--color-text-muted)' }}>
            {isAffiliate
              ? 'Crie a sua conta de afiliado e comece a ganhar comissões.'
              : 'Registe-se para adquirir o seu Cartão +Vida.'}
          </p>

          {/* Toggle cliente/afiliado */}
          <div
            className="flex rounded-xl overflow-hidden border mb-6"
            style={{ borderColor: 'var(--color-border)' }}
          >
            <Link
              href="/register"
              className="flex-1 text-center py-2 text-sm font-medium transition-colors"
              style={{
                background: !isAffiliate ? 'var(--color-primary)' : 'transparent',
                color: !isAffiliate ? '#fff' : 'var(--color-text-muted)',
              }}
            >
              Cliente
            </Link>
            <Link
              href="/register?role=affiliate"
              className="flex-1 text-center py-2 text-sm font-medium transition-colors"
              style={{
                background: isAffiliate ? 'var(--color-primary)' : 'transparent',
                color: isAffiliate ? '#fff' : 'var(--color-text-muted)',
              }}
            >
              Afiliado
            </Link>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="input-label" htmlFor="name">Nome completo</label>
              <input
                id="name" type="text" required
                value={form.name} onChange={set('name')}
                className="input-field" placeholder="João Silva"
                disabled={isPending}
              />
            </div>

            <div>
              <label className="input-label" htmlFor="email">Email</label>
              <input
                id="email" type="email" autoComplete="email" required
                value={form.email} onChange={set('email')}
                className="input-field" placeholder="joao@exemplo.com"
                disabled={isPending}
              />
            </div>

            <div>
              <label className="input-label" htmlFor="phone">Telefone</label>
              <input
                id="phone" type="tel" required
                value={form.phone} onChange={set('phone')}
                className="input-field" placeholder="+244 9XX XXX XXX"
                disabled={isPending}
              />
            </div>

            <BiInput
                value={form.national_id}
                onChange={(val, valid) => {
                  setForm(f => ({ ...f, national_id: val }))
                  setBiValid(valid)
                }}
                disabled={isPending}
              />

            {!isAffiliate && (
              <div>
                <label className="input-label" htmlFor="referral_code">
                  Código de afiliado{' '}
                  <span style={{ color: 'var(--color-text-muted)' }}>(opcional)</span>
                </label>
                <input
                  id="referral_code" type="text"
                  value={form.referral_code} onChange={set('referral_code')}
                  className="input-field font-mono" placeholder="VIDA-XXXXXX"
                  disabled={isPending}
                />
              </div>
            )}

            <div>
              <label className="input-label" htmlFor="password">Palavra-passe</label>
              <input
                id="password" type="password" autoComplete="new-password" required
                value={form.password} onChange={set('password')}
                className="input-field" placeholder="Mínimo 8 caracteres"
                disabled={isPending}
              />
            </div>

            <div>
              <label className="input-label" htmlFor="confirmPassword">Confirmar palavra-passe</label>
              <input
                id="confirmPassword" type="password" autoComplete="new-password" required
                value={form.confirmPassword} onChange={set('confirmPassword')}
                className="input-field" placeholder="Repita a palavra-passe"
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
              disabled={isPending}
              className="btn-primary w-full disabled:opacity-50"
            >
              {isPending ? 'A criar conta...' : 'Criar conta'}
            </button>
          </form>

          <div
            className="mt-6 pt-4 border-t text-center"
            style={{ borderColor: 'var(--color-border)' }}
          >
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              Já tem conta?{' '}
              <Link href="/login" style={{ color: 'var(--color-primary)' }}>
                Entrar
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  )
}
