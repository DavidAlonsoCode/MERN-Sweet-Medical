import express from "express";
import PacienteController from "../controllers/paciente.controller.js";
import { validatePacienteSchemaMiddleware } from "../middlewares/paciente.schema.validator.middleware.js";
import { pacienteSchema, pacienteUpdateSchema } from "../validators/pacienteSchemas.js";
import { verifyUserToken } from "../middlewares/auth.middleware.js";

const pacienteController = PacienteController.instance();
const router = express.Router();

// createPaciente no se verifica por ahora: debe ser privado/publico segun el sign up
router
    .route("/")
    .get(verifyUserToken, (req, res, next) => pacienteController.getPacientes(req, res, next))
    // Le mandamos el schema estricto al crear
    .post(validatePacienteSchemaMiddleware(pacienteSchema), (req, res, next) => pacienteController.createPaciente(req, res, next));

// deletePaciente no se verifica por ahora: debe ser privado para algun admin
router
    .route("/:dni")
    .get(verifyUserToken, (req, res, next) => pacienteController.getPacienteByDni(req, res, next))
    // Le mandamos el schema opcional al actualizar
    .put(verifyUserToken, validatePacienteSchemaMiddleware(pacienteUpdateSchema), (req, res, next) => pacienteController.updatePacienteByDni(req, res, next))
    .delete((req, res, next) => pacienteController.deletePacienteByDni(req, res, next));

export default router;