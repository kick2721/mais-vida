import Image from 'next/image'
import Link from 'next/link'

type LogoSize = 'sm' | 'md' | 'lg'

interface LogoProps {
  size?: LogoSize
  width?: number
  href?: string
  clickable?: boolean
  className?: string
}

const SIZE_MAP: Record<LogoSize, { width: number; height: number }> = {
  sm:  { width: 130, height: 78  },
  md:  { width: 180, height: 108 },
  lg:  { width: 240, height: 144 },
}

export default function Logo({ size = 'md', width, href = '/', clickable = true, className = '' }: LogoProps) {
  const dimensions = width ? { width, height: Math.round(width * 0.6) } : SIZE_MAP[size]

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

  if (!clickable) return <div className={className}>{img}</div>

  return (
    <Link href={href} className={`inline-flex items-center ${className}`}>
      {img}
    </Link>
  )
}
