'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CalendarDays, Bell } from 'lucide-react'
import { useAuth } from '@/lib/AuthContext'
import { AnimatePresence, motion } from 'framer-motion'
import api from '@/lib/api'
import Navbar from '@/components/Navbar'
import AgendaMedico from '@/features/medico/AgendaMedico'
import NotificacionesMedico from '@/features/medico/NotificacionesMedico'
import Spinner from '@/components/Spinner'

export default function MedicoPage() {
    const { user, loading } = useAuth()
    const router = useRouter()
    const [notifCount, setNotifCount] = useState(0)
    const [activeTab, setActiveTab] = useState('agenda') // arranca siempre mostrando la agenda

    useEffect(() => {
        // seguridad basica: si no hay nadie logueado, lo mando al login. y si es paciente pero quiso entrar aca, lo mando a la vista de paciente
        if (!loading && !user) router.replace('/login')
        if (!loading && user && user.rol !== 'MEDICO') router.replace('/paciente')

        // apenas entra, pido al backend cuantas notificaciones tiene sin leer para pintar el numerito rojo
        if (user && user.rol === 'MEDICO') {
            api.get('/notificaciones', { params: { destinatario: user.identificador } })
                .then(({ data }) => {
                    const lista = data.data || data || []
                    setNotifCount(lista.filter(n => !n.leida).length)
                })
                .catch(err => console.error("Error al cargar notificaciones:", err))
        }
    }, [user, loading, router])

    if (loading || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Spinner size="lg" />
            </div>
        )
    }

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="min-h-screen flex flex-col"
        >
            <Navbar notifCount={notifCount} />

            <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-6 flex flex-col gap-5">
                <div className="bg-white/80 p-5 rounded-2xl shadow-sm border border-sky-100 mb-2">
                    <h1 className="text-2xl font-black text-sky-900 tracking-tight">Hola, Dr. {user.nombre}</h1>
                    <p className="text-sm font-medium text-sky-600 mt-0.5">Panel del médico &mdash; Matrícula: <span className="font-bold text-sky-800">{user.identificador}</span></p>
                </div>

                {/* BARRA DE PESTAÑAS PERSONALIZADA */}
                <div className="flex gap-2 w-full bg-[#881337] p-2 rounded-2xl shadow-md border border-[#4c0519]">
                    <button 
                        onClick={() => setActiveTab('agenda')}
                        className={`flex-1 flex items-center justify-center gap-2 h-12 font-bold px-4 rounded-xl transition-all duration-300 ${activeTab === 'agenda' ? 'bg-white text-[#881337] shadow-sm scale-105' : 'text-white/90 hover:bg-white/20'}`}
                    >
                        <CalendarDays size={16} />
                        <span className="hidden sm:inline">Mi agenda</span>
                    </button>

                    <button 
                        onClick={() => setActiveTab('notificaciones')}
                        className={`flex-1 flex items-center justify-center gap-2 h-12 font-bold px-4 rounded-xl transition-all duration-300 ${activeTab === 'notificaciones' ? 'bg-white text-[#881337] shadow-sm scale-105' : 'text-white/90 hover:bg-white/20'}`}
                    >
                        <Bell size={16} />
                        <span className="hidden sm:inline">Notificaciones</span>
                        {notifCount > 0 && (
                            <span className="bg-danger text-danger-foreground text-[10px] font-bold rounded-full min-w-4 h-4 px-1 flex items-center justify-center">
                                {notifCount > 9 ? '9+' : notifCount}
                            </span>
                        )}
                    </button>
                </div>

                {/* CONTENIDO DE LAS PESTAÑAS */}
                <div className="w-full pt-2">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -15 }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                        >
                            {activeTab === 'agenda' && <div className="pt-2"><AgendaMedico /></div>}
                            {activeTab === 'notificaciones' && <div className="pt-2"><NotificacionesMedico onCountChange={setNotifCount} /></div>}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </main>
        </motion.div>
    )
}