import mongoose from 'mongoose';

const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

const medicoSchema = new mongoose.Schema({
    usuario: { type: String, required: true },
    password: { type: String, required: true }, // <-- Agregado en texto plano
    matricula: { type: String, required: true, unique: true },
    nombre: { type: String, required: true },
    especialidades: [{
        _id: false,
        id: { type: mongoose.Schema.Types.ObjectId, ref: 'Especialidad' },
        nombre: String,
        duracionMinutos: Number,
        costo: Number
    }],
    practicas: [{
        _id: false,
        id: { type: mongoose.Schema.Types.ObjectId, ref: 'Practica' },
        nombre: String,
        duracionMinutos: Number,
        costo: Number
    }],
    sedes: [{
        _id: false,
        id: { type: mongoose.Schema.Types.ObjectId, ref: 'Sede' },
        nombre: String,
        duracionMinutos: Number,
        costo: Number
    }],
    disponibilidades: [{
        _id: false,
        id: String,
        dia: {
            type: String,
            enum: diasSemana,
            required: true
        },
        inicio: String,
        fin: String
    }],
    deleted: { type: Boolean, default: false }
}, { timestamps: true });

const MedicoModel = mongoose.model('Medico', medicoSchema);
export default MedicoModel;