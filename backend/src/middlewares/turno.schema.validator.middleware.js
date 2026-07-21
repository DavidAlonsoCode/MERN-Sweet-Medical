import { TurnoValidationError } from "../errors/turno.errors.js";

export const validateTurnoSchemaMiddleware = (schema) => (req, res, next) => {
  try {

    console.log("BODY:");
    console.log(req.body);

    schema.parse(req.body);

    next();

  } catch (error) {

    console.log("ERROR ZOD:");
    console.log(JSON.stringify(error.issues, null, 2));

    next(new TurnoValidationError(error.issues));
  }
};