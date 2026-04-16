// app/components/sections/HowItWorksSection.tsx
'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { CreditCard, Banknote, Send, CheckCircle2 } from 'lucide-react'

const STEPS = [
  {
    icon: CreditCard,
    title: 'Escolha o seu cartão',
    description: 'Selecione a quantidade de cartões que precisa para a sua família.',
  },
  {
    icon: Banknote,
    title: 'Efectue o pagamento',
    description: 'Transfira o valor para a conta bancária indicada. Rápido e seguro.',
  },
  {
    icon: Send,
    title: 'Envie o comprovativo',
    description: 'Carregue a foto do comprovativo de transferência no formulário.',
  },
  {
    icon: CheckCircle2,
    title: 'Receba o cartão',
    description: 'Após validação, o cartão digital é enviado pelo WhatsApp.',
  },
]

export default function HowItWorksSection() {
  return (
    <section id="como-funciona" className="section-dark" style={{ paddingTop: '5rem', paddingBottom: '5rem', position: 'relative', overflow: 'hidden' }}>
      <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <Image src="/stock/consult-a.jpg" alt="" fill style={{ objectFit: 'cover', opacity: 0.28 }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(35,70,18,0.82) 0%, rgba(50,96,34,0.68) 100%)' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, #2d6020 0%, transparent 30%, transparent 70%, #2a5a1c 100%)' }} />
      </div>
      <div className="section-container" style={{ paddingTop: 0, paddingBottom: 0, position: 'relative', zIndex: 1 }}>

        {/* Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <span className="badge-primary mb-4">Simples e rápido</span>
          <h2 className="section-title">Como obter o seu cartão</h2>
          <p className="section-desc">Processo 100% online. Em menos de 48 horas o cartão é seu.</p>
        </motion.div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          {/* Connecting line (desktop) */}
          <div
            className="hidden lg:block absolute top-10 left-0 right-0 h-px"
            style={{ background: 'rgba(74,140,63,0.15)', zIndex: 0, margin: '0 12.5%' }}
          />

          {STEPS.map((step, i) => {
            const Icon = step.icon
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.55, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
                className="flex flex-col items-center text-center relative"
                style={{ zIndex: 1 }}
              >
                {/* Step number ring + icon */}
                <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
                  {/* Outer ring */}
                  <div style={{
                    width: '72px', height: '72px', borderRadius: '50%',
                    background: '#fff',
                    border: '2px solid rgba(74,140,63,0.20)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 4px 20px rgba(74,140,63,0.12)',
                  }}>
                    <div style={{
                      width: '52px', height: '52px', borderRadius: '50%',
                      background: 'var(--color-primary)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Icon size={22} color="#fff" strokeWidth={1.8} />
                    </div>
                  </div>
                  {/* Step number badge */}
                  <div style={{
                    position: 'absolute', top: '-6px', right: '-6px',
                    width: '22px', height: '22px', borderRadius: '50%',
                    background: 'var(--color-primary-dark)',
                    color: '#fff', fontSize: '11px', fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '2px solid rgba(35,70,18,0.9)',
                  }}>
                    {i + 1}
                  </div>
                </div>

                <h3 className="font-serif font-bold text-lg mb-2" style={{ color: '#fff' }}>
                  {step.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.70)', maxWidth: '200px' }}>
                  {step.description}
                </p>
              </motion.div>
            )
          })}
        </div>

        {/* CTA */}
        <motion.div
          className="text-center mt-14"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
        >
          <Link href="/comprar" className="btn-primary text-base">
            Começar agora
          </Link>
          <p className="text-xs mt-3" style={{ color: 'rgba(255,255,255,0.55)' }}>
            Cartão válido por 12 meses a partir da data de emissão
          </p>
        </motion.div>
      </div>
    </section>
  )
}
