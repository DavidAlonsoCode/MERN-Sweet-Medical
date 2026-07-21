import MaestrosService from "../services/maestros.service.js";

class MaestrosController {
    constructor({ maestrosService = MaestrosService.instance() } = {}) {
        this.maestrosService = maestrosService;
    }

    // Helper para extraer page y limit de forma limpia
    _getPaginationParams(req) {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        return { page, limit };
    }

    getEspecialidades(req, res, next) {
        const { page, limit } = this._getPaginationParams(req);

        return this.maestrosService
            .getEspecialidades(page, limit)
            .then((resultado) => res.status(200).json(resultado))
            .catch(next);
    }

    getPracticas(req, res, next) {
        const { page, limit } = this._getPaginationParams(req);

        return this.maestrosService
            .getPracticas(page, limit)
            .then((resultado) => res.status(200).json(resultado))
            .catch(next);
    }

    getSedes(req, res, next) {
        const { page, limit } = this._getPaginationParams(req);

        return this.maestrosService
            .getSedes(page, limit)
            .then((resultado) => res.status(200).json(resultado))
            .catch(next);
    }

    getObrasSociales(req, res, next) {
        const { page, limit } = this._getPaginationParams(req);

        return this.maestrosService
            .getObrasSociales(page, limit)
            .then((resultado) => res.status(200).json(resultado))
            .catch(next);
    }

    static instance() {
        this._instance ||= new this();
        return this._instance;
    }
}

export default MaestrosController;