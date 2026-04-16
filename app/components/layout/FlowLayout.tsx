'use client'

// Wide split-screen layout for long flows (comprar, candidatura, seguimento)
// Same look as AuthLayout but right panel up to max-w-3xl with proper scroll.
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import Logo from '@/app/components/ui/Logo'
import { ArrowLeft } from 'lucide-react'

interface FlowLayoutProps {
  children: React.ReactNode
  backHref?: string
  backLabel?: string
  imageIndex?: number
  maxWidth?: 'md' | 'lg' | 'xl' | '2xl' | '3xl'
}

const CLINIC_IMAGES = [
  '/clinica-1.webp',
  '/clinica-2.webp',
  '/clinica-10.webp',
  '/clinica-9.webp',
  '/clinica-3.webp',
]

const QUOTES = [
  'Saúde acessível para toda a família angolana.',
  'O seu cartão de saúde privada a preço justo.',
  'Junte-se a milhares de famílias já protegidas.',
  'Tranquilidade e segurança para a sua família.',
  'Cuidado humano, ao alcance de todos.',
]

const MAX_W: Record<NonNullable<FlowLayoutProps['maxWidth']>, string> = {
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
}

export default function FlowLayout({
  children,
  backHref = '/',
  backLabel = 'Voltar ao início',
  imageIndex = 0,
  maxWidth = '2xl',
}: FlowLayoutProps) {
  const img = CLINIC_IMAGES[imageIndex % CLINIC_IMAGES.length]
  const quote = QUOTES[imageIndex % QUOTES.length]

  return (
    <div className="min-h-screen flex">
      {/* ── Left panel: clinic image (hidden mobile) ── */}
      <div
        className="hidden lg:flex lg:w-2/5 xl:w-[38%] relative flex-col justify-between p-10 sticky top-0 self-start"
        style={{ background: 'var(--color-primary-dark)', flexShrink: 0, height: '100vh' }}
      >
        <Image src={img} alt="Clínica Mais Vida" fill style={{ objectFit: 'cover', opacity: 0.35 }} priority />
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(160deg, rgba(30,61,24,0.85) 0%, rgba(17,24,20,0.78) 100%)',
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <Logo size="md" href="/" variant="on-dark" />
        </div>

        <div style={{ position: 'relative', zIndex: 1 }}>
          <blockquote className="font-serif text-2xl font-bold leading-snug mb-4" style={{ color: '#fff' }}>
            "{quote}"
          </blockquote>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '32px', height: '2px', background: 'var(--color-primary-light)', borderRadius: '2px' }} />
            <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.55)', fontWeight: 500 }}>
              Clínica Mais Vida — Luanda, Angola
            </span>
          </div>
        </div>
      </div>

      {/* ── Right panel: content ── */}
      <div className="flex-1 px-5 py-10 lg:px-12 xl:px-16" style={{ background: '#fff' }}>
        <div className={`w-full ${MAX_W[maxWidth]} mx-auto`}>
          <Link href={backHref} className="btn-back mb-6 inline-flex">
            <ArrowLeft size={16} />
            {backLabel}
          </Link>

          <div className="flex justify-center mb-8 lg:hidden">
            <Logo size="lg" href="/" />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
          >
            {children}
          </motion.div>
        </div>
      </div>
    </div>
  )
}
