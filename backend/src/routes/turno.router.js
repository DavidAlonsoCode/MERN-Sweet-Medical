import express from "express";

import TurnoController from "../controllers/turno.controller.js";
import { validateTurnoSchemaMiddleware } from "../middlewares/turno.schema.validator.middleware.js";
import { turnoSchema, turnoUpdateSchema } from "../validators/turnoSchemas.js";
import { verifyUserToken } from "../middlewares/auth.middleware.js";

const turnoController = TurnoController.instance();

const router = express.Router();

router
  .route("/")
  .post(verifyUserToken, validateTurnoSchemaMiddleware(turnoSchema), (req, res, next) =>
    turnoController.createTurno(req, res, next),
  )
  .get(verifyUserToken, (req, res, next) => turnoController.getAllTurnos(req, res, next));

// getTurnosDisponibles no se verifica: es publica para la busqueda de turnos
router
  .route("/disponibles")
  .get((req, res, next) => turnoController.getTurnosDisponibles(req, res, next));

router
  .route("/:id")
  .get(verifyUserToken, (req, res, next) => turnoController.getTurnoById(req, res, next))
  .delete(verifyUserToken, (req, res, next) => turnoController.cancelTurno(req, res, next))
  // Un solo PATCH RESTful para toda actualización
  .patch(verifyUserToken, validateTurnoSchemaMiddleware(turnoUpdateSchema), (req, res, next) =>
      turnoController.updateTurno(req, res, next)
  );

//router
//  .route("/:id/realizado")
//  .patch((req, res, next) => turnoController.markTurnoAsRealizado(req, res, next));

export default router;
