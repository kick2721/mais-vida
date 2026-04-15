// app/components/sections/BenefitsSection.tsx
'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Stethoscope, ScanLine, FlaskConical, Syringe, BedDouble, Pill, HeartPulse } from 'lucide-react'
import { BENEFITS, MEMBERSHIP } from '@/lib/constants'

const ICONS = [Stethoscope, ScanLine, FlaskConical, Syringe, BedDouble, Pill, HeartPulse]

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
}
const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as const } },
}

export default function BenefitsSection() {
  return (
    <section id="beneficios" className="py-24" style={{ background: '#fff' }}>
      <div className="section-container" style={{ paddingTop: 0, paddingBottom: 0 }}>

        {/* Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <span className="badge-primary mb-4">O que está incluído</span>
          <h2 className="section-title">Benefícios do {MEMBERSHIP.name}</h2>
          <p className="section-desc">
            Com um único cartão anual, acede a descontos em todas as especialidades da clínica.
          </p>
        </motion.div>

        {/* Grid */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-60px' }}
        >
          {BENEFITS.map((b, i) => {
            const Icon = ICONS[i] ?? HeartPulse
            return (
              <motion.div
                key={i}
                variants={item}
                whileHover={{ y: -4, boxShadow: '0 12px 36px rgba(74,140,63,0.12)' }}
                className="card flex items-start gap-4"
                style={{ cursor: 'default', transition: 'box-shadow 0.2s' }}
              >
                <div
                  className="flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center"
                  style={{ background: 'rgba(74,140,63,0.10)' }}
                >
                  <Icon size={22} style={{ color: 'var(--color-primary)' }} />
                </div>
                <div>
                  <p className="font-semibold text-sm leading-snug mb-1.5" style={{ color: 'var(--color-primary-dark)' }}>
                    {b.service}
                  </p>
                  <span
                    className="inline-block text-xs font-bold px-2.5 py-1 rounded-full"
                    style={{
                      background: b.type === 'percentage' ? 'rgba(74,140,63,0.10)' : 'rgba(184,150,12,0.12)',
                      color: b.type === 'percentage' ? 'var(--color-primary)' : 'var(--color-gold)',
                    }}
                  >
                    {b.type === 'percentage'
                      ? `${b.discount}% desconto`
                      : `Preço fixo: ${b.discount.toLocaleString('pt-AO')} Kz`}
                  </span>
                </div>
              </motion.div>
            )
          })}
        </motion.div>

        {/* CTA */}
        <motion.div
          className="text-center mt-14"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
        >
          <Link href="/comprar" className="btn-primary text-base">
            Quero o meu {MEMBERSHIP.name}
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
