import TurnoModel from '../models/turno.model.js';
import EspecialidadModel from '../models/especialidad.model.js';
import PracticaModel from '../models/practica.model.js';
import SedeModel from '../models/sede.model.js';

class TurnoRepository {
  constructor() { }

    async getAllTurnos(filtros = {}, page = 1, limit = 10) {
        const skip = (page - 1) * limit;
        const query = {};

        //  Manejo seguro del estado (excluir cancelados por defecto si no se especifica)
        if (filtros.estado) {
            if (filtros.estado !== 'TODOS') {
                query.estado = filtros.estado;
            }
        } else {
            query.estado = { $ne: 'CANCELADO' };
        }

        //  Control estricto del rango de fechas
        if (filtros.fechaDesde || filtros.fechaHasta) {
            query.fechaHora = {};
            if (filtros.fechaDesde) query.fechaHora.$gte = new Date(filtros.fechaDesde);
            if (filtros.fechaHasta) query.fechaHora.$lte = new Date(filtros.fechaHasta);
        }

        //  Mapeo seguro de campos relacionales del subdocumento desnormalizado
        if (filtros.practica) query['practica.id'] = filtros.practica;
        if (filtros.especialidad) query['especialidad.id'] = filtros.especialidad;
        if (filtros.sede) query['sede.id'] = filtros.sede;

        //  Mapeo de identificadores directos
        if (filtros.pacienteDni) query.pacienteDni = filtros.pacienteDni;
        if (filtros.medicoMatricula) query.medicoMatricula = filtros.medicoMatricula;
        if (filtros._id) query._id = filtros._id;

        //  Ejecución en paralelo con paginación limpia
        const [data, totalItems] = await Promise.all([
            TurnoModel.find(query).skip(skip).limit(limit),
            TurnoModel.countDocuments(query)
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

  async getTurnoById(id) {
    // Un turno cancelado no debería recuperarse por ID en flujo normal
    return await TurnoModel.findOne({ _id: id, estado: { $ne: 'CANCELADO' } });
  }

  async createTurno(turnoData) {
    const [espDoc, pracDoc, sedeDoc] = await Promise.all([
      turnoData.especialidad ? EspecialidadModel.findById(turnoData.especialidad) : null,
      turnoData.practica ? PracticaModel.findById(turnoData.practica) : null,
      SedeModel.findById(turnoData.sede)
    ]);

    if (!sedeDoc) throw new Error(`La sede con ID ${turnoData.sede} no existe.`);

    const datosFinales = {
      ...turnoData,
      especialidad: espDoc ? { id: espDoc._id, nombre: espDoc.nombre } : null,
      practica: pracDoc ? { id: pracDoc._id, nombre: pracDoc.nombre } : null,
      sede: { id: sedeDoc._id, nombre: sedeDoc.nombre }
    };

    const nuevoTurno = new TurnoModel(datosFinales);
    return await nuevoTurno.save();
  }

  async updateTurnoById(id, turnoUpdateData) {
    return await TurnoModel.findOneAndUpdate(
      { _id: id, estado: { $ne: 'CANCELADO' } },
      turnoUpdateData,
      { returnDocument: 'after' }
    );
  }

  async deleteTurnoById(id) {
    // Borrado lógico: solo cambiamos el estado
    return await TurnoModel.findOneAndUpdate(
      { _id: id },
      { estado: 'CANCELADO' },
      { returnDocument: 'after' }
    );
  }

  static instance() {
    this._instance ||= new this();
    return this._instance;
  }
}

export default TurnoRepository;