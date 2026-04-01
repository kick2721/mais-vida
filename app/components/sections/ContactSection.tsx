'use client'

// app/components/sections/ContactSection.tsx
// Formulário de contacto directo na landing page

import { useState, useTransition } from 'react'
import { BUSINESS, MEMBERSHIP } from '@/lib/constants'
import { createBrowserSupabaseClient } from '@/lib/supabase-client'

export default function ContactSection() {
  const [form, setForm] = useState({ name: '', phone: '', message: '' })
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [key]: e.target.value }))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!form.name || !form.phone) { setError('Por favor preencha o nome e telefone.'); return }

    startTransition(async () => {
      // Guardar em Supabase na tabela contact_requests
      const supabase = createBrowserSupabaseClient()
      const { error: dbError } = await supabase
        .from('contact_requests')
        .insert({
          name: form.name,
          phone: form.phone,
          message: form.message || null,
        })

      if (dbError) {
        // Se a tabela não existe ainda, não bloquear — abrir WhatsApp como fallback
        const msg = encodeURIComponent(`Olá! Sou ${form.name} e gostaria de saber mais sobre o ${MEMBERSHIP.name}.${form.message ? ' ' + form.message : ''}`)
        window.open(`https://wa.me/${BUSINESS.phone.whatsapp}?text=${msg}`, '_blank')
      }

      setSent(true)
    })
  }

  return (
    <section id="contacto" className="py-20" style={{ background: 'var(--color-surface)' }}>
      <div className="section-container">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">

          {/* Texto lado esquerdo */}
          <div>
            <span className="inline-block text-xs font-semibold uppercase tracking-widest mb-3 px-3 py-1 rounded-full"
              style={{ background: '#fff', color: 'var(--color-primary)' }}>
              Contacto
            </span>
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4"
              style={{ color: 'var(--color-text)' }}>
              Tem alguma dúvida?{' '}
              <span style={{ color: 'var(--color-primary)' }}>Fale connosco</span>
            </h2>
            <p className="text-base mb-8" style={{ color: 'var(--color-text-muted)' }}>
              A nossa equipa responde em dias úteis. Pode também contactar-nos directamente pelos canais abaixo.
            </p>

            <div className="space-y-4">
              {[
                { icon: '📞', label: 'Telefone', value: BUSINESS.phone.main, href: `tel:${BUSINESS.phone.main}` },
                { icon: '💬', label: 'WhatsApp', value: 'Enviar mensagem', href: `https://wa.me/${BUSINESS.phone.whatsapp}` },
                { icon: '✉️', label: 'Email', value: BUSINESS.email.info, href: `mailto:${BUSINESS.email.info}` },
                { icon: '📍', label: 'Morada', value: BUSINESS.address, href: undefined },
              ].map(item => (
                <div key={item.label} className="flex items-start gap-3">
                  <span className="text-xl mt-0.5">{item.icon}</span>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide mb-0.5"
                      style={{ color: 'var(--color-text-muted)' }}>{item.label}</p>
                    {item.href ? (
                      <a href={item.href} target={item.href.startsWith('http') ? '_blank' : undefined}
                        rel="noopener noreferrer"
                        className="text-sm font-medium hover:opacity-70 transition-opacity"
                        style={{ color: 'var(--color-primary)' }}>
                        {item.value}
                      </a>
                    ) : (
                      <p className="text-sm" style={{ color: 'var(--color-text)' }}>{item.value}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Formulário lado direito */}
          <div className="card">
            {!sent ? (
              <>
                <h3 className="font-display text-lg font-bold text-gray-900 mb-5">
                  Envie-nos uma mensagem
                </h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="input-label">Nome completo</label>
                    <input type="text" required value={form.name} onChange={set('name')}
                      className="input-field" placeholder="João Silva" disabled={isPending} />
                  </div>
                  <div>
                    <label className="input-label">Telefone / WhatsApp</label>
                    <input type="tel" required value={form.phone} onChange={set('phone')}
                      className="input-field" placeholder="9XX XXX XXX" disabled={isPending} />
                  </div>
                  <div>
                    <label className="input-label">
                      Mensagem <span style={{ color: 'var(--color-text-muted)' }}>(opcional)</span>
                    </label>
                    <textarea value={form.message} onChange={set('message')}
                      rows={3} disabled={isPending}
                      placeholder="Escreva a sua dúvida ou pedido de informação..."
                      className="input-field resize-none" />
                  </div>

                  {error && (
                    <p className="text-sm text-red-600">{error}</p>
                  )}

                  <button type="submit" disabled={isPending} className="btn-primary w-full">
                    {isPending ? 'A enviar...' : 'Enviar mensagem →'}
                  </button>
                </form>
              </>
            ) : (
              <div className="text-center py-8">
                <div className="text-5xl mb-4">✅</div>
                <h3 className="font-display text-lg font-bold text-gray-900 mb-2">
                  Mensagem recebida!
                </h3>
                <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                  A nossa equipa entrará em contacto em breve pelo número <strong>{form.phone}</strong>.
                </p>
                <button onClick={() => { setSent(false); setForm({ name: '', phone: '', message: '' }) }}
                  className="btn-outline text-sm mt-6">
                  Enviar outra mensagem
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </section>
  )
}
