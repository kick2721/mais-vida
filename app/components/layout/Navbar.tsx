'use client'

import { useState, useEffect, useRef } from 'react'
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
  { href: '/#localizacao',   label: 'Contacto' },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()

  useEffect(() => { setMounted(true) }, [])
  useEffect(() => { setOpen(false); setDropdownOpen(false) }, [pathname])
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const panel = (
    <>
      {/* Backdrop */}
      <div
        onClick={() => setOpen(false)}
        style={{
          position: 'fixed', inset: 0, zIndex: 9998,
          background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(3px)',
        }}
      />

      {/* Panel */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 9999,
        width: '80%', maxWidth: '320px', background: '#fff',
        boxShadow: '-8px 0 40px rgba(0,0,0,0.18)',
        display: 'flex', flexDirection: 'column',
        overflowY: 'auto', WebkitOverflowScrolling: 'touch',
      }}>
        {/* Botón cerrar */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '16px 16px 8px' }}>
          <button
            onClick={() => setOpen(false)}
            aria-label="Fechar menu"
            style={{
              width: '40px', height: '40px', borderRadius: '50%',
              background: 'rgba(74,140,63,0.1)', color: 'var(--color-primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: 'none', cursor: 'pointer', flexShrink: 0,
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

          {/* Candidatura — dos opciones */}
          <Link href="/afiliado-candidatura" onClick={() => setOpen(false)}
            style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              padding: '14px 16px', borderRadius: '12px',
              fontSize: '14px', fontWeight: 500,
              color: 'var(--color-primary)',
              background: 'rgba(74,140,63,0.07)',
              border: '1px solid rgba(74,140,63,0.18)',
              textDecoration: 'none',
            }}>
            <span>📋</span> Candidatar-me como afiliado
          </Link>
          <Link href="/candidatura-estado" onClick={() => setOpen(false)}
            style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              padding: '14px 16px', borderRadius: '12px',
              fontSize: '14px', fontWeight: 500,
              color: 'var(--color-text-muted)',
              background: 'rgba(0,0,0,0.03)',
              border: '1px solid var(--color-border)',
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

            {/* Logo */}
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

              {/* Dropdown candidatura */}
              <div ref={dropdownRef} style={{ position: 'relative' }}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="btn-outline text-sm py-2 px-4"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  Candidatura
                  <svg
                    width="12" height="12" viewBox="0 0 12 12" fill="none"
                    style={{ transition: 'transform 0.2s', transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                  >
                    <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>

                {dropdownOpen && (
                  <div style={{
                    position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                    background: '#fff', borderRadius: '12px', minWidth: '220px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                    border: '1px solid var(--color-border)',
                    overflow: 'hidden', zIndex: 100,
                  }}>
                    <Link href="/afiliado-candidatura"
                      onClick={() => setDropdownOpen(false)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '10px',
                        padding: '12px 16px', fontSize: '14px', fontWeight: 500,
                        color: 'var(--color-primary)', textDecoration: 'none',
                        borderBottom: '1px solid var(--color-border)',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(74,140,63,0.06)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <span>📋</span>
                      <div>
                        <div style={{ fontWeight: 600 }}>Candidatar-me</div>
                        <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: 400 }}>Tornar-me afiliado</div>
                      </div>
                    </Link>
                    <Link href="/candidatura-estado"
                      onClick={() => setDropdownOpen(false)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '10px',
                        padding: '12px 16px', fontSize: '14px', fontWeight: 500,
                        color: 'var(--color-text)', textDecoration: 'none',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.03)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <span>🔍</span>
                      <div>
                        <div style={{ fontWeight: 600 }}>Ver candidatura</div>
                        <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: 400 }}>Consultar o estado</div>
                      </div>
                    </Link>
                  </div>
                )}
              </div>

              <Link href="/login" className="btn-outline text-sm py-2 px-4">
                Entrar
              </Link>
              <Link href="/comprar" className="btn-primary text-sm py-2 px-4">
                Obter Cartão
              </Link>
            </div>

            {/* Hambúrguer mobile */}
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

      {/* Portal mobile */}
      {mounted && open && createPortal(
        <div className="md:hidden">{panel}</div>,
        document.body
      )}
    </>
  )
}
