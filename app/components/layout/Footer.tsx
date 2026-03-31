import Logo from '@/app/components/ui/Logo'
import Link from 'next/link'
import { BUSINESS, MEMBERSHIP } from '@/lib/constants'

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t mt-20" style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}>
      <div className="section-container py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">

          <div className="flex flex-col gap-4">
            <Logo size="lg" clickable={false} />
            <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
              {BUSINESS.tagline}
            </p>
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              {BUSINESS.address}
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <p className="font-semibold text-sm" style={{ color: 'var(--color-primary)' }}>Navegação</p>
            {[
              { href: '/', label: 'Início' },
              { href: '/#beneficios', label: 'Benefícios' },
              { href: '/#como-funciona', label: 'Como Funciona' },
              { href: '/comprar', label: `Obter ${MEMBERSHIP.name}` },
              { href: '/afiliado-candidatura', label: 'Tornar-me Afiliado' },
            ].map(link => (
              <Link key={link.href} href={link.href} className="text-sm hover:opacity-70 transition-opacity" style={{ color: 'var(--color-text-muted)' }}>
                {link.label}
              </Link>
            ))}
          </div>

        </div>

        <div className="mt-10 pt-6 border-t flex flex-col md:flex-row items-center justify-between gap-2" style={{ borderColor: 'var(--color-border)' }}>
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            © {year} {BUSINESS.fullName}. Todos os direitos reservados.
          </p>
          <div className="flex gap-4">
            <Link href="/login" className="text-xs hover:opacity-70" style={{ color: 'var(--color-text-muted)' }}>Área de Cliente</Link>
            <Link href="/affiliate/dashboard" className="text-xs hover:opacity-70" style={{ color: 'var(--color-text-muted)' }}>Área de Afiliado</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
