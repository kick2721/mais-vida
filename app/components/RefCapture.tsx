'use client'

// app/components/RefCapture.tsx
// Captura o ?ref= da URL e guarda em cookie para persistir durante a navegação
// Incluir na landing page — não renderiza nada visível

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { REFERRAL } from '@/lib/constants'

export default function RefCapture() {
  const searchParams = useSearchParams()

  useEffect(() => {
    const ref = searchParams.get(REFERRAL.urlParam)
    if (ref) {
      // Guardar em cookie por 30 dias
      const expires = new Date()
      expires.setDate(expires.getDate() + REFERRAL.cookieDays)
      document.cookie = `${REFERRAL.urlParam}=${ref};expires=${expires.toUTCString()};path=/;SameSite=Lax`
    }
  }, [searchParams])

  return null
}
