// app/components/sections/LocationSection.tsx
// Sección de ubicación con Google Maps embed + datos de contacto

import { BUSINESS } from '@/lib/constants'

export default function LocationSection() {
  return (
    <section id="localizacao" className="py-20" style={{ background: 'var(--color-surface)' }}>
      <div className="section-container">

        {/* Cabecera */}
        <div className="text-center mb-10">
          <span
            className="inline-block text-xs font-semibold uppercase tracking-widest mb-3 px-3 py-1 rounded-full"
            style={{ background: '#fff', color: 'var(--color-primary)' }}
          >
            Onde estamos
          </span>
          <h2
            className="font-display text-3xl md:text-4xl font-bold mb-3"
            style={{ color: 'var(--color-text)' }}
          >
            Como chegar
          </h2>
          <p className="text-base max-w-xl mx-auto" style={{ color: 'var(--color-text-muted)' }}>
            Encontre-nos facilmente no Bairro Patriota, Luanda.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

          {/* Mapa — ocupa 2/3 */}
          <div
            className="lg:col-span-2 rounded-2xl overflow-hidden"
            style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.10)', height: 420 }}
          >
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3942.0!2d13.2!3d-8.9!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x9c5815d98dc97f48!2s%2BVida%20Centro%20de%20Diagn%C3%B3stico%20e%20Especialidades!5e0!3m2!1spt!2sao!4v1700000000000!5m2!1spt!2sao"
              width="100%"
              height="100%"
              style={{ border: 0, display: 'block' }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Localização +Vida Centro de Diagnóstico e Especialidades"
            />
          </div>

          {/* Info — ocupa 1/3 */}
          <div className="flex flex-col gap-4">

            <div className="card">
              <div className="flex items-start gap-3">
                <span className="text-2xl mt-0.5">📍</span>
                <div>
                  <p className="font-semibold text-sm mb-1" style={{ color: 'var(--color-text)' }}>
                    Morada
                  </p>
                  <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                    {BUSINESS.address}
                  </p>
                  <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                    Luanda, Angola
                  </p>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-start gap-3">
                <span className="text-2xl mt-0.5">📞</span>
                <div>
                  <p className="font-semibold text-sm mb-1" style={{ color: 'var(--color-text)' }}>
                    Telefone
                  </p>
                  <a
                    href={`tel:${BUSINESS.phone.main}`}
                    className="text-sm hover:opacity-70 transition-opacity block"
                    style={{ color: 'var(--color-primary)' }}
                  >
                    {BUSINESS.phone.main}
                  </a>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-start gap-3">
                <span className="text-2xl mt-0.5">💬</span>
                <div>
                  <p className="font-semibold text-sm mb-1" style={{ color: 'var(--color-text)' }}>
                    WhatsApp
                  </p>
                  <a
                    href={`https://wa.me/${BUSINESS.phone.whatsapp}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm hover:opacity-70 transition-opacity block"
                    style={{ color: 'var(--color-primary)' }}
                  >
                    Enviar mensagem →
                  </a>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-start gap-3">
                <span className="text-2xl mt-0.5">✉️</span>
                <div>
                  <p className="font-semibold text-sm mb-1" style={{ color: 'var(--color-text)' }}>
                    Email
                  </p>
                  <a
                    href={`mailto:${BUSINESS.email.info}`}
                    className="text-sm hover:opacity-70 transition-opacity block"
                    style={{ color: 'var(--color-primary)' }}
                  >
                    {BUSINESS.email.info}
                  </a>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-start gap-3">
                <span className="text-2xl mt-0.5">📸</span>
                <div>
                  <p className="font-semibold text-sm mb-1" style={{ color: 'var(--color-text)' }}>
                    Instagram
                  </p>
                  <a
                    href={`https://instagram.com/${BUSINESS.instagram.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm hover:opacity-70 transition-opacity block"
                    style={{ color: 'var(--color-primary)' }}
                  >
                    {BUSINESS.instagram}
                  </a>
                </div>
              </div>
            </div>

            {/* Botón abrir en Google Maps */}
            <a
              href="https://www.google.com/maps/place/%2BVida+Centro+de+Diagn%C3%B3stico+e+Especialidades/data=!4m2!3m1!1s0x0:0x9c5815d98dc97f48"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary text-sm text-center py-3"
            >
              📍 Abrir no Google Maps
            </a>

          </div>
        </div>
      </div>
    </section>
  )
}
