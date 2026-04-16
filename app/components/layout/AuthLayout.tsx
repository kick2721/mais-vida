'use client'

// Shared layout for auth pages — split screen: left image + right form
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import Logo from '@/app/components/ui/Logo'
import { ArrowLeft } from 'lucide-react'

interface AuthLayoutProps {
  children: React.ReactNode
  backHref?: string
  backLabel?: string
  imageIndex?: number
}

const CLINIC_IMAGES = [
  '/clinica-1.webp',
  '/clinica-2.webp',
  '/clinica-10.webp',
  '/clinica-9.webp',
]

const QUOTES = [
  'Saúde acessível para toda a família angolana.',
  'O seu cartão de saúde privada a preço justo.',
  'Consultas, exames e tratamentos com descontos de até 70%.',
  'Tranquilidade e segurança para a sua família.',
]

export default function AuthLayout({ children, backHref = '/', backLabel = 'Voltar ao início', imageIndex = 0 }: AuthLayoutProps) {
  const img = CLINIC_IMAGES[imageIndex % CLINIC_IMAGES.length]
  const quote = QUOTES[imageIndex % QUOTES.length]

  return (
    <div className="min-h-screen flex">
      {/* ── Left panel: clinic image (hidden mobile) ── */}
      <div className="hidden lg:flex lg:w-5/12 xl:w-1/2 relative flex-col justify-between p-10" style={{ background: 'var(--color-primary-dark)', flexShrink: 0 }}>
        {/* Background image */}
        <Image
          src={img}
          alt="Clínica Mais Vida"
          fill
          style={{ objectFit: 'cover', opacity: 0.35 }}
          priority
        />
        {/* Gradient overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(160deg, rgba(30,61,24,0.85) 0%, rgba(17,24,20,0.75) 100%)',
        }} />

        {/* Logo top */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <Logo size="md" href="/" />
        </div>

        {/* Quote bottom */}
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

      {/* ── Right panel: form ── */}
      <div className="flex-1 flex flex-col justify-center px-5 py-10 lg:px-12 xl:px-16" style={{ background: '#fff', overflowY: 'auto' }}>
        <div className="w-full max-w-md mx-auto">

          {/* Back link */}
          <Link href={backHref} className="btn-back mb-8 inline-flex">
            <ArrowLeft size={16} />
            {backLabel}
          </Link>

          {/* Logo (mobile only) */}
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
