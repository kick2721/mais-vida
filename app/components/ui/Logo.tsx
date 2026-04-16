import Image from 'next/image'
import Link from 'next/link'

type LogoSize = 'sm' | 'md' | 'lg'

interface LogoProps {
  size?: LogoSize
  width?: number
  href?: string
  clickable?: boolean
  className?: string
  variant?: 'default' | 'on-dark'
}

const SIZE_MAP: Record<LogoSize, { width: number; height: number }> = {
  sm:  { width: 100, height: 60  },
  md:  { width: 130, height: 78 },
  lg:  { width: 240, height: 144 },
}

export default function Logo({ size = 'md', width, href = '/', clickable = true, className = '', variant = 'default' }: LogoProps) {
  const dimensions = width ? { width, height: Math.round(width * 0.6) } : SIZE_MAP[size]

  const rawImg = (
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

  const img = variant === 'on-dark' ? (
    <span style={{
      background: 'rgba(255,255,255,0.96)',
      padding: '10px 16px',
      borderRadius: 14,
      boxShadow: '0 6px 24px rgba(0,0,0,0.22)',
      display: 'inline-flex',
      alignItems: 'center',
    }}>
      {rawImg}
    </span>
  ) : rawImg

  if (!clickable) return <div className={className}>{img}</div>

  return (
    <Link href={href} className={`inline-flex items-center ${className}`}>
      {img}
    </Link>
  )
}
