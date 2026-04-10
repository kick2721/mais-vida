// lib/email/send-email.ts
// Todos os emails da plataforma — enviados via Resend
// Supabase Auth emails (reset password) são substituídos por este sistema

import { BUSINESS, MEMBERSHIP } from '@/lib/constants'

type EmailTemplate =
  | 'password_reset'
  | 'affiliate_approved'
  | 'affiliate_rejected'
  | 'affiliate_deactivated'
  | 'affiliate_reactivated'

interface SendEmailOptions {
  to: string
  template: EmailTemplate
  data: Record<string, any>
}

interface ResendResponse {
  id?: string
  error?: { message: string }
}

// ─── BASE LAYOUT ─────────────────────────────────────────────────────────────

function baseLayout(subject: string, body: string): string {
  return `
<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body { font-family: Arial, sans-serif; background: #f0f7ef; margin: 0; padding: 20px; }
    .container { max-width: 560px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .header { background: #4A8C3F; padding: 32px 40px; text-align: center; }
    .header h1 { color: white; font-size: 22px; margin: 0 0 4px; font-weight: 700; letter-spacing: -0.3px; }
    .header p { color: #c6e4c3; font-size: 13px; margin: 0; }
    .body { padding: 32px 40px; }
    .body p { color: #374151; line-height: 1.65; font-size: 15px; margin: 0 0 16px; }
    .highlight { background: #f0f7ef; border-radius: 12px; padding: 16px 20px; margin: 20px 0; border-left: 4px solid #4A8C3F; }
    .highlight p { margin: 6px 0; font-size: 14px; color: #374151; }
    .highlight p strong { color: #1a1a1a; }
    .highlight-warning { background: #fff8e1; border-left: 4px solid #f59e0b; }
    .highlight-danger { background: #fff1f2; border-left: 4px solid #e11d48; }
    .highlight-info { background: #eff6ff; border-left: 4px solid #3b82f6; }
    .btn { display: inline-block; background: #4A8C3F; color: white !important; padding: 13px 30px;
           border-radius: 50px; text-decoration: none; font-weight: 700; margin: 20px 0; font-size: 15px; }
    .btn-outline { background: transparent; color: #4A8C3F !important; border: 2px solid #4A8C3F; }
    .divider { height: 1px; background: #e5e7eb; margin: 24px 0; }
    .footer { padding: 20px 40px 28px; text-align: center; }
    .footer p { font-size: 12px; color: #9ca3af; margin: 4px 0; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 50px; font-size: 12px; font-weight: 700; }
    .badge-green { background: #dcfce7; color: #166534; }
    .badge-red { background: #fee2e2; color: #991b1b; }
    .badge-yellow { background: #fef9c3; color: #92400e; }
    .badge-blue { background: #dbeafe; color: #1e40af; }
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
      <p><strong>${BUSINESS.fullName}</strong></p>
      <p>${BUSINESS.address} · Luanda, Angola</p>
      <p>📞 ${BUSINESS.phone.main} &nbsp;|&nbsp; ✉️ ${BUSINESS.email.info}</p>
    </div>
  </div>
</body>
</html>`.trim()
}

// ─── TEMPLATES ────────────────────────────────────────────────────────────────

function buildEmailContent(
  template: EmailTemplate,
  data: Record<string, any>
): { subject: string; html: string } {

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://mais-vida.com'

  switch (template) {





    // ── Recuperação de password ────────────────────────────────────────────
    // Este template bypassa os emails do Supabase (que têm limite reduzido)
    case 'password_reset': {
      const subject = `Recuperação de palavra-passe — ${BUSINESS.name}`
      const html = baseLayout(subject, `
        <p>Olá!</p>
        <p>Recebemos um pedido de recuperação de palavra-passe para a conta associada a este email.</p>
        <div class="highlight">
          <p>Clique no botão abaixo para definir uma nova palavra-passe.</p>
          <p style="font-size:12px;color:#6b7280">Este link expira em <strong>1 hora</strong>.</p>
        </div>
        <div class="divider"></div>
        <p style="text-align:center">
          <a href="${data.resetUrl}" class="btn">Definir nova palavra-passe →</a>
        </p>
        <div class="divider"></div>
        <div class="highlight highlight-warning">
          <p style="font-size:13px">⚠️ <strong>Não pediu recuperação de palavra-passe?</strong></p>
          <p style="font-size:13px">Ignore este email. A sua conta está segura.</p>
        </div>
        <p style="font-size:13px;color:#6b7280">Se o botão não funcionar, copie e cole este link no seu navegador:</p>
        <p style="font-size:12px;color:#4A8C3F;word-break:break-all">${data.resetUrl}</p>
      `)
      return { subject, html }
    }

    // ── Candidatura aprovada ───────────────────────────────────────────────
    case 'affiliate_approved': {
      const subject = `A sua candidatura foi aprovada! — ${BUSINESS.name}`
      const html = baseLayout(subject, `
        <p>Olá, <strong>${data.affiliateName}</strong>!</p>
        <p>🎉 Temos uma ótima notícia: a sua candidatura ao <strong>Programa de Afiliados ${BUSINESS.name}</strong> foi <strong>aprovada</strong>!</p>
        <div class="highlight">
          <p><strong>O seu código de afiliado:</strong> <span style="font-family:monospace;font-size:16px;font-weight:700;color:#4A8C3F">${data.referralCode}</span></p>
          <p><strong>O seu link de referido:</strong></p>
          <p style="font-size:13px;color:#4A8C3F;word-break:break-all">${siteUrl}/?ref=${data.referralCode}</p>
        </div>
        <p>Pode agora aceder ao seu painel de afiliado com o email e a palavra-passe que definiu ao candidatar-se.</p>
        <div class="highlight highlight-info">
          <p><strong>Como funciona:</strong></p>
          <p style="font-size:13px">1. Partilhe o seu link com a sua rede de contactos.</p>
          <p style="font-size:13px">2. Cada pessoa que comprar um cartão através do seu link gera uma comissão de <strong>${data.commissionAmount || '250'} Kz</strong>.</p>
          <p style="font-size:13px">3. Acompanhe as suas vendas e comissões no painel do afiliado.</p>
        </div>
        <div class="divider"></div>
        <p style="text-align:center">
          <a href="${siteUrl}/login" class="btn">Entrar no painel →</a>
        </p>
        <p style="text-align:center;font-size:13px;color:#6b7280">
          Use o email e a palavra-passe que definiu ao candidatar-se.
        </p>
      `)
      return { subject, html }
    }

    // ── Candidatura rejeitada ──────────────────────────────────────────────
    case 'affiliate_rejected': {
      const subject = `Resposta à sua candidatura — ${BUSINESS.name}`
      const html = baseLayout(subject, `
        <p>Olá, <strong>${data.affiliateName}</strong>!</p>
        <p>Agradecemos o interesse em fazer parte do <strong>Programa de Afiliados ${BUSINESS.name}</strong>.</p>
        <p>Após análise, a sua candidatura <strong>não foi aprovada</strong> neste momento.</p>
        ${data.rejectReason ? `
        <div class="highlight highlight-danger">
          <p><strong>Observação da equipa:</strong></p>
          <p style="font-size:14px">${data.rejectReason}</p>
        </div>
        ` : ''}
        <p>Pode candidatar-se novamente no futuro. Se tiver alguma questão, não hesite em contactar-nos.</p>
        <div class="divider"></div>
        <p style="text-align:center">
          <a href="https://wa.me/${BUSINESS.phone.whatsapp}" class="btn btn-outline">Contactar a equipa →</a>
        </p>
      `)
      return { subject, html }
    }

    // ── Conta desactivada ──────────────────────────────────────────────────
    case 'affiliate_deactivated': {
      const subject = `A sua conta de afiliado foi desactivada — ${BUSINESS.name}`
      const html = baseLayout(subject, `
        <p>Olá, <strong>${data.affiliateName}</strong>!</p>
        <p>A sua conta de afiliado na plataforma <strong>${BUSINESS.name}</strong> foi temporariamente <strong>desactivada</strong>.</p>
        <div class="highlight highlight-warning">
          <p><strong>O que isto significa:</strong></p>
          <p style="font-size:13px">• Não consegue aceder ao seu painel de afiliado.</p>
          <p style="font-size:13px">• O seu link de referido não registará novas vendas durante este período.</p>
          <p style="font-size:13px">• As comissões anteriores não são afectadas.</p>
        </div>
        <p>Para mais informações ou para resolver esta situação, contacte a nossa equipa directamente.</p>
        <div class="divider"></div>
        <p style="text-align:center">
          <a href="https://wa.me/${BUSINESS.phone.whatsapp}" class="btn btn-outline">Contactar a equipa →</a>
        </p>
      `)
      return { subject, html }
    }

    // ── Conta reactivada ───────────────────────────────────────────────────
    case 'affiliate_reactivated': {
      const subject = `A sua conta de afiliado foi reactivada — ${BUSINESS.name}`
      const html = baseLayout(subject, `
        <p>Olá, <strong>${data.affiliateName}</strong>!</p>
        <p>Boa notícia: a sua conta de afiliado na plataforma <strong>${BUSINESS.name}</strong> foi <strong>reactivada</strong>! ✅</p>
        <div class="highlight">
          <p><strong>O seu código de afiliado:</strong> <span style="font-family:monospace;font-size:16px;font-weight:700;color:#4A8C3F">${data.referralCode}</span></p>
          <p><strong>Estado:</strong> <span class="badge badge-green">✅ Activo</span></p>
        </div>
        <p>Já pode voltar a aceder ao seu painel e partilhar o seu link de referido normalmente.</p>
        <div class="divider"></div>
        <p style="text-align:center">
          <a href="${siteUrl}/login" class="btn">Entrar no painel →</a>
        </p>
      `)
      return { subject, html }
    }

    default: {
      const subject = 'Notificação — ' + BUSINESS.name
      const html = baseLayout(subject, '<p>Tem uma nova notificação.</p>')
      return { subject, html }
    }
  }
}

// ─── ENVIO ────────────────────────────────────────────────────────────────────

export async function sendEmail({ to, template, data }: SendEmailOptions): Promise<{
  success: boolean
  error?: string
}> {
  const apiKey = process.env.RESEND_API_KEY

  if (!apiKey) {
    console.warn('[Email] RESEND_API_KEY não configurada. Email não enviado.')
    return { success: false, error: 'RESEND_API_KEY não configurada' }
  }

  const { subject, html } = buildEmailContent(template, data)

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: `${BUSINESS.name} <onboarding@resend.dev>`,
        to: ['kick02721@gmail.com'], // TEST: redirigir ao email verificado até ter domínio
        subject: `[TESTE → ${to}] ${subject}`, // mostra o destinatário real no assunto
        html,
      }),
    })

    const result: ResendResponse = await response.json()

    if (!response.ok || result.error) {
      console.error('[Email] Resend error:', result.error)
      return { success: false, error: result.error?.message }
    }

    console.log(`[Email] ✓ Enviado (${template}) → ${to} | id: ${result.id}`)
    return { success: true }
  } catch (err) {
    console.error('[Email] Erro ao enviar:', err)
    return { success: false, error: String(err) }
  }
}
