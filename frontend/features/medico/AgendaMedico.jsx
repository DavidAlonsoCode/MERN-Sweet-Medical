'use client'

import { useState, useEffect, useCallback } from 'react'
import { Calendar, Clock, User, CheckCircle, AlertCircle, Filter, List, CalendarDays } from 'lucide-react'
import api from '@/lib/api'
import { useAuth } from '@/lib/AuthContext'
import Spinner from '@/components/Spinner'
import Paginacion from '@/features/turnos/Paginacion'
import { Card, Button, Chip } from "@heroui/react"
import CalendarioTurnos from '@/features/turnos/CalendarioTurnos'
import ModalReprogramarTurno from '@/features/turnos/ModalReprogramarTurno'
import ModalHistorialPaciente from '@/features/medico/ModalHistorialPaciente'
import { motion, AnimatePresence } from 'framer-motion'

const estadoColor = {
    RESERVADO: 'primary',
    CONFIRMADO: 'success',
    REALIZADO: 'default',
    CANCELADO: 'danger',
}

export default function AgendaMedico() {
    const { user } = useAuth()  // extraigo los datos del medico logueado (su matricula)
    const [vista, setVista] = useState('lista') // decido si el medico ve sus turnos en lista hacia abajo o en un calendario mensual
    const [turnos, setTurnos] = useState([])  // aca guardo los turnos crudos que me da el backend
    const [meta, setMeta] = useState(null)  // datos de cuantas paginas de turnos hay
    const [page, setPage] = useState(1)
    const [loading, setLoading] = useState(true)  // para mostrar la ruedita de carga mientras espero el fetch
    const [error, setError] = useState('')
    const [successMsg, setSuccessMsg] = useState('')
    const [filtroEstado, setFiltroEstado] = useState('')  // guardo el estado seleccionado (RESERVADO, CANCELADO, etc) para filtrar la lista
    const [accionando, setAccionando] = useState(null)  // guardo el id del turno al que le estoy dando click para poner solo ESE boton a cargar
    
    const [currentMonth, setCurrentMonth] = useState(() => {
        const d = new Date()
        return new Date(d.getFullYear(), d.getMonth(), 1)
    })
    const [reprogramandoTurno, setReprogramandoTurno] = useState(null)
    const [verHistorialPacienteDni, setVerHistorialPacienteDni] = useState(null)  // si hay un dni aca, levanto el modal del historial clinico
    const [pacientesNombres, setPacientesNombres] = useState({})  // un cache en memoria para mapear el dni del paciente con su nombre real

    useEffect(() => {
        // me fijo todos los dnis de pacientes que hay en la lista actual de turnos, elimino repetidos y busco sus nombres
        const dnis = [...new Set(turnos.map(t => t.pacienteDni).filter(Boolean))]
        dnis.forEach(async (dni) => {
            if (pacientesNombres[dni]) return
            try {
                const { data } = await api.get(`/pacientes/${dni}`)
                if (data && data.nombre) {
                    setPacientesNombres(prev => ({ ...prev, [dni]: data.nombre }))
                }
            } catch (err) {
                console.error(`Error fetching patient name for ${dni} in AgendaMedico:`, err)
            }
        })
    }, [turnos])

    // Cargar turnos en vista lista (Paginados localmente y filtrados por estado)
    const cargarTurnosLista = useCallback(async (p = 1) => {
        if (!user?.identificador) return
        setLoading(true)
        setError('')
        try {
            const params = { limit: 1000, medicoMatricula: user.identificador }
            if (filtroEstado) params.estado = filtroEstado
            const { data } = await api.get('/turnos', { params })
            
            let allTurnos = data.data || data || []
            allTurnos.sort((a,b) => new Date(b.fechaHora) - new Date(a.fechaHora))
            
            const limit = 8
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
            setError(err.response?.data?.error || 'Error al cargar la agenda.')
        } finally {
            setLoading(false)
        }
    }, [user, filtroEstado])

    // Cargar turnos en vista calendario (Filtrados por mes, todos los estados)
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
                    medicoMatricula: user.identificador,
                    fechaDesde: startOfMonth,
                    fechaHasta: endOfMonth,
                    limit: 100,
                    estado: 'TODOS'
                }
            })
            setTurnos(data.data || data)
            setMeta(null)
        } catch (err) {
            setError(err.response?.data?.error || 'Error al cargar el calendario de agenda.')
        } finally {
            setLoading(false)
        }
    }, [user])

    // Efecto para cargar según la vista activa
    useEffect(() => {
        setSuccessMsg('')
        setError('')
        if (vista === 'lista') {
            cargarTurnosLista(1)
        } else {
            cargarTurnosCalendario(currentMonth)
        }
    }, [vista, currentMonth, filtroEstado, cargarTurnosLista, cargarTurnosCalendario])

    const cambiarEstadoTurno = async (turno, nuevoEstado, mensajeExito) => {
        const id = turno._id || turno.id
        setAccionando(id)  // prendo el loader del boton especifico
        setSuccessMsg('')
        setError('')
        try {
            // si el estado es cancelado lo elimino de la db, si no lo actualizo con un patch
            if (nuevoEstado === 'CANCELADO') {
                await api.delete(`/turnos/${id}`)
            } else {
                await api.patch(`/turnos/${id}`, { estado: nuevoEstado })
            }
            
            setSuccessMsg(mensajeExito)
            refreshData()  // vuelvo a fetchear todo para que se actualice la pantalla
        } catch (err) {
            setError(err.response?.data?.message || err.response?.data?.error || `Error al actualizar el turno a ${nuevoEstado}.`)
        } finally {
            setAccionando(null)  // apago el loader
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
                    Visualización de Agenda
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

            {/* Renderizado Condicional de Vistas */}
            <AnimatePresence mode="wait">
                {loading ? (
                    <motion.div 
                        key="loading"
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}
                        className="flex justify-center py-12"
                    >
                        <Spinner size="lg" />
                    </motion.div>
                ) : vista === 'calendario' ? (
                    <motion.div 
                        key="calendario"
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}
                    >
                        <CalendarioTurnos 
                            turnos={turnos}
                            rol="MEDICO"
                            currentMonth={currentMonth}
                            onMonthChange={setCurrentMonth}
                            onRefresh={refreshData}
                        />
                    </motion.div>
                ) : (
                    <motion.div 
                        key="lista"
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}
                        className="flex flex-col gap-4"
                    >
                    {/* Filtro de estado para la vista lista */}
                    <div className="flex flex-wrap items-center gap-2 !bg-sky-200/90 backdrop-blur-md py-1.5 px-3 border !border-sky-300 rounded-2xl shadow-sm w-full">
                        <Filter size={16} className="text-default-500" />
                        <span className="text-xs text-default-500 mr-2">Filtrar lista por:</span>
                        {['', 'RESERVADO', 'CONFIRMADO', 'REALIZADO', 'CANCELADO'].map((e) => {
                            const isActive = filtroEstado === e;
                            return (
                                <button
                                    key={e}
                                    onClick={() => setFiltroEstado(e)}
                                    className={`capitalize font-bold h-7 px-3 rounded-xl transition-all duration-300 text-xs flex items-center justify-center ${isActive ? 'bg-white text-sky-900 shadow-sm scale-105' : 'text-sky-700 hover:bg-white/40'}`}
                                >
                                    {e?.toLowerCase() || 'Todos'}
                                </button>
                            );
                        })}
                    </div>

                    {turnos.length === 0 ? (
                        <div className="text-center py-12 text-default-500 text-sm bg-content1 rounded-xl border border-divider">
                            No hay turnos registrados en la lista.
                        </div>
                    ) : (
                        <motion.div layout className="flex flex-col gap-3">
                            <AnimatePresence>
                            {turnos.map((t) => {
                                const id = t._id || t.id
                                const fechaHora = t.fechaHora ? new Date(t.fechaHora) : null
                                const esFuturo = fechaHora && fechaHora > new Date()
                                const puedeConfirmar = t.estado === 'RESERVADO'
                                const puedeCompletar = t.estado === 'CONFIRMADO'
                                const puedeReprogramar = esFuturo && (t.estado === 'RESERVADO' || t.estado === 'CONFIRMADO')
                                const puedeCancelar = esFuturo && (t.estado === 'RESERVADO' || t.estado === 'CONFIRMADO')

                                return (
                                    <motion.div
                                        key={id}
                                        layout
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        transition={{ duration: 0.2 }}
                                        className="w-full"
                                    >
                                        <Card className="w-full">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-3.5 px-5">
                                            <div className="flex flex-col gap-1 text-sm">
                                                <div className="flex items-center gap-2 font-semibold text-foreground">
                                                    <User size={16} className="text-primary" />
                                                    Paciente: {pacientesNombres[t.pacienteDni] || t.pacienteDni}
                                                </div>
                                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-default-500">
                                                    <span className="flex items-center gap-1.5"><Calendar size={14} />{fechaHora ? fechaHora.toLocaleDateString('es-AR') : '-'}</span>
                                                    <span className="flex items-center gap-1.5"><Clock size={14} />{fechaHora ? fechaHora.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }) : '-'} hs</span>
                                                </div>
                                                {t.especialidad ? (
                                                    <div className="text-xs text-default-400 font-medium">
                                                        Especialidad: {t.especialidad.nombre}
                                                    </div>
                                                ) : t.practica ? (
                                                    <div className="text-xs text-default-400 font-medium">
                                                        Práctica: {t.practica.nombre}
                                                    </div>
                                                ) : null}
                                                {t.sede && (
                                                    <div className="text-xs text-default-400">
                                                        Sede: {t.sede.nombre}
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
                                                    {puedeConfirmar && (
                                                        <Button 
                                                            size="sm" 
                                                            isLoading={accionando === id} 
                                                            onPress={() => cambiarEstadoTurno(t, 'CONFIRMADO', 'Turno confirmado.')}
                                                            className="border !border-sky-300 !bg-sky-200/90 hover:!bg-sky-300 !text-sky-900 transition-all duration-200 shadow-sm font-bold w-full sm:w-auto"
                                                        >
                                                            Confirmar
                                                        </Button>
                                                    )}
                                                    {puedeCompletar && (
                                                        <Button 
                                                            size="sm" 
                                                            isLoading={accionando === id} 
                                                            onPress={() => cambiarEstadoTurno(t, 'REALIZADO', 'Turno marcado como realizado.')}
                                                            className="border !border-sky-300 !bg-sky-200/90 hover:!bg-sky-300 !text-sky-900 transition-all duration-200 shadow-sm font-bold w-full sm:w-auto"
                                                        >
                                                            Realizado
                                                        </Button>
                                                    )}
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
                                                            isLoading={accionando === id}
                                                            onPress={() => cambiarEstadoTurno(t, 'CANCELADO', 'Turno cancelado.')}
                                                            className="border border-danger bg-danger/10 hover:bg-danger hover:text-white text-danger transition-all duration-200 shadow-sm font-medium w-full sm:w-auto"
                                                        >
                                                            Cancelar
                                                        </Button>
                                                    )}
                                                    <Button
                                                        size="sm"
                                                        onPress={() => setVerHistorialPacienteDni(t.pacienteDni)}
                                                        className="border !border-sky-300 !bg-sky-200/90 hover:!bg-sky-300 !text-sky-900 transition-all duration-200 shadow-sm font-bold w-full sm:w-auto"
                                                    >
                                                        Historial
                                                    </Button>
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
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Modal de Reprogramación para el Médico */}
            {reprogramandoTurno && (
                <ModalReprogramarTurno
                    turno={reprogramandoTurno}
                    rol="MEDICO"
                    onClose={() => setReprogramandoTurno(null)}
                    onSuccess={() => {
                        setSuccessMsg('El turno del paciente se reprogramó y se confirmó exitosamente.')
                        setReprogramandoTurno(null)
                        refreshData()
                    }}
                />
            )}

            {/* Modal de Historial de Paciente */}
            {verHistorialPacienteDni && (
                <ModalHistorialPaciente
                    pacienteDni={verHistorialPacienteDni}
                    onClose={() => setVerHistorialPacienteDni(null)}
                />
            )}
        </div>
    )
}