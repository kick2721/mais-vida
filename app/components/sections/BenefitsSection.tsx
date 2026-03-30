// app/components/sections/BenefitsSection.tsx
// Secção de benefícios do cartão — usa BENEFITS de constants.ts

import { BENEFITS, MEMBERSHIP } from '@/lib/constants'

export default function BenefitsSection() {
  return (
    <section id="beneficios" className="py-20" style={{ background: '#fff' }}>
      <div className="section-container">

        {/* Cabeçalho */}
        <div className="text-center mb-14">
          <span
            className="inline-block text-xs font-semibold uppercase tracking-widest mb-3 px-3 py-1 rounded-full"
            style={{ background: 'var(--color-surface)', color: 'var(--color-primary)' }}
          >
            O que está incluído
          </span>
          <h2
            className="font-display text-3xl md:text-4xl font-bold mb-4"
            style={{ color: 'var(--color-text)' }}
          >
            Benefícios do {MEMBERSHIP.name}
          </h2>
          <p className="text-base max-w-xl mx-auto" style={{ color: 'var(--color-text-muted)' }}>
            Com um único cartão anual, acede a descontos em todas as
            especialidades da clínica.
          </p>
        </div>

        {/* Grid de benefícios */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {BENEFITS.map((b, i) => (
            <div
              key={i}
              className="card flex items-start gap-4 hover:shadow-md transition-shadow"
            >
              <div
                className="flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg"
                style={{ background: 'var(--color-primary)' }}
              >
                {b.type === 'percentage' ? `${b.discount}%` : 'Kz'}
              </div>
              <div>
                <p
                  className="font-semibold text-sm leading-snug mb-1"
                  style={{ color: 'var(--color-text)' }}
                >
                  {b.service}
                </p>
                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  {b.type === 'percentage'
                    ? `${b.discount}% de desconto`
                    : `Preço fixo: ${b.discount.toLocaleString('pt-AO')} Kz`}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <a href="/comprar" className="btn-primary text-base py-3 px-10">
            Quero o meu {MEMBERSHIP.name}
          </a>
        </div>
      </div>
    </section>
  )
}
