'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, User, CheckCircle, AlertCircle, Shield } from 'lucide-react'
import { useAuth } from '@/lib/AuthContext'
import api from '@/lib/api'
import Spinner from '@/components/Spinner'
import Navbar from '@/components/Navbar'
import { Card, Button, Avatar, Select, Label, ListBox, TextField, Input } from '@heroui/react'
import { motion } from 'framer-motion'

export default function PacientePerfilPage() {
    const { user, updateUser, loading: authLoading } = useAuth()
    const router = useRouter()

    const [profile, setProfile] = useState(null)
    const [obrasSociales, setObrasSociales] = useState([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [successMsg, setSuccessMsg] = useState('')
    const [errorMsg, setErrorMsg] = useState('')

    // Form states
    const [nombre, setNombre] = useState('')
    const [usuario, setUsuario] = useState('')
    const [obraSocialId, setObraSocialId] = useState('')
    const [plan, setPlan] = useState('')

    // Validation errors
    const [nombreError, setNombreError] = useState('')
    const [usuarioError, setUsuarioError] = useState('')

    useEffect(() => {
        if (!authLoading && !user) {
            router.replace('/login')
            return
        }
        if (!authLoading && user && user.rol !== 'PACIENTE') {
            router.replace('/medico')
            return
        }
    }, [user, authLoading, router])

    useEffect(() => {
        if (!user || user.rol !== 'PACIENTE') return

        const loadData = async () => {
            try {
                // pido a la vez los datos del paciente y el catalogo de obras sociales
                const [profileRes, mastersRes] = await Promise.all([
                    api.get(`/pacientes/${user.identificador}`),
                    api.get('/maestros/obras-sociales')
                ])

                const profileData = profileRes.data
                setProfile(profileData)
                setNombre(profileData.nombre || '')
                setUsuario(profileData.usuario || '')
                setObraSocialId(profileData.obraSocial?.id || '')
                setPlan(profileData.plan || '')

                setObrasSociales(mastersRes.data?.data || mastersRes.data || [])
            } catch (err) {
                setErrorMsg('Error al cargar la información del perfil.')
                console.error(err)
            } finally {
                setLoading(false)
            }
        }

        loadData()
    }, [user])

    // Find the currently selected Obra Social details to extract its plans
    const selectedObraSocial = obrasSociales.find(os => os._id === obraSocialId)
    const availablePlans = selectedObraSocial?.planes || []

    // reseteo el plan cuando cambian la obra social porque los planes son distintos para cada una
    const handleObraSocialChange = (newId) => {
        setObraSocialId(newId)
        // si eligieron Particular (Ninguna) o cambiaron a otra OS, limpio el plan o pongo el primero que encuentre
        if (!newId) {
            setPlan('')
        } else {
            const nextOS = obrasSociales.find(os => os._id === newId)
            if (nextOS && nextOS.planes && nextOS.planes.length > 0) {
                // si el plan viejo de casualidad tambien existe en la nueva OS, lo dejo, sino pongo el primero de la lista
                if (!nextOS.planes.includes(plan)) {
                    setPlan(nextOS.planes[0])
                }
            } else {
                setPlan('')
            }
        }
    }

    const validateForm = () => {
        let valid = true
        setNombreError('')
        setUsuarioError('')

        if (!nombre.trim()) {
            setNombreError('El nombre es obligatorio.')
            valid = false
        } else if (nombre.trim().length < 2) {
            setNombreError('El nombre debe tener al menos 2 caracteres.')
            valid = false
        }

        if (!usuario.trim()) {
            setUsuarioError('El nombre de usuario es obligatorio.')
            valid = false
        } else if (usuario.trim().length < 3) {
            setUsuarioError('El usuario debe tener al menos 3 caracteres.')
            valid = false
        }

        return valid
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!validateForm()) return

        setSaving(true)
        setSuccessMsg('')
        setErrorMsg('')

        try {
            const payload = {
                nombre: nombre.trim(),
                usuario: usuario.trim(),
                obraSocial: obraSocialId || null,
                plan: obraSocialId ? plan : ''
            }

            const { data } = await api.put(`/pacientes/${user.identificador}`, payload)

            // Update user details in context
            updateUser({
                nombre: data.nombre,
                usuario: data.usuario
            })

            setProfile(data)
            setSuccessMsg('Perfil actualizado correctamente.')
        } catch (err) {
            setErrorMsg(err.response?.data?.message || err.response?.data?.error || 'Error al guardar los cambios del perfil.')
            console.error(err)
        } finally {
            setSaving(false)
        }
    }

    if (authLoading || loading || !user) {
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
            <Navbar />

            <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-6 flex flex-col gap-6">
                {/* Botón de regreso */}
                <div className="flex items-center">
                    <Button
                        size="sm"
                        variant="light"
                        onPress={() => router.push('/paciente')}
                        startContent={<ArrowLeft size={16} />}
                        className="text-slate-700 font-medium hover:text-slate-900 bg-white/70 hover:bg-white border border-white/50 shadow-sm rounded-full backdrop-blur-sm"
                    >
                        Volver al Panel
                    </Button>
                </div>

                {/* Encabezado de Perfil */}
                <Card className="w-full bg-content1 border border-divider shadow-sm">
                    <div className="p-6 flex flex-col sm:flex-row items-center gap-5">
                        <img
                            src={`https://api.dicebear.com/7.x/adventurer-neutral/svg?seed=${usuario}`}
                            alt="avatar"
                            className="w-20 h-20 rounded-full border-2 border-primary object-cover bg-content2 shadow-sm shrink-0"
                        />
                        <div className="flex-1 text-center sm:text-left">
                            <h1 className="text-xl font-bold text-foreground">{nombre}</h1>
                            <p className="text-sm text-default-500 mt-1">DNI: {user.identificador} · Paciente</p>
                            {profile?.obraSocial ? (
                                <div className="inline-flex items-center gap-1.5 mt-2 bg-primary-50 border border-primary-100 text-primary-700 text-xs px-2.5 py-1 rounded-full font-medium">
                                    <Shield size={12} />
                                    {profile.obraSocial.nombre} · Plan {profile.plan}
                                </div>
                            ) : (
                                <div className="inline-flex items-center gap-1.5 mt-2 bg-default-100 border border-default-200 text-default-600 text-xs px-2.5 py-1 rounded-full font-medium">
                                    Particular (Sin Obra Social)
                                </div>
                            )}
                        </div>
                    </div>
                </Card>

                {/* Navegación por pestañas (Estética para consistencia) */}
                <div className="flex gap-2 w-full !bg-sky-200/90 backdrop-blur-md py-2 px-2 rounded-2xl border !border-sky-300 shadow-sm mt-4">
                    <Button
                        size="md"
                        variant="solid"
                        color="primary"
                        startContent={<User size={16} />}
                        className="w-full font-bold bg-white text-sky-900 shadow-sm border border-sky-300"
                    >
                        Datos Personales
                    </Button>
                </div>

                {/* Formulario de Modificación */}
                <Card className="w-full mt-4 border !border-sky-300 !bg-sky-200/90 backdrop-blur-md shadow-sm">
                    <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
                        <h2 className="text-base font-semibold text-foreground border-b border-divider pb-2">Editar Información Personal</h2>

                        {successMsg && (
                            <div className="flex items-center gap-2 text-sm text-success-700 bg-success-50 p-3.5 rounded-medium border border-success-200">
                                <CheckCircle size={16} className="shrink-0" />
                                <span>{successMsg}</span>
                            </div>
                        )}

                        {errorMsg && (
                            <div className="flex items-center gap-2 text-sm text-danger-700 bg-danger-50 p-3.5 rounded-medium border border-danger-200">
                                <AlertCircle size={16} className="shrink-0" />
                                <span>{errorMsg}</span>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Input Nombre */}
                            <div className="flex flex-col gap-1">
                                <TextField>
                                    <Label>Nombre Completo</Label>
                                    <Input
                                        type="text"
                                        placeholder="Tu nombre completo"
                                        value={nombre}
                                        onChange={(e) => setNombre(e.target.value)}
                                        className={nombreError ? "border-danger-400" : ""}
                                    />
                                </TextField>
                                {nombreError && (
                                    <span className="text-xs text-danger-500 font-medium ml-1">{nombreError}</span>
                                )}
                            </div>

                            {/* Input Usuario */}
                            <div className="flex flex-col gap-1">
                                <TextField>
                                    <Label>Nombre de Usuario</Label>
                                    <Input
                                        type="text"
                                        placeholder="Nombre de usuario"
                                        value={usuario}
                                        onChange={(e) => setUsuario(e.target.value)}
                                        className={usuarioError ? "border-danger-400" : ""}
                                    />
                                </TextField>
                                {usuarioError && (
                                    <span className="text-xs text-danger-500 font-medium ml-1">{usuarioError}</span>
                                )}
                            </div>

                            {/* Select Obra Social */}
                            <div className="flex flex-col gap-1">
                                <Select
                                    placeholder="Particular / Ninguna"
                                    value={obraSocialId || null}
                                    onChange={(val) => handleObraSocialChange(val || '')}
                                >
                                    <Label>Obra Social</Label>
                                    <Select.Trigger>
                                        <Select.Value />
                                        <Select.Indicator />
                                    </Select.Trigger>
                                    <Select.Popover>
                                        <ListBox>
                                            <ListBox.Item id="" textValue="Particular / Ninguna" className="text-default-500 italic">
                                                Particular (Ninguna)
                                            </ListBox.Item>
                                            {obrasSociales.map((os) => (
                                                <ListBox.Item key={os._id} id={os._id} textValue={os.nombre}>
                                                    {os.nombre}
                                                </ListBox.Item>
                                            ))}
                                        </ListBox>
                                    </Select.Popover>
                                </Select>
                            </div>

                            {/* Select Plan (Dinámico) */}
                            <div className="flex flex-col gap-1">
                                <Select
                                    placeholder={obraSocialId ? "Selecciona un plan" : "No aplica"}
                                    isDisabled={!obraSocialId || availablePlans.length === 0}
                                    value={plan || null}
                                    onChange={(val) => setPlan(val || '')}
                                >
                                    <Label>Plan de Cobertura</Label>
                                    <Select.Trigger>
                                        <Select.Value />
                                        <Select.Indicator />
                                    </Select.Trigger>
                                    <Select.Popover>
                                        <ListBox>
                                            {availablePlans.map((p) => (
                                                <ListBox.Item key={p} id={p} textValue={p}>
                                                    Plan {p}
                                                </ListBox.Item>
                                            ))}
                                        </ListBox>
                                    </Select.Popover>
                                </Select>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 mt-4 border-t border-divider pt-4 justify-end">
                            <Button
                                type="button"
                                variant="flat"
                                onPress={() => router.push('/paciente')}
                                className="px-5"
                            >
                                Cancelar
                            </Button>
                            <Button
                                type="submit"
                                color="primary"
                                isLoading={saving}
                                className="px-6 font-medium"
                            >
                                Guardar Cambios
                            </Button>
                        </div>
                    </form>
                </Card>
            </main>
        </motion.div>
    )
}
