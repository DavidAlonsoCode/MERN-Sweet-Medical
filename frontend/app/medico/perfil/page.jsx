'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, User, CheckCircle, AlertCircle, CalendarDays, Plus, Trash2, Edit2, X, Check, Clock, Briefcase, DollarSign, Calendar } from 'lucide-react'
import { useAuth } from '@/lib/AuthContext'
import api from '@/lib/api'
import Spinner from '@/components/Spinner'
import Navbar from '@/components/Navbar'
import { Card, Button, Avatar, Select, Label, ListBox, TextField, Input, Chip } from '@heroui/react'
import { motion, AnimatePresence } from 'framer-motion'

const DIAS_SEMANA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

export default function MedicoPerfilPage() {
    const { user, updateUser, loading: authLoading } = useAuth()
    const router = useRouter()

    const [activeTab, setActiveTab] = useState('perfil')  // me guardo que pestaña esta viendo el medico ahora mismo

    const [medico, setMedico] = useState(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [successMsg, setSuccessMsg] = useState('')
    const [errorMsg, setErrorMsg] = useState('')

    // Catalogs for services
    const [catalogoEspecialidades, setCatalogoEspecialidades] = useState([])
    const [catalogoPracticas, setCatalogoPracticas] = useState([])

    // Profile form states
    const [nombre, setNombre] = useState('')
    const [usuario, setUsuario] = useState('')

    // Service addition states
    const [serviceTipo, setServiceTipo] = useState('especialidad')
    const [serviceId, setServiceId] = useState('')
    const [serviceDuracion, setServiceDuracion] = useState('40')
    const [serviceCosto, setServiceCosto] = useState('15000')
    const [serviceError, setServiceError] = useState('')
    const [serviceSuccess, setServiceSuccess] = useState('')
    const [serviceAdding, setServiceAdding] = useState(false)

    // Service modification states
    const [editingServiceId, setEditingServiceId] = useState(null)
    const [editDuracion, setEditDuracion] = useState('')
    const [editCosto, setEditCosto] = useState('')
    const [serviceActionId, setServiceActionId] = useState(null)

    // Availability additions
    const [nuevoDia, setNuevoDia] = useState('Lunes')
    const [nuevoInicio, setNuevoInicio] = useState('09:00')
    const [nuevoFin, setNuevoFin] = useState('13:00')
    const [dispError, setDispError] = useState('')
    const [dispSuccess, setDispSuccess] = useState('')
    const [dispAdding, setDispAdding] = useState(false)

    // Inline edit states for availability
    const [editingId, setEditingId] = useState(null)
    const [editDia, setEditDia] = useState('')
    const [editInicio, setEditInicio] = useState('')
    const [editFin, setEditFin] = useState('')
    const [dispActionId, setDispActionId] = useState(null)

    // Consultar disponibilidad states
    const [consultarFecha, setConsultarFecha] = useState(new Date().toISOString().substring(0, 10))
    const [consultarServicioId, setConsultarServicioId] = useState('')
    const [consultarSlots, setConsultarSlots] = useState([])
    const [consultarSlotsLoading, setConsultarSlotsLoading] = useState(false)
    const [consultarSlotsError, setConsultarSlotsError] = useState('')

    const loadMedico = async () => {
        if (!user || user.rol !== 'MEDICO') return
        try {
            // voy a buscar toda la info completa del medico para llenar el perfil
            const { data } = await api.get(`/medicos/${user.identificador}`)
            setMedico(data)
            setNombre(data.nombre || '')
            setUsuario(data.usuario || '')

            // si tiene servicios asignados, dejo seleccionado el primero por defecto para la pestaña de agenda
            const primerServicio = data.especialidades?.[0] || data.practicas?.[0]
            if (primerServicio && !consultarServicioId) {
                setConsultarServicioId(primerServicio.id)
            }
        } catch (err) {
            setErrorMsg('Error al cargar la información del médico.')
            console.error(err)
        }
    }

    const loadCatalogs = async () => {
        try {
            const [espRes, pracRes] = await Promise.all([
                api.get('/maestros/especialidades', { params: { limit: 100 } }),
                api.get('/maestros/practicas', { params: { limit: 100 } })
            ])
            setCatalogoEspecialidades(espRes.data?.data || espRes.data || [])
            setCatalogoPracticas(pracRes.data?.data || pracRes.data || [])
        } catch (err) {
            console.error('Error al cargar catálogos maestros', err)
        }
    }

    useEffect(() => {
        const init = async () => {
            setLoading(true)
            // pido al mismo tiempo el perfil y los catalogos
            await Promise.all([loadMedico(), loadCatalogs()])
            setLoading(false)
        }
        init()
    }, [user])

    // Fetch generated slots when consultarFecha or consultarServicioId changes
    const fetchSlots = useCallback(async () => {
        if (!user || !consultarFecha || !consultarServicioId || !medico) return
        setConsultarSlotsLoading(true)
        setConsultarSlotsError('')
        try {
            // Find selected service to get its duration
            const allServices = [...(medico.especialidades || []), ...(medico.practicas || [])]
            const selectedService = allServices.find(s => s.id === consultarServicioId)
            const duracionMins = selectedService?.duracionMinutos || 30

            // Get day of week
            const parts = consultarFecha.split('-')
            const dateObj = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10))
            const diasNombres = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
            const nombreDia = diasNombres[dateObj.getDay()]

            // Fetch doctor's appointments for that selected date
            const startOfDay = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10), 0, 0, 0, 0).toISOString()
            const endOfDay = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10), 23, 59, 59, 999).toISOString()

            const params = {
                medicoMatricula: user.identificador,
                fechaDesde: startOfDay,
                fechaHasta: endOfDay,
                limit: 100
            }
            const { data } = await api.get('/turnos', { params })
            const activeAppointments = (data.data || data || []).filter(t => t.estado !== 'CANCELADO')

            // Filter weekly availability blocks for that day of week
            const dayAvailabilities = (medico.disponibilidades || []).filter(disp => disp.dia === nombreDia)

            let slots = []

            dayAvailabilities.forEach(disp => {
                const [hInicio, mInicio] = disp.inicio.split(':').map(Number)
                const [hFin, mFin] = disp.fin.split(':').map(Number)

                let current = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10), hInicio, mInicio, 0, 0)
                const final = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10), hFin, mFin, 0, 0)

                while (current < final) {
                    const slotHour = current.getHours()
                    const slotMin = current.getMinutes()
                    const timeString = `${String(slotHour).padStart(2, '0')}:${String(slotMin).padStart(2, '0')}`

                    // Look if there is a slot booked
                    const matchedAppointment = activeAppointments.find(appt => {
                        const apptDate = new Date(appt.fechaHora)
                        return apptDate.getHours() === slotHour && apptDate.getMinutes() === slotMin
                    })

                    if (matchedAppointment) {
                        slots.push({
                            hora: timeString,
                            disponible: false,
                            pacienteDni: matchedAppointment.pacienteDni,
                            estado: matchedAppointment.estado,
                            turnoId: matchedAppointment._id || matchedAppointment.id
                        })
                    } else {
                        slots.push({
                            hora: timeString,
                            disponible: true
                        })
                    }

                    current = new Date(current.getTime() + duracionMins * 60000)
                }
            })

            // Sort slots chronologically
            slots.sort((a, b) => a.hora.localeCompare(b.hora))
            setConsultarSlots(slots)
        } catch (err) {
            setConsultarSlotsError('Error al calcular slots horarios.')
            console.error(err)
        } finally {
            setConsultarSlotsLoading(false)
        }
    }, [user, consultarFecha, consultarServicioId, medico])

    useEffect(() => {
        fetchSlots()
    }, [fetchSlots])

    const handleUpdateProfile = async (e) => {
        e.preventDefault()
        if (!nombre.trim() || !usuario.trim()) {
            setErrorMsg('El nombre y el usuario son campos obligatorios.')
            return
        }

        setSaving(true)
        setSuccessMsg('')
        setErrorMsg('')

        try {
            const payload = {
                nombre: nombre.trim(),
                usuario: usuario.trim()
            }
            const { data } = await api.put(`/medicos/${user.identificador}`, payload)

            updateUser({
                nombre: data.nombre,
                usuario: data.usuario
            })

            setMedico(data)
            setSuccessMsg('Perfil actualizado correctamente.')
        } catch (err) {
            setErrorMsg(err.response?.data?.message || err.response?.data?.error || 'Error al actualizar el perfil.')
            console.error(err)
        } finally {
            setSaving(false)
        }
    }

    // Filter master catalogs to exclude services the doctor already has
    const getAvailableMasters = () => {
        const assignedIds = new Set([
            ...(medico?.especialidades || []).map(s => String(s.id)),
            ...(medico?.practicas || []).map(s => String(s.id))
        ])

        if (serviceTipo === 'especialidad') {
            return catalogoEspecialidades.filter(e => !assignedIds.has(String(e._id)))
        } else {
            return catalogoPracticas.filter(p => !assignedIds.has(String(p._id)))
        }
    }

    const handleAddService = async (e) => {
        e.preventDefault()
        setServiceError('')
        setServiceSuccess('')

        if (!serviceId) {
            setServiceError('Debes seleccionar un servicio.')
            return
        }

        const durationVal = parseInt(serviceDuracion, 10)
        const costVal = parseInt(serviceCosto, 10)

        if (isNaN(durationVal) || durationVal <= 0) {
            setServiceError('La duración debe ser un número entero mayor a 0.')
            return
        }
        if (isNaN(costVal) || costVal < 0) {
            setServiceError('El costo no puede ser menor a 0.')
            return
        }

        setServiceAdding(true)
        try {
            const payload = {
                tipo: serviceTipo,
                id: serviceId,
                duracionMinutos: durationVal,
                costo: costVal
            }
            await api.post(`/medicos/${user.identificador}/servicios`, payload)

            setServiceSuccess('Servicio asignado correctamente.')
            setServiceId('')
            await loadMedico()
        } catch (err) {
            setServiceError(err.response?.data?.message || err.response?.data?.error || 'Error al asignar el servicio.')
            console.error(err)
        } finally {
            setServiceAdding(false)
        }
    }

    const handleDeleteService = async (idServicio, tipo) => {
        if (!confirm('¿Estás seguro de que deseas eliminar este servicio?')) return
        setServiceError('')
        setServiceSuccess('')
        setServiceActionId(idServicio)

        try {
            await api.delete(`/medicos/${user.identificador}/servicios/${idServicio}`, {
                params: { tipo }
            })
            setServiceSuccess('Servicio eliminado de tu lista.')

            // If deleting the active consulted service, reset it
            if (consultarServicioId === idServicio) {
                setConsultarServicioId('')
            }
            await loadMedico()
        } catch (err) {
            setServiceError(err.response?.data?.message || err.response?.data?.error || 'Error al eliminar el servicio.')
            console.error(err)
        } finally {
            setServiceActionId(null)
        }
    }

    const startEditingService = (service) => {
        setEditingServiceId(service.id)
        setEditDuracion(String(service.duracionMinutos))
        setEditCosto(String(service.costo))
    }

    const cancelEditingService = () => {
        setEditingServiceId(null)
    }

    const handleUpdateService = async (idServicio, tipo) => {
        setServiceError('')
        setServiceSuccess('')

        const durationVal = parseInt(editDuracion, 10)
        const costVal = parseInt(editCosto, 10)

        if (isNaN(durationVal) || durationVal <= 0) {
            setServiceError('La duración debe ser un número entero mayor a 0.')
            return
        }
        if (isNaN(costVal) || costVal < 0) {
            setServiceError('El costo no puede ser menor a 0.')
            return
        }

        setServiceActionId(idServicio)
        try {
            const payload = {
                tipo,
                duracionMinutos: durationVal,
                costo: costVal
            }
            await api.put(`/medicos/${user.identificador}/servicios/${idServicio}`, payload)

            setServiceSuccess('Servicio actualizado correctamente.')
            setEditingServiceId(null)
            await loadMedico()
        } catch (err) {
            setServiceError(err.response?.data?.message || err.response?.data?.error || 'Error al modificar el servicio.')
            console.error(err)
        } finally {
            setServiceActionId(null)
        }
    }

    // Sort availability ranges chronologically
    const getSortedDisponibilidades = () => {
        if (!medico?.disponibilidades) return []
        return [...medico.disponibilidades].sort((a, b) => {
            const indexA = DIAS_SEMANA.indexOf(a.dia)
            const indexB = DIAS_SEMANA.indexOf(b.dia)
            if (indexA !== indexB) return indexA - indexB
            return a.inicio.localeCompare(b.inicio)
        })
    }

    const handleAddDisponibilidad = async (e) => {
        e.preventDefault()
        setDispError('')
        setDispSuccess('')

        if (nuevoInicio >= nuevoFin) {
            setDispError('La hora de inicio debe ser anterior a la hora de fin.')
            return
        }

        setDispAdding(true)
        try {
            const payload = {
                dia: nuevoDia,
                inicio: nuevoInicio,
                fin: nuevoFin
            }
            await api.post(`/medicos/${user.identificador}/disponibilidades`, payload)

            setDispSuccess('Bloque horario agregado correctamente.')
            await loadMedico()

            setNuevoDia('Lunes')
            setNuevoInicio('09:00')
            setNuevoFin('13:00')
        } catch (err) {
            setDispError(err.response?.data?.message || err.response?.data?.error || 'Error al agregar disponibilidad. Verifica solapamientos.')
            console.error(err)
        } finally {
            setDispAdding(false)
        }
    }

    const handleDeleteDisponibilidad = async (idDisp) => {
        if (!confirm('¿Estás seguro de que deseas eliminar este bloque de disponibilidad?')) return
        setDispError('')
        setDispSuccess('')
        setDispActionId(idDisp)

        try {
            await api.delete(`/medicos/${user.identificador}/disponibilidades/${idDisp}`)
            setDispSuccess('Disponibilidad eliminada correctamente.')
            await loadMedico()
        } catch (err) {
            setDispError(err.response?.data?.message || err.response?.data?.error || 'Error al eliminar disponibilidad.')
            console.error(err)
        } finally {
            setDispActionId(null)
        }
    }

    const startEditing = (disp) => {
        setEditingId(disp.id)
        setEditDia(disp.dia)
        setEditInicio(disp.inicio)
        setEditFin(disp.fin)
    }

    const cancelEditing = () => {
        setEditingId(null)
    }

    const handleUpdateDisponibilidad = async (idDisp) => {
        setDispError('')
        setDispSuccess('')

        if (editInicio >= editFin) {
            setDispError('La hora de inicio debe ser anterior a la hora de fin.')
            return
        }

        setDispActionId(idDisp)
        try {
            const payload = {
                dia: editDia,
                inicio: editInicio,
                fin: editFin
            }
            await api.put(`/medicos/${user.identificador}/disponibilidades/${idDisp}`, payload)

            setDispSuccess('Disponibilidad modificada correctamente.')
            setEditingId(null)
            await loadMedico()
        } catch (err) {
            setDispError(err.response?.data?.message || err.response?.data?.error || 'Error al modificar disponibilidad. Verifica solapamientos.')
            console.error(err)
        } finally {
            setDispActionId(null)
        }
    }

    if (authLoading || loading || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Spinner size="lg" />
            </div>
        )
    }

    // List of active services assigned to doctor for slots consultation dropdown
    const assignedServices = [
        ...(medico?.especialidades || []).map(s => ({ ...s, tipo: 'especialidad' })),
        ...(medico?.practicas || []).map(s => ({ ...s, tipo: 'practica' }))
    ]

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="min-h-screen flex flex-col"
        >
            <Navbar />

            <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-6 flex flex-col gap-6">
                {/* Botón Volver */}
                <div className="flex items-center">
                    <Button
                        size="sm"
                        variant="light"
                        onPress={() => router.push('/medico')}
                        startContent={<ArrowLeft size={16} />}
                        className="text-slate-700 font-medium hover:text-slate-900 bg-white/70 hover:bg-white border border-white/50 shadow-sm rounded-full backdrop-blur-sm"
                    >
                        Volver al Panel
                    </Button>
                </div>

                {/* Perfil Banner */}
                <Card className="w-full bg-content1 border border-divider shadow-sm">
                    <div className="p-6 flex flex-col sm:flex-row items-center gap-5">
                        <img
                            src={`https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=${usuario}`}
                            alt="avatar"
                            className="w-20 h-20 rounded-full border-2 border-primary object-cover bg-content2 shadow-sm shrink-0"
                        />
                        <div className="flex-1 text-center sm:text-left">
                            <h1 className="text-xl font-bold text-foreground">Dr. {nombre}</h1>
                            <p className="text-sm text-default-500 mt-1">Matrícula: {user.identificador} · Médico</p>

                            <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-3">
                                {medico?.especialidades?.map((esp) => (
                                    <Chip key={esp.id || esp.nombre} size="sm" color="primary" variant="flat">
                                        {esp.nombre}
                                    </Chip>
                                ))}
                                {medico?.practicas?.map((prac) => (
                                    <Chip key={prac.id || prac.nombre} size="sm" color="secondary" variant="flat">
                                        {prac.nombre}
                                    </Chip>
                                ))}
                                {medico?.sedes?.map((s) => (
                                    <Chip key={s.id || s.nombre} size="sm" color="default" variant="flat">
                                        {s.nombre}
                                    </Chip>
                                ))}
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Navegación por pestañas */}
                <div className="grid grid-cols-2 sm:flex sm:flex-nowrap gap-2 w-full !bg-sky-200/90 backdrop-blur-md py-2 px-2 rounded-2xl border !border-sky-300 shadow-sm mt-4">
                    <Button
                        size="md"
                        variant={activeTab === 'perfil' ? 'solid' : 'light'}
                        color={activeTab === 'perfil' ? 'primary' : 'default'}
                        onPress={() => setActiveTab('perfil')}
                        startContent={<User size={16} />}
                        className={`w-full font-bold ${activeTab === 'perfil' ? 'bg-white text-sky-900 shadow-sm border border-sky-300' : 'text-sky-900/70'}`}
                    >
                        Datos Personales
                    </Button>
                    <Button
                        size="md"
                        variant={activeTab === 'servicios' ? 'solid' : 'light'}
                        color={activeTab === 'servicios' ? 'primary' : 'default'}
                        onPress={() => setActiveTab('servicios')}
                        startContent={<Briefcase size={16} />}
                        className={`w-full font-bold ${activeTab === 'servicios' ? 'bg-white text-sky-900 shadow-sm border border-sky-300' : 'text-sky-900/70'}`}
                    >
                        Mis Servicios
                    </Button>
                    <Button
                        size="md"
                        variant={activeTab === 'disponibilidad' ? 'solid' : 'light'}
                        color={activeTab === 'disponibilidad' ? 'primary' : 'default'}
                        onPress={() => setActiveTab('disponibilidad')}
                        startContent={<CalendarDays size={16} />}
                        className={`w-full font-bold ${activeTab === 'disponibilidad' ? 'bg-white text-sky-900 shadow-sm border border-sky-300' : 'text-sky-900/70'}`}
                    >
                        Disponibilidad Horaria
                    </Button>
                    <Button
                        size="md"
                        variant={activeTab === 'consultar' ? 'solid' : 'light'}
                        color={activeTab === 'consultar' ? 'primary' : 'default'}
                        onPress={() => setActiveTab('consultar')}
                        startContent={<Clock size={16} />}
                        className={`w-full font-bold ${activeTab === 'consultar' ? 'bg-white text-sky-900 shadow-sm border border-sky-300' : 'text-sky-900/70'}`}
                    >
                        Consultar Agenda Slots
                    </Button>
                </div>

                <div className="w-full mt-4">
                    <AnimatePresence mode="wait">
                        {/* Contenido Pestaña Perfil */}
                        {activeTab === 'perfil' && (
                            <motion.div key="perfil" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                                <Card className="w-full mt-4 border !border-sky-300 !bg-sky-200/90 backdrop-blur-md shadow-sm">
                                <form onSubmit={handleUpdateProfile} className="p-6 flex flex-col gap-5">
                                    <h2 className="text-sm font-semibold text-foreground border-b border-divider pb-2">Editar Datos Básicos</h2>

                                    {successMsg && (
                                        <div className="flex items-center gap-2 text-sm text-success-700 bg-success-50 p-3 rounded-medium border border-success-200">
                                            <CheckCircle size={16} className="shrink-0" />
                                            <span>{successMsg}</span>
                                        </div>
                                    )}

                                    {errorMsg && (
                                        <div className="flex items-center gap-2 text-sm text-danger-700 bg-danger-50 p-3 rounded-medium border border-danger-200">
                                            <AlertCircle size={16} className="shrink-0" />
                                            <span>{errorMsg}</span>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <TextField>
                                            <Label>Nombre Completo</Label>
                                            <Input
                                                type="text"
                                                value={nombre}
                                                onChange={(e) => setNombre(e.target.value)}
                                            />
                                        </TextField>

                                        <TextField>
                                            <Label>Nombre de Usuario</Label>
                                            <Input
                                                type="text"
                                                value={usuario}
                                                onChange={(e) => setUsuario(e.target.value)}
                                            />
                                        </TextField>
                                    </div>

                                    <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-divider">
                                        <Button
                                            type="submit"
                                            color="primary"
                                            isLoading={saving}
                                            className="px-6"
                                        >
                                            Guardar Cambios
                                        </Button>
                                    </div>
                                </form>
                            </Card>
                        </motion.div>
                        )}

                        {/* Contenido Pestaña Servicios (ABM) */}
                        {activeTab === 'servicios' && (
                            <motion.div key="servicios" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4 w-full">
                                {/* Agregar Servicio */}
                                <Card className="lg:col-span-1 border !border-sky-300 !bg-sky-200/90 backdrop-blur-md shadow-sm h-fit">
                                    <form onSubmit={handleAddService} className="p-5 flex flex-col gap-4">
                                        <h3 className="text-sm font-semibold text-foreground border-b border-divider pb-2 flex items-center gap-1.5">
                                            <Plus size={16} className="text-primary" />
                                            Asignar Servicio
                                        </h3>

                                        <div className="flex flex-col gap-3">
                                            {/* Selector de Tipo */}
                                            <div className="flex flex-col gap-1">
                                                <Select
                                                    value={serviceTipo}
                                                    onChange={(val) => {
                                                        setServiceTipo(val || 'especialidad')
                                                        setServiceId('')
                                                    }}
                                                >
                                                    <Label>Tipo de Servicio</Label>
                                                    <Select.Trigger>
                                                        <Select.Value />
                                                        <Select.Indicator />
                                                    </Select.Trigger>
                                                    <Select.Popover>
                                                        <ListBox>
                                                            <ListBox.Item id="especialidad" textValue="Especialidad">
                                                                Especialidad
                                                            </ListBox.Item>
                                                            <ListBox.Item id="practica" textValue="Práctica Médica">
                                                                Práctica Médica
                                                            </ListBox.Item>
                                                        </ListBox>
                                                    </Select.Popover>
                                                </Select>
                                            </div>

                                            {/* Selector del Catálogo Maestro */}
                                            <div className="flex flex-col gap-1">
                                                <Select
                                                    value={serviceId}
                                                    onChange={(val) => setServiceId(val || '')}
                                                    isDisabled={getAvailableMasters().length === 0}
                                                    placeholder={getAvailableMasters().length === 0 ? "Sin opciones disponibles" : "Selecciona del catálogo"}
                                                >
                                                    <Label>{serviceTipo === 'especialidad' ? 'Especialidad' : 'Práctica'}</Label>
                                                    <Select.Trigger>
                                                        <Select.Value />
                                                        <Select.Indicator />
                                                    </Select.Trigger>
                                                    <Select.Popover>
                                                        <ListBox>
                                                            {getAvailableMasters().map((item) => (
                                                                <ListBox.Item key={item._id} id={item._id} textValue={item.nombre}>
                                                                    {item.nombre}
                                                                </ListBox.Item>
                                                            ))}
                                                        </ListBox>
                                                    </Select.Popover>
                                                </Select>
                                            </div>

                                            {/* Duración */}
                                            <TextField>
                                                <Label>Duración (Minutos)</Label>
                                                <Input
                                                    type="number"
                                                    value={serviceDuracion}
                                                    onChange={(e) => setServiceDuracion(e.target.value)}
                                                />
                                            </TextField>

                                            {/* Costo */}
                                            <TextField>
                                                <Label>Costo ($)</Label>
                                                <Input
                                                    type="number"
                                                    value={serviceCosto}
                                                    onChange={(e) => setServiceCosto(e.target.value)}
                                                />
                                            </TextField>
                                        </div>

                                        <Button
                                            type="submit"
                                            color="primary"
                                            isLoading={serviceAdding}
                                            className="w-full font-medium mt-2"
                                            isDisabled={getAvailableMasters().length === 0}
                                        >
                                            Asociar Servicio
                                        </Button>
                                    </form>
                                </Card>

                                {/* Catálogo asignado */}
                                <Card className="lg:col-span-2 border !border-sky-300 !bg-sky-200/90 backdrop-blur-md shadow-sm">
                                    <div className="p-5 flex flex-col gap-4">
                                        <h3 className="text-sm font-semibold text-foreground border-b border-divider pb-2 flex items-center gap-1.5">
                                            <Briefcase size={16} className="text-primary" />
                                            Especialidades y Prácticas Activas
                                        </h3>

                                        {serviceSuccess && (
                                            <div className="flex items-center gap-2 text-xs text-success-700 bg-success-50 p-2.5 rounded-medium border border-success-200">
                                                <CheckCircle size={14} className="shrink-0" />
                                                <span>{serviceSuccess}</span>
                                            </div>
                                        )}

                                        {serviceError && (
                                            <div className="flex items-center gap-2 text-xs text-danger-700 bg-danger-50 p-2.5 rounded-medium border border-danger-200">
                                                <AlertCircle size={14} className="shrink-0" />
                                                <span>{serviceError}</span>
                                            </div>
                                        )}

                                        {assignedServices.length === 0 ? (
                                            <div className="text-center py-12 text-sm text-default-400">
                                                No tienes servicios asignados. Configura uno desde el formulario lateral.
                                            </div>
                                        ) : (
                                            <div className="flex flex-col divide-y divide-divider">
                                                {assignedServices.map((srv) => {
                                                    const isEditing = editingServiceId === srv.id
                                                    return (
                                                        <div key={srv.id} className="py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                                            {isEditing ? (
                                                                /* Modo Edición Servicio */
                                                                <div className="flex-1 flex flex-col sm:flex-row items-end gap-3 bg-content2 p-3 rounded-medium border border-divider w-full">
                                                                    <div className="w-full sm:w-1/3 flex flex-col gap-0.5">
                                                                        <span className="text-xs font-semibold text-primary capitalize">{srv.tipo}</span>
                                                                        <span className="text-sm font-bold text-foreground">{srv.nombre}</span>
                                                                    </div>
                                                                    <div className="w-full sm:w-1/4">
                                                                        <TextField>
                                                                            <Label className="text-xs">Duración (min)</Label>
                                                                            <Input
                                                                                type="number"
                                                                                value={editDuracion}
                                                                                onChange={(e) => setEditDuracion(e.target.value)}
                                                                                className="h-9 min-h-0"
                                                                            />
                                                                        </TextField>
                                                                    </div>
                                                                    <div className="w-full sm:w-1/4">
                                                                        <TextField>
                                                                            <Label className="text-xs">Costo ($)</Label>
                                                                            <Input
                                                                                type="number"
                                                                                value={editCosto}
                                                                                onChange={(e) => setEditCosto(e.target.value)}
                                                                                className="h-9 min-h-0"
                                                                            />
                                                                        </TextField>
                                                                    </div>
                                                                    <div className="flex gap-2">
                                                                        <Button
                                                                            isIconOnly
                                                                            size="sm"
                                                                            color="success"
                                                                            onPress={() => handleUpdateService(srv.id, srv.tipo)}
                                                                            isLoading={serviceActionId === srv.id}
                                                                        >
                                                                            <Check size={16} />
                                                                        </Button>
                                                                        <Button
                                                                            isIconOnly
                                                                            size="sm"
                                                                            variant="flat"
                                                                            onPress={cancelEditingService}
                                                                            isDisabled={serviceActionId === srv.id}
                                                                        >
                                                                            <X size={16} />
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                /* Vista Estándar Servicio */
                                                                <>
                                                                    <div className="flex flex-col gap-0.5">
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="font-semibold text-foreground text-sm">{srv.nombre}</span>
                                                                            <Chip size="sm" color={srv.tipo === 'especialidad' ? 'primary' : 'secondary'} variant="flat" className="capitalize text-[10px] h-5">
                                                                                {srv.tipo}
                                                                            </Chip>
                                                                        </div>
                                                                        <span className="text-xs text-default-500 flex items-center gap-3">
                                                                            <span className="flex items-center gap-1"><Clock size={12} /> {srv.duracionMinutos} min</span>
                                                                            <span className="flex items-center gap-1"><DollarSign size={12} /> {srv.costo}</span>
                                                                        </span>
                                                                    </div>

                                                                    <div className="flex gap-1.5 shrink-0">
                                                                        <Button
                                                                            isIconOnly
                                                                            size="sm"
                                                                            variant="flat"
                                                                            onPress={() => startEditingService(srv)}
                                                                            title="Editar precio y duración"
                                                                        >
                                                                            <Edit2 size={14} className="text-default-600" />
                                                                        </Button>
                                                                        <Button
                                                                            isIconOnly
                                                                            size="sm"
                                                                            variant="flat"
                                                                            color="danger"
                                                                            onPress={() => handleDeleteService(srv.id, srv.tipo)}
                                                                            isLoading={serviceActionId === srv.id}
                                                                            title="Desasociar servicio"
                                                                        >
                                                                            <Trash2 size={14} />
                                                                        </Button>
                                                                    </div>
                                                                </>
                                                            )}
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </Card>
                            </div>
                        </motion.div>
                        )}

                        {/* Contenido Pestaña Disponibilidad */}
                        {activeTab === 'disponibilidad' && (
                            <motion.div key="disponibilidad" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4 w-full">
                                {/* Formulario Agregar Disponibilidad */}
                                <Card className="lg:col-span-1 border !border-sky-300 !bg-sky-200/90 backdrop-blur-md shadow-sm h-fit">
                                    <form onSubmit={handleAddDisponibilidad} className="p-5 flex flex-col gap-4">
                                        <h3 className="text-sm font-semibold text-foreground border-b border-divider pb-2 flex items-center gap-1.5">
                                            <Plus size={16} className="text-primary" />
                                            Agregar Bloque
                                        </h3>

                                        <div className="flex flex-col gap-3">
                                            {/* Selector de día */}
                                            <div className="flex flex-col gap-1">
                                                <Select
                                                    value={nuevoDia}
                                                    onChange={(val) => setNuevoDia(val || 'Lunes')}
                                                >
                                                    <Label>Día de la Semana</Label>
                                                    <Select.Trigger>
                                                        <Select.Value />
                                                        <Select.Indicator />
                                                    </Select.Trigger>
                                                    <Select.Popover>
                                                        <ListBox>
                                                            {DIAS_SEMANA.map((dia) => (
                                                                <ListBox.Item key={dia} id={dia} textValue={dia}>
                                                                    {dia}
                                                                </ListBox.Item>
                                                            ))}
                                                        </ListBox>
                                                    </Select.Popover>
                                                </Select>
                                            </div>

                                            {/* Hora inicio */}
                                            <TextField>
                                                <Label>Hora Inicio</Label>
                                                <Input
                                                    type="time"
                                                    value={nuevoInicio}
                                                    onChange={(e) => setNuevoInicio(e.target.value)}
                                                />
                                            </TextField>

                                            {/* Hora fin */}
                                            <TextField>
                                                <Label>Hora Fin</Label>
                                                <Input
                                                    type="time"
                                                    value={nuevoFin}
                                                    onChange={(e) => setNuevoFin(e.target.value)}
                                                />
                                            </TextField>
                                        </div>

                                        <Button
                                            type="submit"
                                            color="primary"
                                            isLoading={dispAdding}
                                            className="w-full font-medium mt-2"
                                        >
                                            Agregar Horario
                                        </Button>
                                    </form>
                                </Card>

                                {/* Listado y Edición de Disponibilidades */}
                                <Card className="lg:col-span-2 border !border-sky-300 !bg-sky-200/90 backdrop-blur-md shadow-sm">
                                    <div className="p-5 flex flex-col gap-4">
                                        <h3 className="text-sm font-semibold text-foreground border-b border-divider pb-2 flex items-center gap-1.5">
                                            <Clock size={16} className="text-primary" />
                                            Agenda de Disponibilidades
                                        </h3>

                                        {dispSuccess && (
                                            <div className="flex items-center gap-2 text-xs text-success-700 bg-success-50 p-2.5 rounded-medium border border-success-200">
                                                <CheckCircle size={14} className="shrink-0" />
                                                <span>{dispSuccess}</span>
                                            </div>
                                        )}

                                        {dispError && (
                                            <div className="flex items-center gap-2 text-xs text-danger-700 bg-danger-50 p-2.5 rounded-medium border border-danger-200">
                                                <AlertCircle size={14} className="shrink-0" />
                                                <span>{dispError}</span>
                                            </div>
                                        )}

                                        {getSortedDisponibilidades().length === 0 ? (
                                            <div className="text-center py-12 text-sm text-default-400">
                                                No tienes horarios de disponibilidad definidos. Agrega uno usando el formulario lateral.
                                            </div>
                                        ) : (
                                            <div className="flex flex-col divide-y divide-divider">
                                                {getSortedDisponibilidades().map((disp) => {
                                                    const isEditing = editingId === disp.id
                                                    return (
                                                        <div key={disp.id} className="py-3 flex items-center justify-between gap-4">
                                                            {isEditing ? (
                                                                /* Modo Edición Inline */
                                                                <div className="flex-1 flex flex-col sm:flex-row items-end gap-3 bg-content2 p-3 rounded-medium border border-divider">
                                                                    <div className="w-full sm:w-1/3 flex flex-col gap-1">
                                                                        <Select
                                                                            value={editDia}
                                                                            onChange={(val) => setEditDia(val || 'Lunes')}
                                                                        >
                                                                            <Label className="text-xs">Día</Label>
                                                                            <Select.Trigger className="h-9">
                                                                                <Select.Value />
                                                                                <Select.Indicator />
                                                                            </Select.Trigger>
                                                                            <Select.Popover>
                                                                                <ListBox>
                                                                                    {DIAS_SEMANA.map((dia) => (
                                                                                        <ListBox.Item key={dia} id={dia} textValue={dia}>
                                                                                            {dia}
                                                                                        </ListBox.Item>
                                                                                    ))}
                                                                                </ListBox>
                                                                            </Select.Popover>
                                                                        </Select>
                                                                    </div>
                                                                    <div className="w-full sm:w-1/4">
                                                                        <TextField>
                                                                            <Label className="text-xs">Inicio</Label>
                                                                            <Input
                                                                                type="time"
                                                                                value={editInicio}
                                                                                onChange={(e) => setEditInicio(e.target.value)}
                                                                                className="h-9 min-h-0"
                                                                            />
                                                                        </TextField>
                                                                    </div>
                                                                    <div className="w-full sm:w-1/4">
                                                                        <TextField>
                                                                            <Label className="text-xs">Fin</Label>
                                                                            <Input
                                                                                type="time"
                                                                                value={editFin}
                                                                                onChange={(e) => setEditFin(e.target.value)}
                                                                                className="h-9 min-h-0"
                                                                            />
                                                                        </TextField>
                                                                    </div>
                                                                    <div className="flex gap-2">
                                                                        <Button
                                                                            isIconOnly
                                                                            size="sm"
                                                                            color="success"
                                                                            onPress={() => handleUpdateDisponibilidad(disp.id)}
                                                                            isLoading={dispActionId === disp.id}
                                                                        >
                                                                            <Check size={16} />
                                                                        </Button>
                                                                        <Button
                                                                            isIconOnly
                                                                            size="sm"
                                                                            variant="flat"
                                                                            onPress={cancelEditing}
                                                                            isDisabled={dispActionId === disp.id}
                                                                        >
                                                                            <X size={16} />
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                /* Vista Standard */
                                                                <>
                                                                    <div className="flex flex-col gap-0.5">
                                                                        <span className="font-semibold text-foreground text-sm">{disp.dia}</span>
                                                                        <span className="text-xs text-default-500 flex items-center gap-1">
                                                                            <Clock size={12} />
                                                                            {disp.inicio} hs &mdash; {disp.fin} hs
                                                                        </span>
                                                                    </div>

                                                                    <div className="flex gap-1.5 shrink-0">
                                                                        <Button
                                                                            isIconOnly
                                                                            size="sm"
                                                                            variant="flat"
                                                                            onPress={() => startEditing(disp)}
                                                                            title="Editar bloque"
                                                                        >
                                                                            <Edit2 size={14} className="text-default-600" />
                                                                        </Button>
                                                                        <Button
                                                                            isIconOnly
                                                                            size="sm"
                                                                            variant="flat"
                                                                            color="danger"
                                                                            onPress={() => handleDeleteDisponibilidad(disp.id)}
                                                                            isLoading={dispActionId === disp.id}
                                                                            title="Eliminar bloque"
                                                                        >
                                                                            <Trash2 size={14} />
                                                                        </Button>
                                                                    </div>
                                                                </>
                                                            )}
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </Card>
                            </div>
                        </motion.div>
                        )}

                        {/* Contenido Pestaña Consultar Agenda Slots */}
                        {activeTab === 'consultar' && (
                            <motion.div key="consultar" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                                <Card className="w-full mt-4 border !border-sky-300 !bg-sky-200/90 backdrop-blur-md shadow-sm">
                                <div className="p-6 flex flex-col gap-5">
                                    <h2 className="text-sm font-semibold text-foreground border-b border-divider pb-2 flex items-center gap-1.5">
                                        <Calendar size={16} className="text-primary" />
                                        Consultar Grilla Horaria por Servicio
                                    </h2>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-content2 p-4 rounded-medium border border-divider">
                                        {/* Selector de Servicio */}
                                        <div className="flex flex-col gap-1">
                                            <Select
                                                value={consultarServicioId}
                                                onChange={(val) => setConsultarServicioId(val || '')}
                                                placeholder="Selecciona un servicio activo"
                                                isDisabled={assignedServices.length === 0}
                                            >
                                                <Label>Servicio</Label>
                                                <Select.Trigger>
                                                    <Select.Value />
                                                    <Select.Indicator />
                                                </Select.Trigger>
                                                <Select.Popover>
                                                    <ListBox>
                                                        {assignedServices.map((srv) => (
                                                            <ListBox.Item key={srv.id} id={srv.id} textValue={`${srv.nombre} (${srv.tipo})`}>
                                                                {srv.nombre} <span className="text-xs text-default-400 capitalize">({srv.tipo})</span>
                                                            </ListBox.Item>
                                                        ))}
                                                    </ListBox>
                                                </Select.Popover>
                                            </Select>
                                        </div>

                                        {/* Selector de Fecha */}
                                        <TextField>
                                            <Label>Fecha de Consulta</Label>
                                            <Input
                                                type="date"
                                                value={consultarFecha}
                                                onChange={(e) => setConsultarFecha(e.target.value)}
                                            />
                                        </TextField>
                                    </div>

                                    {consultarSlotsError && (
                                        <div className="flex items-center gap-2 text-xs text-danger-700 bg-danger-50 p-2.5 rounded-medium border border-danger-200">
                                            <AlertCircle size={14} className="shrink-0" />
                                            <span>{consultarSlotsError}</span>
                                        </div>
                                    )}

                                    {consultarSlotsLoading ? (
                                        <div className="flex justify-center py-12">
                                            <Spinner size="md" />
                                        </div>
                                    ) : assignedServices.length === 0 ? (
                                        <div className="text-center py-8 text-sm text-default-400">
                                            Primero debes asociar al menos una especialidad o práctica en la pestaña "Mis Servicios".
                                        </div>
                                    ) : consultarSlots.length === 0 ? (
                                        <div className="text-center py-8 text-sm text-default-500 bg-content2 border border-divider rounded-medium italic">
                                            No tienes bloques de disponibilidad semanales configurados para este día de la semana.
                                        </div>
                                    ) : (
                                        <div className="flex flex-col gap-3">
                                            <div className="text-xs text-default-500 font-semibold mb-1">
                                                Listado de turnos/slots generados para el día ({consultarSlots.length} slots):
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                                {consultarSlots.map((slot, i) => (
                                                    <Card
                                                        key={i}
                                                        className={`border shadow-sm flex flex-col p-3 transition-all duration-200 hover:scale-[1.01] ${slot.disponible
                                                                ? 'bg-success-50/20 border-success-200 hover:bg-success-50/40'
                                                                : 'bg-danger-50/10 border-danger-100/60'
                                                            }`}
                                                    >
                                                        <div className="flex items-center justify-between gap-2">
                                                            <span className="font-bold text-sm text-foreground flex items-center gap-1.5">
                                                                <Clock size={14} className="text-default-500" />
                                                                {slot.hora} hs
                                                            </span>
                                                            <Chip
                                                                size="sm"
                                                                color={slot.disponible ? 'success' : 'default'}
                                                                variant="flat"
                                                                className="text-[10px] px-1 h-5"
                                                            >
                                                                {slot.disponible ? 'Disponible' : 'Ocupado'}
                                                            </Chip>
                                                        </div>
                                                        {!slot.disponible && (
                                                            <div className="text-xs text-default-600 mt-2 flex flex-col gap-0.5 bg-content1 p-2 rounded-small border border-divider">
                                                                <div className="flex items-center gap-1 text-[11px] font-medium text-foreground">
                                                                    <User size={10} />
                                                                    DNI Paciente: {slot.pacienteDni}
                                                                </div>
                                                                <div className="text-[10px] text-default-400 capitalize">
                                                                    Estado: {slot.estado.toLowerCase()}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </Card>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </Card>
                        </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </main>
        </motion.div>
    )
}
