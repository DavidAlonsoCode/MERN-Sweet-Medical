import { Inter } from 'next/font/google'
import Providers from '@/components/Providers'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata = {
  title: 'Sweet Medical - Gestión de Turnos',
  description: 'Plataforma de gestión de turnos médicos',
}

export default function RootLayout({
  children,
}) {
  return (
      <html lang="es" className={inter.variable}>
        <body className="font-sans antialiased min-h-screen fondo-sweet">
            <Providers>{children}</Providers>
        </body>
      </html>
  )
}