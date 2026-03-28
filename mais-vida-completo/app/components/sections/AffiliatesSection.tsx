// app/components/sections/AffiliatesSection.tsx
// Secção de afiliados na landing page

import Link from 'next/link'
import { COMMISSION, MEMBERSHIP, REFERRAL } from '@/lib/constants'

const PERKS = [
  {
    icon: '🔗',
    title: 'Link único',
    description: `Recebe um código pessoal ${REFERRAL.prefix}XXXXXX para partilhar com a tua rede.`,
  },
  {
    icon: '💰',
    title: `${COMMISSION.amount.toLocaleString('pt-AO')} Kz por venda`,
    description: 'Por cada cartão vendido através do teu link, recebe uma comissão garantida.',
  },
  {
    icon: '📊',
    title: 'Painel de controlo',
    description: 'Acompanha as tuas vendas, comissões e pagamentos em tempo real.',
  },
  {
    icon: '✅',
    title: 'Sem investimento',
    description: 'Registo gratuito. Só ganhas quando vendes — sem riscos, sem custos fixos.',
  },
]

export default function AffiliatesSection() {
  return (
    <section
      id="afiliados"
      className="py-20"
      style={{ background: '#fff' }}
    >
      <div className="section-container">
        <div className="flex flex-col lg:flex-row gap-14 items-center">

          {/* Texto */}
          <div className="flex-1">
            <span
              className="inline-block text-xs font-semibold uppercase tracking-widest mb-3 px-3 py-1 rounded-full"
              style={{ background: 'var(--color-surface)', color: 'var(--color-primary)' }}
            >
              Programa de Afiliados
            </span>
            <h2
              className="font-display text-3xl md:text-4xl font-bold mb-4"
              style={{ color: 'var(--color-text)' }}
            >
              Ganha comissões a{' '}
              <span style={{ color: 'var(--color-primary)' }}>recomendar saúde</span>
            </h2>
            <p className="text-base mb-8 max-w-md" style={{ color: 'var(--color-text-muted)' }}>
              Partilha o teu link, ajuda as pessoas a aceder a cuidados de saúde com desconto
              e recebe {COMMISSION.amount.toLocaleString('pt-AO')} Kz por cada{' '}
              {MEMBERSHIP.name} vendido.
            </p>
            <Link
              href="/register?role=affiliate"
              className="btn-primary text-base py-3 px-8"
            >
              Tornar-me Afiliado
            </Link>
            <p className="mt-3 text-xs" style={{ color: 'var(--color-text-muted)' }}>
              Já tens conta?{' '}
              <Link href="/login" style={{ color: 'var(--color-primary)' }}>
                Entrar no painel
              </Link>
            </p>
          </div>

          {/* Grid de perks */}
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {PERKS.map((perk, i) => (
              <div key={i} className="card">
                <div className="text-3xl mb-3">{perk.icon}</div>
                <h3
                  className="font-semibold text-sm mb-1"
                  style={{ color: 'var(--color-text)' }}
                >
                  {perk.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
                  {perk.description}
                </p>
              </div>
            ))}
          </div>

        </div>
      </div>
    </section>
  )
}
