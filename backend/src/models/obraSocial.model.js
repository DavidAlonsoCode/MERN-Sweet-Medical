import mongoose from 'mongoose';

const obraSocialSchema = new mongoose.Schema({
    nombre: { type: String, required: true, unique: true },
    planes: [String]
});

const ObraSocialModel = mongoose.model('ObraSocial', obraSocialSchema);
export default ObraSocialModel;