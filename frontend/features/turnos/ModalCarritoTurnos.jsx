import { Calendar, Clock, User, MapPin, Trash2 } from 'lucide-react'
import { useState } from 'react'
import api from '@/lib/api'
import { useAuth } from '@/lib/AuthContext'
import { Button } from '@heroui/react'

export default function ModalCarritoTurnos({ turnos, onClose, onSuccess, onRemove }) {
    const { user } = useAuth()  // uso el hook de autenticacion para sacar el dni del paciente logueado
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [successCount, setSuccessCount] = useState(0)  // cuento cuantos turnos se reservaron bien para mostrar el mensaje
    const [processing, setProcessing] = useState(false)  // estado especifico para deshabilitar botones de borrado mientras se esta procesando el pago/reserva

    if (!turnos || turnos.length === 0) return null

    // funcion helper: el backend pide la hora en formato 24hs (HH:mm) pero yo la tengo en formato 12hs (hh:mm a.m.)
    const convertirHora24 = (horaTexto) => {
        let hora = horaTexto.trim();
        const esPM = hora.includes('p. m.');
        const esAM = hora.includes('a. m.');
        hora = hora.replace(' a. m.', '').replace(' p. m.', '');
        let [h, m] = hora.split(':').map(Number);
        if (esPM && h !== 12) h += 12;
        if (esAM && h === 12) h = 0;
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    };

    const handleConfirmarTodos = async () => {
        setLoading(true)
        setError('')
        setProcessing(true)
        
        let confirmados = 0;
        let errores = [];

        // recorro el array de turnos del carrito y le pego al backend uno por uno (no hay endpoint bulk)
        for (const turno of turnos) {
            const [dia, mes, anio] = turno.fecha.split('/');
            const fechaBackend = `${dia.padStart(2, '0')}-${mes.padStart(2, '0')}-${anio}`;
            const horaBackend = convertirHora24(turno.hora);

            try {
                await api.post('/turnos', {
                    pacienteDni: user.identificador,
                    medicoMatricula: turno.matricula,
                    sede: turno.sedeId,
                    especialidad: turno.especialidadId,
                    fecha: fechaBackend,
                    hora: horaBackend
                });
                confirmados++;  // si pasa sin tirar excepcion, lo cuento como un exito
            } catch (err) {
                // si tira excepcion, meto el error a un array para mostrarle un resumen al final
                errores.push(`Error en turno con Dr/a. ${turno.medico}: ${err.response?.data?.error || 'No se pudo reservar'}`);
            }
        }

        setSuccessCount(confirmados);
        setProcessing(false);
        setLoading(false);

        if (errores.length === 0) {
            onSuccess(confirmados);
        } else {
            setError(`Se reservaron ${confirmados} turnos. Hubo errores en ${errores.length} turnos:\n` + errores.join('\n'));
            // Remove confirmed from cart, but let the parent handle it or we just close after showing error
        }
    }

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl p-6 shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                <div className="flex items-center justify-between mb-4 border-b pb-3">
                    <h2 className="text-xl font-bold text-slate-800">
                        Resumen de Preselección
                    </h2>
                    <span className="bg-sky-100 text-sky-800 px-3 py-1 rounded-full text-sm font-semibold">
                        {turnos.length} turnos
                    </span>
                </div>

                <div className="flex-1 overflow-y-auto pr-2 space-y-3 mb-6">
                    {turnos.map((turno, i) => (
                        <div key={i} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-sky-50/50 border border-sky-100 rounded-xl gap-4">
                            <div className="space-y-1 text-sm text-slate-700">
                                <p className="font-semibold text-slate-900 text-base">Dr/a. {turno.medico}</p>
                                <p className="flex items-center gap-1.5"><Calendar size={14} className="text-sky-600"/> {turno.fecha} <Clock size={14} className="text-sky-600 ml-2"/> {turno.hora}</p>
                                <p className="flex items-center gap-1.5"><MapPin size={14} className="text-sky-600"/> {turno.sede}</p>
                            </div>
                            <div className="flex items-center justify-between w-full sm:w-auto gap-4">
                                <div className="text-right">
                                    <p className="text-xs text-slate-500">A abonar</p>
                                    <p className="font-bold text-emerald-600">{turno.costoEstimado != null ? `$${Number(turno.costoEstimado).toLocaleString('es-AR')}` : '-'}</p>
                                </div>
                                <Button
                                    isIconOnly
                                    size="sm"
                                    color="danger"
                                    variant="flat"
                                    aria-label="Eliminar turno del carrito"
                                    onPress={() => onRemove(turno)}
                                    disabled={loading || processing}
                                >
                                    <Trash2 size={16} />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>

                {error && (
                    <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-700 border border-red-200 text-sm whitespace-pre-line">
                        {error}
                    </div>
                )}

                {successCount > 0 && !error && processing === false && (
                    <div className="mb-4 p-3 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-sm font-medium">
                        ¡Se reservaron {successCount} turnos exitosamente!
                    </div>
                )}

                <div className="flex justify-end gap-3 pt-3 border-t mt-auto">
                    <Button
                        variant="flat"
                        color="default"
                        onPress={onClose}
                        disabled={loading}
                    >
                        {successCount > 0 ? 'Cerrar' : 'Seguir buscando'}
                    </Button>

                    {successCount !== turnos.length && (
                        <Button
                            color="primary"
                            onPress={handleConfirmarTodos}
                            isLoading={loading}
                            className="bg-sky-600 hover:bg-sky-700 font-medium shadow-sm text-white"
                        >
                            {loading ? 'Procesando...' : 'Confirmar Reservas'}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    )
}
