// app/components/sections/HeroSection.tsx
'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronDown, ShoppingCart, Search, Sparkles } from 'lucide-react'

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 28 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
})

export default function HeroSection() {
  const [dropdownOpen, setDropdownOpen] = useState(false)

  return (
    <section className="section-dark" style={{ background: '#1e4a14', overflow: 'hidden', position: 'relative' }}>
      {/* Clinic photo bg with strong green/white overlay */}
      <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        <Image
          src="/stock/doctor-d.jpg"
          alt=""
          fill
          priority
          style={{ objectFit: 'cover', opacity: 0.45 }}
        />
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(110deg, rgba(35,70,18,0.80) 0%, rgba(50,96,34,0.60) 50%, rgba(50,96,34,0.30) 100%)',
        }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 50%, #2a5a1c 100%)' }} />
        {/* Heartbeat ECG line */}
        <svg
          style={{ position: 'absolute', bottom: 90, left: 0, width: '100%', opacity: 0.18 }}
          viewBox="0 0 1440 120" preserveAspectRatio="none" height="80" fill="none"
        >
          <path
            d="M0 60 L200 60 L240 60 L260 30 L280 90 L300 20 L320 100 L340 60 L520 60 L560 60 L580 40 L600 80 L620 60 L820 60 L860 60 L880 25 L900 95 L920 15 L940 105 L960 60 L1140 60 L1180 60 L1200 50 L1220 70 L1240 60 L1440 60"
            stroke="#4A8C3F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          />
        </svg>
      </div>
      <div className="section-container" style={{ paddingTop: '5rem', paddingBottom: '0', position: 'relative', zIndex: 1 }}>
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

          {/* ── Left: Text ─────────────────────────────────── */}
          <div>
            <motion.div {...fadeUp(0.05)}>
              <span className="badge-primary mb-6 inline-flex">
                <Sparkles size={12} />
                Saúde acessível em Angola
              </span>
            </motion.div>

            <motion.h1
              {...fadeUp(0.15)}
              className="font-serif font-bold leading-tight mb-6"
              style={{ fontSize: 'clamp(2.4rem, 5vw, 4rem)', color: '#fff' }}
            >
              O seu cartão de{' '}
              <span style={{ color: '#8fd45f', fontStyle: 'italic' }}>
                saúde privada
              </span>{' '}
              a preço justo
            </motion.h1>

            <motion.p
              {...fadeUp(0.25)}
              className="text-lg mb-10 leading-relaxed"
              style={{ color: 'rgba(255,255,255,0.78)', maxWidth: '460px' }}
            >
              Aceda a consultas, exames e tratamentos na Clínica Mais Vida com descontos
              de até <strong style={{ color: '#8fd45f' }}>15%</strong>.
              Um cartão, toda a família protegida.
            </motion.p>

            <motion.div {...fadeUp(0.35)} className="flex flex-wrap gap-3 mb-14">
              {/* Dropdown Obter Cartão */}
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setDropdownOpen(o => !o)}
                  className="btn-primary text-base"
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <ShoppingCart size={18} />
                  Obter Cartão
                  <ChevronDown
                    size={16}
                    style={{ transition: 'transform 0.2s', transform: dropdownOpen ? 'rotate(180deg)' : 'none' }}
                  />
                </button>
                {dropdownOpen && (
                  <div style={{
                    position: 'absolute', top: 'calc(100% + 8px)', left: 0, zIndex: 50,
                    background: '#fff', borderRadius: '14px', minWidth: '230px',
                    boxShadow: '0 12px 40px rgba(0,0,0,0.14)',
                    border: '1px solid var(--color-border)', overflow: 'hidden',
                  }}>
                    <Link href="/comprar"
                      onClick={() => setDropdownOpen(false)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '12px',
                        padding: '14px 18px', fontSize: '14px', fontWeight: 500,
                        color: 'var(--color-primary)', textDecoration: 'none',
                        borderBottom: '1px solid var(--color-border)',
                        background: 'rgba(74,140,63,0.04)',
                      }}>
                      <ShoppingCart size={16} />
                      <div>
                        <div style={{ fontWeight: 600 }}>Comprar Cartão</div>
                        <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Adquirir um novo cartão</div>
                      </div>
                    </Link>
                    <Link href="/seguimento"
                      onClick={() => setDropdownOpen(false)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '12px',
                        padding: '14px 18px', fontSize: '14px', fontWeight: 500,
                        color: 'var(--color-text)', textDecoration: 'none',
                      }}>
                      <Search size={16} />
                      <div>
                        <div style={{ fontWeight: 600 }}>Ver Estado do Pedido</div>
                        <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Consultar pedido existente</div>
                      </div>
                    </Link>
                  </div>
                )}
              </div>

              <Link href="/#beneficios" className="btn-outline text-base">
                Ver benefícios
              </Link>
            </motion.div>

          </div>

          {/* ── Right: Cards ───────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
            className="relative flex justify-center items-center"
            style={{ minHeight: '520px' }}
          >
            {/* Back card — CSS float animation */}
            <div
              style={{
                position: 'absolute',
                right: '4%',
                top: '4%',
                transform: 'rotate(6deg)',
                zIndex: 1,
                borderRadius: '18px',
                overflow: 'hidden',
                boxShadow: '0 20px 60px rgba(0,0,0,0.22)',
                width: '380px',
                maxWidth: '85vw',
                animation: 'floatB 4.5s ease-in-out infinite',
              }}
            >
              <Image
                src="/cartao-verso.webp"
                alt="Verso do Cartão Mais Vida"
                width={420}
                height={265}
                style={{ display: 'block', width: '100%', height: 'auto' }}
              />
            </div>

            {/* Front card — CSS float animation */}
            <div
              style={{
                position: 'relative',
                transform: 'rotate(-4deg)',
                zIndex: 2,
                borderRadius: '18px',
                overflow: 'hidden',
                boxShadow: '0 30px 80px rgba(0,0,0,0.28)',
                width: '400px',
                maxWidth: '90vw',
                marginTop: '60px',
                animation: 'floatF 4s ease-in-out infinite',
              }}
            >
              <Image
                src="/cartao-frente.webp"
                alt="Frente do Cartão Mais Vida"
                width={450}
                height={284}
                priority
                style={{ display: 'block', width: '100%', height: 'auto' }}
              />
            </div>

            {/* Floating badge */}
            <div
              style={{
                position: 'absolute',
                bottom: '10%',
                left: '5%',
                zIndex: 10,
                background: '#fff',
                borderRadius: '14px',
                padding: '10px 16px',
                boxShadow: '0 8px 30px rgba(0,0,0,0.14)',
                border: '1px solid rgba(74,140,63,0.15)',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <div style={{
                width: '36px', height: '36px', borderRadius: '50%',
                background: 'rgba(74,140,63,0.12)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <span style={{ fontSize: '18px' }}>✓</span>
              </div>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-primary-dark)' }}>
                  Válido em Angola
                </div>
                <div style={{ fontSize: '11px', color: '#6b7280' }}>
                  Clínica Mais Vida
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

    </section>
  )
}
