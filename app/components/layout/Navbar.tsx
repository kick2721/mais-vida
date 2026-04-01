'use client'

import { useState, useEffect } from 'react'
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
  const pathname = usePathname()

  useEffect(() => { setOpen(false) }, [pathname])
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

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
              className="md:hidden flex flex-col justify-center items-center w-10 h-10 rounded-xl gap-1.5"
              style={{ background: 'rgba(74,140,63,0.08)' }}
              aria-label="Abrir menu"
            >
              <span className="block w-5 h-0.5 rounded-full" style={{ background: 'var(--color-primary)' }} />
              <span className="block w-5 h-0.5 rounded-full" style={{ background: 'var(--color-primary)' }} />
              <span className="block w-3.5 h-0.5 rounded-full self-start ml-[5px]" style={{ background: 'var(--color-primary)' }} />
            </button>
          </div>
        </div>
      </header>

      {/* Side panel mobile */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden" style={{ pointerEvents: 'all' }}>

          {/* Backdrop */}
          <div
            className="absolute inset-0"
            style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(3px)' }}
            onClick={() => setOpen(false)}
          />

          {/* Painel — scroll interno completo */}
          <div
            className="absolute top-0 right-0 h-full flex flex-col"
            style={{
              width: '80%',
              maxWidth: '320px',
              background: '#fff',
              boxShadow: '-8px 0 40px rgba(0,0,0,0.18)',
              overflowY: 'auto',
              WebkitOverflowScrolling: 'touch',
            }}
          >
            {/* Cabecera: solo el botón X */}
            <div className="flex items-center justify-end px-4 pt-4 pb-2">
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
                  flexShrink: 0,
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M2 2l12 12M14 2L2 14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            {/* Navegación */}
            <nav className="flex flex-col px-4 pb-2">
              <p className="text-xs font-semibold uppercase tracking-widest px-3 mb-2"
                style={{ color: 'var(--color-text-muted)' }}>
                Navegação
              </p>
              {NAV_LINKS.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="nav-link-mobile"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Divisor */}
            <div className="mx-4 mt-3 mb-4" style={{ height: '1px', background: 'var(--color-border)' }} />

            {/* CTAs */}
            <div className="px-4 pb-8 flex flex-col gap-3">
              <p className="text-xs font-semibold uppercase tracking-widest px-3 mb-1"
                style={{ color: 'var(--color-text-muted)' }}>
                Acesso rápido
              </p>

              <Link href="/candidatura-estado" onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium transition-colors"
                style={{
                  color: 'var(--color-primary)',
                  background: 'rgba(74,140,63,0.07)',
                  border: '1px solid rgba(74,140,63,0.18)',
                }}>
                <span>🔍</span>
                Ver estado da candidatura
              </Link>

              <Link href="/login" onClick={() => setOpen(false)}
                className="btn-outline py-3.5 text-sm text-center w-full">
                Entrar
              </Link>

              <Link href="/comprar" onClick={() => setOpen(false)}
                className="btn-primary py-3.5 text-sm text-center w-full">
                Obter Cartão
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
