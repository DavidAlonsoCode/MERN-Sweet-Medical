import PacienteService from "../services/paciente.service.js";
import { Unauthorized, AccessDeniedByIDPaciente } from "../errors/auth.errors.js";

class PacienteController {
    constructor({ pacienteService = PacienteService.instance() } = {}) {
        this.pacienteService = pacienteService;
    }

    // Pasa los datos del nuevo paciente al servicio y responde con el ID creado.
    createPaciente(req, res, next) {
        return this.pacienteService
            .createPaciente(req.body) // Le pasa el JSON del body al servicio.
            .then((id) => res.status(201).json({ id })) // Si all va bien, responde 201 (Creado).
            .catch(next); // Si algo falla, se lo pasa al manejador de errores.
    }

    // Pide todos los pacientes al servicio y los devuelve como JSON.
    getPacientes(req, res, next) {
        const filtros = { ...req.query };
        // Sacamos los query params. Si no vienen, usamos 1 y 10 por defecto.
        const page = parseInt(req.query.page) || 1;  // tambien los hacemos Int, porque son Strings
        const limit = parseInt(req.query.limit) || 10;

      // Si no es paciente ni medico, no puede hacer nada
      if (req.user?.rol !== "PACIENTE" && req.user?.rol !== "MEDICO") {
        return next(new Unauthorized());
      }
      // Si es paciente, obligamos a que solo traiga su propia info
      if (req.user?.rol === "PACIENTE" && filtros.pacienteDni !== req.user.identificador) {
        return next(new AccessDeniedByIDPaciente(filtros.pacienteDni));
      }

        return this.pacienteService
            .getPacientes(page, limit) // Le pasamos los números al service
            .then((resultado) => {
                if (req.user?.rol === "MEDICO") {
                    if (resultado.data) {
                        resultado.data = resultado.data.map(p => ({ dni: p.dni, nombre: p.nombre, apellido: p.apellido }));
                    } else if (Array.isArray(resultado)) {
                        resultado = resultado.map(p => ({ dni: p.dni, nombre: p.nombre, apellido: p.apellido }));
                    }
                }
                return res.status(200).json(resultado);
            })
            .catch(next);
    }

    // Pide un paciente específico por DNI y lo devuelve.
    getPacienteByDni(req, res, next) {
        // Si no es paciente ni medico, no puede hacer nada
        if (req.user?.rol !== "PACIENTE" && req.user?.rol !== "MEDICO") {
          return next(new Unauthorized());
        }
        // Si es paciente, obligamos a que solo se traiga a si mismo
        if (req.user?.rol === "PACIENTE" && req.params.dni !== req.user.identificador) {
          return next(new AccessDeniedByIDPaciente(req.params.dni));
        }

        return this.pacienteService
            .getPacienteByDni(req.params.dni) // Saca el DNI de la URL (ej: /pacientes/35123456)
            .then((paciente) => {
                if (req.user?.rol === "MEDICO") {
                    return res.status(200).json({ dni: paciente.dni, nombre: paciente.nombre, apellido: paciente.apellido });
                }
                return res.status(200).json(paciente);
            })
            .catch(next);
    }

    // Pasa los datos de actualización al servicio.
    updatePacienteByDni(req, res, next) {
        // Si no es paciente, no puede hacer nada
        if (req.user?.rol !== "PACIENTE") {
          return next(new Unauthorized());
        }
        // Si es paciente, obligamos a que solo actualice su propia info
        if (req.user?.rol === "PACIENTE" && req.params.dni !== req.user.identificador) {
          return next(new AccessDeniedByIDPaciente(req.params.dni));
        }

        return this.pacienteService
            .updatePacienteByDni(req.params.dni, req.body)
            .then((paciente) => res.status(200).json(paciente))
            .catch(next);
    }

    // Le dice al servicio que elimine un paciente.
    deletePacienteByDni(req, res, next) {
        return this.pacienteService
            .deletePacienteByDni(req.params.dni)
            .then(() => res.status(204).send()) // 204 = "Todo ok, pero no te devuelvo nada".
            .catch(next);
    }

    static instance() {
        this._instance ||= new this();
        return this._instance;
    }
}

export default PacienteController;