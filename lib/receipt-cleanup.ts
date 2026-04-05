'use server'

// lib/receipt-cleanup.ts
// Borrado de comprovativos del storage
// Estrategia: marcar para borrar en BD, borrar físicamente cuando el admin
// abre el panel (lazy cleanup) — sin depender de crons externos

import { createServerSupabaseAdminClient } from './supabase-server'

// Marca el comprovativo para borrado en 60 minutos desde ahora
export async function scheduleReceiptDeletion(saleId: string) {
  const supabase = await createServerSupabaseAdminClient()
  const { error } = await supabase
    .from('sales')
    .update({
      receipt_delete_after: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    })
    .eq('id', saleId)
    .is('receipt_delete_after', null) // no sobrescribir si ya está programado

  if (error) {
    console.error('[Cleanup] Error al programar borrado:', error.message)
  }
}

// Borra físicamente del storage los comprovativos que ya cumplieron 1 hora
// Se llama desde el panel admin al cargar — sin cron, sin servidor externo
export async function cleanupExpiredReceipts(): Promise<{ deleted: number; errors: number }> {
  const supabase = await createServerSupabaseAdminClient()

  // Buscar comprovativos listos para borrar
  const { data: sales, error } = await supabase
    .from('sales')
    .select('id, receipt_path')
    .not('receipt_delete_after', 'is', null)
    .lte('receipt_delete_after', new Date().toISOString())
    .not('receipt_path', 'is', null)
    .is('receipt_deleted_at', null)
    .limit(50) // procesar en lotes para no bloquear

  if (error || !sales || sales.length === 0) {
    return { deleted: 0, errors: 0 }
  }

  let deleted = 0
  let errors = 0

  for (const sale of sales) {
    try {
      const path = sale.receipt_path as string

      // El bucket es 'receipts', el path dentro empieza con 'receipts/'
      const storagePath = path.startsWith('receipts/')
        ? path.slice('receipts/'.length)
        : path

      const { error: deleteError } = await supabase.storage
        .from('receipts')
        .remove([storagePath])

      if (deleteError) {
        console.error(`[Cleanup] Error borrando ${storagePath}:`, deleteError.message)
        errors++
        continue
      }

      // Marcar como borrado en BD — limpiar el path
      await supabase
        .from('sales')
        .update({
          receipt_path: null,
          receipt_deleted_at: new Date().toISOString(),
        })
        .eq('id', sale.id)

      console.log(`[Cleanup] ✓ Borrado: ${storagePath}`)
      deleted++
    } catch (err) {
      console.error(`[Cleanup] Error inesperado:`, err)
      errors++
    }
  }

  if (deleted > 0 || errors > 0) {
    console.log(`[Cleanup] Resultado: ${deleted} borrados, ${errors} errores`)
  }

  return { deleted, errors }
}
