import mongoose from 'mongoose';

const turnoSchema = new mongoose.Schema({
    pacienteDni: { type: String, required: true },
    medicoMatricula: { type: String, required: true },

    practica: {
        _id: false,
        id: { type: mongoose.Schema.Types.ObjectId, ref: 'Practica' },
        nombre: String
    },

    especialidad: {
        _id: false,
        id: { type: mongoose.Schema.Types.ObjectId, ref: 'Especialidad' },
        nombre: { type: String }
    },

    sede: {
        _id: false,
        id: { type: mongoose.Schema.Types.ObjectId, ref: 'Sede', required: true },
        nombre: { type: String, required: true }
    },

    fechaHora: { type: Date, required: true },
    estado: {
        type: String,
        enum: ['RESERVADO', 'CONFIRMADO', 'CANCELADO', 'REALIZADO'],
        default: 'RESERVADO'
    }
}, { timestamps: true });
turnoSchema.index(
    { medicoMatricula: 1, fechaHora: 1 },
    {
        unique: true,
        // Solo aplica la restricción si el turno está activo.
        // Permite tener múltiples turnos "CANCELADOS" en el mismo horario.
        partialFilterExpression: { estado: { $in: ['RESERVADO', 'CONFIRMADO', 'REALIZADO'] } },
        name: 'prevenir_doble_booking'
    }
);

const TurnoModel = mongoose.model('Turno', turnoSchema);
export default TurnoModel;