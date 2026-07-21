'use client'

import { useState, useEffect } from 'react'
import { Calendar, Clock, MapPin, User, AlertCircle, CheckCircle, ChevronRight } from 'lucide-react'
import api from '@/lib/api'
import Spinner from '@/components/Spinner'
import { Button } from '@heroui/react'

export default function ModalReprogramarTurno({ turno, rol, onClose, onSuccess }) {
    const [slots, setSlots] = useState([])  // aca guardo los horarios disponibles que encuentro para ese medico
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [selectedSlot, setSelectedSlot] = useState(null)  // el nuevo horario que elige el usuario
    const [rescheduling, setRescheduling] = useState(false)  // para mostrar el spinner en el boton de confirmar

    useEffect(() => {
        const cargarDisponibilidades = async () => {
            if (!turno) return
            setLoading(true)
            setError('')
            try {
                // armo la query para buscar turnos libres con los mismos datos del turno actual (mismo medico, sede, etc)
                const params = {
                    pacienteDni: turno.pacienteDni,
                    medicoMatricula: turno.medicoMatricula,
                    especialidad: turno.especialidad?.nombre,
                    practica: turno.practica?.nombre,
                    sede: turno.sede?.nombre,
                    fechaDesde: new Date().toISOString().split('T')[0], // a partir de hoy
                    limit: 30
                }

                const { data } = await api.get('/turnos/disponibles', { params })
                
                // filtro la lista: si el backend me devolvio el turno actual (porque todavia esta "libre" para el motor de busqueda), lo saco de las opciones para no reprogramar al mismo horario exacto
                const turnosFiltrados = (data.data || data || []).filter(s => {
                    const originalFechaHora = new Date(turno.fechaHora)
                    const slotDia = parseInt(s.fecha.split('/')[0])
                    const slotMes = parseInt(s.fecha.split('/')[1]) - 1
                    const slotAnio = parseInt(s.fecha.split('/')[2])
                    
                    // Convertimos la hora de slot
                    let slotHoraStr = s.hora.trim().replace(' a. m.', '').replace(' p. m.', '')
                    let [h, m] = slotHoraStr.split(':').map(Number)
                    if (s.hora.includes('p. m.') && h !== 12) h += 12
                    if (s.hora.includes('a. m.') && h === 12) h = 0
                    
                    const slotDateObj = new Date(slotAnio, slotMes, slotDia, h, m)
                    return slotDateObj.getTime() !== originalFechaHora.getTime()
                })

                setSlots(turnosFiltrados)
            } catch (err) {
                setError(err.response?.data?.error || 'Error al cargar horarios disponibles.')
            } finally {
                setLoading(false)
            }
        }

        cargarDisponibilidades()
    }, [turno])

    if (!turno) return null

    // recorro todos los slots y los agrupo por fecha en un diccionario para poder renderizarlos mas prolijo despues
    const slotsAgrupados = {}
    slots.forEach(slot => {
        if (!slotsAgrupados[slot.fecha]) {
            slotsAgrupados[slot.fecha] = []
        }
        slotsAgrupados[slot.fecha].push(slot)
    })

    const handleReprogramar = async () => {
        if (!selectedSlot) return
        setRescheduling(true)
        setError('')

        // Parseamos la fecha del slot (D/M/YYYY) a (DD-MM-YYYY)
        const [dia, mes, anio] = selectedSlot.fecha.split('/')
        const fechaBackend = `${dia.padStart(2, '0')}-${mes.padStart(2, '0')}-${anio}`

        // Convertir hora (12 horas a 24 horas)
        const convertirHora24 = (horaTexto) => {
            let hora = horaTexto.trim()
            const esPM = hora.includes('p. m.')
            const esAM = hora.includes('a. m.')

            hora = hora.replace(' a. m.', '').replace(' p. m.', '')
            let [h, m] = hora.split(':').map(Number)

            if (esPM && h !== 12) h += 12
            if (esAM && h === 12) h = 0

            return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
        }

        const horaBackend = convertirHora24(selectedSlot.hora)
        const turnoId = turno._id || turno.id
        const payload = {
            pacienteDni: turno.pacienteDni,
            medicoMatricula: turno.medicoMatricula,
            sede: turno.sede?._id || turno.sede?.id || turno.sede,
            fecha: fechaBackend,
            hora: horaBackend,
            rol: rol
        };

        if (turno.especialidad) {
            payload.especialidad = turno.especialidad?._id || turno.especialidad?.id || turno.especialidad;
        } else if (turno.practica) {
            payload.practica = turno.practica?._id || turno.practica?.id || turno.practica;
        }

        try {
            await api.patch(`/turnos/${turnoId}`, payload)  // le pego al patch del turno viejo para actualizarle la fecha y hora
            onSuccess()
            onClose()
        } catch (err) {
            setError(err.response?.data?.error || err.response?.data?.message || 'No se pudo reprogramar el turno.')
        } finally {
            setRescheduling(false)
        }
    }

    const fechaOriginal = turno.fechaHora ? new Date(turno.fechaHora) : null

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border border-white/30 dark:border-zinc-800/50 rounded-2xl shadow-2xl w-full max-w-xl max-h-[85vh] flex flex-col overflow-hidden">
                
                {/* Header */}
                <div className="p-5 border-b border-divider flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-foreground">Reprogramar Turno</h2>
                        <p className="text-xs text-default-500">
                            Modificando turno con el Dr. {turno.medicoMatricula}
                        </p>
                    </div>
                    <button 
                        onClick={onClose}
                        aria-label="Cerrar modal"
                        className="text-default-400 hover:text-default-600 dark:hover:text-default-200 transition-colors p-1 rounded-full hover:bg-default-100"
                    >
                        &times;
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-5 space-y-5">
                    {/* Información Turno Original */}
                    <div className="bg-default-50 dark:bg-zinc-800/30 border border-default-100 p-4 rounded-xl space-y-2.5">
                        <span className="text-xs font-semibold text-primary uppercase tracking-wider block">Turno Actual</span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                            <div className="flex items-center gap-2 text-default-600">
                                <Calendar size={16} className="text-default-400" />
                                <span>{fechaOriginal ? fechaOriginal.toLocaleDateString('es-AR') : '-'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-default-600">
                                <Clock size={16} className="text-default-400" />
                                <span>{fechaOriginal ? fechaOriginal.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }) : '-'} hs</span>
                            </div>
                            {turno.especialidad && (
                                <div className="flex items-center gap-2 text-default-600">
                                    <User size={16} className="text-default-400" />
                                    <span>Especialidad: {turno.especialidad.nombre}</span>
                                </div>
                            )}
                            {turno.practica && (
                                <div className="flex items-center gap-2 text-default-600 col-span-2">
                                    <User size={16} className="text-default-400" />
                                    <span>Práctica: {turno.practica.nombre}</span>
                                </div>
                            )}
                            {turno.sede && (
                                <div className="flex items-center gap-2 text-default-600 col-span-2">
                                    <MapPin size={16} className="text-default-400" />
                                    <span>Sede: {turno.sede.nombre}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {error && (
                        <div className="flex items-center gap-2.5 text-sm text-danger-700 bg-danger-50 dark:bg-danger-950/20 p-3.5 border border-danger-200 dark:border-danger-900/30 rounded-xl">
                            <AlertCircle size={18} className="shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Disponibilidades */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                            <span>Horarios Disponibles del Médico</span>
                        </h3>

                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-16 gap-3">
                                <Spinner size="md" />
                                <span className="text-xs text-default-500">Buscando disponibilidades...</span>
                            </div>
                        ) : slots.length === 0 ? (
                            <div className="text-center py-12 text-sm text-default-500 border-2 border-dashed border-default-200 rounded-xl">
                                No hay otros horarios disponibles en la agenda del médico para los próximos 15 días.
                            </div>
                        ) : (
                            <div className="space-y-4 max-h-[350px]">
                                {Object.keys(slotsAgrupados).map(fecha => (
                                    <div key={fecha} className="space-y-2">
                                        <div className="text-xs font-semibold text-default-500 bg-default-100 dark:bg-zinc-800 py-1 px-2.5 rounded-medium inline-block">
                                            {fecha}
                                        </div>
                                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                            {slotsAgrupados[fecha].map((slot, index) => {
                                                const esSeleccionado = selectedSlot && 
                                                    selectedSlot.fecha === slot.fecha && 
                                                    selectedSlot.hora === slot.hora;

                                                return (
                                                    <button
                                                        key={index}
                                                        type="button"
                                                        onClick={() => setSelectedSlot(slot)}
                                                        className={`
                                                            py-2 px-3 text-xs rounded-lg font-medium border text-center transition-all duration-200
                                                            ${esSeleccionado 
                                                                ? 'bg-primary border-primary text-primary-foreground shadow-md scale-[1.03]' 
                                                                : 'bg-white dark:bg-zinc-900 border-default-200 hover:border-primary-400 hover:text-primary'
                                                            }
                                                        `}
                                                    >
                                                        {slot.hora}
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-divider bg-default-50/50 dark:bg-zinc-900/50 flex justify-end gap-2.5">
                    <Button
                        size="md"
                        variant="bordered"
                        onPress={onClose}
                        disabled={rescheduling}
                    >
                        Cerrar
                    </Button>
                    <Button
                        size="md"
                        color="primary"
                        isLoading={rescheduling}
                        isDisabled={!selectedSlot}
                        onPress={handleReprogramar}
                    >
                        Confirmar Reprogramación
                    </Button>
                </div>
            </div>
        </div>
    )
}
