// app/components/sections/LocationSection.tsx
'use client'

import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { MapPin, Phone, MessageCircle, Mail, Instagram } from 'lucide-react'
import { BUSINESS } from '@/lib/constants'
import 'leaflet/dist/leaflet.css'

const MAP_LAT = -8.9447
const MAP_LNG = 13.2880

function useLeafletMap(ref: React.RefObject<HTMLDivElement>) {
  useEffect(() => {
    if (!ref.current) return
    let map: any
    let cancelled = false

    ;(async () => {
      const L = (await import('leaflet')).default
      if (cancelled || !ref.current) return

      // Fix default marker icon paths (Leaflet bug with bundlers)
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      map = L.map(ref.current, { scrollWheelZoom: false }).setView([MAP_LAT, MAP_LNG], 16)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
        maxZoom: 19,
      }).addTo(map)
      L.marker([MAP_LAT, MAP_LNG]).addTo(map).bindPopup('+Vida — Centro de Diagnóstico').openPopup()

      setTimeout(() => map && map.invalidateSize(), 200)
    })()

    return () => {
      cancelled = true
      if (map) map.remove()
    }
  }, [ref])
}

const CONTACTS = [
  {
    icon: MapPin,
    label: 'Morada',
    value: `${BUSINESS.address}, Luanda, Angola`,
    href: 'https://www.google.com/maps/place/%2BVida+Centro+de+Diagn%C3%B3stico+e+Especialidades/data=!4m2!3m1!1s0x0:0x9c5815d98dc97f48',
  },
  {
    icon: Phone,
    label: 'Telefone',
    value: BUSINESS.phone.main,
    href: `tel:${BUSINESS.phone.main}`,
  },
  {
    icon: MessageCircle,
    label: 'WhatsApp',
    value: 'Enviar mensagem →',
    href: `https://wa.me/${BUSINESS.phone.whatsapp}`,
  },
  {
    icon: Mail,
    label: 'Email',
    value: BUSINESS.email.info,
    href: `mailto:${BUSINESS.email.info}`,
  },
  {
    icon: Instagram,
    label: 'Instagram',
    value: BUSINESS.instagram,
    href: `https://instagram.com/${BUSINESS.instagram.replace('@', '')}`,
  },
]

export default function LocationSection() {
  const mapRef = useRef<HTMLDivElement>(null)
  useLeafletMap(mapRef)
  return (
    <section id="localizacao" style={{ background: '#fff', paddingTop: '5rem', paddingBottom: '5rem' }}>
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
            <MapPin size={12} />
            Onde estamos
          </span>
          <h2 className="section-title">Como chegar</h2>
          <p className="section-desc">Encontre-nos facilmente no Bairro Patriota, Luanda.</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

          {/* Map */}
          <motion.div
            className="lg:col-span-2 rounded-3xl overflow-hidden"
            style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.12)', height: 420 }}
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <a
              href="https://www.google.com/maps/place/%2BVida+Centro+de+Diagn%C3%B3stico+e+Especialidades/data=!4m2!3m1!1s0x0:0x9c5815d98dc97f48"
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'block', width: '100%', height: '100%', position: 'relative' }}
              aria-label="Abrir localização no Google Maps"
            >
              <img
                src="/mapa.webp"
                alt="Mapa +Vida — Bairro Patriota, Luanda"
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                loading="lazy"
              />
              <div style={{
                position: 'absolute', bottom: 16, right: 16,
                background: 'rgba(255,255,255,0.95)', padding: '8px 14px',
                borderRadius: 10, fontSize: 13, fontWeight: 600,
                color: 'var(--color-primary-dark)', boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <MapPin size={14} /> Abrir no Google Maps
              </div>
            </a>
          </motion.div>

          {/* Contacts */}
          <motion.div
            className="flex flex-col gap-3"
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.1 }}
          >
            {CONTACTS.map((c, i) => {
              const Icon = c.icon
              return (
                <a
                  key={i}
                  href={c.href}
                  target={c.href.startsWith('http') ? '_blank' : undefined}
                  rel="noopener noreferrer"
                  className="card flex items-center gap-3 no-underline group"
                  style={{
                    padding: '0.875rem 1rem',
                    transition: 'box-shadow 0.2s, transform 0.2s',
                    textDecoration: 'none',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateX(4px)'
                    e.currentTarget.style.boxShadow = '0 4px 20px rgba(74,140,63,0.10)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateX(0)'
                    e.currentTarget.style.boxShadow = 'var(--shadow-card)'
                  }}
                >
                  <div style={{
                    width: '38px', height: '38px', borderRadius: '10px',
                    background: 'rgba(74,140,63,0.10)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <Icon size={17} style={{ color: 'var(--color-primary)' }} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1px' }}>
                      {c.label}
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-primary-dark)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.value}
                    </div>
                  </div>
                </a>
              )
            })}

            <a
              href="https://www.google.com/maps/place/%2BVida+Centro+de+Diagn%C3%B3stico+e+Especialidades/data=!4m2!3m1!1s0x0:0x9c5815d98dc97f48"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary text-sm text-center mt-2"
              style={{ textDecoration: 'none' }}
            >
              <MapPin size={16} />
              Abrir no Google Maps
            </a>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
