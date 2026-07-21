import TurnoService from "../services/turno.service.js";
import {
  AccessDeniedByIDTurno,
  AccessDeniedByIDPaciente,
  Unauthorized,
  AccessDeniedByIDMedico
} from "../errors/auth.errors.js";
import { TurnoMissingFieldsError} from "../errors/turno.errors.js";

class TurnoController {
    constructor({ turnoService = TurnoService.instance() } = {}) {
        this.turnoService = turnoService;
    }

    createTurno(req, res, next) {
        // Validamos que si el usuario logueado es un PACIENTE, el DNI enviado en el body coincida con el suyo
        if (req.user?.rol === "PACIENTE" && req.body.pacienteDni !== req.user.identificador) {
          return next(new Unauthorized());
        }
        if (req.user?.rol === "MEDICO" && req.body.medicoMatricula !== req.user.identificador) {
          return next(new Unauthorized());
        }

        return this.turnoService
            .createTurno(req.body)
            .then((id) => res.status(201).json({ id }))
            .catch(next);
    }

    getAllTurnos(req, res, next) {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;

        // Separamos page y limit del resto de los filtros
        const { page: p, limit: l, ...filtros } = req.query;

        // Si es medico, obligamos a que solo traiga su propia info
        /*if(req.user?.rol === "MEDICO"){
          if (filtros.medicoMatricula !== req.user.identificador) {
            return next(new AccessDeniedByIDTurno(filtros.medicoMatricula));
          }
          // Forzamos el filtro con su identidad
          filtros.medicoMatricula = req.user.identificador;
        }
        // Si es paciente, obligamos a que solo traiga su propia info
        if(req.user?.rol === "PACIENTE"){
          if (filtros.pacienteDni !== req.user.identificador) {
            return next(new AccessDeniedByIDTurno(filtros.pacienteDni));
          }
          // Forzamos el filtro con su identidad
          filtros.pacienteDni = req.user.identificador;
        }*/

        return this.turnoService
            .getTurnos(page, limit, filtros)
            .then((turnos) => res.status(200).json(turnos))
            .catch(next);
    }

    getTurnoById(req, res, next) {
        return this.turnoService
            .getTurnoById(req.params.id)
            .then((turno) => {
              // Si es paciente, validamos que el turno le pertenezca
              if (req.user?.rol === "PACIENTE" && turno.pacienteDni !== req.user.identificador) {
                throw new AccessDeniedByIDTurno(req.params.id);
              }
              // Si es medico, validamos que el turno le pertenezca
              if (req.user?.rol === "MEDICO" && turno.medicoMatricula !== req.user.identificador) {
                throw new AccessDeniedByIDTurno(req.params.id);
              }
              // Si pasa las validaciones, se devuelve el turno
              res.status(200).json(turno)
            })
            .catch(next);
    }

    cancelTurno(req, res, next) {
        return this.turnoService
            .getTurnoById(req.params.id)
            .then((turno) => {
              // Si es paciente, validamos que el turno le pertenezca
              if (req.user?.rol === "PACIENTE" && turno.pacienteDni !== req.user.identificador) {
                throw new AccessDeniedByIDTurno(req.params.id);
              }
              // Si es medico, validamos que el turno le pertenezca
              if (req.user?.rol === "MEDICO" && turno.medicoMatricula !== req.user.identificador) {
                throw new AccessDeniedByIDTurno(req.params.id);
              }
              // si esta ok, devolvemos el id del turno
              return this.turnoService.cancelTurno(req.params.id);
            })
            .then(() => res.status(200).json({ message: `Turno con ID ${req.params.id} cancelado exitosamente.` }))
            .catch(next);
    }
    /*
    markTurnoAsRealizado(req, res, next) {
        const { id } = req.params;

        return this.turnoService
            .marcarTurnoComoRealizado(id)
            .then((idActualizado) => {
                res.status(200).json({
                    message: `El turno con ID ${idActualizado} ha sido marcado como REALIZADO correctamente.`,
                });
            })
            .catch(next);
    }
    */
    cambiarHorarioTurno(req, res, next) {
        const { id } = req.params;
        const { fecha, hora } = req.body;

        return this.turnoService
            .cambiarHorarioTurno(id, fecha, hora)
            .then((idActualizado) => {
                res.status(200).json({
                    message: `El horario del turno con ID ${idActualizado} ha sido modificado exitosamente.`,
                });
            })
            .catch(next);
    }

    getTurnosDisponibles(req, res, next) {
        return this.turnoService
            .buscarTurnosDisponibles(req.query)
            .then((turnos) => res.status(200).json(turnos))
            .catch(next);
    }

    updateTurno(req, res, next) {
        const { id } = req.params;
        const { estado, fecha, hora, rol } = req.body;

        return this.turnoService
            .getTurnoById(id)
            .then((turno) => {

                // Un paciente/medico solo puede modificar su propio turno
                if (req.user?.rol === "PACIENTE" && turno.pacienteDni !== req.user.identificador) {
                    throw new AccessDeniedByIDTurno(id);
                }
                if (req.user?.rol === "MEDICO" && turno.medicoMatricula !== req.user.identificador) {
                  throw new AccessDeniedByIDTurno(id);
                }

                // Si mandan estado CONFIRMADO
                if (estado === "CONFIRMADO") {
                    return this.turnoService
                        .confirmarTurno(id)
                        .then((idActualizado) => ({ message: `Turno ${idActualizado} confirmado exitosamente.` }))
                }

                // Si mandan estado REALIZADO
                if (estado === "REALIZADO") {
                    return this.turnoService
                        .marcarTurnoComoRealizado(id)
                        .then((idActualizado) => ({ message: `Turno ${idActualizado} marcado como REALIZADO.` }))
                }

                // Si mandan fecha y hora (Reprogramación)
                if (fecha && hora) {
                    return this.turnoService
                        .cambiarHorarioTurno(id, fecha, hora, req.user?.rol)
                        .then((idActualizado) => ({ message: `Horario del turno ${idActualizado} modificado exitosamente.` }))
                }

                throw new TurnoMissingFieldsError(req.body);
            })
            .then((responseBody) => { res.status(200).json(responseBody); })
            .catch(next);
    }

    static instance() {
        this._instance ||= new this();
        return this._instance;
    }
}

export default TurnoController;
