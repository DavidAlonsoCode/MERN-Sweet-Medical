'use client'

import { useState, useEffect } from 'react'
import { Bell, CheckCheck, CheckCircle2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import api from '@/lib/api'
import { useAuth } from '@/lib/AuthContext'
import Spinner from '@/components/Spinner'
import { Card, Button } from "@heroui/react"

export default function NotificacionesMedico({ onCountChange }) {
    const { user } = useAuth()  // obtengo al medico actual para saber cuales son sus notificaciones
    const [notifs, setNotifs] = useState([])  // aca meto la lista cruda de notificaciones
    const [loading, setLoading] = useState(true)
    const [filtro, setFiltro] = useState('todas') // estado para manejar las solapas: 'todas' | 'no-leidas' | 'leidas'

    const cargar = async () => {
        if (!user?.identificador) return
        setLoading(true)
        try {
            // pido al backend todas las notificaciones de este usuario
            const { data } = await api.get('/notificaciones', {
                params: { destinatario: user.identificador }
            })
            const lista = data.data || data || []
            setNotifs(lista)
            // cuento cuantas quedan sin leer y le aviso al componente padre (el Navbar) para que ponga el numerito rojo
            const noLeidas = lista.filter((n) => !n.leida).length
            if (onCountChange) onCountChange(noLeidas)
        } catch (err) {
            console.error("Error cargando notificaciones:", err);
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        cargar()
    }, [user])

    const marcarLeida = async (id) => {
        try {
            // le aviso al backend que el usuario ya leyo esta notificacion especifica
            await api.patch(`/notificaciones/${id}`, { leida: true })
            // actualizo el estado local para que se vea grisada al instante sin recargar la pagina
            setNotifs((prev) =>
                prev.map((n) => (n._id === id || n.id === id ? { ...n, leida: true } : n))
            )
            // vuelvo a calcular el contador de no leidas y se lo paso al padre
            const updatedNotifs = notifs.map((n) => (n._id === id || n.id === id ? { ...n, leida: true } : n))
            const noLeidas = updatedNotifs.filter((n) => !n.leida).length
            if (onCountChange) onCountChange(noLeidas)
        } catch (err) {
            console.error("Error al marcar la notificación como leída:", err)
        }
    }

    const marcarTodasLeidas = async () => {
        // me fijo cuales quedan sin leer
        const noLeidas = notifs.filter(n => !n.leida)
        if (noLeidas.length === 0) return
        setLoading(true)
        try {
            // lanzo varios parches en paralelo (uno por cada notificacion no leida)
            await Promise.all(
                noLeidas.map(n => api.patch(`/notificaciones/${n._id || n.id}`, { leida: true }))
            )
            await cargar()  // refresco todo
        } catch (err) {
            console.error("Error al marcar todas las notificaciones como leídas:", err)
        } finally {
            setLoading(false)
        }
    }

    const unreadCount = notifs.filter(n => !n.leida).length

    const notifsFiltradas = notifs.filter(n => {
        if (filtro === 'leidas') return n.leida
        if (filtro === 'no-leidas') return !n.leida
        return true
    })

    if (loading && notifs.length === 0) return <div className="flex justify-center py-8"><Spinner /></div>

    return (
        <div className="flex flex-col gap-4">
            
            {/* Barra de Filtros y Acción Masiva */}
            <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-2 !bg-sky-200/90 backdrop-blur-md py-1.5 px-3 border !border-sky-300 rounded-2xl shadow-sm w-full">
                <div className="grid grid-cols-3 md:flex gap-2 w-full md:w-auto">
                    <button
                        onClick={() => setFiltro('todas')}
                        className={`w-full font-bold h-8 rounded-xl transition-all duration-300 text-sm flex items-center justify-center ${filtro === 'todas' ? 'bg-white text-sky-900 shadow-sm scale-105' : 'text-sky-700 hover:bg-white/40'}`}
                    >
                        <span className="hidden sm:inline whitespace-nowrap">Todas ({notifs.length})</span>
                        <span className="sm:hidden whitespace-nowrap">Todas</span>
                    </button>
                    <button
                        onClick={() => setFiltro('no-leidas')}
                        className={`w-full font-bold h-8 rounded-xl transition-all duration-300 text-sm flex items-center justify-center ${filtro === 'no-leidas' ? 'bg-white text-sky-900 shadow-sm scale-105' : 'text-sky-700 hover:bg-white/40'}`}
                    >
                        <span className="hidden sm:inline whitespace-nowrap">No leídas ({unreadCount})</span>
                        <span className="sm:hidden whitespace-nowrap">Nuevas</span>
                    </button>
                    <button
                        onClick={() => setFiltro('leidas')}
                        className={`w-full font-bold h-8 rounded-xl transition-all duration-300 text-sm flex items-center justify-center ${filtro === 'leidas' ? 'bg-white text-sky-900 shadow-sm scale-105' : 'text-sky-700 hover:bg-white/40'}`}
                    >
                        <span className="hidden sm:inline whitespace-nowrap">Leídas ({notifs.length - unreadCount})</span>
                        <span className="sm:hidden whitespace-nowrap">Leídas</span>
                    </button>
                </div>
                
                {unreadCount > 0 && (
                    <Button
                        size="sm"
                        color="secondary"
                        variant="flat"
                        startContent={<CheckCircle2 size={15} />}
                        onPress={marcarTodasLeidas}
                        className="w-full md:w-auto mt-2 md:mt-0 font-bold"
                    >
                        <span className="hidden sm:inline">Marcar todas como leídas</span>
                        <span className="sm:hidden">Marcar leídas</span>
                    </Button>
                )}
            </div>

            {loading && <div className="flex justify-center py-4"><Spinner /></div>}

            <div className="flex flex-col gap-3">
                <AnimatePresence mode="popLayout">
                    {!loading && notifsFiltradas.length === 0 ? (
                        <motion.div 
                            key="empty"
                            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.2 }}
                            className="text-center py-10 bg-content1 rounded-2xl border border-divider"
                        >
                            <Bell className="mx-auto text-default-300 mb-3" size={32} />
                            <p className="text-default-500 text-sm">No hay notificaciones para mostrar.</p>
                        </motion.div>
                    ) : (
                        notifsFiltradas.map((n) => {
                            const id = n._id || n.id
                            const fecha = n.fechaCreacion ? new Date(n.fechaCreacion).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''

                            return (
                                <motion.div 
                                    key={id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.2 }}
                                    className="w-full"
                                >
                                    <Card shadow="sm" className={n.leida ? "bg-default-50/50 opacity-70" : "bg-primary-50/30 border-primary-100 border"}>
                                        <div className="flex flex-col sm:flex-row items-start justify-between gap-3 py-3.5 px-4 w-full">
                                            <div className="flex items-start gap-3 w-full">
                                                <div className={`mt-0.5 p-1.5 rounded-full shrink-0 ${n.leida ? 'bg-default-200 text-default-500' : 'bg-sky-100 text-sky-600'}`}>
                                                    <Bell size={16} />
                                                </div>
                                                <div className="flex flex-col gap-1 flex-1">
                                                    <p className={`text-sm ${n.leida ? 'text-default-600' : 'text-sky-900 font-bold'}`}>{n.mensaje}</p>
                                                    {fecha && <p className="text-xs text-default-400 font-medium">{fecha}</p>}
                                                </div>
                                            </div>
                                            {!n.leida && (
                                                <Button
                                                    size="sm"
                                                    variant="flat"
                                                    color="primary"
                                                    onPress={() => marcarLeida(id)}
                                                    startContent={<CheckCircle2 size={16} />}
                                                    className="shrink-0 self-end sm:self-auto w-full sm:w-auto bg-sky-50 text-sky-700 font-bold hover:bg-sky-100"
                                                >
                                                    Marcar como leída
                                                </Button>
                                            )}
                                        </div>
                                    </Card>
                                </motion.div>
                            )
                        })
                    )}
                </AnimatePresence>
            </div>
        </div>
    )
}