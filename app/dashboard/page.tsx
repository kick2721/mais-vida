// app/dashboard/page.tsx
// Painel do Cliente — estado da membresía e cartão

import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { logoutUser } from '@/lib/actions'
import Logo from '@/app/components/ui/Logo'
import { MEMBERSHIP, BUSINESS } from '@/lib/constants'
import BecomeAffiliateButton from './BecomeAffiliateButton'

export default async function CustomerDashboardPage() {
  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'customer') redirect('/login')

  // Última venda do cliente
  const { data: sale } = await supabase
    .from('sales')
    .select('*, member_cards(*)')
    .eq('customer_email', user.email)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const card = sale?.member_cards?.[0]

  const statusLabel: Record<string, { label: string; color: string; bg: string }> = {
    pending_review: { label: 'Aguarda verificação', color: '#92400e', bg: '#fef3c7' },
    confirmed:      { label: 'Confirmado',          color: '#065f46', bg: '#d1fae5' },
    cancelled:      { label: 'Cancelado',           color: '#991b1b', bg: '#fee2e2' },
  }

  const cardStatusLabel: Record<string, { label: string; color: string; bg: string }> = {
    pending:  { label: 'Cartão a ser preparado', color: '#92400e', bg: '#fef3c7' },
    issued:   { label: 'Cartão emitido ✓',       color: '#065f46', bg: '#d1fae5' },
  }

  const saleStatus   = sale ? statusLabel[sale.status]  : null
  const cardStatus   = card ? cardStatusLabel[card.status] : null

  return (
    <div className="min-h-screen" style={{ background: 'rgba(240,247,239,0.6)' }}>

      {/* Header */}
      <header
        className="border-b px-4"
        style={{ background: '#fff', borderColor: 'var(--color-border)' }}
      >
        <div className="section-container flex items-center justify-between h-16">
          <Logo size="sm" href="/" />
          <div className="flex items-center gap-4">
            <span className="text-sm hidden md:block" style={{ color: 'var(--color-text-muted)' }}>
              {profile.full_name || user.email}
            </span>
            <form action={logoutUser}>
              <button type="submit" className="btn-outline text-sm py-1.5 px-3">
                Sair
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="section-container py-10">
        <h1
          className="font-display text-2xl font-bold mb-1"
          style={{ color: 'var(--color-text)' }}
        >
          Olá, {profile.full_name?.split(' ')[0] || 'Cliente'}
        </h1>
        <p className="text-sm mb-8" style={{ color: 'var(--color-text-muted)' }}>
          Aqui pode acompanhar o estado da sua membresía.
        </p>

        {!sale ? (
          /* Sem compra ainda */
          <div className="card text-center max-w-md mx-auto">
            <div className="text-5xl mb-4">💳</div>
            <h2 className="font-display text-xl font-bold mb-2" style={{ color: 'var(--color-text)' }}>
              Ainda não tem {MEMBERSHIP.name}
            </h2>
            <p className="text-sm mb-6" style={{ color: 'var(--color-text-muted)' }}>
              Adquira o seu cartão e comece a poupar em saúde para toda a família.
            </p>
            <Link href="/comprar" className="btn-primary">
              Obter {MEMBERSHIP.name}
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-2xl">

            {/* Estado da compra */}
            <div className="card">
              <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--color-text-muted)' }}>
                Estado da compra
              </p>
              {saleStatus && (
                <span
                  className="inline-block text-xs font-semibold px-3 py-1 rounded-full mb-3"
                  style={{ color: saleStatus.color, background: saleStatus.bg }}
                >
                  {saleStatus.label}
                </span>
              )}
              <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                Valor:{' '}
                <strong style={{ color: 'var(--color-text)' }}>
                  {sale.amount?.toLocaleString('pt-AO')} {MEMBERSHIP.currencySymbol}
                </strong>
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                Submetido em {new Date(sale.created_at).toLocaleDateString('pt-AO')}
              </p>
            </div>

            {/* Estado do cartão */}
            <div className="card">
              <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--color-text-muted)' }}>
                {MEMBERSHIP.cardName}
              </p>
              {card ? (
                <>
                  {cardStatus && (
                    <span
                      className="inline-block text-xs font-semibold px-3 py-1 rounded-full mb-3"
                      style={{ color: cardStatus.color, background: cardStatus.bg }}
                    >
                      {cardStatus.label}
                    </span>
                  )}
                  {card.status === 'issued' && card.card_number && (
                    <p className="text-sm font-mono mt-2" style={{ color: 'var(--color-primary)' }}>
                      Nº {card.card_number}
                    </p>
                  )}
                </>
              ) : (
                <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                  O cartão será emitido após confirmação do pagamento.
                </p>
              )}
            </div>

          </div>
        )}

        {/* Tornar-me Afiliado */}
        <div className="mt-8 max-w-2xl">
          <div className="card border-2" style={{ borderColor: 'rgba(74,140,63,0.25)', background: 'rgba(240,247,239,0.8)' }}>
            <div className="flex items-start gap-4 flex-wrap">
              <div className="text-3xl">🤝</div>
              <div className="flex-1">
                <h3 className="font-display font-bold text-gray-900 mb-1">
                  Quer ganhar dinheiro a recomendar?
                </h3>
                <p className="text-sm mb-4" style={{ color: 'var(--color-text-muted)' }}>
                  Torne-se afiliado e ganhe <strong style={{ color: 'var(--color-primary)' }}>250 Kz</strong> por cada Cartão +Vida vendido através do seu link. 
                  A sua membresía actual não é afectada.
                </p>
                <BecomeAffiliateButton />
              </div>
            </div>
          </div>
        </div>

        {/* Contacto */}
        <div className="mt-10">
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            Dúvidas? Fale connosco:{' '}
            <a
              href={`https://wa.me/${BUSINESS.phone.whatsapp}`}
              style={{ color: 'var(--color-primary)' }}
            >
              WhatsApp
            </a>
            {' '}ou{' '}
            <a href={`mailto:${BUSINESS.email.info}`} style={{ color: 'var(--color-primary)' }}>
              {BUSINESS.email.info}
            </a>
          </p>
        </div>
      </main>
    </div>
  )
}
