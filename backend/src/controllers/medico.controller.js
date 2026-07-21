import MedicoService from "../services/medico.service.js";
import { Unauthorized, AccessDeniedByIDMedico } from "../errors/auth.errors.js";

class MedicoController {
  constructor({ medicoService = MedicoService.instance() } = {}) {
    this.medicoService = medicoService;
  }

  createMedico(req, res, next) {
    return this.medicoService
      .createMedico(req.body)
      .then((id) => res.status(201).json({ id }))
      .catch(next);
  }

  getMedicos(req, res, next) {
    const filtros = { ...req.query };

    return this.medicoService
      .getMedicos(filtros) //Especialidad(str), Práctica(str)
      .then((medicos) => res.status(200).json(medicos))
      .catch(next);
  }

  getMedicoByMatricula(req, res, next) {
    // Si no es medico, no puede hacer nada
    if (req.user?.rol !== "MEDICO") {
      return next(new Unauthorized());
    }
    // Si es medico, obligamos a que solo traiga su propia info
    if (req.user?.rol === "MEDICO" && req.params.matricula !== req.user.identificador) {
      return next(new AccessDeniedByIDMedico(req.params.matricula));
    }

    return this.medicoService
      .getMedicoByMatricula(req.params.matricula)
      .then((medico) => res.status(200).json(medico))
      .catch(next);
  }

  updateMedicoByMatricula(req, res, next) {
    // Si no es medico, no puede hacer nada
    if (req.user?.rol !== "MEDICO") {
      return next(new Unauthorized());
    }
    // Si es medico, obligamos a que solo modifique su propia info
    if (req.user?.rol === "MEDICO" && req.params.matricula !== req.user.identificador) {
      return next(new AccessDeniedByIDMedico(req.params.matricula));
    }

    return this.medicoService
      .updateMedicoByMatricula(req.params.matricula, req.body)
      .then((medico) => res.status(200).json(medico))
      .catch(next);
  }

  deleteMedicoByMatricula(req, res, next) {
    return this.medicoService
      .deleteMedicoByMatricula(req.params.matricula)
      .then(() => res.status(204).send())
      .catch(next);
  }


  getDisponibilidades(req, res, next) {
    return this.medicoService.getDisponibilidadesByMatricula(req.params.matricula)
      .then((disponibilidades) => res.status(200).json(disponibilidades))
      .catch(next);
  }

  addDisponibilidad(req, res, next) {
    // Si no es medico, no puede hacer nada
    if (req.user?.rol !== "MEDICO") {
      return next(new Unauthorized());
    }
    // Si es medico, obligamos a que solo modifique su propia disponibilidad
    if (req.user?.rol === "MEDICO" && req.params.matricula !== req.user.identificador) {
      return next(new AccessDeniedByIDMedico(req.params.matricula));
    }

    return this.medicoService.addDisponibilidadToMedico(req.params.matricula, req.body)
        .then((nuevaDisp) => {
            // Devuelvo un 201 (Creado) con el objeto que mandó el service
            res.status(201).json({
                message: "Disponibilidad agregada correctamente",
                disponibilidad: nuevaDisp
            });
        })
        .catch(next);
  }

  updateDisponibilidad(req, res, next) {
    // Si no es medico, no puede hacer nada
    if (req.user?.rol !== "MEDICO") {
      return next(new Unauthorized());
    }
    // Si es medico, obligamos a que solo actualice su propia disponibilidad
    if (req.user?.rol === "MEDICO" && req.params.matricula !== req.user.identificador) {
      return next(new AccessDeniedByIDMedico(req.params.matricula));
    }

    return this.medicoService.updateDisponibilidad(req.params.matricula, req.params.idDisp, req.body)
      .then(() => res.status(204).send())
      .catch(next);
  }

  deleteDisponibilidad(req, res, next) {
    // Si no es medico, no puede hacer nada
    if (req.user?.rol !== "MEDICO") {
      return next(new Unauthorized());
    }
    // Si es medico, obligamos a que solo elimine su propia disponibilidad
    if (req.user?.rol === "MEDICO" && req.params.matricula !== req.user.identificador) {
      return next(new AccessDeniedByIDMedico(req.params.matricula));
    }

    return this.medicoService.deleteDisponibilidad(req.params.matricula, req.params.idDisp)
      .then(() => res.status(204).send())
      .catch(next);
  }

  addServicio(req, res, next) {
    const { matricula } = req.params;

    // Si no es medico, no puede hacer nada
    if (req.user?.rol !== "MEDICO") {
      return next(new Unauthorized());
    }
    // Si es medico, obligamos a que solo pueda agregar servicios a si mismo
    if (req.user?.rol === "MEDICO" && matricula !== req.user.identificador) {
      return next(new AccessDeniedByIDMedico(matricula));
    }

    // req.body trae: { tipo, nombre, duracionMinutos }
    return this.medicoService.addServicioToMedico(matricula, req.body)
      .then((id) => res.status(201).json({ id }))
      .catch(next);
  }

  updateServicio(req, res, next) {
    const { matricula, idServicio } = req.params;

    // Si no es medico, no puede hacer nada
    if (req.user?.rol !== "MEDICO") {
      return next(new Unauthorized());
    }
    // Si es medico, obligamos a que solo pueda actualizar servicios a si mismo
    if (req.user?.rol === "MEDICO" && matricula !== req.user.identificador) {
      return next(new AccessDeniedByIDMedico(matricula));
    }

    return this.medicoService.updateServicioMedico(matricula, idServicio, req.body)
      .then(() => res.status(204).send())
      .catch(next);
  }

  deleteServicio(req, res, next) {
    const { matricula, idServicio } = req.params;
    const { tipo } = req.query;

    // Si no es medico, no puede hacer nada
    if (req.user?.rol !== "MEDICO") {
      return next(new Unauthorized());
    }
    // Si es medico, obligamos a que solo pueda eliminar servicios a si mismo
    if (req.user?.rol === "MEDICO" && matricula !== req.user.identificador) {
      return next(new AccessDeniedByIDMedico(matricula));
    }

    return this.medicoService.deleteServicioMedico(matricula, idServicio, tipo)
      .then(() => res.status(204).send())
      .catch(next);
  }

  static instance() {
    this._instance ||= new this();
    return this._instance;
  }
}

export default MedicoController;
