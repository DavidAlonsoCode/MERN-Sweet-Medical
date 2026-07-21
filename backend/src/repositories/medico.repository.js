import mongoose from 'mongoose';
import MedicoModel from '../models/medico.model.js';
import EspecialidadModel from '../models/especialidad.model.js';
import PracticaModel from '../models/practica.model.js';
import SedeModel from '../models/sede.model.js';
import { FiltroInvalidoError } from '../errors/medico.errors.js'; // Ajustá la ruta

class MedicoRepository {
  constructor() { }

  async getAllMedicos(filtros = {}, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const query = { deleted: false };

    for (const [key, value] of Object.entries(filtros)) {
      if (key === 'page' || key === 'limit' || value === undefined || value === '') continue;

      switch (key) {
        case 'nombre':
          query.nombre = { $regex: value, $options: 'i' };
          break;

        case 'especialidad':
          query['especialidades.id'] = value;
          break;
        case 'practica':
          query['practicas.id'] = value;
          break;
        case 'sede':
          query['sedes.id'] = value;
          break;

        case 'matricula':
        case 'usuario':
        case '_id':
          query[key] = value;
          break;

        case 'deleted':
          query.deleted = value === 'true';
          break;

        default:
          query[key] = value;
          break;
      }
    }

    const [data, totalItems] = await Promise.all([
      MedicoModel.find(query).skip(skip).limit(limit),
      MedicoModel.countDocuments(query)
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

  async getMedicoByMatricula(matricula) {
    return await MedicoModel.findOne({ matricula, deleted: false });
  }

    async createMedico(medicoData) {
        const [espDocs, pracDocs, sedeDocs] = await Promise.all([
            EspecialidadModel.find({ _id: { $in: medicoData.especialidades } }),
            PracticaModel.find({ _id: { $in: medicoData.practicas } }),
            SedeModel.find({ _id: { $in: medicoData.sedes } })
        ]);

        const datosFinales = {
            ...medicoData,
            especialidades: espDocs.map(e => ({
                id: e._id,
                nombre: e.nombre,
                duracionMinutos: e.duracionMinutos,
                costo: e.costo
            })),
            practicas: pracDocs.map(p => ({
                id: p._id,
                nombre: p.nombre,
                duracionMinutos: p.duracionMinutos,
                costo: p.costo
            })),
            sedes: sedeDocs.map(s => ({ id: s._id, nombre: s.nombre }))
        };

        // Hacemos el upsert: si la matrícula existe (incluso borrada lógicamente),
        // lo actualiza y lo vuelve a "activar" (deleted: false). Si no, lo crea.
        const medicoGuardado = await MedicoModel.findOneAndUpdate(
            { matricula: medicoData.matricula },
            { $set: { ...datosFinales, deleted: false } },
            { returnDocument: 'after', upsert: true, runValidators: true }
        );

        return medicoGuardado;
    }

  async updateMedicoByMatricula(matricula, medicoUpdateData) {
    return await MedicoModel.findOneAndUpdate(
      { matricula, deleted: false },
      medicoUpdateData,
      { returnDocument: 'after' }
    );
  }

  async deleteMedicoByMatricula(matricula) {
    // Borrado lógico
    return await MedicoModel.findOneAndUpdate(
      { matricula },
      { deleted: true },
      { returnDocument: 'after' }
    );
  }

  async getServicioPorId(tipo, id) {
    const Modelo = tipo === "especialidad" ? EspecialidadModel : PracticaModel;
    return await Modelo.findById(id);
  }
  async getNombreServicio(tipo, id) {
    const Modelo = tipo === "especialidad" ? EspecialidadModel : PracticaModel;
    const doc = await Modelo.findById(id);
    if (!doc) return null;
    return doc.nombre;
  }

    async getMedicoByUsuario(usuario) {
        return await MedicoModel.findOne({ usuario, deleted: false });
    }

  static instance() {
    this._instance ||= new this();
    return this._instance;
  }


}

export default MedicoRepository;