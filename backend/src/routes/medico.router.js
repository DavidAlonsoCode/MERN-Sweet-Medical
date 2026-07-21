import express from "express";

import MedicoController from "../controllers/medico.controller.js";
import TurnoController from "../controllers/turno.controller.js";
import {medicoSchema} from "../validators/medicoSchemas.js";
import {validateMedicoSchemaMiddleware} from "../middlewares/medico.schema.validator.middleware.js";
import {verifyUserToken} from "../middlewares/auth.middleware.js";

const medicoController = MedicoController.instance();
const turnoController = TurnoController.instance();

const router = express.Router();

// getMedicos no se verifica por ahora: debe ser publica para la busqueda de turnos
// createMedico no se verifica por ahora: debe ser privado para algun admin
router
  .route("/")
  .get((req, res, next) => medicoController.getMedicos(req, res, next))
  .post(validateMedicoSchemaMiddleware(medicoSchema), (req, res, next) =>
      medicoController.createMedico(req, res, next));

// deleteMedico no se verifica por ahora: debe ser privado para algun admin
router
  .route("/:matricula")
  .get(verifyUserToken, (req, res, next) =>
    medicoController.getMedicoByMatricula(req, res, next),
  )
  .put(verifyUserToken, (req, res, next) =>
    medicoController.updateMedicoByMatricula(req, res, next),
  )
  .delete((req, res, next) =>
    medicoController.deleteMedicoByMatricula(req, res, next),
  );

// getDisponibilidades no se verifica por ahora: debe ser publica para la busqueda de turnos
router
  .route("/:matricula/disponibilidades")
  .get((req, res, next) => medicoController.getDisponibilidades(req, res, next))
  .post(verifyUserToken, (req, res, next) => medicoController.addDisponibilidad(req, res, next));

router
  .route("/:matricula/disponibilidades/:idDisp")
  .put(verifyUserToken, (req, res, next) => medicoController.updateDisponibilidad(req, res, next))
  .delete(verifyUserToken, (req, res, next) => medicoController.deleteDisponibilidad(req, res, next));

router
  .route("/:matricula/servicios")
  .post(verifyUserToken, (req, res, next) => medicoController.addServicio(req, res, next));

router
  .route("/:matricula/servicios/:idServicio")
  .put(verifyUserToken, (req, res, next) => medicoController.updateServicio(req, res, next))
  .delete(verifyUserToken, (req, res, next) => medicoController.deleteServicio(req, res, next));

export default router;
