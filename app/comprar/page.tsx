'use client'

import { useState, useTransition, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { createBrowserSupabaseClient } from '@/lib/supabase-client'
import Logo from '@/app/components/ui/Logo'
import { MEMBERSHIP, BANK, REFERRAL, BUSINESS } from '@/lib/constants'

function ComprarForm() {
  const searchParams = useSearchParams()

  // Leer ref da URL ou da cookie (guardada quando entrou pelo link do afiliado)
  const getRefFromCookie = () => {
    if (typeof document === 'undefined') return ''
    const match = document.cookie.match(new RegExp('(?:^|; )' + REFERRAL.urlParam + '=([^;]*)'))
    return match ? decodeURIComponent(match[1]) : ''
  }

  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    national_id: '',
    referral_code: searchParams.get(REFERRAL.urlParam) || getRefFromCookie(),
  })
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [isPending, startTransition] = useTransition()

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [key]: e.target.value }))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!file) { setError('Por favor anexe o comprovativo de pagamento.'); return }
    if (!form.national_id.trim()) { setError('Por favor introduza o seu documento de identidade.'); return }
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
    if (!allowed.includes(file.type)) { setError('Formato inválido. Use JPG, PNG, WEBP ou PDF.'); return }

    startTransition(async () => {
      const supabase = createBrowserSupabaseClient()
      const ext = file.name.split('.').pop()
      const path = `receipts/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error: uploadError } = await supabase.storage.from('receipts').upload(path, file)
      if (uploadError) { setError('Erro ao enviar o comprovativo. Tente novamente.'); return }
      const { error: saleError } = await supabase.from('sales').insert({
        customer_name: form.full_name,
        customer_email: form.email,
        customer_phone: form.phone,
        national_id: form.national_id,
        amount: MEMBERSHIP.price,
        currency: MEMBERSHIP.currency,
        receipt_path: path,
        referral_code: form.referral_code || null,
        status: 'pending_review',
      })
      if (saleError) { setError('Erro ao registar a compra. Tente novamente.'); return }
      setSuccess(true)
    })
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4"
        style={{ background: 'rgba(240,247,239,0.6)' }}>
        <div className="w-full max-w-md text-center">
          <div className="flex justify-center mb-8"><Logo size="lg" href="/" /></div>
          <div className="card">
            <div className="text-5xl mb-4">✅</div>
            <h2 className="font-display text-2xl font-bold text-gray-900 mb-3">Pedido recebido!</h2>
            <p className="text-sm mb-2" style={{ color: 'var(--color-text-muted)' }}>
              Recebemos o seu pedido e o comprovativo de pagamento.
            </p>
            <p className="text-sm mb-6" style={{ color: 'var(--color-text-muted)' }}>
              A nossa equipa irá verificar o pagamento e enviar o seu cartão por{' '}
              <strong>WhatsApp</strong> em até <strong>48 horas úteis</strong>.
            </p>
            <Link href="/" className="btn-outline text-sm">Voltar ao início</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10"
      style={{ background: 'rgba(240,247,239,0.6)' }}>
      <div className="w-full max-w-lg">

        {/* Botão voltar */}
        <Link href="/" className="btn-back mb-6 inline-flex">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Voltar ao início
        </Link>

        <div className="flex justify-center mb-8"><Logo size="lg" href="/" /></div>

        {/* Badge jornada */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full"
            style={{ background: 'rgba(74,140,63,0.1)' }}>
            <span className="text-lg">💳</span>
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--color-primary)' }}>
              Obter Cartão +Vida
            </span>
          </div>
        </div>

        {/* Dados bancários */}
        <div className="card mb-6 border-2" style={{ borderColor: 'var(--color-primary)' }}>
          <p className="font-semibold text-sm uppercase tracking-wider mb-4 text-center"
            style={{ color: 'var(--color-primary)' }}>
            1. Efectue a transferência bancária
          </p>
          <div className="space-y-2 text-sm">
            {[
              ['Banco',      BANK.bankName],
              ['Titular',    BANK.accountHolder],
              ['IBAN',       BANK.iban],
              ['Montante',   `${MEMBERSHIP.price.toLocaleString('pt-AO')} ${MEMBERSHIP.currencySymbol}`],
              ['Referência', BANK.reference],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between gap-4 flex-wrap">
                <span style={{ color: 'var(--color-text-muted)' }}>{label}</span>
                <span className={`font-medium ${label === 'IBAN' ? 'font-mono text-xs' : ''}`}
                  style={label === 'Montante' ? { color: 'var(--color-primary)', fontWeight: 700, fontSize: '1rem' } : { color: 'var(--color-text)' }}>
                  {value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Formulário */}
        <div className="card">
          <p className="font-semibold text-sm uppercase tracking-wider mb-4"
            style={{ color: 'var(--color-primary)' }}>
            2. Preencha os seus dados e anexe o comprovativo
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="input-label" htmlFor="full_name">Nome completo</label>
              <input id="full_name" type="text" required value={form.full_name} onChange={set('full_name')}
                className="input-field" placeholder="João Silva" disabled={isPending} />
            </div>
            <div>
              <label className="input-label" htmlFor="email">Email</label>
              <input id="email" type="email" required value={form.email} onChange={set('email')}
                className="input-field" placeholder="joao@exemplo.com" disabled={isPending} />
            </div>
            <div>
              <label className="input-label" htmlFor="phone">Telefone (WhatsApp)</label>
              <input id="phone" type="tel" required value={form.phone} onChange={set('phone')}
                className="input-field" placeholder="9XX XXX XXX" disabled={isPending} />
              <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                Enviaremos o seu cartão para este número de WhatsApp.
              </p>
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
            <div>
              <label className="input-label" htmlFor="referral_code">
                Código de afiliado <span style={{ color: 'var(--color-text-muted)' }}>(opcional)</span>
              </label>
              <input id="referral_code" type="text" value={form.referral_code} onChange={set('referral_code')}
                className="input-field font-mono" placeholder="VIDA-XXXXXX" disabled={isPending} />
            </div>
            <div>
              <label className="input-label" htmlFor="receipt">Comprovativo de pagamento</label>
              <input id="receipt" type="file" required accept="image/jpeg,image/png,image/webp,application/pdf"
                onChange={e => setFile(e.target.files?.[0] ?? null)}
                className="input-field" disabled={isPending} />
              <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                Formatos aceites: JPG, PNG, WEBP, PDF · Máx. 5MB
              </p>
            </div>

            {error && (
              <div className="rounded-xl p-3 bg-red-50 border border-red-200">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <button type="submit" disabled={isPending} className="btn-primary w-full">
              {isPending ? 'A enviar...' : `Submeter pedido — ${MEMBERSHIP.price.toLocaleString('pt-AO')} ${MEMBERSHIP.currencySymbol}`}
            </button>
          </form>

          <p className="text-xs text-center mt-4" style={{ color: 'var(--color-text-muted)' }}>
            Dúvidas? Fale connosco pelo{' '}
            <a href={`https://wa.me/${BUSINESS.phone.whatsapp}`} style={{ color: 'var(--color-primary)' }}>WhatsApp</a>
            {' '}ou{' '}
            <a href={`mailto:${BUSINESS.email.commercial}`} style={{ color: 'var(--color-primary)' }}>{BUSINESS.email.commercial}</a>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function ComprarPage() {
  return <Suspense><ComprarForm /></Suspense>
}
