'use client'

import { useState, useEffect, useCallback } from 'react'
import { Calendar, Clock, MapPin, User, X, CheckCircle, AlertCircle, List, CalendarDays } from 'lucide-react'
import api from '@/lib/api'
import { useAuth } from '@/lib/AuthContext'
import Spinner from '@/components/Spinner'
import Paginacion from '@/features/turnos/Paginacion'
import { Card, Button, Chip } from "@heroui/react"
import CalendarioTurnos from '@/features/turnos/CalendarioTurnos'
import ModalReprogramarTurno from '@/features/turnos/ModalReprogramarTurno'
import { motion, AnimatePresence } from 'framer-motion'

const estadoColor = {
    RESERVADO: 'primary',
    CONFIRMADO: 'success',
    REALIZADO: 'default',
    CANCELADO: 'danger',
}

export default function MisTurnos() {
    const { user } = useAuth()  // saco el usuario logueado para filtrar solo sus turnos
    const [vista, setVista] = useState('lista') // controlo si muestro la vista de 'lista' clasica o el 'calendario' visual
    const [turnos, setTurnos] = useState([])  // aca guardo los turnos que me devuelve la api
    const [meta, setMeta] = useState(null)  // datos de paginacion (pagina actual, total, etc)
    const [page, setPage] = useState(1)
    const [loading, setLoading] = useState(true)  // estado para mostrar el spinner mientras carga
    const [error, setError] = useState('')
    const [cancelando, setCancelando] = useState(null)  // guardo el id del turno que se esta cancelando para ponerle el loader solo a ese boton
    const [successMsg, setSuccessMsg] = useState('')
    
    const [currentMonth, setCurrentMonth] = useState(() => {
        // inicializo el calendario en el mes actual apenas carga el componente
        const d = new Date()
        return new Date(d.getFullYear(), d.getMonth(), 1)
    })
    const [reprogramandoTurno, setReprogramandoTurno] = useState(null)  // si hay un turno aca, se abre el modal de reprogramar
    const [medicosMap, setMedicosMap] = useState({})  // diccionario para transformar la matricula del medico en su nombre real

    useEffect(() => {
        api.get('/medicos')
            .then(({ data }) => {
                const list = data.data || data || []
                const map = {}
                list.forEach(m => {
                    map[m.matricula] = m.nombre
                })
                setMedicosMap(map)
            })
            .catch(err => console.error("Error loading doctors map in MisTurnos:", err))
    }, [])

    // Cargar turnos en vista lista (Paginados localmente para orden global, excluyendo cancelados por defecto)
    const cargarTurnosLista = useCallback(async (p = 1) => {
        if (!user?.identificador) return
        setLoading(true)
        setError('')
        try {
            // pido todos los turnos del paciente de una para poder ordenarlos aca en el front
            const { data } = await api.get(`/turnos`, {
                params: { pacienteDni: user.identificador, limit: 1000 },
            })
            
            let allTurnos = data.data || data || []
            // los ordeno del mas reciente al mas antiguo usando la fecha y hora reales
            allTurnos.sort((a,b) => new Date(b.fechaHora) - new Date(a.fechaHora))
            
            const limit = 6
            const totalItems = allTurnos.length
            const totalPages = Math.ceil(totalItems / limit) || 1
            const paginatedTurnos = allTurnos.slice((p - 1) * limit, p * limit)
            
            setTurnos(paginatedTurnos)
            setMeta({
                currentPage: p,
                totalPages,
                totalItems,
                itemsPerPage: limit
            })
            setPage(p)
        } catch (err) {
            setError(err.response?.data?.error || 'Error al cargar los turnos.')
        } finally {
            setLoading(false)
        }
    }, [user])

    // Cargar turnos en vista calendario (No paginados, filtrados por mes, incluyendo cancelados)
    const cargarTurnosCalendario = useCallback(async (monthDate) => {
        if (!user?.identificador) return
        setLoading(true)
        setError('')
        try {
            const year = monthDate.getFullYear()
            const month = monthDate.getMonth()
            const startOfMonth = new Date(year, month, 1, 0, 0, 0, 0).toISOString()
            const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999).toISOString()

            const { data } = await api.get('/turnos', {
                params: {
                    pacienteDni: user.identificador,
                    fechaDesde: startOfMonth,
                    fechaHasta: endOfMonth,
                    limit: 100,
                    estado: 'TODOS'
                }
            })
            setTurnos(data.data || data)
            setMeta(null)
        } catch (err) {
            setError(err.response?.data?.error || 'Error al cargar el calendario de turnos.')
        } finally {
            setLoading(false)
        }
    }, [user])

    // Efecto para cargar datos según la vista activa
    useEffect(() => {
        setSuccessMsg('')
        setError('')
        if (vista === 'lista') {
            cargarTurnosLista(1)
        } else {
            cargarTurnosCalendario(currentMonth)
        }
    }, [vista, currentMonth, cargarTurnosLista, cargarTurnosCalendario])

    const handleCancelar = async (turnoId) => {
        setCancelando(turnoId)  // pongo el boton especifico en estado de carga
        setSuccessMsg('')
        setError('')
        try {
            await api.delete(`/turnos/${turnoId}`)  // le pego al endpoint para cancelar
            setSuccessMsg('Turno cancelado correctamente.')
            // dependiendo de en que vista estaba el usuario, recargo los datos usando la funcion correspondiente
            if (vista === 'lista') {
                cargarTurnosLista(page)
            } else {
                cargarTurnosCalendario(currentMonth)
            }
        } catch (err) {
            setError(err.response?.data?.error || 'No se pudo cancelar el turno.')
        } finally {
            setCancelando(null)  // saco el loader del boton
        }
    }

    const refreshData = () => {
        if (vista === 'lista') {
            cargarTurnosLista(page)
        } else {
            cargarTurnosCalendario(currentMonth)
        }
    }

    return (
        <div className="flex flex-col gap-4">
            
            {/* Controladores de Vista */}
            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center !bg-sky-200/90 backdrop-blur-md py-1.5 px-3 border !border-sky-300 rounded-2xl shadow-sm mb-2 w-full gap-2">
                <span className="text-sm font-bold text-sky-900 ml-1 text-center sm:text-left">
                    Visualización de Turnos
                </span>
                <div className="grid grid-cols-2 sm:flex gap-2 w-full sm:w-auto">
                    <Button
                        size="sm"
                        variant={vista === 'lista' ? 'solid' : 'flat'}
                        color={vista === 'lista' ? 'primary' : 'default'}
                        onPress={() => setVista('lista')}
                        startContent={<List size={14} />}
                        className="w-full font-medium"
                    >
                        Lista
                    </Button>
                    <Button
                        size="sm"
                        variant={vista === 'calendario' ? 'solid' : 'flat'}
                        color={vista === 'calendario' ? 'primary' : 'default'}
                        onPress={() => setVista('calendario')}
                        startContent={<CalendarDays size={14} />}
                        className="w-full font-medium"
                    >
                        Calendario
                    </Button>
                </div>
            </div>

            {successMsg && (
                <div className="flex items-center gap-2.5 bg-emerald-100 border border-emerald-300 p-3.5 rounded-xl shadow-sm animate-fade-in mb-2">
                    <CheckCircle size={18} className="shrink-0 text-emerald-700" />
                    <span className="text-black font-semibold text-sm">{successMsg}</span>
                </div>
            )}
            {error && (
                <div className="flex items-center gap-2.5 bg-red-100 border border-red-300 p-3.5 rounded-xl shadow-sm animate-fade-in mb-2">
                    <AlertCircle size={18} className="shrink-0 text-red-700" />
                    <span className="text-black font-semibold text-sm">{error}</span>
                </div>
            )}

            <AnimatePresence mode="wait">
            {loading ? (
                <motion.div key="loading" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="flex justify-center py-12">
                    <Spinner size="lg" />
                </motion.div>
            ) : vista === 'calendario' ? (
                <motion.div key="calendario" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                    <CalendarioTurnos 
                        turnos={turnos} 
                        rol="PACIENTE" 
                        currentMonth={currentMonth}
                        onMonthChange={setCurrentMonth}
                        onRefresh={refreshData}
                    />
                </motion.div>
            ) : turnos.length === 0 ? (
                <motion.div key="empty" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="text-center py-12 text-default-500 text-sm bg-content1 rounded-xl border border-divider">
                    No tenés turnos registrados.
                </motion.div>
            ) : (
                <motion.div key="lista" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="flex flex-col gap-3">
                    <AnimatePresence>
                    {turnos.map((t) => {
                        const id = t._id || t.id
                        const fechaHora = t.fechaHora ? new Date(t.fechaHora) : null
                        const esFuturo = fechaHora && fechaHora > new Date()
                        const puedeCancelar = esFuturo && (t.estado === 'RESERVADO' || t.estado === 'CONFIRMADO')
                        const puedeReprogramar = esFuturo && (t.estado === 'RESERVADO' || t.estado === 'CONFIRMADO')

                        return (
                            <motion.div key={id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.2 }}>
                                <Card className="w-full">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-3.5 px-5">
                                        <div className="flex flex-col gap-1.5 text-sm">
                                        <div className="flex items-center gap-2 font-semibold text-foreground">
                                            <User size={16} className="text-primary" />
                                            Dr. {medicosMap[t.medicoMatricula] || t.medicoMatricula}
                                        </div>
                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-default-500">
                                            <span className="flex items-center gap-1.5"><Calendar size={14} />{fechaHora ? fechaHora.toLocaleDateString('es-AR') : '-'}</span>
                                            <span className="flex items-center gap-1.5"><Clock size={14} />{fechaHora ? fechaHora.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }) : '-'} hs</span>
                                        </div>
                                        {t.especialidad && (
                                            <div className="text-xs text-default-400 font-medium">
                                                Especialidad: {t.especialidad.nombre}
                                            </div>
                                        )}
                                        {t.practica && (
                                            <div className="text-xs text-default-400 font-medium">
                                                Práctica: {t.practica.nombre}
                                            </div>
                                        )}
                                        {t.sede && (
                                            <div className="flex items-center gap-1.5 text-xs text-default-400">
                                                <MapPin size={13} className="text-default-400" /> <span>{t.sede.nombre}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex flex-col items-stretch sm:items-end justify-center gap-3 shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-divider w-full sm:w-auto">
                                        <div className="self-start sm:self-end">
                                            <Chip size="sm" color={estadoColor[t.estado] || 'default'} variant="flat" className="capitalize font-semibold">
                                                {t.estado.toLowerCase()}
                                            </Chip>
                                        </div>
                                        
                                        <div className="flex flex-col sm:flex-row gap-2 w-full">
                                            {puedeReprogramar && (
                                                <Button
                                                    size="sm"
                                                    onPress={() => setReprogramandoTurno(t)}
                                                    className="border !border-sky-300 !bg-sky-200/90 hover:!bg-sky-300 !text-sky-900 transition-all duration-200 shadow-sm font-bold w-full sm:w-auto"
                                                >
                                                    Reprogramar
                                                </Button>
                                            )}
                                            {puedeCancelar && (
                                                <Button
                                                    size="sm"
                                                    isLoading={cancelando === id}
                                                    onPress={() => handleCancelar(id)}
                                                    className="border border-danger bg-danger/5 hover:bg-danger hover:text-white text-danger transition-all duration-200 shadow-sm font-medium w-full sm:w-auto"
                                                >
                                                    Cancelar
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </motion.div>
                    )
                    })}
                    </AnimatePresence>
                    <Paginacion meta={meta} onChangePage={cargarTurnosLista} />
                </motion.div>
            )}
            </AnimatePresence>

            {/* Modal de Reprogramación */}
            {reprogramandoTurno && (
                <ModalReprogramarTurno
                    turno={reprogramandoTurno}
                    rol="PACIENTE"
                    onClose={() => setReprogramandoTurno(null)}
                    onSuccess={() => {
                        setSuccessMsg('El turno se reprogramó exitosamente y requiere confirmación del médico.')
                        setReprogramandoTurno(null)
                        refreshData()
                    }}
                />
            )}
        </div>
    )
}