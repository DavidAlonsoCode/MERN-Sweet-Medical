import {
  MedicoMissingFieldsError,
  DisponibilidadInvalidaError,
  DisponibilidadSuperpuestaError,
  DisponibilidadNoEncontradaError,
  ServicioNoValido,
  ServicioNoEncontrado
} from "../errors/medico.errors.js";

const diasSemana = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

class Medico {
  constructor({
    usuario,
    password,
    matricula,
    nombre,
    especialidades = [],
    practicas = [],
    sedes = [],
    disponibilidades = [],
  }) {
    this.usuario = usuario;
    this.password = password;
    this.matricula = matricula;
    this.nombre = nombre;
    this.especialidades = especialidades;
    this.practicas = practicas;
    this.sedes = sedes;

    this.disponibilidades = [];
    if (disponibilidades && Array.isArray(disponibilidades)) {
      disponibilidades.forEach((disp) => {
        this.agregarDisponibilidad(disp.id, disp.dia, disp.inicio, disp.fin);
      });
    }

    this.validar();
  }

  //Reglas
  //----------
  validar() {
    const requiredFields = ["matricula", "usuario", "nombre"];
    const isMissingFields = requiredFields.some((field) => !this[field]);
    // some devuelve true si un elemento del array cumple la condicion, en este caso si no existe un campo requerido

    if (isMissingFields) {
      throw new MedicoMissingFieldsError(this);
    }
  }

  calcularDuracionTurno() {
    // considerar la duración de un turno, como la máxima duración de especialidad o práctica del médico.
    let maxDuracion = 0;

    if (this.especialidades && this.especialidades.length > 0) {
      const maxEspecialidad = Math.max(...this.especialidades.map(e => e.duracionMinutos || 0));
      if (maxEspecialidad > maxDuracion) maxDuracion = maxEspecialidad;
    }

    if (this.practicas && this.practicas.length > 0) {
      const maxPractica = Math.max(...this.practicas.map(p => p.duracionMinutos || 0));
      if (maxPractica > maxDuracion) maxDuracion = maxPractica;
    }

    // Si por alguna razón los arrays están vacíos o no tienen duracionMinutos, devolvemos un default
    return maxDuracion > 0 ? maxDuracion : 30;
  }

  agregarDisponibilidad(id, dia, inicio, fin) {
    if (inicio >= fin) throw new DisponibilidadInvalidaError();

    const idAsignado = id || `d_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    const superpone = this.disponibilidades.some((disp) => {
      return (
        disp.dia === dia &&
        inicio < disp.fin &&
        fin > disp.inicio
      );
    });

    if (superpone) throw new DisponibilidadSuperpuestaError();

    // Guardamos con el ID asignado
    this.disponibilidades.push({ id: idAsignado, dia, inicio, fin });
  }

  modificarDisponibilidad(idDisp, dia, inicio, fin) {
    if (inicio >= fin) throw new DisponibilidadInvalidaError();

    const index = this.disponibilidades.findIndex((d) => d.id === idDisp);
    if (index === -1) throw new DisponibilidadNoEncontradaError(idDisp);

    const superpone = this.disponibilidades.some((disp) => {
      return (
        disp.id !== idDisp &&
        disp.dia === dia &&
        inicio < disp.fin &&
        fin > disp.inicio
      );
    });

    if (superpone) throw new DisponibilidadSuperpuestaError();

    this.disponibilidades[index] = { id: idDisp, dia, inicio, fin };
  }

  eliminarDisponibilidad(idDisp) {
    this.disponibilidades = this.disponibilidades.filter(d => d.id !== idDisp);
  }

  estaDisponible(fechaHoraInicio) {
    const diaSemana = diasSemana[fechaHoraInicio.getDay()];

    const duracionMinutos = this.calcularDuracionTurno();
    const fechaHoraFin = new Date(
      fechaHoraInicio.getTime() + duracionMinutos * 60000
    );

    const horaInicioTurno = fechaHoraInicio.toTimeString().substring(0, 5);
    const horaFinTurno = fechaHoraFin.toTimeString().substring(0, 5);

    console.log("VALIDANDO DISPONIBILIDAD");
    console.log("diaSemana:", diaSemana);
    console.log("horaInicioTurno:", horaInicioTurno);
    console.log("horaFinTurno:", horaFinTurno);
    console.log("disponibilidades:", this.disponibilidades);

    return this.disponibilidades.some((disp) => {
        console.log("comparando contra:", disp);

        return (
            disp.dia === diaSemana &&
            horaInicioTurno >= disp.inicio &&
            horaFinTurno <= disp.fin
        );
    });
}


  agregarServicio(tipo, servicio) {
    const { id, nombre } = servicio;
    const coleccion = tipo === "especialidad" ? this.especialidades : this.practicas;

    if (tipo !== "especialidad" && tipo !== "practica") throw new ServicioNoValido();

    const yaExiste = coleccion.some(s => String(s.id) === String(id));
    if (yaExiste) throw new Error(`El médico ya cuenta con: ${nombre}`);

    coleccion.push(servicio);
    return id;
  }

  modificarServicio(tipo, idServicio, nuevosDatos) {
    const coleccion = tipo === "especialidad" ? this.especialidades : this.practicas;
    const servicio = coleccion.find(s => String(s.id) === String(idServicio));
    if (!servicio) throw new ServicioNoEncontrado(idServicio);
    if (nuevosDatos.duracionMinutos !== undefined) {
      servicio.duracionMinutos = nuevosDatos.duracionMinutos;
    }
    if (nuevosDatos.costo !== undefined) {
      servicio.costo = nuevosDatos.costo;
    }
  }

  eliminarServicio(tipo, idServicio) {
    if (tipo === "especialidad") {
      this.especialidades = this.especialidades.filter(s => String(s.id) !== String(idServicio));
    } else if (tipo === "practica") {
      this.practicas = this.practicas.filter(s => String(s.id) !== String(idServicio));
    }
  }

}

export default Medico;
