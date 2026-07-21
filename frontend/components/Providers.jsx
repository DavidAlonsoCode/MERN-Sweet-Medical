'use client'

import { AuthProvider } from '@/lib/AuthContext'

// este componente envuelve a toda la app para que el contexto de autenticacion este disponible en cualquier pantalla
export default function Providers({ children }) {
  return <AuthProvider>{children}</AuthProvider>
}