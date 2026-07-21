import PacienteModel from '../models/paciente.model.js';
import ObraSocialModel from '../models/obraSocial.model.js';

class PacienteRepository {
    constructor() { }

    async getAllPacientes(filtros = {}, page = 1, limit = 10) {
        const skip = (page - 1) * limit;

        const query = { deleted: false };

        for (const [key, value] of Object.entries(filtros)) {
            if (key === 'page' || key === 'limit' || value === undefined || value === '') continue;

            switch (key) {
                case 'nombre':
                    query.nombre = { $regex: value, $options: 'i' };
                    break;

                case 'obraSocial':
                    query['obraSocial.id'] = value;
                    break;

                case 'dni':
                case 'usuario':
                case 'plan':
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
            PacienteModel.find(query).skip(skip).limit(limit),
            PacienteModel.countDocuments(query)
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

    async getPacienteByDni(dni) {
        return await PacienteModel.findOne({ dni, deleted: false });
    }

    async createPaciente(pacienteData) {
        let datosFinales = { ...pacienteData };

        // Si viene obra social, buscamos su info para guardarla desnormalizada
        if (pacienteData.obraSocial) {
            const osDoc = await ObraSocialModel.findById(pacienteData.obraSocial);
            if (osDoc) {
                datosFinales.obraSocial = {
                    id: osDoc._id,
                    nombre: osDoc.nombre
                };
            } else {
                delete datosFinales.obraSocial; // Para no guardar basura
            }
        }

        // Hacemos un upsert: Busca por DNI.
        // Si existe (incluso borrado), lo actualiza y lo vuelve a "activar" (deleted: false).
        // Si no existe, lo crea desde cero.
        const pacienteGuardado = await PacienteModel.findOneAndUpdate(
            { dni: pacienteData.dni },
            { $set: { ...datosFinales, deleted: false } },
            { returnDocument: 'after', upsert: true, runValidators: true }
        );

        return pacienteGuardado;
    }

    async updatePacienteByDni(dni, pacienteUpdateData) {
        let datosFinales = { ...pacienteUpdateData };

        // Solo buscamos en la BD si la obraSocial es un String (el ID nuevo enviado por el usuario).
        // Si es un objeto, significa que el service nos pasó la obra social que ya tenía y no hay que tocarla.
        if (pacienteUpdateData.obraSocial && typeof pacienteUpdateData.obraSocial === 'string') {
            const osDoc = await ObraSocialModel.findById(pacienteUpdateData.obraSocial);
            if (osDoc) {
                datosFinales.obraSocial = {
                    id: osDoc._id,
                    nombre: osDoc.nombre
                };
            }
        }

        return await PacienteModel.findOneAndUpdate(
            { dni, deleted: false },
            datosFinales,
            { returnDocument: 'after' }
        );
    }

    async deletePacienteByDni(dni) {
        // Borrado logico: Actualizamos el flag
        return await PacienteModel.findOneAndUpdate(
            { dni },
            { deleted: true },
            { returnDocument: 'after' }
        );
    }

    async getPacienteByUsuario(usuario) {
        return await PacienteModel.findOne({ usuario, deleted: false });
    }

    static instance() {
        this._instance ||= new this();
        return this._instance;
    }
}

export default PacienteRepository;