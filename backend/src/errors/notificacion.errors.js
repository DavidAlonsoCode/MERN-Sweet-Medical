class NotificacionError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
    this.name = this.constructor.name;
  }
}

class NotificacionMissingFieldsError extends NotificacionError {
  constructor(notificacionData) {
    const fields = ["destinatario", "remitente", "mensaje"].filter(
      (field) => !notificacionData[field],
    );
    super(400, `Faltan campos requeridos: ${fields.join(", ")}.`);
  }
}

class NotificacionNotFoundError extends NotificacionError {
  constructor(id) {
    super(404, `No se encontró la notificación con el id ${id}.`);
  }
}

export {
  NotificacionError,
  NotificacionMissingFieldsError,
  NotificacionNotFoundError,
};
