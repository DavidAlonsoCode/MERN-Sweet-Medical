'use client'

import { useState, useEffect } from 'react'
import { Calendar as CalendarIcon, Clock, MapPin, User, ChevronLeft, ChevronRight, X, CheckCircle, AlertCircle } from 'lucide-react'
import { Card, Button, Chip } from "@heroui/react"
import api from '@/lib/api'
import ModalReprogramarTurno from './ModalReprogramarTurno'
import ModalHistorialPaciente from '../medico/ModalHistorialPaciente'

const NOMBRE_MESES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

const DIAS_SEMANA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

const estadoColor = {
    RESERVADO: 'primary',
    CONFIRMADO: 'success',
    REALIZADO: 'default',
    CANCELADO: 'danger',
}

const estadoBgColor = {
    RESERVADO: 'bg-blue-500 hover:bg-blue-600 text-white',
    CONFIRMADO: 'bg-emerald-500 hover:bg-emerald-600 text-white',
    REALIZADO: 'bg-zinc-400 hover:bg-zinc-500 text-white',
    CANCELADO: 'bg-rose-500 hover:bg-rose-600 text-white',
}

export default function CalendarioTurnos({ turnos = [], rol, currentMonth, onMonthChange, onRefresh }) {
    const [selectedDay, setSelectedDay] = useState(null)  // guardo el dia al que el usuario le hizo click para ver el detalle a la derecha
    const [reprogramandoTurno, setReprogramandoTurno] = useState(null)
    const [accionando, setAccionando] = useState(null)  // para mostrar el spinner individual en los botones de accion
    const [localError, setLocalError] = useState('')
    const [localSuccess, setLocalSuccess] = useState('')
    const [verHistorialPacienteDni, setVerHistorialPacienteDni] = useState(null)

    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()

    const [medicosMap, setMedicosMap] = useState({})
    const [pacientesMap, setPacientesMap] = useState({})

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
            .catch(err => console.error("Error loading doctors map in calendar:", err))
    }, [])

    useEffect(() => {
        const uniqueDnis = [...new Set(turnos.map(t => t.pacienteDni).filter(Boolean))]
        uniqueDnis.forEach(async (dni) => {
            if (pacientesMap[dni]) return
            try {
                const { data } = await api.get(`/pacientes/${dni}`)
                if (data && data.nombre) {
                    setPacientesMap(prev => ({ ...prev, [dni]: data.nombre }))
                }
            } catch (err) {
                console.error(`Error loading patient name for ${dni}:`, err)
            }
        })
    }, [turnos])

    // si cambia el mes desde las flechitas, limpio el dia que estaba seleccionado para que no quede raro
    useEffect(() => {
        setSelectedDay(null)
    }, [currentMonth])

    const handlePrevMonth = () => {
        onMonthChange(new Date(year, month - 1, 1))
    }

    const handleNextMonth = () => {
        onMonthChange(new Date(year, month + 1, 1))
    }

    // armo la logica clasica del calendario para saber donde cae el primer dia del mes
    const primerDia = new Date(year, month, 1)
    let indexInicio = primerDia.getDay() // 0 = Domingo, 1 = Lunes, etc
    
    // como en argentina la semana arranca el lunes, ajusto los indices (0 = Lun, 6 = Dom)
    indexInicio = indexInicio === 0 ? 6 : indexInicio - 1

    const totalDiasMes = new Date(year, month + 1, 0).getDate()
    const totalDiasMesPrev = new Date(year, month, 0).getDate()

    const celdas = []
    
    // Rellenar días del mes anterior
    for (let i = indexInicio - 1; i >= 0; i--) {
        celdas.push({
            dia: totalDiasMesPrev - i,
            fecha: new Date(year, month - 1, totalDiasMesPrev - i),
            esMesActual: false
        })
    }

    // Rellenar días del mes actual
    for (let d = 1; d <= totalDiasMes; d++) {
        celdas.push({
            dia: d,
            fecha: new Date(year, month, d),
            esMesActual: true
        })
    }

    // Rellenar días del mes siguiente para completar la grilla
    const totalCeldasActuales = celdas.length
    const resto = totalCeldasActuales % 7
    if (resto > 0) {
        const celdasSiguientes = 7 - resto
        for (let d = 1; d <= celdasSiguientes; d++) {
            celdas.push({
                dia: d,
                fecha: new Date(year, month + 1, d),
                esMesActual: false
            })
        }
    }

    // funcion helper para filtrar los turnos que caen exactamente en un dia en particular del calendario
    const obtenerTurnosDelDia = (fecha) => {
        return turnos.filter(t => {
            if (!t.fechaHora) return false
            const d = new Date(t.fechaHora)
            return d.getDate() === fecha.getDate() &&
                   d.getMonth() === fecha.getMonth() &&
                   d.getFullYear() === fecha.getFullYear()
        })
    }

    const formatDiaSemanaLargo = (fecha) => {
        return fecha.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })
    }

    // Manejar Confirmación de turno (Médico)
    const handleConfirmar = async (turnoId) => {
        setAccionando(turnoId)
        setLocalError('')
        setLocalSuccess('')
        try {
            await api.patch(`/turnos/${turnoId}`, { estado: 'CONFIRMADO' })
            setLocalSuccess('Turno confirmado correctamente.')
            if (onRefresh) onRefresh()
        } catch (err) {
            setLocalError(err.response?.data?.message || err.response?.data?.error || 'Error al confirmar el turno.')
        } finally {
            setAccionando(null)
        }
    }

    // Manejar Realizado (Médico)
    const handleRealizado = async (turnoId) => {
        setAccionando(turnoId)
        setLocalError('')
        setLocalSuccess('')
        try {
            await api.patch(`/turnos/${turnoId}`, { estado: 'REALIZADO' })
            setLocalSuccess('El turno fue marcado como REALIZADO.')
            if (onRefresh) onRefresh()
        } catch (err) {
            setLocalError(err.response?.data?.message || err.response?.data?.error || 'Error al completar el turno.')
        } finally {
            setAccionando(null)
        }
    }

    // Manejar Cancelar turno (Paciente / Médico)
    const handleCancelar = async (turnoId) => {
        setAccionando(turnoId)
        setLocalError('')
        setLocalSuccess('')
        try {
            await api.delete(`/turnos/${turnoId}`)
            setLocalSuccess('Turno cancelado correctamente.')
            if (onRefresh) onRefresh()
        } catch (err) {
            setLocalError(err.response?.data?.error || 'Error al cancelar el turno.')
        } finally {
            setAccionando(null)
        }
    }

    // Turnos para el día seleccionado
    const turnosDelDiaSeleccionado = selectedDay ? obtenerTurnosDelDia(selectedDay) : []
    const hoy = new Date()

    return (
        <div className="flex flex-col gap-6">
            
            {localSuccess && (
                <div className="flex items-center gap-2.5 bg-emerald-500/10 border border-emerald-500/20 p-3.5 rounded-xl animate-fade-in">
                    <CheckCircle size={18} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-emerald-700 dark:text-emerald-300 font-semibold text-sm">{localSuccess}</span>
                </div>
            )}
            {localError && (
                <div className="flex items-center gap-2.5 bg-red-500/10 border border-red-500/20 p-3.5 rounded-xl animate-fade-in">
                    <AlertCircle size={18} className="shrink-0 text-red-600 dark:text-red-400" />
                    <span className="text-red-700 dark:text-red-300 font-semibold text-sm">{localError}</span>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Calendario (Grid principal) */}
                <div className="lg:col-span-2 bg-content1 rounded-2xl border border-divider shadow-sm p-4 flex flex-col gap-4">
                    
                    {/* Header del Calendario */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-divider pb-3">
                        <div className="flex items-center gap-3">
                            <h2 className="text-xl font-bold text-foreground capitalize">
                                {NOMBRE_MESES[month]} {year}
                            </h2>
                            <div className="flex items-center border border-default-200 rounded-lg overflow-hidden">
                                <button 
                                    onClick={handlePrevMonth}
                                    aria-label="Mes anterior"
                                    className="p-1.5 hover:bg-default-100 transition-colors text-default-600"
                                >
                                    <ChevronLeft size={16} />
                                </button>
                                <button 
                                    onClick={handleNextMonth}
                                    aria-label="Mes siguiente"
                                    className="p-1.5 hover:bg-default-100 transition-colors text-default-600 border-l border-default-200"
                                >
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>

                        {/* Leyenda de estados */}
                        <div className="flex flex-wrap gap-2 text-xs">
                            <span className="flex items-center gap-1.5 text-default-500">
                                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 block"></span> Reservado
                            </span>
                            <span className="flex items-center gap-1.5 text-default-500">
                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 block"></span> Confirmado
                            </span>
                            <span className="flex items-center gap-1.5 text-default-500">
                                <span className="w-2.5 h-2.5 rounded-full bg-zinc-400 block"></span> Realizado
                            </span>
                            <span className="flex items-center gap-1.5 text-default-500">
                                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 block"></span> Cancelado
                            </span>
                        </div>
                    </div>

                    {/* Grilla Semanal */}
                    <div className="grid grid-cols-7 gap-1.5 text-center text-xs font-semibold text-default-500 pb-1">
                        {DIAS_SEMANA.map(d => (
                            <div key={d}>{d}</div>
                        ))}
                    </div>

                    {/* Días del Mes */}
                    <div className="grid grid-cols-7 gap-1.5">
                        {celdas.map((c, i) => {
                            const turnosDia = obtenerTurnosDelDia(c.fecha)
                            const esHoy = hoy.getDate() === c.fecha.getDate() && 
                                          hoy.getMonth() === c.fecha.getMonth() && 
                                          hoy.getFullYear() === c.fecha.getFullYear()
                            
                            const esSeleccionado = selectedDay && 
                                                   selectedDay.getDate() === c.fecha.getDate() &&
                                                   selectedDay.getMonth() === c.fecha.getMonth() &&
                                                   selectedDay.getFullYear() === c.fecha.getFullYear()

                            return (
                                <div
                                    key={i}
                                    onClick={() => setSelectedDay(c.fecha)}
                                    className={`
                                        min-h-[75px] md:min-h-[105px] border rounded-xl p-1.5 flex flex-col justify-between cursor-pointer transition-all duration-200
                                        ${c.esMesActual 
                                            ? 'bg-white dark:bg-zinc-900 border-default-200 hover:border-primary-300 hover:shadow-md' 
                                            : 'bg-default-50 dark:bg-zinc-800/20 border-default-100 text-default-400'
                                        }
                                        ${esHoy ? 'border-primary-400 ring-2 ring-primary-100 dark:ring-primary-950/45 font-bold' : ''}
                                        ${esSeleccionado ? 'border-primary dark:border-primary bg-primary-50/20 dark:bg-primary-950/10' : ''}
                                    `}
                                >
                                    {/* Número del día */}
                                    <div className="flex items-center justify-between">
                                        <span className={`
                                            text-xs font-semibold rounded-full w-5 h-5 flex items-center justify-center
                                            ${esHoy ? 'bg-primary text-primary-foreground' : 'text-default-700'}
                                        `}>
                                            {c.dia}
                                        </span>
                                    </div>

                                    {/* Turnos en Desktop */}
                                    <div className="hidden md:flex flex-col gap-1 overflow-y-auto max-h-[70px] mt-1 pr-0.5">
                                        {turnosDia.slice(0, 3).map((t, idx) => {
                                            const id = t._id || t.id
                                            const tTime = t.fechaHora ? new Date(t.fechaHora).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }) : ''
                                            
                                            return (
                                                <div
                                                    key={idx}
                                                    className={`
                                                        text-[10px] truncate px-1 py-0.5 rounded font-medium text-left
                                                        ${estadoBgColor[t.estado] || 'bg-default-200'}
                                                    `}
                                                    title={`${tTime} hs - ${t.especialidad?.nombre || t.practica?.nombre || 'Consulta'}`}
                                                >
                                                    {tTime} {rol === 'PACIENTE' ? `Dr. ${medicosMap[t.medicoMatricula] || t.medicoMatricula}` : (pacientesMap[t.pacienteDni] || `DNI ${t.pacienteDni}`)}
                                                </div>
                                            )
                                        })}
                                        {turnosDia.length > 3 && (
                                            <div className="text-[9px] text-default-400 font-semibold pl-1">
                                                +{turnosDia.length - 3} más
                                            </div>
                                        )}
                                    </div>

                                    {/* Turnos en Mobile (Dots) */}
                                    <div className="flex md:hidden justify-center gap-0.5 mt-1 flex-wrap">
                                        {turnosDia.map((t, idx) => (
                                            <span 
                                                key={idx} 
                                                className={`
                                                    w-1.5 h-1.5 rounded-full block
                                                    ${t.estado === 'RESERVADO' ? 'bg-blue-500' : ''}
                                                    ${t.estado === 'CONFIRMADO' ? 'bg-emerald-500' : ''}
                                                    ${t.estado === 'REALIZADO' ? 'bg-zinc-400' : ''}
                                                    ${t.estado === 'CANCELADO' ? 'bg-rose-500' : ''}
                                                `}
                                            />
                                        ))}
                                    </div>

                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Detalle del Día Seleccionado (Side Panel) */}
                <div className="bg-content1 rounded-2xl border border-divider shadow-sm p-4 flex flex-col gap-4 h-fit">
                    <div className="border-b border-divider pb-3">
                        <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                            <CalendarIcon size={18} className="text-primary" />
                            <span>Detalle del Día</span>
                        </h3>
                        <p className="text-xs text-default-500 capitalize mt-0.5">
                            {selectedDay ? formatDiaSemanaLargo(selectedDay) : 'Seleccioná un día del calendario'}
                        </p>
                    </div>

                    {!selectedDay ? (
                        <div className="text-center py-12 text-default-400 text-sm">
                            Hacé clic en cualquier celda para ver los turnos correspondientes.
                        </div>
                    ) : turnosDelDiaSeleccionado.length === 0 ? (
                        <div className="text-center py-12 text-default-400 text-sm border border-dashed border-default-200 rounded-xl">
                            No hay turnos registrados para esta fecha.
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3.5 max-h-[500px] overflow-y-auto pr-1">
                            {turnosDelDiaSeleccionado.map(t => {
                                const id = t._id || t.id
                                const tTime = t.fechaHora ? new Date(t.fechaHora) : null
                                const esFuturo = tTime && tTime > new Date()
                                const puedeCancelar = esFuturo && (t.estado === 'RESERVADO' || t.estado === 'CONFIRMADO')
                                const puedeReprogramar = esFuturo && (t.estado === 'RESERVADO' || t.estado === 'CONFIRMADO')

                                return (
                                    <div 
                                        key={id} 
                                        className="p-3 bg-default-50/50 dark:bg-zinc-800/10 border border-default-100 rounded-xl space-y-3 flex flex-col justify-between"
                                    >
                                        <div className="space-y-1.5 text-xs text-default-600">
                                            <div className="flex items-center justify-between gap-2 border-b border-divider pb-1.5 mb-1.5">
                                                <span className="flex items-center gap-1 font-bold text-foreground text-sm">
                                                    <Clock size={14} className="text-primary" />
                                                    {tTime ? tTime.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }) : '-'} hs
                                                </span>
                                                <Chip size="sm" color={estadoColor[t.estado] || 'default'} variant="flat" className="capitalize text-[10px] h-5 px-1.5">
                                                    {t.estado.toLowerCase()}
                                                </Chip>
                                            </div>

                                            {rol === 'PACIENTE' ? (
                                                <div className="flex items-center gap-2">
                                                    <User size={13} className="text-default-400" />
                                                    <span><b>Médico:</b> {medicosMap[t.medicoMatricula] || t.medicoMatricula}</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    <User size={13} className="text-default-400" />
                                                    <span><b>Paciente:</b> {pacientesMap[t.pacienteDni] || t.pacienteDni}</span>
                                                </div>
                                            )}

                                            {t.especialidad && (
                                                <div className="flex items-center gap-2">
                                                    <User size={13} className="text-default-400" />
                                                    <span><b>Especialidad:</b> {t.especialidad.nombre}</span>
                                                </div>
                                            )}
                                            {t.practica && (
                                                <div className="flex items-center gap-2">
                                                    <User size={13} className="text-default-400" />
                                                    <span><b>Práctica:</b> {t.practica.nombre}</span>
                                                </div>
                                            )}
                                            {t.sede && (
                                                <div className="flex items-center gap-2">
                                                    <MapPin size={13} className="text-default-400" />
                                                    <span><b>Sede:</b> {t.sede.nombre}</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Botones de acción */}
                                        <div className="flex flex-wrap gap-1.5 pt-2 justify-end border-t border-divider/60">
                                            
                                            {/* Acciones del Médico */}
                                            {rol === 'MEDICO' && t.estado === 'RESERVADO' && (
                                                <Button 
                                                    size="sm" 
                                                    isLoading={accionando === id}
                                                    onPress={() => handleConfirmar(id)}
                                                    className="border border-primary bg-primary/10 hover:bg-primary hover:text-white text-primary transition-all duration-200 shadow-sm font-medium text-xs h-8 px-3"
                                                >
                                                    Confirmar
                                                </Button>
                                            )}
                                            {rol === 'MEDICO' && t.estado === 'CONFIRMADO' && (
                                                <Button 
                                                    size="sm" 
                                                    isLoading={accionando === id}
                                                    onPress={() => handleRealizado(id)}
                                                    className="border border-secondary bg-secondary/10 hover:bg-secondary hover:text-white text-secondary transition-all duration-200 shadow-sm font-medium text-xs h-8 px-3"
                                                >
                                                    Realizado
                                                </Button>
                                            )}

                                            {/* Ver Historial Paciente (Médico) */}
                                            {rol === 'MEDICO' && (
                                                <Button
                                                    size="sm"
                                                    onPress={() => setVerHistorialPacienteDni(t.pacienteDni)}
                                                    className="border border-primary bg-primary/10 hover:bg-primary hover:text-white text-primary transition-all duration-200 shadow-sm font-medium text-xs h-8 px-3"
                                                >
                                                    Historial
                                                </Button>
                                            )}

                                            {/* Acciones de Reprogramar (Médico y Paciente) */}
                                            {puedeReprogramar && (
                                                <Button 
                                                    size="sm" 
                                                    isLoading={accionando === id}
                                                    onPress={() => setReprogramandoTurno(t)}
                                                    className="border border-default-300 hover:border-primary hover:bg-primary hover:text-white transition-all duration-200 shadow-sm font-medium text-xs h-8 px-3"
                                                >
                                                    Reprogramar
                                                </Button>
                                            )}

                                            {/* Cancelar (Ambos) */}
                                            {puedeCancelar && (
                                                <Button 
                                                    size="sm" 
                                                    isLoading={accionando === id}
                                                    onPress={() => handleCancelar(id)}
                                                    className="border border-danger bg-danger/5 hover:bg-danger hover:text-white text-danger transition-all duration-200 shadow-sm font-medium text-xs h-8 px-3"
                                                >
                                                    Cancelar
                                                </Button>
                                            )}

                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>

            </div>

            {/* Modal de Reprogramación */}
            {reprogramandoTurno && (
                <ModalReprogramarTurno
                    turno={reprogramandoTurno}
                    rol={rol}
                    onClose={() => setReprogramandoTurno(null)}
                    onSuccess={() => {
                        setLocalSuccess('El turno se reprogramó exitosamente.')
                        setReprogramandoTurno(null)
                        if (onRefresh) onRefresh()
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
