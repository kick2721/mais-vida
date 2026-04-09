// app/api/cleanup-receipts/route.ts
// Cron unificado — ejecutado automáticamente por Vercel cada hora
// Hace dos cosas en una sola llamada:
//   1. Borra comprovativos de pago del storage (1 hora tras confirmar/cancelar)
//   2. Borra candidaturas aprobadas/rechazadas de la BD (2 días tras revisión)
// Protegido por CRON_SECRET para que nadie externo pueda llamarlo

import { NextResponse } from 'next/server'
import { runFullCleanup } from '@/lib/receipt-cleanup'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await runFullCleanup()

    console.log(
      `[Cron] Comprovativos: ${result.receipts.deleted} borrados — ` +
      `Candidaturas: ${result.applications.deleted} borradas`
    )

    return NextResponse.json({
      success: true,
      receipts: result.receipts,
      applications: result.applications,
      timestamp: new Date().toISOString(),
    })
  } catch (err) {
    console.error('[Cron] Error crítico:', err)
    return NextResponse.json({ error: 'Cleanup failed' }, { status: 500 })
  }
}
