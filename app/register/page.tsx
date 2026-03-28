'use client'

import { useState, useTransition, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createBrowserSupabaseClient } from '@/lib/supabase-client'
import Logo from '@/app/components/ui/Logo'
import { REFERRAL } from '@/lib/constants'

function RegisterForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const role = searchParams.get('role') === 'affiliate' ? 'affiliate' : 'customer'
  const isAffiliate = role === 'affiliate'

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    national_id: '',
    referral_code: searchParams.get(REFERRAL.urlParam) || '',
  })
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [key]: e.target.value }))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirmPassword) { setError('As palavras-passe não coincidem.'); return }
    if (form.password.length < 8) { setError('A palavra-passe deve ter pelo menos 8 caracteres.'); return }
    if (!form.national_id.trim()) { setError('Por favor introduza o seu documento de identidade.'); return }

    startTransition(async () => {
      const supabase = createBrowserSupabaseClient()
      const { error: authError } = await supabase.auth.signUp({
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
          ? 'Este email já está registado.' : 'Erro ao criar conta. Tente novamente.')
        return
      }
      if (isAffiliate) router.push('/affiliate/dashboard')
      else router.push('/comprar')
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10"
      style={{ background: 'rgba(240,247,239,0.6)' }}>
      <div className="w-full max-w-md">

        {/* Botão voltar */}
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
          {/* Header — contexto claro da jornada */}
          <div className="text-center mb-6 pb-5 border-b" style={{ borderColor: 'var(--color-border)' }}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-3"
              style={{ background: isAffiliate ? 'rgba(139,26,26,0.08)' : 'rgba(74,140,63,0.08)' }}>
              <span className="text-lg">{isAffiliate ? '🤝' : '💳'}</span>
              <span className="text-xs font-bold uppercase tracking-widest"
                style={{ color: isAffiliate ? 'var(--color-accent)' : 'var(--color-primary)' }}>
                {isAffiliate ? 'Registo de Afiliado' : 'Registo de Cliente'}
              </span>
            </div>
            <h2 className="font-display text-xl font-bold text-gray-900 mb-1">
              {isAffiliate ? 'Torna-te Afiliado' : 'Cria a tua conta'}
            </h2>
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              {isAffiliate
                ? 'Regista-te e começa a ganhar 250 Kz por cada cartão vendido.'
                : 'Regista-te para adquirir o teu Cartão +Vida.'}
            </p>
          </div>

          {/* Aviso de jornada errada */}
          <div className="rounded-xl p-3 mb-5 flex items-start gap-3"
            style={{ background: 'rgba(74,140,63,0.06)', border: '1px solid rgba(74,140,63,0.15)' }}>
            <span className="text-base mt-0.5">{isAffiliate ? '💡' : '💡'}</span>
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              {isAffiliate
                ? <>Quer comprar um cartão?{' '}<Link href="/comprar" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>Clique aqui →</Link></>
                : <>Quer ser afiliado e ganhar comissões?{' '}<Link href="/register?role=affiliate" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>Registe-se aqui →</Link></>
              }
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="input-label" htmlFor="name">Nome completo</label>
              <input id="name" type="text" required value={form.name} onChange={set('name')}
                className="input-field" placeholder="João Silva" disabled={isPending} />
            </div>
            <div>
              <label className="input-label" htmlFor="email">Email</label>
              <input id="email" type="email" autoComplete="email" required value={form.email} onChange={set('email')}
                className="input-field" placeholder="joao@exemplo.com" disabled={isPending} />
            </div>
            <div>
              <label className="input-label" htmlFor="phone">Telefone</label>
              <input id="phone" type="tel" required value={form.phone} onChange={set('phone')}
                className="input-field" placeholder="+244 9XX XXX XXX" disabled={isPending} />
            </div>
            <div>
              <label className="input-label" htmlFor="national_id">
                Nº do Bilhete de Identidade ou Passaporte
              </label>
              <input id="national_id" type="text" required value={form.national_id} onChange={set('national_id')}
                className="input-field" placeholder="Ex: 005847291AN014 ou passaporte"
                disabled={isPending} autoComplete="off" />
              <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                Aceita BI angolano ou passaporte de qualquer país.
              </p>
            </div>
            {!isAffiliate && (
              <div>
                <label className="input-label" htmlFor="referral_code">
                  Código de afiliado <span style={{ color: 'var(--color-text-muted)' }}>(opcional)</span>
                </label>
                <input id="referral_code" type="text" value={form.referral_code} onChange={set('referral_code')}
                  className="input-field font-mono" placeholder="VIDA-XXXXXX" disabled={isPending} />
              </div>
            )}
            <div>
              <label className="input-label" htmlFor="password">Palavra-passe</label>
              <input id="password" type="password" autoComplete="new-password" required
                value={form.password} onChange={set('password')}
                className="input-field" placeholder="Mínimo 8 caracteres" disabled={isPending} />
            </div>
            <div>
              <label className="input-label" htmlFor="confirmPassword">Confirmar palavra-passe</label>
              <input id="confirmPassword" type="password" autoComplete="new-password" required
                value={form.confirmPassword} onChange={set('confirmPassword')}
                className="input-field" placeholder="Repita a palavra-passe" disabled={isPending} />
            </div>

            {error && (
              <div className="rounded-xl p-3 bg-red-50 border border-red-200">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <button type="submit" disabled={isPending} className="btn-primary w-full">
              {isPending ? 'A criar conta...' : isAffiliate ? 'Criar conta de Afiliado' : 'Criar conta de Cliente'}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t text-center" style={{ borderColor: 'var(--color-border)' }}>
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              Já tem conta?{' '}
              <Link href="/login" style={{ color: 'var(--color-primary)' }}>Entrar</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function RegisterPage() {
  return <Suspense><RegisterForm /></Suspense>
}
