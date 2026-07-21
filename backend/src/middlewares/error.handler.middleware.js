import { MedicoError } from "../errors/medico.errors.js";
import { TurnoError } from "../errors/turno.errors.js";
import { PacienteError } from "../errors/paciente.errors.js";
import { AuthError } from "../errors/auth.errors.js";

function errorHandler(error, _req, res, next) {
  console.error(error);

  //Error de JSON
  if (error instanceof SyntaxError && "body" in error) {
    return res.status(400).json({
      message: "Error de formato en el JSON",
      error: error.message,
    });
  }
  //Error en medico
  if (error instanceof MedicoError) {
    return res.status(error.status).json({
      message: error.message,
    });
  }
  //Error en turno
  if (error instanceof TurnoError) {
    return res.status(error.statusCode).json({
      message: error.message,
    });
  }
  //Error en paciente
  if (error instanceof PacienteError) {
      return res.status(error.status).json({
          message: error.message
      });
  }
  //Error de autenticacion
  if (error instanceof AuthError) {
      return res.status(error.status).json({
          message: error.message
      });
  }
  //Error generico
  if (error instanceof Error) {
    return res.status(500).json({
      message: "Error interno del servidor",
      error: error.message,
    });
  }

  return next(error);
}

export default errorHandler;
