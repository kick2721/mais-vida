// app/components/ui/Logo.tsx
// Componente reutilizável do logo oficial +Vida
// Usado em: Navbar, HeroSection, forgot-password, reset-password, login, register

import Image from 'next/image'
import Link from 'next/link'

type LogoSize = 'sm' | 'md' | 'lg'

interface LogoProps {
  /** Tamanho pré-definido: sm=80px, md=120px, lg=180px de largura */
  size?: LogoSize
  /** Largura personalizada em px (sobrescreve `size`) */
  width?: number
  /** Link de destino ao clicar no logo. Por omissão '/' */
  href?: string
  /** Se false, não envolve em <Link>. Útil em páginas onde o logo não deve ser clicável */
  clickable?: boolean
  /** Classes CSS adicionais no contentor */
  className?: string
}

const SIZE_MAP: Record<LogoSize, { width: number; height: number }> = {
  sm: { width: 80,  height: 48  },
  md: { width: 120, height: 72  },
  lg: { width: 180, height: 108 },
}

export default function Logo({
  size = 'md',
  width,
  href = '/',
  clickable = true,
  className = '',
}: LogoProps) {
  const dimensions = width
    ? { width, height: Math.round(width * 0.6) }
    : SIZE_MAP[size]

  const img = (
    <Image
      src="/logo.png"
      alt="+Vida — Saúde Humanizada"
      width={dimensions.width}
      height={dimensions.height}
      priority
      className="object-contain"
      style={{ width: dimensions.width, height: 'auto' }}
    />
  )

  if (!clickable) {
    return <div className={className}>{img}</div>
  }

  return (
    <Link href={href} className={`inline-flex items-center ${className}`}>
      {img}
    </Link>
  )
}
