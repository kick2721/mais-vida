// lib/email/send-email.ts
// Utilitário para envio de emails usando Resend
// NOTA: Requer RESEND_API_KEY no .env.local e domínio verificado no Resend

import { BUSINESS, MEMBERSHIP } from '@/lib/constants'

type EmailTemplate = 'purchase_confirmed' | 'card_issued' | 'commission_paid' | 'welcome'

interface SendEmailOptions {
  to: string
  template: EmailTemplate
  data: Record<string, any>
}

interface ResendResponse {
  id?: string
  error?: { message: string }
}

// ─── TEMPLATES ───────────────────────────────────────────────────────────────

function buildEmailHtml(template: EmailTemplate, data: Record<string, any>): {
  subject: string
  html: string
} {
  const base = (subject: string, body: string) => ({
    subject,
    html: `
<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body { font-family: 'DM Sans', Arial, sans-serif; background: #f0f7ef; margin: 0; padding: 20px; }
    .container { max-width: 560px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; }
    .header { background: #4A8C3F; padding: 32px 40px; text-align: center; }
    .header h1 { color: white; font-size: 24px; margin: 0; font-weight: 700; }
    .header p { color: #c6e4c3; font-size: 13px; margin: 4px 0 0; }
    .body { padding: 32px 40px; }
    .body p { color: #374151; line-height: 1.6; }
    .highlight { background: #f0f7ef; border-radius: 12px; padding: 16px 20px; margin: 20px 0; }
    .highlight p { margin: 4px 0; font-size: 14px; }
    .footer { padding: 20px 40px; border-top: 1px solid #d4e8d1; text-align: center; }
    .footer p { font-size: 12px; color: #9ca3af; margin: 4px 0; }
    .btn { display: inline-block; background: #4A8C3F; color: white !important; padding: 12px 28px; 
           border-radius: 50px; text-decoration: none; font-weight: 600; margin: 16px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${BUSINESS.name}</h1>
      <p>${BUSINESS.tagline}</p>
    </div>
    <div class="body">
      ${body}
    </div>
    <div class="footer">
      <p>${BUSINESS.fullName}</p>
      <p>${BUSINESS.address}</p>
      <p>📞 ${BUSINESS.phone.main} | ${BUSINESS.email.info}</p>
    </div>
  </div>
</body>
</html>
    `.trim(),
  })

  switch (template) {
    case 'purchase_confirmed':
      return base(
        `Pagamento confirmado — ${MEMBERSHIP.name}`,
        `
          <p>Olá, <strong>${data.customerName}</strong>!</p>
          <p>O seu pagamento foi confirmado com sucesso. A sua membresía <strong>${MEMBERSHIP.name}</strong> está agora activa.</p>
          <div class="highlight">
            <p><strong>Valor:</strong> ${(data.amount || 0).toLocaleString()} ${data.currency || 'AOA'}</p>
            <p><strong>Estado:</strong> ✅ Confirmado</p>
          </div>
          <p>O seu cartão digital está a ser preparado e será enviado em breve para este email e para o seu WhatsApp.</p>
          <p>Pode consultar o estado da sua membresía no painel do cliente.</p>
          <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://mais-vida.com'}/dashboard" class="btn">
            Ver o meu painel
          </a>
        `,
      )

    case 'card_issued':
      return base(
        `O seu ${MEMBERSHIP.cardName} foi emitido!`,
        `
          <p>Olá, <strong>${data.customerName}</strong>!</p>
          <p>O seu <strong>${MEMBERSHIP.cardName}</strong> foi emitido com sucesso! 🎉</p>
          <div class="highlight">
            <p><strong>Número do cartão:</strong> <span style="font-family: monospace; font-size: 15px;">${data.cardNumber}</span></p>
            <p><strong>Estado:</strong> ✅ Emitido e activo</p>
          </div>
          <p>Apresente este número (ou o cartão digital enviado) em qualquer serviço da clínica para usufruir dos seus descontos.</p>
          <p>Se tiver alguma questão, contacte-nos pelo WhatsApp: <strong>${BUSINESS.phone.whatsapp}</strong></p>
        `,
      )

    case 'commission_paid':
      return base(
        `Comissão paga — ${BUSINESS.name}`,
        `
          <p>Olá, <strong>${data.affiliateName}</strong>!</p>
          <p>A sua comissão foi processada e paga com sucesso.</p>
          <div class="highlight">
            <p><strong>Valor pago:</strong> ${(data.amount || 0).toLocaleString()} ${data.currency || 'AOA'}</p>
            <p><strong>Data:</strong> ${data.paidAt || new Date().toLocaleDateString('pt-AO')}</p>
          </div>
          <p>Pode verificar o seu historial de comissões no painel do afiliado.</p>
          <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://mais-vida.com'}/affiliate/dashboard" class="btn">
            Ver o meu painel
          </a>
        `,
      )

    case 'welcome':
      return base(
        `Bem-vindo(a) ao ${BUSINESS.name}!`,
        `
          <p>Olá, <strong>${data.customerName}</strong>!</p>
          <p>A sua conta foi criada com sucesso na plataforma <strong>${BUSINESS.name}</strong>.</p>
          <p>Para completar a sua adesão ao ${MEMBERSHIP.name}, efectue o pagamento de 
          <strong>${MEMBERSHIP.price.toLocaleString()} ${MEMBERSHIP.currency}</strong> usando um dos métodos disponíveis.</p>
          <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://mais-vida.com'}/comprar" class="btn">
            Completar adesão
          </a>
        `,
      )

    default:
      return base('Notificação', '<p>Tem uma nova notificação.</p>')
  }
}

// ─── ENVIO ───────────────────────────────────────────────────────────────────

export async function sendEmail({ to, template, data }: SendEmailOptions): Promise<{
  success: boolean
  error?: string
}> {
  const apiKey = process.env.RESEND_API_KEY

  if (!apiKey) {
    console.warn('[Email] RESEND_API_KEY não configurada. Email não enviado.')
    return { success: false, error: 'RESEND_API_KEY não configurada' }
  }

  const { subject, html } = buildEmailHtml(template, data)

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: `${BUSINESS.name} <no-reply@mais-vida.com>`,
        to: [to],
        subject,
        html,
      }),
    })

    const result: ResendResponse = await response.json()

    if (!response.ok || result.error) {
      console.error('[Email] Resend error:', result.error)
      return { success: false, error: result.error?.message }
    }

    console.log('[Email] Enviado com sucesso:', result.id)
    return { success: true }
  } catch (err) {
    console.error('[Email] Erro ao enviar:', err)
    return { success: false, error: String(err) }
  }
}
