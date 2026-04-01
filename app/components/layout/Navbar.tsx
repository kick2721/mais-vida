'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Logo from '@/app/components/ui/Logo'

const NAV_LINKS = [
  { href: '/',               label: 'Início' },
  { href: '/#beneficios',    label: 'Benefícios' },
  { href: '/#como-funciona', label: 'Como Funciona' },
  { href: '/#afiliados',     label: 'Afiliados' },
  { href: '/#faq',           label: 'FAQ' },
  { href: '/#contacto',      label: 'Contacto' },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()

  useEffect(() => { setMounted(true) }, [])
  useEffect(() => { setOpen(false) }, [pathname])
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  const panel = (
    <>
      {/* Backdrop */}
      <div
        onClick={() => setOpen(false)}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9998,
          background: 'rgba(0,0,0,0.45)',
          backdropFilter: 'blur(3px)',
        }}
      />

      {/* Panel */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          zIndex: 9999,
          width: '80%',
          maxWidth: '320px',
          background: '#fff',
          boxShadow: '-8px 0 40px rgba(0,0,0,0.18)',
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {/* Botón cerrar */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '16px 16px 8px' }}>
          <button
            onClick={() => setOpen(false)}
            aria-label="Fechar menu"
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'rgba(74,140,63,0.1)',
              color: 'var(--color-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: 'none',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M2 2l12 12M14 2L2 14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Navegación */}
        <nav style={{ display: 'flex', flexDirection: 'column', padding: '0 16px 8px' }}>
          <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-text-muted)', padding: '0 12px', marginBottom: '8px' }}>
            Navegação
          </p>
          {NAV_LINKS.map(link => (
            <Link key={link.href} href={link.href} onClick={() => setOpen(false)} className="nav-link-mobile">
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Divisor */}
        <div style={{ height: '1px', background: 'var(--color-border)', margin: '12px 16px 16px' }} />

        {/* CTAs */}
        <div style={{ padding: '0 16px 40px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-text-muted)', padding: '0 12px', marginBottom: '4px' }}>
            Acesso rápido
          </p>
          <Link href="/candidatura-estado" onClick={() => setOpen(false)}
            style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              padding: '14px 16px', borderRadius: '12px',
              fontSize: '14px', fontWeight: 500,
              color: 'var(--color-primary)',
              background: 'rgba(74,140,63,0.07)',
              border: '1px solid rgba(74,140,63,0.18)',
              textDecoration: 'none',
            }}>
            <span>🔍</span> Ver estado da candidatura
          </Link>
          <Link href="/login" onClick={() => setOpen(false)}
            className="btn-outline text-sm text-center w-full"
            style={{ paddingTop: '14px', paddingBottom: '14px' }}>
            Entrar
          </Link>
          <Link href="/comprar" onClick={() => setOpen(false)}
            className="btn-primary text-sm text-center w-full"
            style={{ paddingTop: '14px', paddingBottom: '14px' }}>
            Obter Cartão
          </Link>
        </div>
      </div>
    </>
  )

  return (
    <>
      <header className="sticky top-0 z-50 w-full" style={{
        background: 'rgba(255,255,255,0.97)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(74,140,63,0.15)',
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
      }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">

            <Logo size="sm" className="md:hidden" />
            <Logo size="md" className="hidden md:inline-flex" />

            {/* Nav desktop */}
            <nav className="hidden md:flex items-center gap-1">
              {NAV_LINKS.map(link => (
                <Link key={link.href} href={link.href}
                  className={`nav-link ${pathname === link.href ? 'active' : ''}`}>
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* CTAs desktop */}
            <div className="hidden md:flex items-center gap-3">
              <Link href="/candidatura-estado" className="btn-outline text-sm py-2 px-4">
                Ver candidatura
              </Link>
              <Link href="/login" className="btn-outline text-sm py-2 px-4">
                Entrar
              </Link>
              <Link href="/comprar" className="btn-primary text-sm py-2 px-4">
                Obter Cartão
              </Link>
            </div>

            {/* Hambúrguer mobile */}
            <button
              onClick={() => setOpen(true)}
              className="md:hidden"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'rgba(74,140,63,0.08)',
                border: 'none',
                cursor: 'pointer',
                gap: '5px',
              }}
              aria-label="Abrir menu"
            >
              <span style={{ display: 'block', width: '20px', height: '2px', borderRadius: '2px', background: 'var(--color-primary)' }} />
              <span style={{ display: 'block', width: '20px', height: '2px', borderRadius: '2px', background: 'var(--color-primary)' }} />
              <span style={{ display: 'block', width: '20px', height: '2px', borderRadius: '2px', background: 'var(--color-primary)' }} />
            </button>
          </div>
        </div>
      </header>

      {/* Portal — montado directamente en document.body */}
      {mounted && open && createPortal(panel, document.body)}
    </>
  )
}
