import { Calendar, Clock, User, MapPin } from 'lucide-react'
import { useState } from 'react'
import api from '@/lib/api'
import { useAuth } from '@/lib/AuthContext'

export default function ModalConfirmarTurno({ turno, onClose, onSuccess }) {
    const { user } = useAuth()  // necesito el dni del usuario para la peticion de reserva
    const [loading, setLoading] = useState(false)  // para poner en gris el boton mientras espero a la bd
    const [error, setError] = useState('')

    if (!turno) return null

    const [dia, mes, anio] = turno.fecha.split('/');

const fechaBackend =
    `${dia.padStart(2, '0')}-${mes.padStart(2, '0')}-${anio}`;

    // convierto la hora de 12hs a 24hs porque el backend me lo pide asi
    const convertirHora24 = (horaTexto) => {
        let hora = horaTexto.trim();

        const esPM = hora.includes('p. m.');
        const esAM = hora.includes('a. m.');

        hora = hora
            .replace(' a. m.', '')
            .replace(' p. m.', '');

        let [h, m] = hora.split(':').map(Number);

        if (esPM && h !== 12) h += 12;
        if (esAM && h === 12) h = 0;

        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    };

    const horaBackend = convertirHora24(turno.hora);

    console.log("fechaBackend:", fechaBackend);
    console.log("horaBackend:", horaBackend);

    const handleConfirmar = async () => {
        setLoading(true)
        setError('')

        const payload = {
            pacienteDni: user.identificador,
            medicoMatricula: turno.matricula,
            sede: turno.sedeId,
            fecha: fechaBackend,
            hora: horaBackend
        };

        // me fijo si es una practica o una especialidad para mandar el id correcto
        if (turno.practicaId) {
            payload.practica = turno.practicaId;
        } else if (turno.especialidadId) {
            payload.especialidad = turno.especialidadId;
        }

        try {
            await api.post('/turnos', payload)  // aca efectivizo la reserva
            onSuccess()  // le aviso al componente padre que salio bien para que cierre el modal y recargue la lista
        } catch (err) {
            const msg =
                err.response?.data?.error ||
                err.response?.data?.message ||
                'No se pudo reservar el turno.'

            setError(msg)
        } finally {
            setLoading(false)  // apago el loader
        }
    }

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-xl p-6 shadow-xl w-full max-w-md">
                <h2 className="text-lg font-bold mb-4">
                    Confirmar reserva
                </h2>

                <div className="space-y-2 mb-6">
                    <p><b>Médico:</b> {turno.medico}</p>
                    <p><b>Fecha:</b> {turno.fecha}</p>
                    <p><b>Hora:</b> {turno.hora}</p>
                    <p><b>Sede:</b> {turno.sede}</p>
                </div>

                {error && (
                    <div className="mb-4 p-3 rounded bg-red-100 text-red-700">
                        {error}
                    </div>
                )}

                <div className="flex justify-end gap-2">
                    <button
                        className="px-4 py-2 border rounded"
                        onClick={onClose}
                        disabled={loading}
                    >
                        Cancelar
                    </button>

                    <button
                        className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
                        onClick={handleConfirmar}
                        disabled={loading}
                    >
                        {loading ? 'Reservando...' : 'Confirmar'}
                    </button>
                </div>
            </div>
        </div>
    )
}