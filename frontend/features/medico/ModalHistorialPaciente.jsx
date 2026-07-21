'use client'

import { useState, useEffect } from 'react'
import { Calendar, Clock, MapPin, User, AlertCircle, RefreshCw } from 'lucide-react'
import api from '@/lib/api'
import Spinner from '@/components/Spinner'
import { Button, Chip } from '@heroui/react'

const estadoColor = {
    RESERVADO: 'primary',
    CONFIRMADO: 'success',
    REALIZADO: 'default',
    CANCELADO: 'danger',
}

export default function ModalHistorialPaciente({ pacienteDni, onClose }) {
    const [historial, setHistorial] = useState([])  // aca voy a guardar todos los turnos historicos del paciente
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [pacienteNombre, setPacienteNombre] = useState('')  // para mostrar el nombre lindo en el titulo
    const [medicosMap, setMedicosMap] = useState({})  // diccionario para transformar la matricula de un medico en su nombre real

    const cargarHistorial = async () => {
        setLoading(true)
        setError('')
        try {
            // lanzo 3 peticiones en paralelo para que cargue mas rapido: turnos, datos del paciente y medicos
            const [histRes, patientRes, medicosRes] = await Promise.all([
                api.get('/turnos', {
                    params: {
                        pacienteDni: pacienteDni,
                        limit: 100,
                        estado: 'TODOS'
                    }
                }),
                api.get(`/pacientes/${pacienteDni}`).catch(() => null),
                api.get('/medicos').catch(() => null)
            ])

            if (patientRes && patientRes.data) {
                setPacienteNombre(patientRes.data.nombre || '')
            }

            if (medicosRes && medicosRes.data) {
                const list = medicosRes.data.data || medicosRes.data || []
                const map = {}
                list.forEach(m => {
                    map[m.matricula] = m.nombre
                })
                setMedicosMap(map)
            }

            // ordeno los turnos para que los mas recientes queden arriba en la lista
            const list = histRes.data.data || histRes.data || []
            list.sort((a, b) => new Date(b.fechaHora) - new Date(a.fechaHora))
            setHistorial(list)
        } catch (err) {
            setError(err.response?.data?.error || 'Error al cargar el historial del paciente.')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (pacienteDni) {
            cargarHistorial()
        }
    }, [pacienteDni])

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border border-white/30 dark:border-zinc-800/50 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
                
                {/* Header */}
                <div className="p-5 border-b border-divider flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-foreground">
                            Historial de Turnos de {pacienteNombre || 'Paciente'}
                        </h2>
                        <p className="text-xs text-default-500">
                            DNI: <span className="font-semibold">{pacienteDni}</span>
                        </p>
                    </div>
                    <button 
                        onClick={onClose}
                        className="text-default-400 hover:text-default-600 dark:hover:text-default-200 transition-colors p-1 rounded-full hover:bg-default-100"
                    >
                        &times;
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                    {error && (
                        <div className="flex items-center gap-2.5 bg-red-500/10 border border-red-500/20 p-3.5 rounded-xl animate-fade-in">
                            <AlertCircle size={18} className="shrink-0 text-red-600 dark:text-red-400" />
                            <span className="text-red-700 dark:text-red-300 font-semibold text-sm">{error}</span>
                            <Button
                                size="sm"
                                onPress={cargarHistorial}
                                className="ml-auto border border-danger bg-danger/5 hover:bg-danger hover:text-white text-danger transition-all duration-200 shadow-sm font-medium"
                            >
                                Reintentar
                            </Button>
                        </div>
                    )}

                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-24 gap-3">
                            <Spinner size="lg" />
                            <span className="text-sm text-default-500 font-medium">Cargando historial de turnos...</span>
                        </div>
                    ) : historial.length === 0 ? (
                        <div className="text-center py-16 text-sm text-default-500 border-2 border-dashed border-default-200 rounded-xl">
                            Este paciente no registra ningún turno en el sistema.
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {historial.map((t, index) => {
                                const tDate = t.fechaHora ? new Date(t.fechaHora) : null;
                                const isPast = tDate && tDate < new Date();

                                return (
                                    <div 
                                        key={t._id || t.id || index}
                                        className={`
                                            p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm transition-all
                                            ${t.estado === 'CANCELADO' 
                                                ? 'bg-danger-50/10 border-danger-100 dark:border-danger-950/25 opacity-70' 
                                                : isPast 
                                                    ? 'bg-default-50/50 border-default-100 opacity-80' 
                                                    : 'bg-white dark:bg-zinc-900 border-default-200'
                                            }
                                        `}
                                    >
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-3">
                                                <span className="font-semibold text-foreground flex items-center gap-1.5">
                                                    <Calendar size={14} className="text-primary" />
                                                    {tDate ? tDate.toLocaleDateString('es-AR') : '-'}
                                                </span>
                                                <span className="text-default-500 flex items-center gap-1">
                                                    <Clock size={14} />
                                                    {tDate ? tDate.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }) : '-'} hs
                                                </span>
                                            </div>

                                            <div className="text-xs text-default-500 space-y-0.5">
                                                <div><b>Médico:</b> {medicosMap[t.medicoMatricula] || t.medicoMatricula}</div>
                                                {t.especialidad && <div><b>Especialidad:</b> {t.especialidad.nombre}</div>}
                                                {t.practica && <div><b>Práctica:</b> {t.practica.nombre}</div>}
                                                {t.sede && <div className="flex items-center gap-1 text-[11px]"><MapPin size={11} /> {t.sede.nombre}</div>}
                                            </div>
                                        </div>

                                        <div className="flex sm:flex-col items-start sm:items-end gap-2 shrink-0">
                                            <Chip size="sm" color={estadoColor[t.estado] || 'default'} variant="flat" className="capitalize">
                                                {t.estado.toLowerCase()}
                                            </Chip>
                                            {isPast && t.estado !== 'CANCELADO' && (
                                                <span className="text-[10px] bg-default-100 dark:bg-zinc-800 text-default-500 px-2 py-0.5 rounded-full font-medium">
                                                    Turno Pasado
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-divider bg-default-50/50 dark:bg-zinc-900/50 flex justify-end">
                    <Button
                        size="md"
                        onPress={onClose}
                        className="border border-default-300 hover:border-default-500 hover:bg-default-100 transition-all duration-200 shadow-sm font-medium"
                    >
                        Cerrar
                    </Button>
                </div>
            </div>
        </div>
    )
}
