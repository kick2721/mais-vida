import Link from 'next/link'
import { COMMISSION, MEMBERSHIP, REFERRAL } from '@/lib/constants'

const PERKS = [
  { icon: '🔗', title: 'Link único', description: `Recebe um código pessoal ${REFERRAL.prefix}XXXXXX para partilhar com a tua rede.` },
  { icon: '💰', title: `${COMMISSION.amount.toLocaleString('pt-AO')} Kz por venda`, description: 'Por cada cartão vendido através do teu link, recebe uma comissão garantida.' },
  { icon: '📊', title: 'Painel de controlo', description: 'Acompanha as tuas vendas, comissões e pagamentos em tempo real.' },
  { icon: '✅', title: 'Sem investimento', description: 'Registo gratuito. Só ganhas quando vendes — sem riscos, sem custos fixos.' },
]

export default function AffiliatesSection() {
  return (
    <section id="afiliados" className="py-20" style={{ background: 'rgba(255,255,255,0.7)' }}>
      <div className="section-container">
        <div className="flex flex-col lg:flex-row gap-14 items-center">

          {/* Texto */}
          <div className="flex-1">
            <span className="inline-block text-xs font-semibold uppercase tracking-widest mb-3 px-3 py-1 rounded-full"
              style={{ background: 'rgba(139,26,26,0.08)', color: 'var(--color-accent)' }}>
              Programa de Afiliados
            </span>
            <h2 className="font-display text-3xl md:text-4xl font-bold mb-4" style={{ color: 'var(--color-text)' }}>
              Ganha comissões a{' '}
              <span style={{ color: 'var(--color-primary)' }}>recomendar saúde</span>
            </h2>
            <p className="text-base mb-8 max-w-md" style={{ color: 'var(--color-text-muted)' }}>
              Partilha o teu link, ajuda as pessoas a aceder a cuidados de saúde com desconto
              e recebe {COMMISSION.amount.toLocaleString('pt-AO')} Kz por cada {MEMBERSHIP.name} vendido.
            </p>

            {/* CTA claramente separado */}
            <div className="p-5 rounded-2xl border-2 inline-block" style={{ borderColor: 'rgba(74,140,63,0.25)', background: 'rgba(240,247,239,0.8)' }}>
              <p className="text-sm font-semibold mb-1" style={{ color: 'var(--color-text)' }}>
                Quero tornar-me afiliado:
              </p>
              <p className="text-xs mb-3" style={{ color: 'var(--color-text-muted)' }}>
                Preencha o formulário de candidatura. A nossa equipa analisa e aprova manualmente.
              </p>
              <Link href="/afiliado-candidatura" className="btn-primary text-base py-3 px-8 block text-center">
                Candidatar-me como Afiliado →
              </Link>
              <p className="mt-3 text-xs text-center" style={{ color: 'var(--color-text-muted)' }}>
                Já foi aprovado?{' '}
                <Link href="/login" style={{ color: 'var(--color-primary)' }}>Entrar no painel</Link>
              </p>
            </div>

            {/* Separador visual claro */}
            <div className="mt-6 pt-5 border-t" style={{ borderColor: 'var(--color-border)' }}>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                🛒 Quer comprar um cartão para si?{' '}
                <Link href="/comprar" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
                  Obter Cartão +Vida →
                </Link>
              </p>
            </div>
          </div>

          {/* Grid de perks */}
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {PERKS.map((perk, i) => (
              <div key={i} className="card">
                <div className="text-3xl mb-3">{perk.icon}</div>
                <h3 className="font-semibold text-sm mb-1" style={{ color: 'var(--color-text)' }}>
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
