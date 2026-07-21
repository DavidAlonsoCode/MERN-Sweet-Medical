class AuthError extends Error {
    constructor(status, message) {
        super(message);
        this.status = status;
        this.name = this.constructor.name;
    }
}

class Unauthorized extends AuthError {
  constructor() {
    super(401, `Acceso denegado. No puede acceder a esta ruta.`);
  }
}

class AccessDeniedByToken extends AuthError {
    constructor() {
        super(401, `Acceso denegado. No se proporcionó un token.`);
    }
}

class AccessDeniedByIDTurno extends AuthError {
    constructor(idTurno) {
        super(401, `Acceso denegado. No tiene permiso para ver o modificar el turno ${idTurno}.`);
    }
}

class AccessDeniedByIDMedico extends AuthError {
  constructor(matriculaMedico) {
    super(401, `Acceso denegado. No tiene permiso para ver o modificar los datos del medico ${matriculaMedico}.`);
  }
}

class AccessDeniedByIDPaciente extends AuthError {
  constructor(pacienteDni) {
    super(401, `Acceso denegado. No tiene permiso para ver o modificar los datos del paciente ${pacienteDni}.`);
  }
}

class AccessDeniedByNotificacion extends AuthError {
  constructor() {
    super(401, `Acceso denegado. No tiene permiso para ver o modificar los datos de la notificacion.`);
  }
}

class InvalidToken extends AuthError {
    constructor() {
        super(401, `Token inválido o expirado.`);
    }
}

export {
  AuthError,
  AccessDeniedByToken,
  InvalidToken,
  AccessDeniedByIDTurno,
  Unauthorized,
  AccessDeniedByIDMedico,
  AccessDeniedByIDPaciente,
  AccessDeniedByNotificacion
};