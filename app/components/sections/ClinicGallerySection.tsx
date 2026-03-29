'use client'

// app/components/sections/ClinicGallerySection.tsx
// Slider automático con las fotos reales de la clínica

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'

const PHOTOS = [
  { src: '/clinica-1.jpg',  caption: 'Recepção' },
  { src: '/clinica-10.jpg', caption: 'Hall de entrada' },
  { src: '/clinica-8.jpg',  caption: 'Sala de espera' },
  { src: '/clinica-9.jpg',  caption: 'Sala de espera' },
  { src: '/clinica-2.jpg',  caption: 'Consultório' },
  { src: '/clinica-3.jpg',  caption: 'Sala de observação' },
  { src: '/clinica-4.jpg',  caption: 'Sala de espera 2º piso' },
  { src: '/clinica-5.jpg',  caption: 'Laboratório' },
  { src: '/clinica-6.jpg',  caption: 'Área pediátrica' },
  { src: '/clinica-7.jpg',  caption: 'Interior da clínica' },
]

export default function ClinicGallerySection() {
  const [current, setCurrent] = useState(0)
  const [paused, setPaused] = useState(false)

  const next = useCallback(() => {
    setCurrent(c => (c + 1) % PHOTOS.length)
  }, [])

  const prev = useCallback(() => {
    setCurrent(c => (c - 1 + PHOTOS.length) % PHOTOS.length)
  }, [])

  // Auto-avance cada 4 segundos
  useEffect(() => {
    if (paused) return
    const timer = setInterval(next, 4000)
    return () => clearInterval(timer)
  }, [paused, next])

  return (
    <section className="py-20" style={{ background: '#fff' }}>
      <div className="section-container">

        {/* Cabecera */}
        <div className="text-center mb-10">
          <span
            className="inline-block text-xs font-semibold uppercase tracking-widest mb-3 px-3 py-1 rounded-full"
            style={{ background: 'var(--color-surface)', color: 'var(--color-primary)' }}
          >
            Conheça-nos
          </span>
          <h2
            className="font-display text-3xl md:text-4xl font-bold mb-3"
            style={{ color: 'var(--color-text)' }}
          >
            As nossas instalações
          </h2>
          <p className="text-base max-w-xl mx-auto" style={{ color: 'var(--color-text-muted)' }}>
            Espaços modernos, equipados e pensados para o seu conforto e bem-estar.
          </p>
        </div>

        {/* Slider principal */}
        <div
          className="relative rounded-2xl overflow-hidden"
          style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.14)' }}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          {/* Imagen activa */}
          <div className="relative w-full" style={{ aspectRatio: '16/9' }}>
            {PHOTOS.map((photo, i) => (
              <div
                key={photo.src}
                className="absolute inset-0 transition-opacity duration-700"
                style={{ opacity: i === current ? 1 : 0, zIndex: i === current ? 1 : 0 }}
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

            {/* Overlay gradiente abajo */}
            <div
              className="absolute bottom-0 left-0 right-0 h-20 z-10"
              style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.45), transparent)' }}
            />

            {/* Caption */}
            <div className="absolute bottom-4 left-6 z-20">
              <span className="text-white text-sm font-semibold opacity-90">
                {PHOTOS[current].caption}
              </span>
            </div>

            {/* Contador */}
            <div className="absolute bottom-4 right-6 z-20">
              <span className="text-white text-xs opacity-70">
                {current + 1} / {PHOTOS.length}
              </span>
            </div>

            {/* Botón anterior */}
            <button
              onClick={prev}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full flex items-center justify-center transition-all"
              style={{ background: 'rgba(255,255,255,0.85)', color: 'var(--color-text)' }}
              aria-label="Anterior"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M11 4L6 9l5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            {/* Botón siguiente */}
            <button
              onClick={next}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full flex items-center justify-center transition-all"
              style={{ background: 'rgba(255,255,255,0.85)', color: 'var(--color-text)' }}
              aria-label="Próximo"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M7 4l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Miniaturas */}
        <div className="flex gap-2 mt-4 overflow-x-auto pb-1 justify-center flex-wrap">
          {PHOTOS.map((photo, i) => (
            <button
              key={photo.src}
              onClick={() => { setCurrent(i); setPaused(true) }}
              className="flex-shrink-0 rounded-lg overflow-hidden transition-all"
              style={{
                width: 72,
                height: 48,
                outline: i === current ? '3px solid var(--color-primary)' : '3px solid transparent',
                outlineOffset: '2px',
                opacity: i === current ? 1 : 0.55,
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

        {/* Barra de progreso */}
        <div className="mt-4 h-1 rounded-full overflow-hidden mx-auto max-w-xs" style={{ background: 'var(--color-border)' }}>
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${((current + 1) / PHOTOS.length) * 100}%`,
              background: 'var(--color-primary)',
            }}
          />
        </div>

      </div>
    </section>
  )
}
