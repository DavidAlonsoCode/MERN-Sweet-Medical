import EspecialidadModel from "../models/especialidad.model.js";
import PracticaModel from "../models/practica.model.js";
import SedeModel from "../models/sede.model.js";
import ObraSocialModel from "../models/obraSocial.model.js";

class MaestrosRepository {

    // Helper para no repetir la lógica de paginación en cada maestro
    async _paginarModelo(Modelo, page, limit) {
        const skip = (page - 1) * limit;

        const [data, totalItems] = await Promise.all([
            Modelo.find().skip(skip).limit(limit),
            Modelo.countDocuments()
        ]);

        return {
            data,
            meta: {
                totalItems,
                itemsPerPage: Number(limit),
                currentPage: Number(page),
                totalPages: Math.ceil(totalItems / limit)
            }
        };
    }

    async getAllEspecialidades(page = 1, limit = 10) {
        return await this._paginarModelo(EspecialidadModel, page, limit);
    }

    async getAllPracticas(page = 1, limit = 10) {
        return await this._paginarModelo(PracticaModel, page, limit);
    }

    async getAllSedes(page = 1, limit = 10) {
        return await this._paginarModelo(SedeModel, page, limit);
    }

    async getAllObrasSociales(page = 1, limit = 10) {
        return await this._paginarModelo(ObraSocialModel, page, limit);
    }

    static instance() {
        this._instance ||= new this();
        return this._instance;
    }
}

export default MaestrosRepository;