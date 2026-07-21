import TurnoRepository from "../repositories/turno.repository.js";
import MedicoService from "./medico.service.js";
import NotificacionService from "./notificacion.service.js";
import {
  medicoAvailable,
  medicoHasTurno,
} from "../validators/medicoDisponibilidad.js";
import PacienteService from "./paciente.service.js";
import { turnoExists, verifyCancelTime } from "../validators/turnoControl.js";
import Turno from "../domain/Turno.js";
import {
  MedicoNoBrindaServicioError,
  TurnoError,
} from "../errors/turno.errors.js";
import CoberturaService from "./cobertura.service.js";
import EspecialidadModel from "../models/especialidad.model.js";
import {
  programarRecordatorioTurno,
  cancelarRecordatorioTurno,
} from "../jobs/turno.jobs.js";

class TurnoService {
  constructor({
    turnoRepository = TurnoRepository.instance(),
    medicoService = MedicoService.instance(),
    pacienteService = PacienteService.instance(),
    notificacionService = NotificacionService.instance(),
  } = {}) {
    this.turnoRepository = turnoRepository;
    this.medicoService = medicoService;
    this.pacienteService = pacienteService;
    this.notificacionService = notificacionService;
  }

  createTurno(turnoData) {
    // Convertimos fecha + hora a Date real
    const [dia, mes, anio] = turnoData.fecha.split("-").map(Number);

    const fechaHoraReal = new Date(Date.UTC(anio, mes - 1, dia, parseInt(turnoData.hora.split(":")[0]) + 3, parseInt(turnoData.hora.split(":")[1])));

    const turnoAProcesar = {
      ...turnoData,
      fechaHora: fechaHoraReal,
    };

    return (
      Promise.resolve()

        // Buscar paciente y médico
        .then(() => {
          return Promise.all([
            this.pacienteService.getPacienteByDni(turnoAProcesar.pacienteDni),

            this.medicoService.getMedicoByMatricula(
              turnoAProcesar.medicoMatricula,
            ),
          ]);
        })

        .then(([paciente, medico]) => {
          // Validaciones
          this._validarRequisitosMedico(medico, turnoAProcesar);
          console.log("Fecha turno:", turnoAProcesar.fechaHora);
          console.log("Disponibilidades medico:", medico.disponibilidades);
          console.log("Dia:", turnoAProcesar.fechaHora.getDay());
          console.log(
            "Hora:",
            turnoAProcesar.fechaHora.toTimeString().substring(0, 5)
          );
          return medicoAvailable(medico, turnoAProcesar.fechaHora)
            .then(() =>
              this.turnoRepository.getAllTurnos({
                medicoMatricula: medico.matricula,
              }),
            )

            .then((resultado) =>
              medicoHasTurno(resultado.data, turnoAProcesar.fechaHora, medico),
            )

            .then(() => ({
              paciente,
              medico,
            }));
        })

        // Crear turno
        .then(({ paciente, medico }) => {
          return this.turnoRepository
            .createTurno(turnoAProcesar)

            .then((turnoCreado) => {
              let promesaServicio;

              // Buscar nombre de especialidad
              if (turnoAProcesar.especialidad) {
                promesaServicio = EspecialidadModel.findById(
                  turnoAProcesar.especialidad,
                )

                  .then(
                    (especialidad) => `la especialidad ${especialidad.nombre}`,
                  );
              }

              // Fallback por si no hay especialidad
              else {
                promesaServicio = Promise.resolve("el servicio solicitado");
              }

              return promesaServicio.then((servicioSolicitado) => {
                // Formatear fecha
                const fechaFormateada =
                  turnoAProcesar.fechaHora.toLocaleDateString("es-AR");

                // Formatear hora
                const horaFormateada =
                  turnoAProcesar.fechaHora.toLocaleTimeString("es-AR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  });

                // Crear notificación
                return this.notificacionService
                  .createNotificacion({
                    destinatario: turnoAProcesar.medicoMatricula,

                    remitente: "sistema",

                    mensaje:
                      `El paciente ${paciente.nombre || paciente.dni} ` +
                      `solicitó un turno para ${servicioSolicitado} ` +
                      `el ${fechaFormateada} a las ${horaFormateada}.`,
                  })

                  .then(() => {
                    programarRecordatorioTurno(turnoCreado);
                    return turnoCreado._id;
                  });
              });
            });
        })
    );
  }

    _validarRequisitosMedico(medico, turno) {
        const trabajaSede = medico.sedes?.some((s) => {
            const sedePlana = s.toObject ? s.toObject() : s;
            const idSede = sedePlana.id;
            return idSede && idSede.toString() === turno.sede;
        });

        if (!trabajaSede)
            throw new MedicoNoBrindaServicioError(medico.matricula, turno.sede);

        // Validación de práctica (si el turno es para una práctica)
        if (turno.practica) {
            const tienePrac = medico.practicas?.some(
                (p) => p.id.toString() === turno.practica,
            );
            if (!tienePrac)
                throw new MedicoNoBrindaServicioError(medico.matricula, turno.practica);
        }

        // Validación de especialidad (si el turno es para una especialidad)
        if (turno.especialidad) {
            const tieneEsp = medico.especialidades?.some(
                (e) => e.id.toString() === turno.especialidad,
            );
            if (!tieneEsp)
                throw new MedicoNoBrindaServicioError(
                    medico.matricula,
                    turno.especialidad,
                );
        }
    }

  getTurnos(page, limit, filtros) {
    return this.turnoRepository
      .getAllTurnos(filtros, page, limit)
      .then((resultado) => {
        return {
          // Transformo los datos crudos de Mongo en objetos de nuestra clase Turno
          data: resultado.data.map((data) => new Turno(data)),
          meta: resultado.meta,
        };
      });
  }

  getTurnoById(id) {
    return this.turnoRepository
      .getTurnoById(id)
      .then((turno) => turnoExists(turno, id));
  }

  confirmarTurno(id) {
    return this.turnoRepository
      .getTurnoById(id)

      .then((turnoData) => turnoExists(turnoData, id))

      .then((turnoData) => {
        // Validar que no esté cancelado
        if (turnoData.estado === "CANCELADO") {
          throw new TurnoError("No se puede confirmar un turno cancelado.");
        }

        // Actualizar estado
        return this.turnoRepository.updateTurnoById(id, {
          estado: "CONFIRMADO",
        });
      })

      .then((turnoActualizado) => {
        // Formatear fecha y hora
        const fechaFormateada = new Date(
          turnoActualizado.fechaHora,
        ).toLocaleString("es-AR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });

        // Buscar médico para poner su nombre en la notificación
        return this.medicoService
          .getMedicoByMatricula(turnoActualizado.medicoMatricula)
          .catch(() => null)
          .then((medico) => {
            const nombreMedico = medico ? medico.nombre : turnoActualizado.medicoMatricula;
            
            // Notificar al paciente
            return this.notificacionService.createNotificacion({
              destinatario: turnoActualizado.pacienteDni,
              remitente: "sistema",
              mensaje: `Su turno con el/la Dr/a. ${nombreMedico} para la fecha ${fechaFormateada} ha sido confirmado.`,
            });
          })
          .then(() => turnoActualizado.id);
      });
  }

  cancelTurno(id) {
    return this.turnoRepository
      .getTurnoById(id)
      .then((turno) => turnoExists(turno, id))
      .then((turno) => {
        // Validar que el turno no esté ya cancelado
        if (turno.estado === "CANCELADO") {
          return Promise.resolve(turno.id);
        }
        verifyCancelTime(turno, id); // verifica que se pueda cancelar todavia
        return this.turnoRepository.deleteTurnoById(id).then(() => turno);
      })
      .then((canceledTurno) => {
        // Formatear fecha y hora
        const fechaFormateada = new Date(
          canceledTurno.fechaHora,
        ).toLocaleString("es-AR", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });

        // Buscar paciente y médico para poner sus nombres en las notificaciones
        return Promise.all([
          this.pacienteService.getPacienteByDni(canceledTurno.pacienteDni).catch(() => null),
          this.medicoService.getMedicoByMatricula(canceledTurno.medicoMatricula).catch(() => null)
        ]).then(([paciente, medico]) => {
          const nombrePaciente = paciente ? paciente.nombre : `DNI ${canceledTurno.pacienteDni}`;
          const nombreMedico = medico ? medico.nombre : canceledTurno.medicoMatricula;

          return Promise.all([
            // Notificar al médico
            this.notificacionService.createNotificacion({
              destinatario: canceledTurno.medicoMatricula,
              remitente: "sistema",
              mensaje:
                `El turno del/la paciente ${nombrePaciente} ` +
                `asignado para la fecha ${fechaFormateada} ` +
                `ha sido cancelado.`,
            }),

            // Notificar al paciente
            this.notificacionService.createNotificacion({
              destinatario: canceledTurno.pacienteDni,
              remitente: "sistema",
              mensaje:
                `Su turno con el/la Dr/a. ${nombreMedico} ` +
                `asignado para la fecha ${fechaFormateada} ` +
                `ha sido cancelado.`,
            }),
          ]);
        }).then(() => {
          cancelarRecordatorioTurno(canceledTurno.id);
          return canceledTurno.id;
        });
      });
  }

  marcarTurnoComoRealizado(id) {
    return this.turnoRepository
      .getTurnoById(id)
      .then((turnoData) => turnoExists(turnoData, id))
      .then((turnoData) => {
        const turno = new Turno(turnoData);

        // El dominio valida si es futuro y cambia el estado
        turno.marcarComoRealizado();

        // Persistimos solo el cambio de estado
        return this.turnoRepository.updateTurnoById(id, {
          estado: turno.estado,
        });
      })
      .then((turnoActualizado) => turnoActualizado.id);
  }

  cambiarHorarioTurno(id, nuevaFecha, nuevaHora, rol) {
    const [day, month, year] = nuevaFecha.split("-").map(Number);
    const [hours, minutes] = nuevaHora.split(":").map(Number);
    const nuevaFechaHoraTurno = new Date(Date.UTC(year, month - 1, day, hours + 3, minutes));

    return this.turnoRepository
      .getTurnoById(id)
      .then((turno) => turnoExists(turno, id))
      .then((turno) => {
        // Validar que el turno no esté ya cancelado o realizado
        if (turno.estado === "CANCELADO" || turno.estado === "REALIZADO") {
          throw new TurnoError(
            `No se puede cambiar el horario de un turno en estado ${turno.estado}.`,
          );
        }

        // Validar regla de cancelación (debe faltar más de 1 hora para el turno ORIGINAL)
        verifyCancelTime(turno, id);

        // Validar que realmente sea "OTRO" horario
        if (turno.fechaHora.getTime() === nuevaFechaHoraTurno.getTime()) {
          throw new TurnoError(
            "El nuevo horario debe ser diferente al actual.",
          );
        }

        // Traer al médico para validar la NUEVA disponibilidad
        return this.medicoService
          .getMedicoByMatricula(turno.medicoMatricula)
          .then((medico) => {
            // Validar disponibilidad general en la nueva fecha
            return medicoAvailable(medico, nuevaFechaHoraTurno)
              .then(() =>
                this.turnoRepository.getAllTurnos({
                  medicoMatricula: medico.matricula,
                }),
              )
              .then((resultado) => {
                const turnosSinActual = resultado.data.filter(
                  (t) => t.id !== id,
                );

                return medicoHasTurno(
                  turnosSinActual,
                  nuevaFechaHoraTurno,
                  medico,
                );
              });
          });
      })
      .then(() => {
        // Si pasamos todas las validaciones, actualizamos el turno
        const updateData = {
          fechaHora: nuevaFechaHoraTurno,
        };

        if (rol === "PACIENTE") {
          updateData.estado = "RESERVADO";
        } else if (rol === "MEDICO") {
          updateData.estado = "CONFIRMADO";
        }

        return this.turnoRepository.updateTurnoById(id, updateData);
      })
      .then((turnoActualizado) => {
        const fechaFormateada = turnoActualizado.fechaHora.toLocaleDateString("es-AR");
        const horaFormateada = turnoActualizado.fechaHora.toLocaleTimeString("es-AR", {
          hour: "2-digit",
          minute: "2-digit",
        });

        // Buscar paciente y médico para poner sus nombres en las notificaciones
        return Promise.all([
          this.pacienteService.getPacienteByDni(turnoActualizado.pacienteDni).catch(() => null),
          this.medicoService.getMedicoByMatricula(turnoActualizado.medicoMatricula).catch(() => null)
        ]).then(([paciente, medico]) => {
          const nombrePaciente = paciente ? paciente.nombre : `DNI ${turnoActualizado.pacienteDni}`;
          const nombreMedico = medico ? medico.nombre : turnoActualizado.medicoMatricula;

          let msgMedico = `El turno de ${nombrePaciente} fue reprogramado para el ${fechaFormateada} a las ${horaFormateada}.`;
          let msgPaciente = `Tu turno con el/la Dr/a. ${nombreMedico} fue reprogramado para el ${fechaFormateada} a las ${horaFormateada}.`;

          if (rol === "PACIENTE") {
            msgMedico = `El/la paciente ${nombrePaciente} reprogramó su turno para el ${fechaFormateada} a las ${horaFormateada}. Requiere confirmación.`;
            msgPaciente = `Reprogramaste tu turno con el/la Dr/a. ${nombreMedico} para el ${fechaFormateada} a las ${horaFormateada}. Queda a la espera de confirmación.`;
          } else if (rol === "MEDICO") {
            msgMedico = `Reprogramaste el turno de ${nombrePaciente} para el ${fechaFormateada} a las ${horaFormateada}.`;
            msgPaciente = `El/la Dr/a. ${nombreMedico} reprogramó tu turno para el ${fechaFormateada} a las ${horaFormateada}.`;
          }

          return Promise.all([
            this.notificacionService.createNotificacion({
              destinatario: turnoActualizado.medicoMatricula,
              remitente: "sistema",
              mensaje: msgMedico,
            }),

            this.notificacionService.createNotificacion({
              destinatario: turnoActualizado.pacienteDni,
              remitente: "sistema",
              mensaje: msgPaciente,
            }),
          ]);
        }).then(() => {
          cancelarRecordatorioTurno(turnoActualizado.id); // Eliminamos la alarma vieja
          programarRecordatorioTurno(turnoActualizado); // Seteamos la alarma nueva
          return turnoActualizado.id;
        });
      });
  }

    async buscarTurnosDisponibles(filtros) {
        const { pacienteDni, medicoMatricula, especialidad, practica, sede, fechaDesde, fechaHasta, sortBy = "fecha", order = "asc", page = 1, limit = 10 } = filtros;

        if (!pacienteDni) {
            throw new TurnoError("El DNI del paciente es obligatorio para calcular las coberturas.", 400);
        }

        const coberturaService = CoberturaService.instance();

        // 1. Obtenemos el paciente
        const paciente = await this.pacienteService.getPacienteByDni(pacienteDni);

        // 2. Alta Cohesión: Delegamos la obtención de médicos al servicio correspondiente.
        // Traemos a los médicos. Idealmente los filtros de texto (especialidad) deberíamos pasarlos al repo,
        // pero como el repo actual busca por ID de especialidad, haremos un filtro mixto para no romper tu arquitectura actual.
        const resultadoMedicos = await this.medicoService.getMedicos({ limit: 100, matricula: medicoMatricula });
        let medicosFiltrados = resultadoMedicos.data;

        if (especialidad) {
            medicosFiltrados = medicosFiltrados.filter(m => m.especialidades?.some(e => e.nombre.toLowerCase() === especialidad.toLowerCase()));
        }
        if (practica) {
            medicosFiltrados = medicosFiltrados.filter(m => m.practicas?.some(p => p.nombre.toLowerCase() === practica.toLowerCase()));
        }
        if (sede) {
            medicosFiltrados = medicosFiltrados.filter(m => m.sedes?.some(s => s.nombre.toLowerCase() === sede.toLowerCase()));
        }

        // 3. Bajo Acoplamiento: Le pedimos a la BD SOLAMENTE los turnos en el rango de fechas solicitado.
        // Evitamos traer 10.000 registros innecesarios a la memoria.
        const desde = fechaDesde ? new Date(fechaDesde) : new Date();
        const hasta = fechaHasta ? new Date(fechaHasta) : new Date(new Date().setDate(new Date().getDate() + 15));

        const resultadoTurnos = await this.turnoRepository.getAllTurnos({
            fechaDesde: desde.toISOString(),
            fechaHasta: hasta.toISOString()
        }, 1, 1000); // Traemos un límite prudente, pero ya acotado por fecha.

        const turnosOcupados = resultadoTurnos.data;
        const diasSemana = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
        let turnosDisponibles = [];

        // 4. Generación de los slots disponibles
        for (const medico of medicosFiltrados) {
            const duracionMins = medico.calcularDuracionTurno();

            const servicioBuscado = especialidad ? medico.especialidades.find(e => e.nombre.toLowerCase() === especialidad.toLowerCase()) :
                practica ? medico.practicas.find(p => p.nombre.toLowerCase() === practica.toLowerCase()) :
                    (medico.especialidades[0] || medico.practicas[0]);

            const costoBase = servicioBuscado?.costo || 15000;
            const nombreOS = typeof paciente.obraSocial === "string" ? paciente.obraSocial : paciente.obraSocial?.nombre;

            const infoCobertura = coberturaService.calcularCobertura(nombreOS, paciente.plan, costoBase);

            for (let d = new Date(desde); d <= hasta; d.setDate(d.getDate() + 1)) {
                const nombreDia = diasSemana[d.getDay()];
                const disponibilidadesDelDia = medico.disponibilidades.filter(disp => disp.dia === nombreDia);

                for (const disp of disponibilidadesDelDia) {
                  const [hInicio, mInicio] = disp.inicio.split(":").map(Number);
                  const [hFin, mFin] = disp.fin.split(":").map(Number);

                  let horaActual = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), hInicio + 3, mInicio));

                  const horaFinal = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), hFin + 3, mFin));

                    while (horaActual < horaFinal) {
                        const estaOcupado = turnosOcupados.some(t =>
                            t.medicoMatricula === medico.matricula &&
                            t.fechaHora.getTime() === horaActual.getTime() &&
                            t.estado !== "CANCELADO"
                        );

                        if (!estaOcupado && horaActual > new Date()) {
                          const sedeSeleccionada = medico.sedes.length > 0 ? medico.sedes[0] : null;
                          console.log({
    medico: medico.matricula,
    dispInicio: disp.inicio,
    dispFin: disp.fin,
    horaActual: horaActual.toString(),
    horaMostrar: horaActual.toLocaleTimeString("es-AR", {
        hour: "2-digit",
        minute: "2-digit"
    })
});

console.log(
    "horaActual real:",
    horaActual.getHours() + ":" + horaActual.getMinutes()
);
                            turnosDisponibles.push({
                                medico: medico.nombre,
                                matricula: medico.matricula,
                                especialidad: servicioBuscado ? servicioBuscado.nombre : "Consulta",
                                sede: sedeSeleccionada ? sedeSeleccionada.nombre : "-",
                                especialidadId: servicioBuscado?.id?.toString(),
                                practicaId: practica ? servicioBuscado?.id?.toString() : null,
                                sedeId: sedeSeleccionada?.id?.toString(),
                                fecha: horaActual.toLocaleDateString("es-AR"),
                                hora: horaActual.toLocaleTimeString("es-AR", {hour: "2-digit", minute: "2-digit"}),
                                nivelCobertura: infoCobertura.nivelCobertura,
                                costoEstimado: infoCobertura.montoAbonar,
                                _fechaOriginal: new Date(horaActual),
                            });
                        }
                        horaActual = new Date(horaActual.getTime() + duracionMins * 60000);
                    }
                }
            }
        }

        // 5. Ordenamiento y Paginación final
        turnosDisponibles.sort((a, b) => {
            if (sortBy === "costo") {
                return order === "asc" ? a.costoEstimado - b.costoEstimado : b.costoEstimado - a.costoEstimado;
            }
            return order === "asc" ? a._fechaOriginal - b._fechaOriginal : b._fechaOriginal - a._fechaOriginal;
        });

        turnosDisponibles.forEach(t => delete t._fechaOriginal);

        const numPage = parseInt(page);
        const numLimit = parseInt(limit);
        const startIndex = (numPage - 1) * numLimit;
        const turnosPaginados = turnosDisponibles.slice(startIndex, startIndex + numLimit);

        return {
            data: turnosPaginados,
            meta: {
                totalItems: turnosDisponibles.length,
                itemsPerPage: numLimit,
                currentPage: numPage,
                totalPages: Math.ceil(turnosDisponibles.length / numLimit),
            },
        };
    }

  static instance() {
    this._instance ||= new this();
    return this._instance;
  }
}

export default TurnoService;
