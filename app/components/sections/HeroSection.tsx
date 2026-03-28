// app/components/sections/HeroSection.tsx
// Secção principal da landing page

import Link from 'next/link'
import Logo from '@/app/components/ui/Logo'
import { BUSINESS, MEMBERSHIP } from '@/lib/constants'

export default function HeroSection() {
  return (
    <section
      className="relative overflow-hidden"
      style={{ background: 'var(--color-surface)' }}
    >
      {/* Fundo decorativo */}
      <div
        className="absolute inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 70% 40%, var(--color-primary) 0%, transparent 60%)`,
        }}
      />

      <div className="section-container relative z-10 py-20 md:py-28">
        <div className="flex flex-col md:flex-row items-center gap-12 md:gap-16">

          {/* Texto */}
          <div className="flex-1 text-center md:text-left">
            {/* Logo no hero — visível apenas em mobile (desktop tem Navbar) */}
            <div className="flex justify-center md:hidden mb-8">
              <Logo size="lg" clickable={false} />
            </div>

            <span
              className="inline-block text-xs font-semibold uppercase tracking-widest mb-4 px-3 py-1 rounded-full"
              style={{
                background: 'var(--color-primary)',
                color: '#fff',
                letterSpacing: '0.15em',
              }}
            >
              Saúde Humanizada
            </span>

            <h1
              className="font-display text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6"
              style={{ color: 'var(--color-text)' }}
            >
              O seu cartão de saúde{' '}
              <span style={{ color: 'var(--color-primary)' }}>
                com descontos reais
              </span>
            </h1>

            <p
              className="text-lg md:text-xl mb-8 max-w-lg mx-auto md:mx-0"
              style={{ color: 'var(--color-text-muted)' }}
            >
              {BUSINESS.tagline}. Aceda a consultas, exames e muito mais com descontos
              exclusivos para toda a família.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
              <Link href="/comprar" className="btn-primary text-base py-3 px-8">
                Obter {MEMBERSHIP.name}
              </Link>
              <Link href="/#beneficios" className="btn-outline text-base py-3 px-8">
                Ver Benefícios
              </Link>
            </div>

            {/* Social proof */}
            <p
              className="mt-6 text-sm"
              style={{ color: 'var(--color-text-muted)' }}
            >
              💳 Apenas{' '}
              <strong style={{ color: 'var(--color-primary)' }}>
                {MEMBERSHIP.price.toLocaleString('pt-AO')} {MEMBERSHIP.currencySymbol}
              </strong>{' '}
              por ano · Válido {MEMBERSHIP.durationMonths} meses
            </p>
          </div>

          {/* Card visual — desktop */}
          <div className="flex-shrink-0 hidden md:flex items-center justify-center">
            <div
              className="relative rounded-3xl p-8 flex flex-col items-center gap-6 shadow-2xl"
              style={{
                background: 'linear-gradient(135deg, var(--color-primary) 0%, #2d5a24 100%)',
                width: 320,
                minHeight: 220,
              }}
            >
              <Logo size="md" clickable={false} />
              <div className="text-center">
                <p className="text-white/80 text-xs uppercase tracking-widest mb-1">
                  {MEMBERSHIP.cardName}
                </p>
                <p className="text-white font-display text-2xl font-bold">
                  {MEMBERSHIP.name}
                </p>
              </div>
              <div
                className="absolute -bottom-4 -right-4 w-16 h-16 rounded-full opacity-20"
                style={{ background: '#fff' }}
              />
              <div
                className="absolute -top-3 -left-3 w-10 h-10 rounded-full opacity-10"
                style={{ background: '#fff' }}
              />
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
