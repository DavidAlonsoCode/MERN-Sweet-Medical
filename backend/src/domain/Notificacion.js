import { NotificacionMissingFieldsError } from "../errors/notificacion.errors.js";

class Notificacion {
  constructor({
    id,
    _id,
    destinatario,
    remitente,
    mensaje,
    fechaCreacion,
    fechaLeida,
    leida,
  }) {
    this.id = id || _id;
    this.destinatario = destinatario;
    this.remitente = remitente;
    this.mensaje = mensaje;
    this.fechaCreacion = fechaCreacion ? new Date(fechaCreacion) : new Date();
    this.fechaLeida = fechaLeida ? new Date(fechaLeida) : null;
    this.leida = leida || false;

    this.validar();
  }

  //    Reglas de Negocio
  //----------------------------
  validar() {
    const requiredFields = ["destinatario", "remitente", "mensaje"];
    const isMissingFields = requiredFields.some((field) => !this[field]);

    if (isMissingFields) {
      throw new NotificacionMissingFieldsError(this);
    }
  }

  marcarComoLeida() {
    // Si la notificación ya fue leída, no hacemos nada.
    if (this.leida) {
      return;
    }
    this.fechaLeida = new Date();
    this.leida = true;
  }
}

export default Notificacion;
