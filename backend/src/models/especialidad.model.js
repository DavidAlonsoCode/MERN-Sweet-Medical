import mongoose from 'mongoose';

const especialidadSchema = new mongoose.Schema({
    nombre: { type: String, required: true, unique: true },
    duracionMinutos: { type: Number, default: 30 },
    costo: { type: Number, default: 0 }
});

const EspecialidadModel = mongoose.model('Especialidad', especialidadSchema);
export default EspecialidadModel;