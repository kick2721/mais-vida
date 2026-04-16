'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Link2, TrendingUp, Clock, Wallet } from 'lucide-react'
import { COMMISSION, MEMBERSHIP } from '@/lib/constants'

const PERKS = [
  {
    icon: Link2,
    title: 'Link exclusivo',
    description: 'Partilhe o seu link personalizado e acompanhe as vendas em tempo real.',
  },
  {
    icon: TrendingUp,
    title: `${COMMISSION.amount} Kz por venda`,
    description: `Cada cartão vendido gera ${COMMISSION.amount} ${COMMISSION.currency} de comissão para si.`,
  },
  {
    icon: Clock,
    title: 'Sem stock',
    description: 'Produto 100% digital. Sem investimento inicial, sem risco.',
  },
  {
    icon: Wallet,
    title: 'Pagamento mensal',
    description: `Receba as suas comissões todos os meses, a partir de ${COMMISSION.withdrawalMinimum} Kz acumulados.`,
  },
]

export default function AffiliatesSection() {
  return (
    <section
      id="afiliados"
      style={{ background: 'var(--color-primary-dark)', paddingTop: '5rem', paddingBottom: '5rem', position: 'relative', overflow: 'hidden' }}
    >
      <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <Image src="/stock/family-a.jpg" alt="" fill style={{ objectFit: 'cover', opacity: 0.50 }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(115deg, rgba(30,61,24,0.85) 0%, rgba(30,61,24,0.62) 55%, rgba(30,61,24,0.35) 100%)' }} />
      </div>
      <div className="section-container" style={{ paddingTop: 0, paddingBottom: 0, position: 'relative', zIndex: 1 }}>
        <div className="grid lg:grid-cols-2 gap-14 items-center">

          {/* Left: Text */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
          >
            <span
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full mb-6"
              style={{ background: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.9)', letterSpacing: '0.05em', textTransform: 'uppercase' }}
            >
              Programa de afiliados
            </span>

            <h2
              className="font-serif font-bold mb-6 leading-tight"
              style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', color: '#fff' }}
            >
              Ganhe dinheiro a{' '}
              <span style={{ color: 'rgba(106,173,94,0.9)', fontStyle: 'italic' }}>
                promover saúde
              </span>
            </h2>

            <p className="text-base mb-8 leading-relaxed" style={{ color: 'rgba(255,255,255,0.72)', maxWidth: '420px' }}>
              Torne-se afiliado Mais Vida e ganhe{' '}
              <strong style={{ color: '#fff' }}>{COMMISSION.amount} Kz</strong> por cada{' '}
              {MEMBERSHIP.name} vendido através do seu link. Sem investimento, sem stock.
            </p>

            {/* CTA card */}
            <div style={{
              background: '#fff',
              borderRadius: '16px',
              padding: '1.5rem',
              boxShadow: '0 8px 40px rgba(0,0,0,0.20)',
              display: 'inline-block',
              maxWidth: '380px',
              width: '100%',
            }}>
              <p className="font-bold text-lg mb-1" style={{ color: 'var(--color-primary-dark)' }}>
                Pronto para começar?
              </p>
              <p className="text-sm mb-4" style={{ color: 'var(--color-text-muted)' }}>
                Candidate-se agora. Aprovação em 24–48h.
              </p>
              <div className="flex gap-3 flex-wrap">
                <Link href="/afiliado-candidatura" className="btn-primary text-sm">
                  Candidatar-me
                </Link>
                <Link href="/candidatura-estado" className="btn-outline text-sm" style={{ borderColor: 'var(--color-primary)' }}>
                  Ver candidatura
                </Link>
              </div>
            </div>
          </motion.div>

          {/* Right: Perks grid */}
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
          >
            {PERKS.map((p, i) => {
              const Icon = p.icon
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 + i * 0.1 }}
                  style={{
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: '16px',
                    padding: '1.25rem',
                  }}
                >
                  <div style={{
                    width: '44px', height: '44px', borderRadius: '12px',
                    background: 'rgba(255,255,255,0.12)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: '0.75rem',
                  }}>
                    <Icon size={20} color="rgba(255,255,255,0.9)" />
                  </div>
                  <h3 className="font-bold text-sm mb-1" style={{ color: '#fff' }}>{p.title}</h3>
                  <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.65)' }}>{p.description}</p>
                </motion.div>
              )
            })}
          </motion.div>
        </div>
      </div>
    </section>
  )
}
