'use client'

// app/afiliado-candidatura/page.tsx

import { useState, useTransition } from 'react'
import Link from 'next/link'
import Logo from '@/app/components/ui/Logo'
import LoadingOverlay from '@/app/components/ui/LoadingOverlay'
import BtnSpinner from '@/app/components/ui/BtnSpinner'
import { createBrowserSupabaseClient } from '@/lib/supabase-client'
import { COMMISSION, MEMBERSHIP, BUSINESS } from '@/lib/constants'

const NETWORK_OPTIONS = [
  'Menos de 50 pessoas',
  '50 a 200 pessoas',
  '200 a 500 pessoas',
  'Mais de 500 pessoas',
]

const OCCUPATION_OPTIONS = [
  'Profissional de saúde',
  'Professor / Educador',
  'Empresário / Comerciante',
  'Vendedor / Agente comercial',
  'Funcionário público',
  'Estudante',
  'Outro',
]

export default function AffiliateCandidaturePage() {
  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    national_id: '',
    occupation: '',
    network_size: '',
    motivation: '',
    instagram: '',
    facebook: '',
    tiktok: '',
    other_social: '',
  })
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  const set = (key: string) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => setForm(f => ({ ...f, [key]: e.target.value }))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!form.full_name || !form.phone || !form.national_id || !form.motivation) {
      setError('Por favor preencha todos os campos obrigatórios.')
      return
    }
    if (form.motivation.length < 30) {
      setError('Por favor desenvolva mais a sua resposta (mínimo 30 caracteres).')
      return
    }

    startTransition(async () => {
      const supabase = createBrowserSupabaseClient()

      // Verificar duplicados por BI/Passaporte ou telefone
      const { data: existing } = await supabase
        .from('affiliate_applications')
        .select('id, national_id, phone')
        .or(`national_id.eq.${form.national_id},phone.eq.${form.phone}`)
        .limit(1)

      if (existing && existing.length > 0) {
        const dup = existing[0]
        if (dup.national_id === form.national_id) {
          setError('Já existe uma candidatura com este número de BI / Passaporte. Se acredita que é um engano, contacte-nos.')
        } else {
          setError('Já existe uma candidatura com este número de telefone. Se acredita que é um engano, contacte-nos.')
        }
        return
      }

      const { error: dbError } = await supabase
        .from('affiliate_applications')
        .insert({
          full_name: form.full_name,
          phone: form.phone,
          national_id: form.national_id,
          occupation: form.occupation || null,
          network_size: form.network_size || null,
          motivation: form.motivation,
          instagram: form.instagram || null,
          facebook: form.facebook || null,
          tiktok: form.tiktok || null,
          other_social: form.other_social || null,
        })

      if (dbError) {
        setError('Erro ao submeter candidatura. Tente novamente.')
        return
      }

      setSuccess(true)
    })
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4"
        style={{ background: 'rgba(240,247,239,0.6)' }}>
        <div className="w-full max-w-md">
          <div className="flex justify-center mb-8"><Logo size="lg" href="/" /></div>
          <div className="card text-center py-10">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="font-display text-2xl font-bold text-gray-900 mb-3">
              Candidatura enviada!
            </h2>
            <p className="text-sm mb-2" style={{ color: 'var(--color-text-muted)' }}>
              Recebemos a sua candidatura com sucesso.
            </p>
            <p className="text-sm mb-6" style={{ color: 'var(--color-text-muted)' }}>
              A nossa equipa irá analisá-la e entrar em contacto pelo número <strong>{form.phone}</strong> em breve.
            </p>
            <Link href="/candidatura-estado" className="btn-primary text-sm block mb-3">
              Consultar estado da candidatura →
            </Link>
            <Link href="/" className="btn-outline text-sm block">
              Voltar ao início
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen px-4 py-10" style={{ background: 'rgba(240,247,239,0.6)' }}>

      {isPending && <LoadingOverlay message="A enviar candidatura…" />}

      <div className="w-full max-w-xl mx-auto">

        <Link href="/" className="btn-back mb-6 inline-flex">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Voltar ao início
        </Link>

        <div className="flex justify-center mb-8"><Logo size="lg" href="/" /></div>

        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-3"
            style={{ background: 'rgba(139,26,26,0.08)' }}>
            <span className="text-lg">🤝</span>
            <span className="text-xs font-bold uppercase tracking-widest"
              style={{ color: 'var(--color-accent)' }}>
              Programa de Afiliados
            </span>
          </div>
          <h1 className="font-display text-2xl font-bold text-gray-900 mb-2">
            Candidatura a Afiliado
          </h1>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            Preencha o formulário abaixo. A nossa equipa irá analisar a sua candidatura
            e entrar em contacto em breve.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { icon: '💰', text: `${COMMISSION.amount.toLocaleString()} Kz por venda` },
            { icon: '🔗', text: 'Link único de referido' },
            { icon: '📊', text: 'Painel de comissões' },
          ].map((item, i) => (
            <div key={i} className="card text-center py-4 px-2">
              <div className="text-2xl mb-1">{item.icon}</div>
              <p className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>{item.text}</p>
            </div>
          ))}
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-5">

            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-4"
                style={{ color: 'var(--color-primary)' }}>
                1. Dados pessoais
              </p>
              <div className="space-y-4">
                <div>
                  <label className="input-label">Nome completo <span className="text-red-500">*</span></label>
                  <input type="text" required value={form.full_name} onChange={set('full_name')}
                    className="input-field" placeholder="João Silva" disabled={isPending} />
                </div>
                <div>
                  <label className="input-label">Telefone / WhatsApp <span className="text-red-500">*</span></label>
                  <input type="tel" required value={form.phone} onChange={set('phone')}
                    className="input-field" placeholder="9XX XXX XXX" disabled={isPending} />
                </div>
                <div>
                  <label className="input-label">Nº do BI ou Passaporte <span className="text-red-500">*</span></label>
                  <input type="text" required value={form.national_id} onChange={set('national_id')}
                    className="input-field" placeholder="Ex: 005847291AN014"
                    disabled={isPending} autoComplete="off" />
                </div>
              </div>
            </div>

            <div className="border-t" style={{ borderColor: 'var(--color-border)' }} />

            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-4"
                style={{ color: 'var(--color-primary)' }}>
                2. Perfil comercial
              </p>
              <div className="space-y-4">
                <div>
                  <label className="input-label">Qual é a sua ocupação actual?</label>
                  <select value={form.occupation} onChange={set('occupation')}
                    className="input-field" disabled={isPending}>
                    <option value="">Seleccione uma opção</option>
                    {OCCUPATION_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <label className="input-label">Quantas pessoas tem na sua rede de contactos?</label>
                  <select value={form.network_size} onChange={set('network_size')}
                    className="input-field" disabled={isPending}>
                    <option value="">Seleccione uma opção</option>
                    {NETWORK_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="border-t" style={{ borderColor: 'var(--color-border)' }} />

            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-1"
                style={{ color: 'var(--color-primary)' }}>
                3. Redes sociais
              </p>
              <p className="text-xs mb-4" style={{ color: 'var(--color-text-muted)' }}>
                Partilhe os seus perfis para que possamos avaliar melhor a sua presença digital.
                Pelo menos uma rede social é recomendada.
              </p>
              <div className="space-y-4">
                <div>
                  <label className="input-label">Instagram</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm"
                      style={{ color: 'var(--color-text-muted)' }}>instagram.com/</span>
                    <input type="text" value={form.instagram} onChange={set('instagram')}
                      className="input-field pl-28" placeholder="o_seu_usuario" disabled={isPending} />
                  </div>
                </div>
                <div>
                  <label className="input-label">Facebook</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm"
                      style={{ color: 'var(--color-text-muted)' }}>facebook.com/</span>
                    <input type="text" value={form.facebook} onChange={set('facebook')}
                      className="input-field pl-28" placeholder="o_seu_usuario" disabled={isPending} />
                  </div>
                </div>
                <div>
                  <label className="input-label">TikTok</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm"
                      style={{ color: 'var(--color-text-muted)' }}>tiktok.com/@</span>
                    <input type="text" value={form.tiktok} onChange={set('tiktok')}
                      className="input-field pl-28" placeholder="o_seu_usuario" disabled={isPending} />
                  </div>
                </div>
                <div>
                  <label className="input-label">Outra rede ou canal</label>
                  <input type="text" value={form.other_social} onChange={set('other_social')}
                    className="input-field" placeholder="Ex: YouTube, LinkedIn, WhatsApp Business..."
                    disabled={isPending} />
                </div>
              </div>
            </div>

            <div className="border-t" style={{ borderColor: 'var(--color-border)' }} />

            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-4"
                style={{ color: 'var(--color-primary)' }}>
                4. Motivação
              </p>
              <div>
                <label className="input-label">
                  Porque quer ser afiliado da clínica +Vida? <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  value={form.motivation}
                  onChange={set('motivation')}
                  rows={4}
                  disabled={isPending}
                  placeholder="Descreva brevemente a sua motivação..."
                  className="input-field resize-none"
                />
                <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                  {form.motivation.length}/30 caracteres mínimo
                </p>
              </div>
            </div>

            {error && (
              <div className="rounded-xl p-3 bg-red-50 border border-red-200">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <button type="submit" disabled={isPending}
              className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50">
              {isPending ? <><BtnSpinner />A enviar candidatura…</> : 'Enviar candidatura →'}
            </button>

            <p className="text-xs text-center" style={{ color: 'var(--color-text-muted)' }}>
              A sua candidatura será analisada pela equipa da clínica.
              Será contactado pelo WhatsApp fornecido.
            </p>
          </form>
        </div>

        <div className="mt-6 text-center space-y-2">
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            Já foi aprovado?{' '}
            <Link href="/login" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
              Entrar no painel →
            </Link>
          </p>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            Já se candidatou?{' '}
            <Link href="/candidatura-estado" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
              Ver estado da candidatura →
            </Link>
          </p>
        </div>

      </div>
    </div>
  )
}
