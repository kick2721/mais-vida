// app/api/cleanup-receipts/route.ts
// Endpoint que borra físicamente los comprovativos expirados del storage
// Llamado automáticamente por Vercel Cron cada 15 minutos
// También puede llamarse manualmente desde el panel admin

import { NextResponse } from 'next/server'
import { cleanupExpiredReceipts } from '@/lib/receipt-cleanup'

// Vercel Cron Job — configurado en vercel.json
// Protegido por CRON_SECRET para que nadie externo pueda llamarlo
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  // Verificar que la llamada viene de Vercel Cron o del admin
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await cleanupExpiredReceipts()

    console.log(`[Cleanup] Resultado: ${result.deleted} borrados, ${result.errors} errores`)

    return NextResponse.json({
      success: true,
      deleted: result.deleted,
      errors: result.errors,
      timestamp: new Date().toISOString(),
    })
  } catch (err) {
    console.error('[Cleanup] Error crítico:', err)
    return NextResponse.json({ error: 'Cleanup failed' }, { status: 500 })
  }
}
