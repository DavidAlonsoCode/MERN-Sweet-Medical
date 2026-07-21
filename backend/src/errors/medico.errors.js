class MedicoError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
    this.name = this.constructor.name;
  }
}

class MedicoNotFoundError extends MedicoError {
  constructor(matricula) {
    super(404, `Usuario con matricula: ${matricula} no encontrado`);
  }
}

class MedicoAlreadyExistsError extends MedicoError {
  constructor(matricula) {
    super(409, `Ya existe un usuario con matricula: ${matricula}`);
  }
}

class MedicoMissingFieldsError extends MedicoError {
  constructor(medicoData) {
    const fields = ["matricula", "usuario", "nombre"].filter(
      (field) => !medicoData[field],
    );
    super(400, `Faltan campos requeridos: ${fields.join(", ")}.`);
  }
}

class DisponibilidadInvalidaError extends MedicoError {
  constructor() {
    super(400, "La hora de inicio debe ser anterior a la hora de fin.");
  }
}

class DisponibilidadNoEncontradaError extends MedicoError {
  constructor(id) {
    super(404, `Disponibilidad ${id} no encontrada`);
  }
}

class DisponibilidadSuperpuestaError extends MedicoError {
  constructor() {
    super(
      409,
      "El médico ya tiene un bloque de disponibilidad que se superpone ese día.",
    );
  }
}

class ServicioNoValido extends MedicoError {
  constructor() {
    super(400, "El servicio ingresado no es valido.");
  }
}

class ServicioNoEncontrado extends MedicoError {
  constructor(id) {
    super(404, `Servicio ${id} no encontrado`);
  }
}

class FiltroInvalidoError extends MedicoError {
  constructor(filtro) {
    super(400, `El valor ingresado para el filtro '${filtro}' no es un ID válido.`);
  }
}

class MedicoValidationError extends MedicoError {
    constructor(issues) {
        // Junta todos los errores de Zod en un solo texto
        const messages = issues.map((issue) => issue.message).join(" | ");
        super(400, `Error de validación: ${messages}`);
    }
}

export {
  MedicoError,
  MedicoNotFoundError,
  MedicoAlreadyExistsError,
  MedicoMissingFieldsError,
  DisponibilidadInvalidaError,
  DisponibilidadNoEncontradaError,
  DisponibilidadSuperpuestaError,
  ServicioNoValido,
  ServicioNoEncontrado,
  FiltroInvalidoError,
  MedicoValidationError
};
