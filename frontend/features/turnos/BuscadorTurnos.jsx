'use client'

import { useState } from 'react'
import { AlertCircle, ArrowUpDown } from 'lucide-react'
import api from '@/lib/api'
import { useAuth } from '@/lib/AuthContext'
import FiltrosTurnos from './FiltrosTurnos'
import TurnoCard from './TurnoCard'
import Paginacion from './Paginacion'
import ModalCarritoTurnos from './ModalCarritoTurnos'
import { motion, AnimatePresence } from 'framer-motion'
import Spinner from '@/components/Spinner'
import { Button } from '@heroui/react'

const FILTROS_INICIALES = {
    medicoMatricula: '',
    especialidad: '',
    practica: '',
    sede: '',
    fechaDesde: '',
    fechaHasta: '',
}

export default function BuscadorTurnos() {
    const { user } = useAuth()  // necesito el DNI del usuario para armar las reservas despues
    const [filtros, setFiltros] = useState(FILTROS_INICIALES)  // aca guardo todo lo que el usuario va seleccionando en los inputs de filtro
    const [sortBy, setSortBy] = useState('fecha')
    const [order, setOrder] = useState('asc')
    const [page, setPage] = useState(1)
    const [resultado, setResultado] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [carrito, setCarrito] = useState([])  // estado super importante: aca mantengo los turnos pre-seleccionados antes de confirmar
    const [verCarrito, setVerCarrito] = useState(false)  // controla si el modal de confirmacion esta abierto o cerrado
    const [successMsg, setSuccessMsg] = useState('')  // guardo mensaje de exito para mostrar barrita verde

    const buscar = async (newPage = 1) => {
        // me aseguro de que el usuario exista antes de buscar nada para evitar errores locos
        if (!user?.identificador) return
        setLoading(true)
        setError('')
        try {
            const params = {
                pacienteDni: user.identificador,
                sortBy,
                order,
                page: newPage,
                limit: 9,
            }
            if (filtros.medicoMatricula) params.medicoMatricula = filtros.medicoMatricula
            if (filtros.especialidad) params.especialidad = filtros.especialidad
            if (filtros.practica) params.practica = filtros.practica
            if (filtros.sede) params.sede = filtros.sede
            if (filtros.fechaDesde) params.fechaDesde = filtros.fechaDesde
            if (filtros.fechaHasta) params.fechaHasta = filtros.fechaHasta

            const { data } = await api.get('/turnos/disponibles', { params })
            setResultado(data)
            setPage(newPage)
        } catch (err) {
            setError(err.response?.data?.error || 'Error al buscar turnos.')
        } finally {
            setLoading(false)
        }
    }

    const handleLimpiar = () => {
        // reseteo todo a cero como si recien entrara a la pantalla
        setFiltros(FILTROS_INICIALES)
        setResultado(null)
        setError('')
        setPage(1)
    }

    const handleOrdenar = (campo) => {
        // logica clasica de tabla: si toco el mismo campo invierto el orden, si toco uno nuevo empiezo en asc
        const newOrder = sortBy === campo && order === 'asc' ? 'desc' : 'asc'
        setSortBy(campo)
        setOrder(newOrder)
        // si ya habia resultados mostrandose, refetcheo automaticamente la pagina 1 con el nuevo orden
        if (resultado) buscar(1)
    }

    const handleReservaExitosa = (cantidad) => {
        setVerCarrito(false)
        setCarrito([])
        setSuccessMsg(`Se reservaron ${cantidad} turnos correctamente.`)
        buscar(page)
    }

    const toggleCarrito = (turno) => {
        // funcion para agregar o sacar un turno del carrito
        setCarrito(prev => {
            // como el backend a veces no me manda un id unico de slot, armo una clave compuesta (medico + dia + hora) para saber si ya esta
            const isEnCarrito = prev.some(t => t.matricula === turno.matricula && t.fecha === turno.fecha && t.hora === turno.hora)
            if (isEnCarrito) {
                // si ya estaba en el carrito, lo filtro (lo elimino)
                return prev.filter(t => !(t.matricula === turno.matricula && t.fecha === turno.fecha && t.hora === turno.hora))
            } else {
                // si no estaba, lo meto al array conservando lo que ya habia
                return [...prev, turno]
            }
        })
    }

    return (
        <div className="flex flex-col gap-6">
            <FiltrosTurnos
                filtros={filtros}
                onChange={setFiltros}
                onBuscar={() => {
                    setSuccessMsg('')
                    buscar(1)
                }}
                onLimpiar={handleLimpiar}
                loading={loading}
            />

            {successMsg && (
                <div className="text-sm text-success-700 bg-success-50 p-3 rounded-medium border border-success-200">
                    {successMsg}
                </div>
            )}

            {error && (
                <div className="flex items-center gap-2 text-sm text-danger-700 bg-danger-50 p-3 rounded-medium border border-danger-200">
                    <AlertCircle size={16} className="shrink-0" />
                    {error}
                </div>
            )}

            {carrito.length > 0 && (
                <motion.div 
                    initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                    className="sticky top-4 z-40 bg-white/90 backdrop-blur-md shadow-lg border border-sky-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4"
                >
                    <div>
                        <p className="font-bold text-sky-900">Carrito de Preselección</p>
                        <p className="text-sm text-slate-600">Tienes <b>{carrito.length}</b> turnos seleccionados para reservar.</p>
                    </div>
                    <Button 
                        color="primary" 
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold w-full sm:w-auto shadow-sm"
                        onPress={() => setVerCarrito(true)}
                    >
                        Ver y Confirmar ({carrito.length})
                    </Button>
                </motion.div>
            )}

            <AnimatePresence mode="wait">
                {loading && (
                    <motion.div key="loading" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="flex justify-center py-12">
                        <Spinner size="lg" />
                    </motion.div>
                )}

                {!loading && resultado && (
                    <motion.div key="results" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="flex flex-col gap-4">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 !bg-sky-200/90 backdrop-blur-md py-1.5 px-3 border !border-sky-300 rounded-2xl shadow-sm w-full">
                            <p className="text-sm text-default-500 font-medium ml-1">
                                {resultado.meta?.totalItems ?? 0} turnos disponibles
                            </p>
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="text-xs text-default-500 mr-1">Ordenar por:</span>
                                <Button
                                    size="sm"
                                    onPress={() => handleOrdenar('fecha')}
                                    startContent={<ArrowUpDown size={14} />}
                                    className={sortBy === 'fecha' ? "border !border-sky-300 !bg-sky-200/90 hover:!bg-sky-300 !text-sky-900 shadow-sm font-bold" : "border-default-200 text-default-500"}
                                    variant={sortBy === 'fecha' ? "solid" : "bordered"}
                                >
                                    Fecha {sortBy === 'fecha' ? (order === 'asc' ? '↑' : '↓') : ''}
                                </Button>
                                <Button
                                    size="sm"
                                    onPress={() => handleOrdenar('costo')}
                                    startContent={<ArrowUpDown size={14} />}
                                    className={sortBy === 'costo' ? "border !border-sky-300 !bg-sky-200/90 hover:!bg-sky-300 !text-sky-900 shadow-sm font-bold" : "border-default-200 text-default-500"}
                                    variant={sortBy === 'costo' ? "solid" : "bordered"}
                                >
                                    Costo {sortBy === 'costo' ? (order === 'asc' ? '↑' : '↓') : ''}
                                </Button>
                            </div>
                        </div>

                        {resultado.data?.length === 0 ? (
                            <div className="text-center py-12 text-default-500 text-sm bg-content1 rounded-2xl border border-divider">
                                No se encontraron turnos disponibles con los filtros aplicados.
                            </div>
                        ) : (
                            <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                <AnimatePresence>
                                {resultado.data.map((turno, i) => {
                                    const enCarrito = carrito.some(t => t.matricula === turno.matricula && t.fecha === turno.fecha && t.hora === turno.hora)
                                    return (
                                        <motion.div key={turno.id || `${turno.matricula}-${turno.fecha}-${turno.hora}`} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.2 }}>
                                            <TurnoCard turno={turno} enCarrito={enCarrito} onToggleCarrito={toggleCarrito} />
                                        </motion.div>
                                    )
                                })}
                                </AnimatePresence>
                            </motion.div>
                        )}

                        <Paginacion
                            meta={resultado.meta}
                            onChangePage={(p) => buscar(p)}
                        />
                    </motion.div>
                )}

                {!loading && !resultado && (
                    <motion.div key="empty" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="text-center py-16 text-default-500 text-sm bg-content1 rounded-2xl border border-divider">
                        Aplica los filtros y presioná <span className="font-medium text-foreground">Buscar</span> para ver la cartilla de turnos.
                    </motion.div>
                )}
            </AnimatePresence>

            {verCarrito && (
                <ModalCarritoTurnos
                    turnos={carrito}
                    onClose={() => setVerCarrito(false)}
                    onSuccess={handleReservaExitosa}
                    onRemove={toggleCarrito}
                />
            )}
        </div>
    )
}