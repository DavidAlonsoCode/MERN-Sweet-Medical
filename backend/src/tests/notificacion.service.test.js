import { jest } from "@jest/globals";
import NotificacionService from "../services/notificacion.service.js";
import { connectTestDB, clearTestDB, closeTestDB } from "./setup-p.js";

jest.setTimeout(60000);

describe("NotificacionService", () => {
  let notificacionService;

  beforeAll(async () => {
    await connectTestDB();
  });

  beforeEach(async () => {
    await clearTestDB();
    notificacionService = NotificacionService.instance();
  });

  afterAll(async () => {
    await closeTestDB();
  });

  test("debería crear una notificación correctamente", async () => {
    const id = await notificacionService.createNotificacion({
      destinatario: "paciente1",
      remitente: "sistema",
      mensaje: "Su turno ha sido confirmado.",
    });
    expect(id).toBeDefined();
  });

  test("debería obtener notificaciones sin leer y leídas", async () => {
    const creada = await notificacionService.createNotificacion({
      destinatario: "paciente1",
      remitente: "sistema",
      mensaje: "Mensaje de prueba",
    });

    const id = creada.id || creada._id;

    // Buscar sin leer
    let result = await notificacionService.getAllNotificaciones({
      destinatario: "paciente1",
      leida: false,
    });

    expect(result.data.length).toBe(1);
    expect(result.data[0].leida).toBe(false);

    // Actualizar a leída
    await notificacionService.updateNotificacion(id, {
      destinatario: "paciente1",
      remitente: "sistema",
      mensaje: "Mensaje de prueba",
      leida: true,
    });

    // Ya no debería aparecer en sin leer
    result = await notificacionService.getAllNotificaciones({
      destinatario: "paciente1",
      leida: false,
    });

    expect(result.data.length).toBe(0);

    // Ahora debería aparecer como leída
    const leidas = await notificacionService.getAllNotificaciones({
      destinatario: "paciente1",
      leida: true,
    });

    expect(leidas.data.length).toBe(1);
    expect(leidas.data[0].leida).toBe(true);
  });

  test("debería fallar al intentar crear una notificación sin campos requeridos", async () => {
    try {
      await notificacionService.createNotificacion({
        destinatario: "paciente1",
      });
      throw new Error("No debería haber pasado");
    } catch (error) {
      expect(error.name).toBe("NotificacionMissingFieldsError");
      expect(error.status).toBe(400);
    }
  });

  test("debería fallar al intentar actualizar una notificación inexistente", async () => {
    const fakeId = "507f1f77bcf86cd799439011";

    try {
      await notificacionService.updateNotificacion(fakeId, {
        destinatario: "paciente1",
        remitente: "sistema",
        mensaje: "Mensaje inexistente",
        leida: true,
      });

      throw new Error("No debería haber pasado");
    } catch (error) {
      expect(error.name).toBe("NotificacionNotFoundError");
      expect(error.status).toBe(404);
    }
  });

  test("debería filtrar las notificaciones correctamente por destinatario", async () => {
    await notificacionService.createNotificacion({
      destinatario: "pacienteA",
      remitente: "sistema",
      mensaje: "Mensaje para A",
    });

    await notificacionService.createNotificacion({
      destinatario: "pacienteB",
      remitente: "sistema",
      mensaje: "Mensaje para B",
    });

    const notificacionesA = await notificacionService.getAllNotificaciones({
      destinatario: "pacienteA",
      leida: false,
    });

    const notificacionesB = await notificacionService.getAllNotificaciones({
      destinatario: "pacienteB",
      leida: false,
    });

    expect(notificacionesA.data.length).toBe(1);
    expect(notificacionesB.data.length).toBe(1);

    expect(notificacionesA.data[0].destinatario).toBe("pacienteA");
    expect(notificacionesB.data[0].destinatario).toBe("pacienteB");
  });

  test("Flujo de Demo: obtener notificaciones, simular creación post-turno y verificar la nueva notificación", async () => {
    const destinatarioDni = "pacienteDemo123";

    // 1. GET notificaciones inicial (debe estar vacío para este destinatario)
    let resultInicial = await notificacionService.getAllNotificaciones({
      destinatario: destinatarioDni,
    });
    expect(resultInicial.data.length).toBe(0);

    // 2. POST turno (Simulamos la notificación que crearía el TurnoService/Job de node-schedule)
    const nuevaNotificacion = await notificacionService.createNotificacion({
      destinatario: destinatarioDni,
      remitente: "sistema",
      mensaje:
        "Recordatorio: Tienes un turno asignado para mañana a las 15:30 hs con el médico de matrícula MN123.",
    });

    expect(nuevaNotificacion).toBeDefined();
    expect(nuevaNotificacion.destinatario).toBe(destinatarioDni);

    // 3. GET notificaciones nuevamente para verificar que la notificación programada apareció
    let resultFinal = await notificacionService.getAllNotificaciones({
      destinatario: destinatarioDni,
      leida: false,
    });

    expect(resultFinal.data.length).toBe(1);
    expect(resultFinal.data[0].mensaje).toContain(
      "Recordatorio: Tienes un turno",
    );
    expect(resultFinal.data[0].leida).toBe(false);

    // 4. Caso Borde: El paciente la marca como leída y ya no debe salir en la bandeja de 'sin leer'
    const idNotificacion = resultFinal.data[0].id || resultFinal.data[0]._id;
    await notificacionService.updateNotificacion(idNotificacion, {
      destinatario: resultFinal.data[0].destinatario,
      remitente: resultFinal.data[0].remitente,
      mensaje: resultFinal.data[0].mensaje,
      leida: true,
    });

    let resultSinLeer = await notificacionService.getAllNotificaciones({
      destinatario: destinatarioDni,
      leida: false,
    });
    expect(resultSinLeer.data.length).toBe(0);
  });
});
