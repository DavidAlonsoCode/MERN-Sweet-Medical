import MaestrosRepository from "../repositories/maestros.repository.js";

class MaestrosService {
    constructor({ maestrosRepository = MaestrosRepository.instance() } = {}) {
        this.maestrosRepository = maestrosRepository;
    }

    getEspecialidades(page, limit) {
        return this.maestrosRepository.getAllEspecialidades(page, limit);
    }

    getPracticas(page, limit) {
        return this.maestrosRepository.getAllPracticas(page, limit);
    }

    getSedes(page, limit) {
        return this.maestrosRepository.getAllSedes(page, limit);
    }

    getObrasSociales(page, limit) {
        return this.maestrosRepository.getAllObrasSociales(page, limit);
    }

    static instance() {
        this._instance ||= new this();
        return this._instance;
    }
}

export default MaestrosService;