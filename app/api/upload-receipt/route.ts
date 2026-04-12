import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient as createClient } from '@/lib/supabase-server'

const MAX_SIZE_BYTES = 2 * 1024 * 1024 // 2MB

// Magic bytes para cada tipo de archivo permitido
const ALLOWED_TYPES: { mime: string; magic: number[] }[] = [
  { mime: 'image/jpeg', magic: [0xFF, 0xD8, 0xFF] },
  { mime: 'image/png',  magic: [0x89, 0x50, 0x4E, 0x47] },
  { mime: 'image/webp', magic: [0x52, 0x49, 0x46, 0x46] }, // RIFF header
  { mime: 'application/pdf', magic: [0x25, 0x50, 0x44, 0x46] }, // %PDF
]

function detectMime(buffer: Uint8Array): string | null {
  for (const { mime, magic } of ALLOWED_TYPES) {
    if (magic.every((byte, i) => buffer[i] === byte)) {
      // Verificación adicional para WEBP: bytes 8-11 deben ser "WEBP"
      if (mime === 'image/webp') {
        const webp = [0x57, 0x45, 0x42, 0x50]
        if (!webp.every((byte, i) => buffer[8 + i] === byte)) continue
      }
      return mime
    }
  }
  return null
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'Ficheiro em falta.' }, { status: 400 })
    }

    // Gerar o nome do ficheiro no servidor — nunca confiar no cliente
    const ext = file.name.split('.').pop()?.toLowerCase() || 'bin'
    const filePath = `receipts/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    // 1. Validar tamaño en servidor (no confiar en el cliente)
    if (file.size > MAX_SIZE_BYTES) {
      const sizeMB = (file.size / 1024 / 1024).toFixed(1)
      return NextResponse.json(
        { error: `Ficheiro demasiado grande (${sizeMB}MB). Máximo permitido: 2MB.` },
        { status: 400 }
      )
    }

    // 2. Validar tipo MIME real leyendo los primeros bytes (magic numbers)
    const arrayBuffer = await file.arrayBuffer()
    const bytes = new Uint8Array(arrayBuffer)
    const detectedMime = detectMime(bytes)

    if (!detectedMime) {
      return NextResponse.json(
        { error: 'Tipo de ficheiro não permitido. Use JPG, PNG, WEBP ou PDF.' },
        { status: 400 }
      )
    }

    // 3. Sanear el nombre del archivo (evitar path traversal)
    const safeFileName = filePath.replace(/[^a-zA-Z0-9/_.-]/g, '_')

    // 4. Subir a Supabase Storage desde el servidor
    const supabase = await createClient()
    const { error: uploadError } = await supabase.storage
      .from('receipts')
      .upload(safeFileName, arrayBuffer, {
        contentType: detectedMime,
        upsert: false,
      })

    if (uploadError) {
      console.error('Supabase upload error:', uploadError)
      return NextResponse.json(
        { error: 'Erro ao guardar ficheiro. Tente novamente.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, path: safeFileName })
  } catch (err) {
    console.error('Upload route error:', err)
    return NextResponse.json({ error: 'Erro interno. Tente novamente.' }, { status: 500 })
  }
}
