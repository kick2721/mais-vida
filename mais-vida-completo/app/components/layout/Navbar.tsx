'use client'

// app/components/layout/Navbar.tsx
// Navbar principal — logo oficial + navegação desktop/mobile

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Logo from '@/app/components/ui/Logo'
import { BUSINESS } from '@/lib/constants'

const NAV_LINKS = [
  { href: '/',         label: 'Início' },
  { href: '/#beneficios', label: 'Benefícios' },
  { href: '/#como-funciona', label: 'Como Funciona' },
  { href: '/#afiliados', label: 'Afiliados' },
  { href: '/comprar',  label: 'Obter Cartão' },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  return (
    <header
      className="sticky top-0 z-50 w-full border-b"
      style={{
        background: 'rgba(255,255,255,0.97)',
        backdropFilter: 'blur(8px)',
        borderColor: 'var(--color-border)',
      }}
    >
      <div className="section-container">
        <div className="flex items-center justify-between h-16 md:h-20">

          {/* Logo */}
          <Logo size="sm" className="md:hidden" />
          <Logo size="md" className="hidden md:inline-flex" />

          {/* Nav desktop */}
          <nav className="hidden md:flex items-center gap-6">
            {NAV_LINKS.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium transition-colors hover:opacity-70"
                style={{
                  color: pathname === link.href
                    ? 'var(--color-primary)'
                    : 'var(--color-text)',
                  fontWeight: pathname === link.href ? 700 : 500,
                }}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* CTA desktop */}
          <div className="hidden md:flex items-center gap-3">
            <Link href="/login" className="btn-outline text-sm py-2 px-4">
              Entrar
            </Link>
            <Link href="/comprar" className="btn-primary text-sm py-2 px-4">
              Obter Cartão
            </Link>
          </div>

          {/* Hamburger mobile */}
          <button
            onClick={() => setOpen(!open)}
            className="md:hidden flex flex-col justify-center items-center w-10 h-10 gap-1.5"
            aria-label="Abrir menu"
          >
            <span
              className="block w-6 h-0.5 transition-all duration-200"
              style={{
                background: 'var(--color-primary)',
                transform: open ? 'rotate(45deg) translateY(8px)' : 'none',
              }}
            />
            <span
              className="block w-6 h-0.5 transition-all duration-200"
              style={{
                background: 'var(--color-primary)',
                opacity: open ? 0 : 1,
              }}
            />
            <span
              className="block w-6 h-0.5 transition-all duration-200"
              style={{
                background: 'var(--color-primary)',
                transform: open ? 'rotate(-45deg) translateY(-8px)' : 'none',
              }}
            />
          </button>
        </div>
      </div>

      {/* Menu mobile */}
      {open && (
        <div
          className="md:hidden border-t px-4 pb-6 pt-4 flex flex-col gap-4"
          style={{
            background: '#fff',
            borderColor: 'var(--color-border)',
          }}
        >
          {NAV_LINKS.map(link => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="text-base font-medium py-1"
              style={{ color: 'var(--color-text)' }}
            >
              {link.label}
            </Link>
          ))}
          <hr style={{ borderColor: 'var(--color-border)' }} />
          <Link href="/login" onClick={() => setOpen(false)} className="btn-outline text-center">
            Entrar
          </Link>
          <Link href="/comprar" onClick={() => setOpen(false)} className="btn-primary text-center">
            Obter Cartão
          </Link>
        </div>
      )}
    </header>
  )
}
