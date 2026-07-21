'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/AuthContext'
import Spinner from '@/components/Spinner'

export default function RootPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // me aseguro de que haya terminado de cargar antes de patear al usuario
    if (loading) return
    if (!user) {
      router.replace('/login')  // no estas logueado, vas al login
    } else if (user.rol === 'MEDICO') {
      router.replace('/medico')  // sos doc, vas a tu panel
    } else {
      router.replace('/paciente')  // sos paciente, vas al tuyo
    }
  }, [user, loading, router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Spinner size="lg" />
    </div>
  )
}
