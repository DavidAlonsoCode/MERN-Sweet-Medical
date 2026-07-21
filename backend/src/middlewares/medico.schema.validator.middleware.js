import { MedicoValidationError } from "../errors/medico.errors.js";

export const validateMedicoSchemaMiddleware = (schema) => (req, res, next) => {
    try {
        // Si el body está bien, sigue de largo
        schema.parse(req.body);
        next();
    } catch (error) {
        // Si falla, tira error al errorHandler central
        next(new MedicoValidationError(error.issues));
    }
};