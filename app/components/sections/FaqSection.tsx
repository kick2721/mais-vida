'use client'

// app/components/sections/FaqSection.tsx
// Perguntas frequentes — acordeão animado

import { useState } from 'react'
import { MEMBERSHIP, COMMISSION, BUSINESS } from '@/lib/constants'

const FAQS = [
  {
    q: `Quanto custa o ${MEMBERSHIP.name}?`,
    a: `O ${MEMBERSHIP.name} custa ${MEMBERSHIP.price.toLocaleString('pt-AO')} Kz por ano. Com um único pagamento anual, toda a sua família tem acesso imediato aos descontos em todas as especialidades da clínica.`,
  },
  {
    q: 'O cartão cobre toda a família?',
    a: 'Sim. O cartão é familiar — cobre o titular e os seus dependentes. Basta apresentar o cartão (físico ou digital) em qualquer serviço da clínica para usufruir dos descontos.',
  },
  {
    q: 'Como funciona o pagamento?',
    a: `O pagamento é feito por transferência bancária ou Multicaixa Express. Após efectuar a transferência, submete o comprovativo no formulário online. A nossa equipa valida em até ${MEMBERSHIP.durationMonths > 12 ? '48' : '48'} horas úteis.`,
  },
  {
    q: 'Quanto tempo demora a receber o cartão?',
    a: 'Após confirmação do pagamento, o seu cartão digital é preparado e enviado para o seu WhatsApp em até 48 horas úteis.',
  },
  {
    q: 'Quais são os descontos incluídos?',
    a: 'O cartão inclui 15% de desconto em consultas de especialidade e ecografias, 10% em exames laboratoriais, procedimentos ambulatoriais e farmácia, e consulta de clínica geral a preço fixo de 5.000 Kz.',
  },
  {
    q: 'Como me torno afiliado?',
    a: `Pode registar-se directamente como afiliado em "Registar como Afiliado". Após criar a conta, recebe um link único de referido. Por cada cartão vendido através do seu link, ganha ${COMMISSION.amount.toLocaleString('pt-AO')} Kz de comissão.`,
  },
  {
    q: 'Como recebo as comissões de afiliado?',
    a: 'As comissões são aprovadas e pagas pelo administrador após confirmação de cada venda. Pode acompanhar o seu saldo e historial de pagamentos no painel do afiliado.',
  },
  {
    q: 'Tenho dúvidas — como posso contactar a clínica?',
    a: `Pode contactar-nos pelo WhatsApp ${BUSINESS.phone.main}, por telefone ${BUSINESS.phone.secondary} ou por email ${BUSINESS.email.info}. Estamos disponíveis em dias úteis.`,
  },
]

export default function FaqSection() {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <section id="faq" className="py-20" style={{ background: '#fff' }}>
      <div className="section-container">

        <div className="text-center mb-14">
          <span className="inline-block text-xs font-semibold uppercase tracking-widest mb-3 px-3 py-1 rounded-full"
            style={{ background: 'var(--color-surface)', color: 'var(--color-primary)' }}>
            FAQ
          </span>
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4"
            style={{ color: 'var(--color-text)' }}>
            Perguntas frequentes
          </h2>
          <p className="text-base max-w-xl mx-auto" style={{ color: 'var(--color-text-muted)' }}>
            Tudo o que precisa de saber antes de aderir ao {MEMBERSHIP.name}.
          </p>
        </div>

        <div className="max-w-2xl mx-auto space-y-3">
          {FAQS.map((faq, i) => (
            <div
              key={i}
              className="rounded-2xl border overflow-hidden transition-all"
              style={{
                borderColor: open === i ? 'var(--color-primary)' : 'var(--color-border)',
                background: open === i ? 'rgba(240,247,239,0.6)' : '#fff',
              }}
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between gap-4 px-6 py-4 text-left"
              >
                <span className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>
                  {faq.q}
                </span>
                <span
                  className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold transition-transform"
                  style={{
                    background: 'var(--color-primary)',
                    transform: open === i ? 'rotate(45deg)' : 'rotate(0deg)',
                  }}
                >
                  +
                </span>
              </button>

              {open === i && (
                <div className="px-6 pb-5">
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
                    {faq.a}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* CTA abaixo do FAQ */}
        <div className="text-center mt-12">
          <p className="text-sm mb-4" style={{ color: 'var(--color-text-muted)' }}>
            Ainda tem dúvidas?
          </p>
          <a
            href={`https://wa.me/${BUSINESS.phone.whatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary text-sm py-2.5 px-6 inline-flex items-center gap-2"
          >
            💬 Falar connosco no WhatsApp
          </a>
        </div>

      </div>
    </section>
  )
}
