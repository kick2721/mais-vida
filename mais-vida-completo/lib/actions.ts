'use server'

import { createServerSupabaseClient } from './supabase-server'
import { redirect } from 'next/navigation'

export async function logoutUser() {
  const supabase = await createServerSupabaseClient()
  await supabase.auth.signOut()
  redirect('/login')
}
