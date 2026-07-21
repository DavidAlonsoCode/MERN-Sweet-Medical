import schedule from "node-schedule";
import NotificacionService from "../services/notificacion.service.js";
import TurnoRepository from "../repositories/turno.repository.js";
import MedicoService from "../services/medico.service.js";
import PacienteService from "../services/paciente.service.js";

export const programarRecordatorioTurno = (turno) => {
  if (process.env.NODE_ENV === "test") {
    return; // Evitamos dejar temporizadores abiertos durante la ejecución de los tests de Jest
  }

  const notificacionService = NotificacionService.instance();
  const idTurno = turno.id || turno._id;

  // Calculamos exactamente 24 horas antes del inicio del turno
  // const fechaRecordatorio = new Date(turno.fechaHora.getTime() - 24 * 60 * 60 * 1000);
  // Test: Disparar notificación exactamente 100 segundos después de crearlo
  const fechaRecordatorio = new Date(Date.now() + 100 * 1000);

  // Si la fecha calculada ya pasó (ej: reservó un turno para hoy mismo), no programamos nada diferido
  if (fechaRecordatorio < new Date()) {
    return;
  }

  console.log(
    `[Jobs] Temporizador programado a las: ${fechaRecordatorio.toLocaleString()} para el turno ${idTurno}`,
  );

  // Programamos la tarea asignándole un nombre único (para poder cancelarla si reprograman el turno)
  schedule.scheduleJob(`recordatorio_${idTurno}`, fechaRecordatorio, () => {
    const horaFormateada = new Date(turno.fechaHora).toLocaleTimeString(
      "es-AR",
      { hour: "2-digit", minute: "2-digit" },
    );

    console.log(
      `[Jobs] ¡Alarma disparada! Creando recordatorios para paciente y médico...`,
    );

    const medicoService = MedicoService.instance();
    const pacienteService = PacienteService.instance();

    Promise.all([
      medicoService.getMedicoByMatricula(turno.medicoMatricula).catch(() => null),
      pacienteService.getPacienteByDni(turno.pacienteDni).catch(() => null)
    ]).then(([medico, paciente]) => {
      const nombreMedico = medico ? medico.nombre : `con matrícula ${turno.medicoMatricula}`;
      const nombrePaciente = paciente ? paciente.nombre : `DNI ${turno.pacienteDni}`;

      return Promise.all([
        notificacionService.createNotificacion({
          destinatario: turno.pacienteDni,
          remitente: "sistema",
          mensaje: `Recordatorio: Tienes un turno asignado para mañana a las ${horaFormateada} hs con el/la Dr/a. ${nombreMedico}.`,
        }),
        notificacionService.createNotificacion({
          destinatario: turno.medicoMatricula,
          remitente: "sistema",
          mensaje: `Recordatorio: Mañana a las ${horaFormateada} hs tienes un turno con el/la paciente ${nombrePaciente}.`,
        }),
      ]);
    }).catch((err) =>
      console.error(
        `[Jobs] Error enviando recordatorios del turno ${idTurno}:`,
        err,
      ),
    );
  });
};

export const cancelarRecordatorioTurno = (idTurno) => {
  const job = schedule.scheduledJobs[`recordatorio_${idTurno}`];
  if (job) {
    job.cancel();
    console.log(`[Jobs] Temporizador del turno ${idTurno} cancelado/removido.`);
  }
};

export const recuperarRecordatoriosProgramados = () => {
  if (process.env.NODE_ENV === "test") {
    return;
  }

  console.log("[Jobs] Recuperando temporizadores de turnos pendientes...");
  const repository = TurnoRepository.instance();

  repository
    .getAllTurnos({}, 1, 10000)
    .then(({ data }) => {
      // Filtramos los turnos futuros que no estén cancelados ni realizados
      const turnosPendientes = data.filter(
        (t) =>
          t.estado !== "CANCELADO" &&
          t.estado !== "REALIZADO" &&
          t.fechaHora > new Date(),
      );
      turnosPendientes.forEach((turno) => programarRecordatorioTurno(turno));
      console.log(
        `[Jobs] Se recuperaron exitosamente ${turnosPendientes.length} temporizadores activos.`,
      );
    })
    .catch((err) => console.error("[Jobs] Error en la recuperación:", err));
};
