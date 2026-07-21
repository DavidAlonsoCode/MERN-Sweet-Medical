import mongoose from 'mongoose';

const pacienteSchema = new mongoose.Schema({
    usuario: { type: String, required: true },
    password: { type: String, required: true }, // <-- Agregado en texto plano
    dni: { type: String, required: true, unique: true },
    nombre: { type: String, required: true },
    obraSocial: {
        _id: false,
        id: { type: mongoose.Schema.Types.ObjectId, ref: 'ObraSocial' },
        nombre: String
    },
    plan: { type: String, required: true },
    deleted: { type: Boolean, default: false }
}, { timestamps: true });

const PacienteModel = mongoose.model('Paciente', pacienteSchema);
export default PacienteModel;