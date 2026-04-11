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

export default function ReceptionForm({ receptionistName }: { receptionistName: string }) {
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
    }, 150)
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
      <div className="card text-center py-10">
        <div className="text-6xl mb-5">✅</div>
        <h2 className="font-display text-2xl font-bold text-gray-900 mb-2">Venda registada!</h2>
        <p className="text-sm text-gray-500 mb-8">
          O cartão entrou na fila de emissão no painel do administrador.
        </p>
        <button onClick={resetForm} className="btn-primary w-full">
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

      {/* Recepcionista activo */}
      <div className="rounded-xl p-3 border flex items-center gap-2"
        style={{ borderColor: 'var(--color-border)', background: 'rgba(0,0,0,0.03)' }}>
        <span className="text-base">👤</span>
        <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
          Venda registada por: <strong className="text-gray-800">{receptionistName}</strong>
        </p>
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
