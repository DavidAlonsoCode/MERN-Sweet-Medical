'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Stethoscope, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { useAuth } from '@/lib/AuthContext'
import { motion } from 'framer-motion'
import api from '@/lib/api'
import { Card, TextField, Label, Input, Button } from '@heroui/react'

export default function LoginPage() {
    const { login } = useAuth()  // extraigo la funcion de login del contexto global
    const router = useRouter()  // uso el enrutador de next para redirigir al usuario despues de loguearse

    const [form, setForm] = useState({ usuario: '', password: '' })  // guardo lo que el usuario va escribiendo en los inputs
    const [showPassword, setShowPassword] = useState(false)  // controlo si el input de clave muestra asteriscos o texto plano
    const [error, setError] = useState('')  // aca guardo los mensajes de error para mostrarlos en rojo
    const [loading, setLoading] = useState(false)  // booleano para deshabilitar el boton mientras el backend responde

    const handleChange = (e) => {
        // actualizo el estado del formulario dinamica y genericamente con el nombre del input
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
        if (error) setError('')  // si habia un error, lo limpio en cuanto el usuario vuelve a escribir
    }

    const validate = () => {
        if (!form.usuario.trim()) return 'El usuario es obligatorio.'
        if (!form.password.trim()) return 'La contraseña es obligatoria.'
        if (form.password.length < 3) return 'La contraseña es demasiado corta.'
        return null
    }

    const handleSubmit = async (e) => {
        e.preventDefault()  // evito que el formulario recargue la pagina por defecto
        const validationError = validate()
        if (validationError) { setError(validationError); return }

        setLoading(true)
        setError('')

        try {
            // hago la peticion al backend con las credenciales
            const { data } = await api.post('/auth/login', {
                usuario: form.usuario.trim(),
                password: form.password,
            })

            login(data.user, data.token)  // guardo la sesion en el contexto global

            // redirijo a la pantalla correspondiente segun el rol que me devolvio el backend
            if (data.user.rol === 'MEDICO') {
                router.push('/medico')
            } else {
                router.push('/paciente')
            }
        } catch (err) {
            // si el backend tira error, extraigo el mensaje o pongo uno generico
            const msg = err.response?.data?.error || err.response?.data?.message || 'Credenciales invalidas.'
            setError(msg)
        } finally {
            setLoading(false)  // devuelvo el boton a su estado normal siempre, falle o no
        }
    }

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="min-h-screen flex items-center justify-center p-4"
        >
            <div className="w-full max-w-sm">
                <div className="text-center mb-8 backdrop-blur-md bg-white/40 p-6 rounded-[2rem] border border-white/40 shadow-sm">
                    <div className="inline-flex items-center justify-center p-3.5 rounded-2xl bg-gradient-to-tr from-sky-500 to-blue-600 mb-4 shadow-lg shadow-sky-500/30">
                        <Stethoscope size={36} className="text-white drop-shadow-md" />
                    </div>
                    <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-sky-600 to-blue-800 tracking-tight">Sweet Medical</h1>
                    <p className="text-sm font-medium text-sky-900/80 mt-2">Portal de Pacientes y Profesionales</p>
                </div>

                <Card shadow="sm" className="!bg-[#881337] border-none">
                    <div className="p-6">
                        <h2 className="text-base font-semibold text-white mb-5">Iniciar sesión</h2>

                        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
                            {/* Nuevo TextField de v3 */}
                            <TextField isInvalid={!!error} classNames={{ label: "text-white/90" }}>
                                <Label className="text-white/90">Usuario</Label>
                                <Input
                                    name="usuario"
                                    type="text"
                                    autoComplete="username"
                                    value={form.usuario}
                                    onChange={handleChange}
                                    placeholder="Ingrese su usuario"
                                />
                            </TextField>

                            {/* Nuevo TextField de v3 con botón de ver contraseña */}
                            <TextField isInvalid={!!error} classNames={{ label: "text-white/90" }} className="w-full">
                                <Label className="text-white/90">Contraseña</Label>
                                <div className="relative w-full flex items-center">
                                    <Input
                                        name="password"
                                        autoComplete="current-password"
                                        value={form.password}
                                        onChange={handleChange}
                                        placeholder="Ingrese su contraseña"
                                        type={showPassword ? 'text' : 'password'}
                                        className="w-full pr-10 bg-white"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword((v) => !v)}
                                        className="absolute right-3 z-10 text-default-400 hover:text-default-600 focus:outline-none flex items-center justify-center"
                                        aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </TextField>

                            {error && (
                                <div className="flex items-center gap-2 text-sm text-danger bg-danger-50 border border-danger-100 rounded-medium px-3 py-2">
                                    <AlertCircle size={16} className="shrink-0" />
                                    <span>{error}</span>
                                </div>
                            )}

                            <Button
                                type="submit"
                                isDisabled={loading}
                                className="mt-2 font-bold w-full border border-white/20 bg-white hover:bg-white/90 text-[#881337] shadow-sm"
                            >
                                {loading ? 'Ingresando...' : 'Iniciar Sesión'}
                            </Button>
                        </form>
                    </div>
                </Card>
            </div>
        </motion.div>
    )
}