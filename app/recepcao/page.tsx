// app/recepcao/page.tsx
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { logoutUser } from '@/lib/actions'
import Logo from '@/app/components/ui/Logo'
import { BUSINESS } from '@/lib/constants'
import ReceptionForm from './ReceptionForm'

export default async function RecepcaoPage() {
  const supabase = await createServerSupabaseClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'receptionist') redirect('/login')

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-surface)' }}>

      {/* Header */}
      <header className="bg-white border-b" style={{ borderColor: 'var(--color-border)' }}>
        <div className="section-container flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <Logo size="sm" href="/" />
            <span
              className="text-xs font-semibold text-white px-2 py-0.5 rounded-full"
              style={{ background: 'var(--color-primary)' }}
            >
              RECEPÇÃO
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600 hidden sm:block">{profile.full_name}</span>
            <form action={logoutUser}>
              <button type="submit" className="text-sm text-gray-500 hover:text-gray-800 transition-colors">
                Sair →
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="section-container py-8 max-w-xl mx-auto">
        <div className="mb-6">
          <h1 className="font-display text-2xl font-bold text-gray-900">Registar Venda</h1>
          <p className="text-gray-500 text-sm mt-1">Venda presencial — pagamento já recebido</p>
        </div>

        <ReceptionForm />
      </div>
    </div>
  )
}
