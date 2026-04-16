'use client'

// app/components/sections/ClinicGallerySection.tsx

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Building2 } from 'lucide-react'

const PHOTOS = [
  { src: '/clinica-1.webp',  caption: 'Receção' },
  { src: '/clinica-10.webp', caption: 'Consultório' },
  { src: '/clinica-8.webp',  caption: 'Área de espera do laboratório' },
  { src: '/clinica-9.webp',  caption: 'Sala de observação' },
  { src: '/clinica-2.webp',  caption: 'Área de espera da receção' },
  { src: '/clinica-3.webp',  caption: 'Área de espera da receção' },
  { src: '/clinica-4.webp',  caption: 'Hall de entrada' },
  { src: '/clinica-5.webp',  caption: 'Área de recreação infantil' },
  { src: '/clinica-6.webp',  caption: 'Área de recreação infantil' },
  { src: '/clinica-7.webp',  caption: 'Laboratório' },
]

export default function ClinicGallerySection() {
  const [current, setCurrent] = useState(0)
  const [paused, setPaused] = useState(false)

  const next = useCallback(() => setCurrent(c => (c + 1) % PHOTOS.length), [])
  const prev = useCallback(() => setCurrent(c => (c - 1 + PHOTOS.length) % PHOTOS.length), [])

  useEffect(() => {
    if (paused) return
    const timer = setInterval(next, 4000)
    return () => clearInterval(timer)
  }, [paused, next])

  return (
    <section style={{ background: 'linear-gradient(to bottom, #f5f9f3 0%, #f5f9f3 80%, #2d6020 100%)', paddingTop: '5rem', paddingBottom: '5rem' }}>
      <div className="section-container" style={{ paddingTop: 0, paddingBottom: 0 }}>

        {/* Header */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <span className="badge-primary mb-4">
            <Building2 size={12} />
            Conheça-nos
          </span>
          <h2 className="section-title">As nossas instalações</h2>
          <p className="section-desc">
            Espaços modernos, equipados e pensados para o seu conforto e bem-estar.
          </p>
        </motion.div>

        {/* Slider */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <div
            className="relative rounded-3xl overflow-hidden"
            style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.16)' }}
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
          >
            <div className="relative w-full" style={{ aspectRatio: '16/9' }}>
              {PHOTOS.map((photo, i) => (
                <div
                  key={photo.src}
                  className="absolute inset-0"
                  style={{
                    opacity: i === current ? 1 : 0,
                    zIndex: i === current ? 1 : 0,
                    transition: 'opacity 0.8s ease',
                    transform: i === current ? 'scale(1)' : 'scale(1.02)',
                  }}
                >
                  <Image
                    src={photo.src}
                    alt={photo.caption}
                    fill
                    style={{ objectFit: 'cover' }}
                    priority={i === 0}
                  />
                </div>
              ))}

              {/* Gradient overlay */}
              <div
                className="absolute bottom-0 left-0 right-0 z-10"
                style={{ height: '40%', background: 'linear-gradient(to top, rgba(0,0,0,0.55), transparent)' }}
              />

              {/* Caption */}
              <div className="absolute bottom-5 left-6 z-20 flex items-center gap-2">
                <div style={{
                  width: '6px', height: '6px', borderRadius: '50%',
                  background: 'var(--color-primary-light)', flexShrink: 0,
                }} />
                <span style={{ color: '#fff', fontSize: '14px', fontWeight: 600, letterSpacing: '0.02em' }}>
                  {PHOTOS[current].caption}
                </span>
              </div>

              {/* Counter */}
              <div className="absolute bottom-5 right-6 z-20">
                <span className="glass text-xs font-semibold px-3 py-1.5 rounded-full" style={{ color: '#fff', background: 'rgba(0,0,0,0.35)' }}>
                  {current + 1} / {PHOTOS.length}
                </span>
              </div>

              {/* Nav buttons */}
              <button
                onClick={prev}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full flex items-center justify-center transition-all hover:scale-110"
                style={{ background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(8px)', boxShadow: '0 4px 16px rgba(0,0,0,0.15)' }}
                aria-label="Anterior"
              >
                <ChevronLeft size={20} style={{ color: 'var(--color-primary-dark)' }} />
              </button>
              <button
                onClick={next}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full flex items-center justify-center transition-all hover:scale-110"
                style={{ background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(8px)', boxShadow: '0 4px 16px rgba(0,0,0,0.15)' }}
                aria-label="Próximo"
              >
                <ChevronRight size={20} style={{ color: 'var(--color-primary-dark)' }} />
              </button>
            </div>
          </div>

          {/* Thumbnails */}
          <div className="flex gap-2 mt-4 overflow-x-auto pb-1 justify-center flex-wrap">
            {PHOTOS.map((photo, i) => (
              <button
                key={photo.src}
                onClick={() => { setCurrent(i); setPaused(true) }}
                className="flex-shrink-0 rounded-xl overflow-hidden transition-all"
                style={{
                  width: 72, height: 48,
                  outline: i === current ? '2.5px solid var(--color-primary)' : '2.5px solid transparent',
                  outlineOffset: '2px',
                  opacity: i === current ? 1 : 0.5,
                  transform: i === current ? 'scale(1.05)' : 'scale(1)',
                  transition: 'all 0.2s',
                }}
              >
                <Image
                  src={photo.src}
                  alt={photo.caption}
                  width={72}
                  height={48}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              </button>
            ))}
          </div>

          {/* Progress bar */}
          <div className="mt-4 h-0.5 rounded-full overflow-hidden mx-auto max-w-xs" style={{ background: 'var(--color-border)' }}>
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${((current + 1) / PHOTOS.length) * 100}%`,
                background: 'var(--color-primary)',
              }}
            />
          </div>
        </motion.div>
      </div>
    </section>
  )
}
