'use client'

import Logo from '@/app/components/ui/Logo'
import Link from 'next/link'
import { MapPin, Phone, Mail, Instagram, MessageCircle } from 'lucide-react'
import { BUSINESS, MEMBERSHIP } from '@/lib/constants'

const NAV = [
  { href: '/', label: 'Início' },
  { href: '/#beneficios', label: 'Benefícios' },
  { href: '/#como-funciona', label: 'Como Funciona' },
  { href: '/#afiliados', label: 'Afiliados' },
  { href: '/#faq', label: 'FAQ' },
  { href: '/#localizacao', label: 'Contacto' },
]

const LINKS_RAPIDOS = [
  { href: '/comprar', label: `Comprar ${MEMBERSHIP.name}` },
  { href: '/seguimento', label: 'Estado do Pedido' },
  { href: '/afiliado-candidatura', label: 'Tornar-me Afiliado' },
  { href: '/candidatura-estado', label: 'Estado da Candidatura' },
  { href: '/login', label: 'Entrar na conta' },
]

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer style={{ background: '#111814', color: 'rgba(255,255,255,0.75)' }}>
      {/* Top green accent */}
      <div style={{ height: '3px', background: 'linear-gradient(90deg, var(--color-primary), var(--color-primary-light))' }} />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">

          {/* Brand */}
          <div className="lg:col-span-1">
            <Logo size="md" className="mb-4" />
            <p className="text-sm leading-relaxed mb-6" style={{ color: 'rgba(255,255,255,0.55)', maxWidth: '240px' }}>
              {BUSINESS.tagline}. Saúde acessível para toda a família angolana.
            </p>
            <div className="flex items-center gap-3">
              <a
                href={`https://wa.me/${BUSINESS.phone.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  width: '38px', height: '38px', borderRadius: '10px',
                  background: 'rgba(255,255,255,0.08)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(74,140,63,0.3)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
                aria-label="WhatsApp"
              >
                <MessageCircle size={17} color="rgba(255,255,255,0.8)" />
              </a>
              <a
                href={`https://instagram.com/${BUSINESS.instagram.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  width: '38px', height: '38px', borderRadius: '10px',
                  background: 'rgba(255,255,255,0.08)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(74,140,63,0.3)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
                aria-label="Instagram"
              >
                <Instagram size={17} color="rgba(255,255,255,0.8)" />
              </a>
              <a
                href={`mailto:${BUSINESS.email.info}`}
                style={{
                  width: '38px', height: '38px', borderRadius: '10px',
                  background: 'rgba(255,255,255,0.08)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(74,140,63,0.3)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
                aria-label="Email"
              >
                <Mail size={17} color="rgba(255,255,255,0.8)" />
              </a>
            </div>
          </div>

          {/* Navegação */}
          <div>
            <h3 style={{ color: '#fff', fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '1rem' }}>
              Navegação
            </h3>
            <ul className="space-y-2.5">
              {NAV.map(n => (
                <li key={n.href}>
                  <Link
                    href={n.href}
                    style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', textDecoration: 'none', transition: 'color 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'rgba(106,173,94,0.9)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.6)')}
                  >
                    {n.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Links rápidos */}
          <div>
            <h3 style={{ color: '#fff', fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '1rem' }}>
              Acesso rápido
            </h3>
            <ul className="space-y-2.5">
              {LINKS_RAPIDOS.map(l => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', textDecoration: 'none', transition: 'color 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'rgba(106,173,94,0.9)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.6)')}
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contacto */}
          <div>
            <h3 style={{ color: '#fff', fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '1rem' }}>
              Contacto
            </h3>
            <div className="space-y-3">
              {[
                { icon: MapPin, text: BUSINESS.address },
                { icon: Phone, text: BUSINESS.phone.main, href: `tel:${BUSINESS.phone.main}` },
                { icon: Mail, text: BUSINESS.email.info, href: `mailto:${BUSINESS.email.info}` },
                { icon: Instagram, text: BUSINESS.instagram, href: `https://instagram.com/${BUSINESS.instagram.replace('@', '')}` },
              ].map((c, i) => {
                const Icon = c.icon
                const content = (
                  <div className="flex items-start gap-2.5">
                    <Icon size={14} style={{ color: 'var(--color-primary-light)', flexShrink: 0, marginTop: '2px' }} />
                    <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.55)', lineHeight: 1.5 }}>{c.text}</span>
                  </div>
                )
                return c.href ? (
                  <a key={i} href={c.href} target={c.href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer" style={{ textDecoration: 'none', display: 'block' }}
                    onMouseEnter={e => (e.currentTarget.querySelector('span')!.style.color = 'rgba(255,255,255,0.85)')}
                    onMouseLeave={e => (e.currentTarget.querySelector('span')!.style.color = 'rgba(255,255,255,0.55)')}
                  >
                    {content}
                  </a>
                ) : (
                  <div key={i}>{content}</div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)' }}>
            © {year} {BUSINESS.fullName}. Todos os direitos reservados.
          </p>
          <div className="flex gap-5">
            <Link href="/login" style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)', textDecoration: 'none', transition: 'color 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.7)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.35)')}
            >
              Área de Cliente
            </Link>
            <Link href="/affiliate/dashboard" style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)', textDecoration: 'none', transition: 'color 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.7)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.35)')}
            >
              Portal Afiliado
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
