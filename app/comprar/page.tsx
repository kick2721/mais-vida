'use client'

import { useState, useTransition, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { createBrowserSupabaseClient } from '@/lib/supabase-client'
import Logo from '@/app/components/ui/Logo'
import LoadingOverlay from '@/app/components/ui/LoadingOverlay'
import BtnSpinner from '@/app/components/ui/BtnSpinner'
import { MEMBERSHIP, BANK, REFERRAL, BUSINESS } from '@/lib/constants'

const MAX_CARDS = 5

interface CardHolder {
  full_name: string
  national_id: string
  receipt: File | null
}

function ComprarForm() {
  const searchParams = useSearchParams()

  const getRefFromCookie = () => {
    if (typeof document === 'undefined') return ''
    const match = document.cookie.match(new RegExp('(?:^|; )' + REFERRAL.urlParam + '=([^;]*)'))
    return match ? decodeURIComponent(match[1]) : ''
  }

  const [quantity, setQuantity]   = useState(1)
  const [holders, setHolders]     = useState<CardHolder[]>([{ full_name: '', national_id: '', receipt: null }])
  const [contact, setContact]     = useState({ email: '', phone: '' })
  const [referralCode, setReferralCode] = useState(
    searchParams.get(REFERRAL.urlParam) || getRefFromCookie()
  )
  const [error, setError]         = useState('')
  const [success, setSuccess]     = useState(false)
  const [isPending, startTransition] = useTransition()
  // Estado de validación de BI: null=sin verificar, 'checking'=verificando, 'ok'=libre, 'taken'=ocupado
  const [biStatus, setBiStatus]   = useState<(null | 'checking' | 'ok' | 'taken')[]>([null])

  const totalAmount = quantity * MEMBERSHIP.price

  // Sync holders array when quantity changes
  const changeQuantity = (newQty: number) => {
    const q = Math.max(1, Math.min(MAX_CARDS, newQty))
    setQuantity(q)
    setHolders(prev => {
      if (q > prev.length) {
        return [...prev, ...Array(q - prev.length).fill({ full_name: '', national_id: '', receipt: null })]
      }
      return prev.slice(0, q)
    })
    setBiStatus(prev => {
      if (q > prev.length) return [...prev, ...Array(q - prev.length).fill(null)]
      return prev.slice(0, q)
    })
  }

  // Verificar en Supabase si el BI ya tiene cartão activo o pedido pendiente
  const checkBi = async (nationalId: string, index: number) => {
    const trimmed = nationalId.trim()
    if (!trimmed || trimmed.length < 5) {
      setBiStatus(prev => prev.map((s, i) => i === index ? null : s))
      return
    }
    setBiStatus(prev => prev.map((s, i) => i === index ? 'checking' : s))
    const supabase = createBrowserSupabaseClient()
    const { data } = await supabase
      .rpc('check_national_id_exists', { p_national_id: trimmed })
    const taken = data === true
    setBiStatus(prev => prev.map((s, i) => i === index ? (taken ? 'taken' : 'ok') : s))
  }

  const setHolder = (index: number, field: keyof CardHolder) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = field === 'receipt' ? (e.target.files?.[0] ?? null) : e.target.value
      setHolders(prev => prev.map((h, i) => i === index ? { ...h, [field]: value } : h))
      if (field === 'national_id') {
        checkBi(e.target.value, index)
      }
    }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
    const MAX_SIZE_MB = 2
    const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024

    for (let i = 0; i < holders.length; i++) {
      if (!holders[i].full_name.trim()) {
        setError(`Por favor preencha o nome completo do Cartão ${i + 1}.`); return
      }
      if (!holders[i].national_id.trim()) {
        setError(`Por favor preencha o BI/Passaporte do Cartão ${i + 1}.`); return
      }
      if (biStatus[i] === 'taken') {
        setError(`Cartão ${i + 1}: este BI/Passaporte já tem um cartão activo ou pedido em curso.`); return
      }
      if (biStatus[i] === 'checking') {
        setError(`Cartão ${i + 1}: aguarde a verificação do BI/Passaporte.`); return
      }
      if (!holders[i].receipt) {
        setError(`Por favor anexe o comprovativo do Cartão ${i + 1}.`); return
      }
      if (!allowed.includes(holders[i].receipt!.type)) {
        setError(`Cartão ${i + 1}: formato inválido. Use JPG, PNG, WEBP ou PDF.`); return
      }
      if (holders[i].receipt!.size > MAX_SIZE_BYTES) {
        const sizeMB = (holders[i].receipt!.size / 1024 / 1024).toFixed(1)
        setError(`Cartão ${i + 1}: ficheiro demasiado grande (${sizeMB}MB). Máximo permitido: ${MAX_SIZE_MB}MB.`); return
      }
    }
    startTransition(async () => {
      const supabase = createBrowserSupabaseClient()

      // Upload comprovativo por cartão via API route segura (validação MIME real)
      const rows = []
      for (const h of holders) {
        const receiptFile = h.receipt!
        const ext = receiptFile.name.split('.').pop()
        const filePath = `receipts/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

        const fd = new FormData()
        fd.append('file', receiptFile)
        fd.append('filePath', filePath)
        const uploadRes = await fetch('/api/upload-receipt', { method: 'POST', body: fd })
        if (!uploadRes.ok) {
          const data = await uploadRes.json().catch(() => ({}))
          setError(data.error || 'Erro ao enviar comprovativo. Tente novamente.'); return
        }

        rows.push({
          customer_name:  h.full_name,
          customer_email: contact.email,
          customer_phone: contact.phone,
          national_id:    h.national_id,
          amount:         MEMBERSHIP.price,
          currency:       MEMBERSHIP.currency,
          receipt_path:   filePath,
          referral_code:  referralCode || null,
          status:         'pending_review',
        })
      }

      const { error: saleError } = await supabase.from('sales').insert(rows)
      if (saleError) { setError('Erro ao registar a compra. Tente novamente.'); return }

      setSuccess(true)
    })
  }

  // ── SUCCESS ──────────────────────────────────────────────────────────────
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
              Recebemos o seu pedido de <strong>{quantity} cartão{quantity > 1 ? 'ões' : ''}</strong> e o comprovativo de pagamento.
            </p>
            <p className="text-sm mb-6" style={{ color: 'var(--color-text-muted)' }}>
              A nossa equipa irá verificar o pagamento e enviar os cartões por{' '}
              <strong>WhatsApp</strong> em até <strong>48 horas úteis</strong>.
            </p>
            <Link href="/seguimento" className="btn-primary text-sm block mb-3">
              Ver estado do meu pedido →
            </Link>
            <Link href="/" className="btn-outline text-sm">Voltar ao início</Link>
          </div>
        </div>
      </div>
    )
  }

  // ── FORM ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen px-4 py-10"
      style={{ background: 'rgba(240,247,239,0.6)' }}>

      {isPending && <LoadingOverlay message="A enviar pedido…" />}

      <div className="w-full max-w-lg mx-auto">
        <Link href="/" className="btn-back mb-6 inline-flex">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Voltar ao início
        </Link>

        <div className="flex justify-center mb-8"><Logo size="lg" href="/" /></div>

        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full"
            style={{ background: 'rgba(74,140,63,0.1)' }}>
            <span className="text-lg">💳</span>
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--color-primary)' }}>
              Obter Cartão +Vida
            </span>
          </div>
        </div>

        {/* ── PASSO 0: quantos cartões? ── */}
        <div className="card mb-6">
          <p className="font-semibold text-sm uppercase tracking-wider mb-1"
            style={{ color: 'var(--color-primary)' }}>
            Quantos cartões pretende comprar?
          </p>
            <p className="text-sm mb-3" style={{ color: 'var(--color-text-muted)' }}>Pode comprar para si e para a sua família. Máximo {MAX_CARDS} por pedido.</p>

          {/* Selector visual */}
          <div className="flex items-center gap-3 mb-4">
            <button type="button"
              onClick={() => changeQuantity(quantity - 1)}
              disabled={quantity <= 1}
              className="w-10 h-10 rounded-xl border-2 font-bold text-xl flex items-center justify-center transition-all disabled:opacity-30"
              style={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}>
              −
            </button>
            <div className="flex-1 text-center">
              <span className="text-3xl font-bold" style={{ color: 'var(--color-primary)' }}>{quantity}</span>
              <span className="text-sm text-gray-500 ml-2">cartão{quantity > 1 ? 'ões' : ''}</span>
            </div>
            <button type="button"
              onClick={() => changeQuantity(quantity + 1)}
              disabled={quantity >= MAX_CARDS}
              className="w-10 h-10 rounded-xl border-2 font-bold text-xl flex items-center justify-center transition-all disabled:opacity-30"
              style={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}>
              +
            </button>
          </div>

          {/* Pills de seleção rápida — centradas em grid */}
          <div className="grid grid-cols-5 gap-2 mb-4">
            {[1, 2, 3, 4, 5].map(n => (
              <button key={n} type="button"
                onClick={() => changeQuantity(n)}
                className="py-2 rounded-full text-sm font-semibold border-2 transition-all text-center"
                style={quantity === n
                  ? { background: 'var(--color-primary)', color: '#fff', borderColor: 'var(--color-primary)' }
                  : { background: 'transparent', color: 'var(--color-primary)', borderColor: 'var(--color-primary)', opacity: 0.6 }
                }>
                {n}
              </button>
            ))}
          </div>

          {/* Total em destaque */}
          <div className="rounded-xl p-3 flex items-center justify-between"
            style={{ background: 'rgba(74,140,63,0.08)' }}>
            <span className="text-sm text-gray-600">
              {quantity} × {MEMBERSHIP.price.toLocaleString('pt-AO')} {MEMBERSHIP.currencySymbol}
            </span>
            <span className="text-lg font-bold" style={{ color: 'var(--color-primary)' }}>
              {totalAmount.toLocaleString('pt-AO')} {MEMBERSHIP.currencySymbol}
            </span>
          </div>
        </div>

        {/* ── PASSO 1: dados bancários ── */}
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
              ['Montante',   `${totalAmount.toLocaleString('pt-AO')} ${MEMBERSHIP.currencySymbol}`],
              ['Referência', BANK.reference],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between gap-4 flex-wrap">
                <span style={{ color: 'var(--color-text-muted)' }}>{label}</span>
                <span className={`font-medium ${label === 'IBAN' ? 'font-mono text-xs' : ''}`}
                  style={label === 'Montante'
                    ? { color: 'var(--color-primary)', fontWeight: 700, fontSize: '1rem' }
                    : { color: 'var(--color-text)' }}>
                  {value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── PASSO 2: formulário ── */}
        <div className="card">
          <p className="font-semibold text-sm uppercase tracking-wider mb-4"
            style={{ color: 'var(--color-primary)' }}>
            2. Preencha os dados e anexe o comprovativo
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Dados de contacto — partilhados por todos os cartões */}
            <div className="rounded-xl p-4 border" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}>
              <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--color-primary)' }}>
                Contacto do responsável pelo pedido
              </p>
              <div className="space-y-3">
                <div>
                  <label className="input-label" htmlFor="email">Email</label>
                  <input id="email" type="email" required value={contact.email}
                    onChange={e => setContact(c => ({ ...c, email: e.target.value }))}
                    className="input-field" placeholder="joao@exemplo.com" disabled={isPending} />
                </div>
                <div>
                  <label className="input-label" htmlFor="phone">Telefone (WhatsApp)</label>
                  <input id="phone" type="tel" required value={contact.phone}
                    onChange={e => setContact(c => ({ ...c, phone: e.target.value }))}
                    className="input-field" placeholder="9XX XXX XXX" disabled={isPending} />
                  <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                    Enviaremos os cartões para este número de WhatsApp.
                  </p>
                </div>
              </div>
            </div>

            {/* Um bloco por cada cartão */}
            {holders.map((holder, i) => (
              <div key={i} className="rounded-xl p-4 border-2 transition-all"
                style={{ borderColor: 'var(--color-primary)', opacity: 1 }}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-6 h-6 rounded-full text-white text-xs font-bold flex items-center justify-center"
                    style={{ background: 'var(--color-primary)' }}>
                    {i + 1}
                  </span>
                  <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-primary)' }}>
                    Cartão {i + 1}{i === 0 ? ' (titular do pedido)' : ''}
                  </p>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="input-label">Nome completo</label>
                    <input type="text" required value={holder.full_name}
                      onChange={setHolder(i, 'full_name')}
                      className="input-field" placeholder="Nome completo" disabled={isPending} />
                  </div>
                  <div>
                    <label className="input-label">Nº do BI ou Passaporte</label>
                    <input type="text" required value={holder.national_id}
                      onChange={setHolder(i, 'national_id')}
                      className="input-field font-mono"
                      placeholder="Ex: 005847291AN014"
                      disabled={isPending} autoComplete="off"
                      style={biStatus[i] === 'taken' ? { borderColor: '#ef4444', background: '#fef2f2' } :
                             biStatus[i] === 'ok'    ? { borderColor: '#16a34a', background: '#f0fdf4' } : {}}
                    />
                    {biStatus[i] === 'checking' && (
                      <p className="text-xs mt-1 flex items-center gap-1" style={{ color: '#6b7280' }}>
                        <svg className="animate-spin" width="12" height="12" viewBox="0 0 16 16" fill="none">
                          <circle cx="8" cy="8" r="6" stroke="currentColor" strokeOpacity="0.3" strokeWidth="2"/>
                          <path d="M14 8A6 6 0 0 0 8 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                        A verificar…
                      </p>
                    )}
                    {biStatus[i] === 'taken' && (
                      <p className="text-xs mt-1 font-semibold" style={{ color: '#ef4444' }}>
                        ⚠️ Este BI/Passaporte já tem um cartão activo ou pedido em curso.
                      </p>
                    )}
                    {biStatus[i] === 'ok' && (
                      <p className="text-xs mt-1 font-semibold" style={{ color: '#16a34a' }}>
                        ✓ Disponível
                      </p>
                    )}
                    {biStatus[i] === null && (
                      <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                        Aceita BI angolano ou passaporte de qualquer país.
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="input-label">Comprovativo de pagamento</label>
                    <input type="file" required accept="image/jpeg,image/png,image/webp,application/pdf"
                      onChange={setHolder(i, 'receipt')}
                      className="input-field" disabled={isPending} />
                    <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                      JPG, PNG, WEBP ou PDF · Máx. 2MB
                    </p>
                  </div>
                </div>
              </div>
            ))}

            {/* Código de afiliado */}
            <div>
              <label className="input-label" htmlFor="referral_code">
                Código de afiliado <span style={{ color: 'var(--color-text-muted)' }}>(opcional)</span>
              </label>
              <input id="referral_code" type="text" value={referralCode}
                onChange={e => setReferralCode(e.target.value)}
                className="input-field font-mono" placeholder="VIDA-XXXXXX" disabled={isPending} />
            </div>

            {error && (
              <div className="rounded-xl p-3 bg-red-50 border border-red-200">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Resumo final + botão */}
            <div className="rounded-xl p-4 border-2" style={{ borderColor: 'var(--color-primary)', background: 'rgba(74,140,63,0.05)' }}>
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-semibold text-gray-700">
                  {quantity} cartão{quantity > 1 ? 'ões' : ''}
                </span>
                <span className="text-xl font-bold" style={{ color: 'var(--color-primary)' }}>
                  {totalAmount.toLocaleString('pt-AO')} {MEMBERSHIP.currencySymbol}
                </span>
              </div>
              <button type="submit" disabled={isPending}
                className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50">
                {isPending
                  ? <><BtnSpinner />A enviar pedido…</>
                  : `Submeter pedido — ${totalAmount.toLocaleString('pt-AO')} ${MEMBERSHIP.currencySymbol}`}
              </button>
            </div>
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
