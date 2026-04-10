'use client'

import { useState, useTransition, useRef, useEffect, useCallback } from 'react'
import { searchAffiliate, registerManualSale } from '@/lib/receptionist-actions'
import { createBrowserSupabaseClient } from '@/lib/supabase-client'
import BtnSpinner from '@/app/components/ui/BtnSpinner'
import { MEMBERSHIP, BUSINESS } from '@/lib/constants'

type PaymentMethod = 'cash' | 'transfer'

interface AffiliateResult {
  id: string
  referral_code: string
  full_name: string
  phone: string
}

type Step = 'form' | 'success'

export default function ReceptionForm() {
  // Form state
  const [customerName,  setCustomerName]  = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [nationalId,    setNationalId]    = useState('')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash')

  // Affiliate search
  const [affiliateQuery,    setAffiliateQuery]    = useState('')
  const [affiliateResults,  setAffiliateResults]  = useState<AffiliateResult[]>([])
  const [selectedAffiliate, setSelectedAffiliate] = useState<AffiliateResult | null>(null)
  const [showDropdown,      setShowDropdown]      = useState(false)
  const [searchPending,     startSearchTransition] = useTransition()
  const searchRef = useRef<HTMLDivElement>(null)

  // BI duplicate check
  type BiStatus = null | 'checking' | 'ok' | 'taken'
  const [biStatus, setBiStatus] = useState<BiStatus>(null)

  const checkBi = useCallback(async (value: string) => {
    const trimmed = value.trim()
    if (!trimmed || trimmed.length < 5) { setBiStatus(null); return }
    setBiStatus('checking')
    const supabase = createBrowserSupabaseClient()
    const { data } = await supabase.rpc('check_national_id_exists', { p_national_id: trimmed })
    setBiStatus(data === true ? 'taken' : 'ok')
  }, [])

  // Submit
  const [isPending, startTransition] = useTransition()
  const [error,     setError]        = useState('')
  const [step,      setStep]         = useState<Step>('form')
  const [lastSaleId, setLastSaleId]  = useState('')

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Search affiliates with debounce
  useEffect(() => {
    if (!affiliateQuery || affiliateQuery.trim().length < 2) {
      setAffiliateResults([])
      setShowDropdown(false)
      return
    }
    const timer = setTimeout(() => {
      startSearchTransition(async () => {
        const { results } = await searchAffiliate(affiliateQuery)
        setAffiliateResults(results || [])
        setShowDropdown(true)
      })
    }, 300)
    return () => clearTimeout(timer)
  }, [affiliateQuery])

  function selectAffiliate(aff: AffiliateResult) {
    setSelectedAffiliate(aff)
    setAffiliateQuery(`${aff.full_name} — ${aff.referral_code}`)
    setShowDropdown(false)
  }

  function clearAffiliate() {
    setSelectedAffiliate(null)
    setAffiliateQuery('')
    setAffiliateResults([])
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!customerName.trim())  { setError('Nome do cliente é obrigatório.');        return }
    if (!customerPhone.trim()) { setError('Telefone do cliente é obrigatório.');     return }
    if (!nationalId.trim())    { setError('BI / Passaporte é obrigatório.');         return }
    if (biStatus === 'taken')   { setError('Este BI/Passaporte já tem um cartão activo ou pedido em curso.'); return }
    if (biStatus === 'checking') { setError('Aguarde a verificação do BI/Passaporte.'); return }

    startTransition(async () => {
      const result = await registerManualSale({
        customer_name:  customerName.trim(),
        customer_phone: customerPhone.trim(),
        customer_email: customerEmail.trim(),
        national_id:    nationalId.trim(),
        payment_method: paymentMethod,
        referral_code:  selectedAffiliate?.referral_code,
      })

      if (result.error) {
        setError(result.error)
        return
      }

      setLastSaleId(result.saleId || '')
      setStep('success')
    })
  }

  function resetForm() {
    setCustomerName('')
    setCustomerPhone('')
    setCustomerEmail('')
    setNationalId('')
    setPaymentMethod('cash')
    clearAffiliate()
    setBiStatus(null)
    setError('')
    setStep('form')
  }

  // ── SUCCESS ──────────────────────────────────────────────────────────────
  if (step === 'success') {
    return (
      <div className="card text-center">
        <div className="text-5xl mb-4">✅</div>
        <h2 className="font-display text-xl font-bold text-gray-900 mb-2">Venda registada!</h2>
        <p className="text-sm text-gray-600 mb-1">
          O cartão entrou na fila de emissão no painel do administrador.
        </p>
        <p className="text-sm text-gray-500 mb-6">
          Envie o cartão ao cliente pelo WhatsApp quando estiver emitido.
        </p>

        {/* WhatsApp quick link */}
        <a
          href={`https://wa.me/244${customerPhone.replace(/\D/g, '').replace(/^244/, '')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary flex items-center justify-center gap-2 mb-3"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
          </svg>
          Abrir WhatsApp do cliente
        </a>

        <button onClick={resetForm} className="btn-outline w-full">
          Registar nova venda
        </button>
      </div>
    )
  }

  // ── FORM ─────────────────────────────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit} className="space-y-4">

      {/* Dados do cliente */}
      <div className="card space-y-4">
        <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-primary)' }}>
          Dados do cliente
        </p>

        <div>
          <label className="input-label">Nome completo *</label>
          <input
            type="text"
            required
            value={customerName}
            onChange={e => setCustomerName(e.target.value)}
            className="input-field"
            placeholder="Nome completo do cliente"
            disabled={isPending}
            autoComplete="off"
          />
        </div>

        <div>
          <label className="input-label">Telefone (WhatsApp) *</label>
          <input
            type="tel"
            required
            value={customerPhone}
            onChange={e => setCustomerPhone(e.target.value)}
            className="input-field"
            placeholder="9XX XXX XXX"
            disabled={isPending}
          />
          <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
            Será usado para enviar o cartão por WhatsApp.
          </p>
        </div>

        <div>
          <label className="input-label">
            Email <span style={{ color: 'var(--color-text-muted)' }}>(opcional)</span>
          </label>
          <input
            type="email"
            value={customerEmail}
            onChange={e => setCustomerEmail(e.target.value)}
            className="input-field"
            placeholder="cliente@exemplo.com"
            disabled={isPending}
          />
        </div>

        <div>
          <label className="input-label">BI / Passaporte *</label>
          <input
            type="text"
            required
            value={nationalId}
            onChange={e => { setNationalId(e.target.value); checkBi(e.target.value) }}
            className={`input-field font-mono ${biStatus === "taken" ? "border-red-400 bg-red-50" : biStatus === "ok" ? "border-green-400" : ""}`}
            placeholder="Ex: 005847291AN014"
            disabled={isPending}
            autoComplete="off"
          />
          {biStatus === 'checking' && (
            <p className="text-xs mt-1 text-amber-600">A verificar BI/Passaporte…</p>
          )}
          {biStatus === 'taken' && (
            <p className="text-xs mt-1 text-red-600">⚠️ Este BI/Passaporte já tem um cartão activo ou pedido em curso.</p>
          )}
          {biStatus === 'ok' && (
            <p className="text-xs mt-1 text-green-600">✓ BI/Passaporte disponível.</p>
          )}
        </div>
      </div>

      {/* Método de pagamento */}
      <div className="card">
        <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--color-primary)' }}>
          Método de pagamento
        </p>
        <div className="grid grid-cols-2 gap-3">
          {(['cash', 'transfer'] as PaymentMethod[]).map(method => (
            <button
              key={method}
              type="button"
              onClick={() => setPaymentMethod(method)}
              className="py-3 rounded-xl border-2 text-sm font-semibold transition-all"
              style={paymentMethod === method
                ? { background: 'var(--color-primary)', color: '#fff', borderColor: 'var(--color-primary)' }
                : { background: 'transparent', color: 'var(--color-primary)', borderColor: 'var(--color-primary)', opacity: 0.6 }
              }
            >
              {method === 'cash' ? '💵 Numerário' : '🏦 Transferência'}
            </button>
          ))}
        </div>
      </div>

      {/* Afiliado — búsqueda */}
      <div className="card">
        <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--color-primary)' }}>
          Afiliado <span className="font-normal normal-case" style={{ color: 'var(--color-text-muted)' }}>(opcional)</span>
        </p>

        {selectedAffiliate ? (
          <div
            className="flex items-center justify-between rounded-xl p-3 border-2"
            style={{ borderColor: 'var(--color-primary)', background: 'rgba(74,140,63,0.06)' }}
          >
            <div>
              <p className="font-semibold text-sm text-gray-900">{selectedAffiliate.full_name}</p>
              <p className="text-xs font-mono mt-0.5" style={{ color: 'var(--color-primary)' }}>
                {selectedAffiliate.referral_code}
              </p>
            </div>
            <button
              type="button"
              onClick={clearAffiliate}
              className="text-gray-400 hover:text-red-500 transition-colors text-lg leading-none ml-3"
            >
              ✕
            </button>
          </div>
        ) : (
          <div ref={searchRef} className="relative">
            <input
              type="text"
              value={affiliateQuery}
              onChange={e => setAffiliateQuery(e.target.value)}
              onFocus={() => affiliateResults.length > 0 && setShowDropdown(true)}
              className="input-field"
              placeholder="Buscar por nome, código ou telefone…"
              disabled={isPending}
              autoComplete="off"
            />

            {searchPending && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <svg className="animate-spin w-4 h-4 text-gray-400" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="6" stroke="currentColor" strokeOpacity="0.3" strokeWidth="2"/>
                  <path d="M14 8A6 6 0 0 0 8 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
            )}

            {showDropdown && affiliateResults.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white rounded-xl border shadow-lg overflow-hidden"
                style={{ borderColor: 'var(--color-border)' }}>
                {affiliateResults.map(aff => (
                  <button
                    key={aff.id}
                    type="button"
                    onClick={() => selectAffiliate(aff)}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b last:border-0"
                    style={{ borderColor: 'var(--color-border)' }}
                  >
                    <p className="font-semibold text-sm text-gray-900">{aff.full_name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      <span className="font-mono" style={{ color: 'var(--color-primary)' }}>{aff.referral_code}</span>
                      {aff.phone && <span className="ml-2">· {aff.phone}</span>}
                    </p>
                  </button>
                ))}
              </div>
            )}

            {showDropdown && affiliateResults.length === 0 && !searchPending && affiliateQuery.length >= 2 && (
              <div className="absolute z-10 w-full mt-1 bg-white rounded-xl border shadow-lg px-4 py-3"
                style={{ borderColor: 'var(--color-border)' }}>
                <p className="text-sm text-gray-500">Nenhum afiliado encontrado.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Resumo */}
      <div className="rounded-xl p-4 border-2 flex items-center justify-between"
        style={{ borderColor: 'var(--color-primary)', background: 'rgba(74,140,63,0.05)' }}>
        <span className="text-sm font-semibold text-gray-700">Total a registar</span>
        <span className="text-xl font-bold" style={{ color: 'var(--color-primary)' }}>
          {MEMBERSHIP.price.toLocaleString('pt-AO')} Kz
        </span>
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
          ? <><BtnSpinner />A registar venda…</>
          : 'Registar venda confirmada →'}
      </button>

      <p className="text-xs text-center" style={{ color: 'var(--color-text-muted)' }}>
        A venda entra directamente como confirmada e o cartão fica pendente de emissão.
      </p>
    </form>
  )
}
