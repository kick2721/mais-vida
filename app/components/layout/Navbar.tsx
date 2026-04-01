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

            {/* Logo */}
            <Logo size="sm" className="md:hidden" />
            <Logo size="md" className="hidden md:inline-flex" />

            {/* Nav desktop */}
            <nav className="hidden md:flex items-center gap-1">
              {NAV_LINKS.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`nav-link ${pathname === link.href ? 'active' : ''}`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* CTAs desktop */}
            <div className="hidden md:flex items-center gap-3">
              <Link href="/candidatura-estado" className="text-sm font-medium transition-colors"
                style={{ color: 'var(--color-text-muted)' }}>
                Ver candidatura
              </Link>
              <Link href="/login" className="btn-outline text-sm py-2 px-4">
                Entrar
              </Link>
              <Link href="/comprar" className="btn-primary text-sm py-2 px-4">
                Obter Cartão
              </Link>
            </div>

            {/* Botão hambúrguer mobile */}
            <button
              onClick={() => setOpen(!open)}
              className="md:hidden flex flex-col justify-center items-center w-11 h-11 rounded-xl transition-colors"
              style={{ background: open ? 'rgba(74,140,63,0.1)' : 'transparent' }}
              aria-label={open ? 'Fechar menu' : 'Abrir menu'}
            >
              <span className="block w-5 h-0.5 transition-all duration-250"
                style={{ background: 'var(--color-primary)', transform: open ? 'rotate(45deg) translateY(6px)' : 'none' }} />
              <span className="block w-5 h-0.5 mt-1.5 transition-all duration-250"
                style={{ background: 'var(--color-primary)', opacity: open ? 0 : 1 }} />
              <span className="block w-5 h-0.5 mt-1.5 transition-all duration-250"
                style={{ background: 'var(--color-primary)', transform: open ? 'rotate(-45deg) translateY(-6px)' : 'none' }} />
            </button>
          </div>
        </div>
      </header>

      {/* Drawer mobile */}
      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0"
            style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(2px)' }}
            onClick={() => setOpen(false)}
          />
          {/* Painel */}
          <div className="absolute top-0 right-0 h-full w-72 flex flex-col"
            style={{ background: '#fff', boxShadow: '-4px 0 24px rgba(0,0,0,0.12)' }}>

            {/* Header do drawer */}
            <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
              <Logo size="sm" clickable={false} />
              <button
                onClick={() => setOpen(false)}
                className="w-9 h-9 flex items-center justify-center rounded-lg transition-colors"
                style={{ color: 'var(--color-text-muted)' }}
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M1 1l16 16M17 1L1 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            {/* Links de navegação */}
            <nav className="flex flex-col gap-1 p-4 flex-1">
              <p className="text-xs font-semibold uppercase tracking-widest mb-2 px-4"
                style={{ color: 'var(--color-text-muted)' }}>Menu</p>
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

            {/* CTAs no fundo do drawer */}
            <div className="p-4 border-t flex flex-col gap-3" style={{ borderColor: 'var(--color-border)' }}>
              <Link href="/candidatura-estado" onClick={() => setOpen(false)}
                className="text-sm font-medium text-center py-2 rounded-xl transition-colors"
                style={{ color: 'var(--color-primary)', background: 'rgba(74,140,63,0.08)' }}>
                🔍 Ver estado da candidatura
              </Link>
              <Link href="/login" onClick={() => setOpen(false)} className="btn-outline text-center w-full">
                Entrar
              </Link>
              <Link href="/comprar" onClick={() => setOpen(false)} className="btn-primary text-center w-full">
                Obter Cartão
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
