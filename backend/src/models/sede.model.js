import mongoose from 'mongoose';

const sedeSchema = new mongoose.Schema({
    nombre: { type: String, required: true, unique: true },
    barrio: String
});

const SedeModel = mongoose.model('Sede', sedeSchema);
export default SedeModel;