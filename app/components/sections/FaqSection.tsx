'use client'

// app/components/sections/FaqSection.tsx

import { useState } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, HelpCircle } from 'lucide-react'

const FAQS = [
  {
    q: 'Quanto custa o cartão?',
    a: 'O Cartão +Vida custa 5.000 Kz por ano. Com um único pagamento, tem acesso a descontos em todas as especialidades durante 12 meses.',
  },
  {
    q: 'Como recebo o cartão?',
    a: 'Após o pagamento e validação do comprovativo (normalmente em menos de 48 horas), o cartão digital é enviado pelo WhatsApp.',
  },
  {
    q: 'Posso usar o cartão para toda a família?',
    a: 'Cada membro da família precisa do seu próprio cartão. Pode comprar vários cartões na mesma compra com preço individual de 5.000 Kz cada.',
  },
  {
    q: 'Onde posso usar o cartão?',
    a: 'O cartão é válido exclusivamente na Clínica Mais Vida (+Vida — Centro de Diagnóstico e Especialidades), localizada no Edifício Akuchi Plaza, Bairro Patriota, Luanda.',
  },
  {
    q: 'O que acontece se o meu cartão expirar?',
    a: 'Após os 12 meses de validade, pode renovar adquirindo um novo cartão. O processo é idêntico ao da primeira compra.',
  },
  {
    q: 'Como me candidato a afiliado?',
    a: 'Preencha o formulário de candidatura disponível na secção "Afiliados". Após análise (24–48h), receberá um e-mail de aprovação com o seu link exclusivo.',
  },
]

export default function FaqSection() {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <section id="faq" className="section-dark" style={{ paddingTop: '5rem', paddingBottom: '5rem', position: 'relative', overflow: 'hidden' }}>
      <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <Image src="/stock/nurse-a.jpg" alt="" fill style={{ objectFit: 'cover', opacity: 0.28 }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(160deg, rgba(17,34,9,0.90) 0%, rgba(30,61,24,0.82) 100%)' }} />
      </div>
      <div className="section-container" style={{ paddingTop: 0, paddingBottom: 0, position: 'relative', zIndex: 1 }}>

        {/* Header */}
        <motion.div
          className="text-center mb-14"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <span className="badge-primary mb-4">
            <HelpCircle size={12} />
            Dúvidas frequentes
          </span>
          <h2 className="section-title">Perguntas frequentes</h2>
          <p className="section-desc">Encontre respostas para as dúvidas mais comuns sobre o Cartão +Vida.</p>
        </motion.div>

        {/* Accordion */}
        <motion.div
          className="max-w-2xl mx-auto space-y-3"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
        >
          {FAQS.map((faq, i) => {
            const isOpen = open === i
            return (
              <div
                key={i}
                style={{
                  borderRadius: '16px',
                  border: `1.5px solid ${isOpen ? 'rgba(106,173,94,0.45)' : 'rgba(255,255,255,0.12)'}`,
                  background: isOpen ? 'rgba(106,173,94,0.12)' : 'rgba(255,255,255,0.07)',
                  overflow: 'hidden',
                  transition: 'border-color 0.2s, background 0.2s',
                  boxShadow: isOpen ? '0 4px 20px rgba(74,140,63,0.08)' : 'none',
                }}
              >
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  style={{
                    width: '100%', display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', gap: '16px',
                    padding: '1.125rem 1.25rem',
                    background: 'none', border: 'none', cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <span style={{
                    fontSize: '15px', fontWeight: 600,
                    color: isOpen ? 'var(--color-primary-light)' : '#fff',
                    transition: 'color 0.2s',
                  }}>
                    {faq.q}
                  </span>
                  <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.25 }}
                    style={{ flexShrink: 0 }}
                  >
                    <ChevronDown
                      size={18}
                      style={{ color: isOpen ? 'var(--color-primary-light)' : 'rgba(255,255,255,0.55)' }}
                    />
                  </motion.div>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      key="answer"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
                      style={{ overflow: 'hidden' }}
                    >
                      <div style={{
                        padding: '0 1.25rem 1.25rem',
                        fontSize: '14px', lineHeight: 1.7,
                        color: 'rgba(255,255,255,0.70)',
                        borderTop: '1px solid rgba(255,255,255,0.10)',
                        paddingTop: '0.875rem',
                      }}>
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}
