// app/components/sections/HeroSection.tsx
'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { BUSINESS, MEMBERSHIP } from '@/lib/constants'

export default function HeroSection() {
  const [cartaoOpen, setCartaoOpen] = useState(false)

  return (
    <section className="relative overflow-hidden" style={{ background: 'rgba(240,247,239,0.75)' }}>

      <style>{`
        .card-frente {
          transform: rotate(-2deg);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
          box-shadow: 0 20px 60px rgba(74,140,63,0.22), 0 4px 16px rgba(0,0,0,0.12);
        }
        .card-frente:hover {
          transform: rotate(0deg) scale(1.03);
          box-shadow: 0 28px 70px rgba(74,140,63,0.30), 0 6px 20px rgba(0,0,0,0.15);
        }
        .card-verso {
          transform: rotate(2deg);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
          box-shadow: 0 20px 60px rgba(139,26,26,0.15), 0 4px 16px rgba(0,0,0,0.10);
          margin-left: 24px;
        }
        .card-verso:hover {
          transform: rotate(0deg) scale(1.03);
          box-shadow: 0 28px 70px rgba(139,26,26,0.22), 0 6px 20px rgba(0,0,0,0.13);
        }
        .cartao-dropdown {
          animation: fadeInDown 0.18s ease;
        }
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="section-container relative z-10 py-20 md:py-28">
        <div className="flex flex-col md:flex-row items-center gap-12 md:gap-16">

          {/* ── Texto izquierda ── */}
          <div className="flex-1 text-center md:text-left">
            <span
              className="inline-block text-xs font-semibold uppercase tracking-widest mb-4 px-3 py-1 rounded-full"
              style={{ background: 'var(--color-primary)', color: '#fff', letterSpacing: '0.15em' }}
            >
              Centro de Diagnóstico e Especialidades
            </span>

            <h1
              className="font-display text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6"
              style={{ color: 'var(--color-text)' }}
            >
              O seu cartão de saúde{' '}
              <span style={{ color: 'var(--color-primary)' }}>com descontos reais</span>
            </h1>

            <p
              className="text-lg md:text-xl mb-8 max-w-lg mx-auto md:mx-0"
              style={{ color: 'var(--color-text-muted)' }}
            >
              {BUSINESS.tagline}. Aceda a consultas, exames e muito mais com descontos
              exclusivos em consultas, exames e muito mais.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">

              {/* ── Botão duplo: Obter Cartão ── */}
              <div className="relative">
                <button
                  onClick={() => setCartaoOpen(o => !o)}
                  className="btn-primary text-base py-3 px-8 flex items-center gap-2"
                >
                  Obter {MEMBERSHIP.name}
                  <svg
                    width="16" height="16" viewBox="0 0 16 16" fill="none"
                    style={{ transition: 'transform 0.2s', transform: cartaoOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                  >
                    <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>

                {cartaoOpen && (
                  <div
                    className="cartao-dropdown absolute left-0 top-full mt-2 z-50 rounded-2xl border shadow-xl overflow-hidden"
                    style={{ minWidth: '220px', background: '#fff', borderColor: 'var(--color-border)' }}
                  >
                    <Link
                      href="/comprar"
                      onClick={() => setCartaoOpen(false)}
                      className="flex items-center gap-3 px-5 py-4 hover:bg-green-50 transition-colors"
                    >
                      <span className="text-xl">💳</span>
                      <div>
                        <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                          Comprar Cartão
                        </p>
                        <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                          Adquirir um novo cartão
                        </p>
                      </div>
                    </Link>
                    <div style={{ height: '1px', background: 'var(--color-border)' }} />
                    <Link
                      href="/seguimento"
                      onClick={() => setCartaoOpen(false)}
                      className="flex items-center gap-3 px-5 py-4 hover:bg-green-50 transition-colors"
                    >
                      <span className="text-xl">📦</span>
                      <div>
                        <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                          Ver Estado do Pedido
                        </p>
                        <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                          Consultar um pedido já feito
                        </p>
                      </div>
                    </Link>
                  </div>
                )}
              </div>

              <Link href="/#beneficios" className="btn-outline text-base py-3 px-8">
                Ver Benefícios
              </Link>
            </div>

            <p className="mt-6 text-sm" style={{ color: 'var(--color-text-muted)' }}>
              💳 Apenas{' '}
              <strong style={{ color: 'var(--color-primary)' }}>
                {MEMBERSHIP.price.toLocaleString('pt-AO')} {MEMBERSHIP.currencySymbol}
              </strong>{' '}
              por ano · Válido {MEMBERSHIP.durationMonths} meses
            </p>
          </div>

          {/* ── Tarjetas DESKTOP ── */}
          <div className="flex-shrink-0 hidden md:flex flex-col items-end justify-center gap-1">
            <div className="flex flex-col gap-5" style={{ width: 380 }}>

              <div className="card-frente rounded-2xl overflow-hidden">
                <Image
                  src="/cartao-frente.png"
                  alt="Cartão de Membro +Vida — Frente"
                  width={380}
                  height={252}
                  style={{ width: '100%', height: 'auto', display: 'block' }}
                  priority
                />
              </div>

              <div className="card-verso rounded-2xl overflow-hidden">
                <Image
                  src="/cartao-verso.png"
                  alt="Cartão de Membro +Vida — Verso"
                  width={380}
                  height={252}
                  style={{ width: '100%', height: 'auto', display: 'block' }}
                  priority
                />
              </div>

            </div>

            {/* Badge debajo, sin tapar nada */}
            <div
              className="px-4 py-2 rounded-full text-xs font-bold text-white shadow-lg mt-2"
              style={{ background: 'var(--color-primary)' }}
            >
              ✓ Cartão oficial
            </div>
          </div>

          {/* ── Tarjetas MOBILE ── */}
          <div className="md:hidden w-full max-w-sm mx-auto flex flex-col gap-4">
            <div className="rounded-2xl overflow-hidden shadow-xl" style={{ transform: 'rotate(-1deg)' }}>
              <Image
                src="/cartao-frente.png"
                alt="Cartão de Membro +Vida — Frente"
                width={340}
                height={225}
                style={{ width: '100%', height: 'auto', display: 'block' }}
                priority
              />
            </div>
            <div className="rounded-2xl overflow-hidden shadow-lg" style={{ transform: 'rotate(1deg)', marginLeft: '16px' }}>
              <Image
                src="/cartao-verso.png"
                alt="Cartão de Membro +Vida — Verso"
                width={340}
                height={225}
                style={{ width: '100%', height: 'auto', display: 'block' }}
              />
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
