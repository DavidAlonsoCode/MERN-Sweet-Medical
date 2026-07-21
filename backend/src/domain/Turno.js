import {
  TurnoEnFuturoError,
  TurnoMandatoryFieldError,
  TurnoServiceRequiredError
} from "../errors/turno.errors.js";

class Turno {
  constructor({ id, pacienteDni, medicoMatricula, especialidad, practica, sede, fecha, hora, fechaHora, estado }) {
    this.id = id;
    this.pacienteDni = pacienteDni;
    this.medicoMatricula = medicoMatricula;
    this.especialidad = especialidad;
    this.practica = practica;
    this.sede = sede;
    this.estado = estado || "RESERVADO";

    if (fecha && hora) {
      const [day, month, year] = fecha.split("-").map(Number);
      const [hours, minutes] = hora.split(":").map(Number);
      this.fechaHora = new Date(year, month - 1, day, hours, minutes);
    } else {
      this.fechaHora = fechaHora;
    }

    this.validar();
  }

  validar() {
    // Agregamos 'practica' aquí
    const camposObligatorios = ['pacienteDni', 'medicoMatricula', 'sede', 'fechaHora'];

    if (!this.especialidad && !this.practica) {
        throw new TurnoServiceRequiredError();
    }

    for (const campo of camposObligatorios) {
      if (!this[campo]) {
        throw new TurnoMandatoryFieldError(campo);
      }
    }
  }

  marcarComoRealizado() {
    const ahora = new Date();
    if (this.fechaHora > ahora) {
      throw new TurnoEnFuturoError(this.id, this.fechaHora);
    }
    this.estado = "REALIZADO";
  }
}

export default Turno;