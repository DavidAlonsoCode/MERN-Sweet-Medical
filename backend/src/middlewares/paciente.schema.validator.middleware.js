import { PacienteValidationError } from "../errors/paciente.errors.js";

export const validatePacienteSchemaMiddleware = (schema) => (req, res, next) => {
    try {
        schema.parse(req.body);
        next();
    } catch (error) {
        next(new PacienteValidationError(error.issues));
    }
};