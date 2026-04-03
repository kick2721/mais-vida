// app/dashboard/page.tsx
// Clientes ya no tienen cuenta — redirigir al inicio
import { redirect } from 'next/navigation'

export default function CustomerDashboardPage() {
  redirect('/')
}
