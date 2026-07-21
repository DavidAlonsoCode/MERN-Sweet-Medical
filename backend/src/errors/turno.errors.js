class TurnoError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
  }
}

class TurnoMissingFieldsError extends TurnoError {
  constructor(turnoData) {
    super(
      `Faltan campos obligatorios para crear o modificar el turno. Datos recibidos: ${JSON.stringify(turnoData)}`,
    );
  }
}

class TurnoMandatoryFieldError extends TurnoError {
  constructor(campo) {
    super(
      `Faltan datos obligatorios para crear el turno: el campo ${campo} es requerido.`,
      400
    );
  }
}

class TurnoServiceRequiredError extends TurnoError {
  constructor() {
    super(
      `Faltan datos obligatorios: el turno debe tener asociada una especialidad o una práctica.`,
      400
    );
  }
}

class TurnoValidationError extends TurnoError {
  constructor(issues) {
    const messages = issues.map((issue) => issue.message).join(" ");
    super(`${messages}`, 400);
    this.issues = issues;
  }
}

class MedicoNoDisponibleError extends TurnoError {
  constructor(matricula, fechaHora) {
    super(
      `El médico con matrícula ${matricula} no se encuentra disponible en la fecha y hora ${fechaHora}.`,
    );
  }
}

class TurnoNotFoundError extends TurnoError {
  constructor(id) {
    super(`El turno con ID ${id} no fue encontrado.`, 404);
  }
}

class TurnoCancelationTimeError extends TurnoError {
  constructor(id, remainingTimeMinutes) {
    // Si remainingTimeMinutes es negativo, significa que el turno ya pasó.
    const message =
      remainingTimeMinutes <= 0
        ? `El turno con ID ${id} no puede ser cancelado porque ya ha pasado.`
        : `El turno con ID ${id} no puede ser cancelado. Faltan ${remainingTimeMinutes} minutos para el turno y debe ser cancelado con al menos 1 hora de anticipación.`;

    super(message, 400);
  }
}

class TurnoDuplicatedError extends TurnoError {
  constructor(fechaHora) {
    super(
      `El médico ya tiene un turno asignado para la fecha y hora: ${fechaHora.toLocaleString()}`,
      409,
    );
  }
}

class TurnoEnFuturoError extends TurnoError {
  constructor(id, fechaHora) {
    super(
      `El turno programado para el ${fechaHora.toLocaleString()} no puede marcarse como realizado porque aún no ha ocurrido.`,
      400
    );
  }
}

class MedicoNoBrindaServicioError extends TurnoError {
  constructor(matricula, servicio) {
    super(
      `El médico con matrícula ${matricula} no brinda el servicio solicitado (${servicio}).`,
      400
    );
  }
}


export {
  MedicoNoDisponibleError,
  TurnoCancelationTimeError,
  TurnoError,
  TurnoMissingFieldsError,
  TurnoNotFoundError,
  TurnoValidationError,
  TurnoDuplicatedError,
  TurnoEnFuturoError,
  TurnoMandatoryFieldError,
  TurnoServiceRequiredError,
  MedicoNoBrindaServicioError
};
