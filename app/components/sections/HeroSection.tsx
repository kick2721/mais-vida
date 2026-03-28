import Link from 'next/link'
import Image from 'next/image'
import { BUSINESS, MEMBERSHIP } from '@/lib/constants'

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden" style={{ background: 'rgba(240,247,239,0.75)' }}>
      <div className="section-container relative z-10 py-20 md:py-28">
        <div className="flex flex-col md:flex-row items-center gap-12 md:gap-16">

          {/* Texto */}
          <div className="flex-1 text-center md:text-left">
            <span className="inline-block text-xs font-semibold uppercase tracking-widest mb-4 px-3 py-1 rounded-full"
              style={{ background: 'var(--color-primary)', color: '#fff', letterSpacing: '0.15em' }}>
              Centro de Diagnóstico e Especialidades
            </span>

            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6"
              style={{ color: 'var(--color-text)' }}>
              O seu cartão de saúde{' '}
              <span style={{ color: 'var(--color-primary)' }}>com descontos reais</span>
            </h1>

            <p className="text-lg md:text-xl mb-8 max-w-lg mx-auto md:mx-0"
              style={{ color: 'var(--color-text-muted)' }}>
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

            <p className="mt-6 text-sm" style={{ color: 'var(--color-text-muted)' }}>
              💳 Apenas{' '}
              <strong style={{ color: 'var(--color-primary)' }}>
                {MEMBERSHIP.price.toLocaleString('pt-AO')} {MEMBERSHIP.currencySymbol}
              </strong>{' '}
              por ano · Válido {MEMBERSHIP.durationMonths} meses
            </p>
          </div>

          {/* Imagem fondo/logo lado direito — desktop */}
          <div className="flex-shrink-0 hidden md:flex items-center justify-center">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl"
              style={{ width: 340, height: 420 }}>
              <Image
                src="/fondo.jpeg"
                alt="Clínica +Vida"
                fill
                style={{ objectFit: 'cover', objectPosition: 'center' }}
                priority
              />
              {/* Overlay com logo por cima */}
              <div className="absolute inset-0 flex flex-col items-center justify-center"
                style={{ background: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(2px)' }}>
                <Image
                  src="/logo.png"
                  alt="+Vida Logo"
                  width={220}
                  height={110}
                  style={{ objectFit: 'contain' }}
                  priority
                />
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
