'use server'

// lib/receipt-cleanup.ts
// Lógica de borrado de comprovativos del storage de Supabase
// Se llama desde: confirmSale, cancelSale y el endpoint /api/cleanup-receipts

import { createServerSupabaseAdminClient } from './supabase-server'

// Marca el comprovativo para borrado en 60 minutos
export async function scheduleReceiptDeletion(saleId: string) {
  const supabase = await createServerSupabaseAdminClient()
  await supabase.rpc('mark_receipt_for_deletion', {
    p_sale_id: saleId,
    p_delay_minutes: 60,
  })
}

// Borra físicamente del storage todos los comprovativos que ya cumplieron el tiempo
export async function cleanupExpiredReceipts(): Promise<{
  deleted: number
  errors: number
}> {
  const supabase = await createServerSupabaseAdminClient()

  // Obtener los comprovativos listos para borrar
  const { data: receipts, error } = await supabase.rpc('get_receipts_to_delete')

  if (error || !receipts || receipts.length === 0) {
    return { deleted: 0, errors: 0 }
  }

  let deleted = 0
  let errors = 0

  for (const receipt of receipts) {
    try {
      const path = receipt.receipt_path as string

      // Normalizar el path para el storage
      // El bucket es 'receipts', el path dentro del bucket empieza con 'receipts/'
      const storagePath = path.startsWith('receipts/')
        ? path.slice('receipts/'.length) // quitar prefijo del bucket
        : path

      const { error: deleteError } = await supabase.storage
        .from('receipts')
        .remove([storagePath])

      if (deleteError) {
        console.error(`[Cleanup] Error borrando ${path}:`, deleteError.message)
        errors++
        continue
      }

      // Marcar como borrado en BD
      await supabase.rpc('mark_receipt_deleted', { p_sale_id: receipt.sale_id })

      console.log(`[Cleanup] ✓ Borrado: ${storagePath}`)
      deleted++
    } catch (err) {
      console.error(`[Cleanup] Error inesperado:`, err)
      errors++
    }
  }

  return { deleted, errors }
}
