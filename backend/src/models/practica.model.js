import mongoose from 'mongoose';

const practicaSchema = new mongoose.Schema({
  nombre: { type: String, required: true, unique: true },
  duracionMinutos: { type: Number, default: 30 },
  costo: { type: Number, default: 0 }
});

const PracticaModel = mongoose.model('Practica', practicaSchema);
export default PracticaModel;