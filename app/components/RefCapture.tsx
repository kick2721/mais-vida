'use client'

// app/components/RefCapture.tsx
// Captura o ?ref= da URL, guarda em cookie e redireciona para /comprar

import { useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { REFERRAL } from '@/lib/constants'

export default function RefCapture() {
  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    const ref = searchParams.get(REFERRAL.urlParam)
    if (ref) {
      // Guardar em cookie por 30 dias
      const expires = new Date()
      expires.setDate(expires.getDate() + REFERRAL.cookieDays)
      document.cookie = `${REFERRAL.urlParam}=${ref};expires=${expires.toUTCString()};path=/;SameSite=Lax`

      // Redirecionar para /comprar mantendo o código na URL
      router.replace(`/comprar?${REFERRAL.urlParam}=${ref}`)
    }
  }, [searchParams, router])

  return null
}
