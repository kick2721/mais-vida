'use client'

// app/components/sections/StatsSection.tsx
// Contadores animados — dispara quando a secção entra no viewport

import { useEffect, useRef, useState } from 'react'

const STATS = [
  { value: 500,  suffix: '+', label: 'Famílias protegidas',      icon: '👨‍👩‍👧‍👦' },
  { value: 7,    suffix: '',  label: 'Especialidades médicas',   icon: '🩺' },
  { value: 48,   suffix: 'h', label: 'Emissão do cartão',        icon: '⚡' },
  { value: 15,   suffix: '%', label: 'Desconto em consultas',    icon: '💊' },
]

function useCountUp(target: number, duration = 1800, active: boolean) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!active) return
    let start = 0
    const step = target / (duration / 16)
    const timer = setInterval(() => {
      start += step
      if (start >= target) {
        setCount(target)
        clearInterval(timer)
      } else {
        setCount(Math.floor(start))
      }
    }, 16)
    return () => clearInterval(timer)
  }, [active, target, duration])

  return count
}

function StatCard({ value, suffix, label, icon, active }: {
  value: number; suffix: string; label: string; icon: string; active: boolean
}) {
  const count = useCountUp(value, 1600, active)

  return (
    <div className="text-center px-4 py-6">
      <div className="text-4xl mb-3">{icon}</div>
      <div className="font-display text-4xl md:text-5xl font-bold mb-2"
        style={{ color: 'var(--color-primary)' }}>
        {count}{suffix}
      </div>
      <p className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
        {label}
      </p>
    </div>
  )
}

export default function StatsSection() {
  const ref = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setActive(true) },
      { threshold: 0.3 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return (
    <section ref={ref} className="py-16" style={{ background: 'var(--color-primary)' }}>
      <div className="section-container py-0">
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-white/20">
          {STATS.map((stat, i) => (
            <div key={i} style={{ color: 'white' }}>
              <div className="text-center px-4 py-6">
                <div className="text-4xl mb-3">{stat.icon}</div>
                <div className="font-display text-4xl md:text-5xl font-bold mb-2 text-white">
                  {active ? <AnimatedNum value={stat.value} suffix={stat.suffix} /> : `0${stat.suffix}`}
                </div>
                <p className="text-sm font-medium text-white/80">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function AnimatedNum({ value, suffix }: { value: number; suffix: string }) {
  const count = useCountUp(value, 1600, true)
  return <>{count}{suffix}</>
}
