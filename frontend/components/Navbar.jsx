'use client'

import { useRouter } from 'next/navigation'
import { LogOut, Stethoscope, Bell } from 'lucide-react'
import { useAuth } from '@/lib/AuthContext'
import { Button } from '@heroui/react'

export default function Navbar({ notifCount = 0 }) {
    const { user, logout } = useAuth()
    const router = useRouter()

    const handleLogout = () => {
        logout()  // borro todo rastro del usuario de la memoria y el localStorage
        router.push('/login')  // y lo devuelvo a la pantalla de inicio
    }

    return (
        <header className="bg-white/95 backdrop-blur-md border-b-[3px] border-sky-200/50 shadow-sm sticky top-0 z-40">
            <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
                {/* Logo Creativo */}
                <div className="flex items-center gap-3 cursor-pointer" onClick={() => router.push(user?.rol === 'MEDICO' ? '/medico' : '/paciente')}>
                    <div className="bg-gradient-to-tr from-sky-500 to-blue-600 p-2 rounded-xl shadow-md">
                        <Stethoscope size={20} className="text-white drop-shadow-sm" />
                    </div>
                    <span className="font-black text-transparent bg-clip-text bg-gradient-to-r from-sky-600 to-blue-700 text-xl tracking-tight hidden sm:block">
                        Sweet Medical
                    </span>
                    <span className="font-black text-sky-700 text-xl tracking-tight sm:hidden">
                        SM
                    </span>
                </div>

                {/* Lado derecho (Info de usuario y acciones) */}
                <div className="flex items-center gap-5">
                    {user && (
                        <div
                            className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity bg-slate-50 border border-slate-100 pl-3 pr-1 py-1 rounded-full shadow-sm"
                            onClick={() => router.push(user.rol === 'MEDICO' ? '/medico/perfil' : '/paciente/perfil')}
                            title="Ver Perfil"
                        >
                            <span className="text-sm text-slate-600 hidden md:block font-medium">
                                {user.nombre} <span className="mx-1 text-slate-300">|</span> <span className="font-bold text-sky-700">{user.rol}</span>
                            </span>
                            <img
                                src={`https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=${user.usuario}`}
                                alt="avatar"
                                className="w-8 h-8 rounded-full border-2 border-white shadow-sm object-cover bg-sky-100 shrink-0"
                            />
                        </div>
                    )}



                    {/* Botón de Logout */}
                    <Button
                        size="sm"
                        variant="flat"
                        color="danger"
                        onPress={handleLogout}
                        aria-label="Cerrar sesión"
                        className="min-w-0 px-2 sm:px-3 font-semibold bg-red-50 text-red-600 hover:bg-red-100 flex items-center justify-center"
                    >
                        <LogOut size={18} className="shrink-0" />
                        <span className="hidden sm:inline">Salir</span>
                    </Button>
                </div>
            </div>
        </header>
    )
}
