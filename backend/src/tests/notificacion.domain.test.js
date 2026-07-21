import Notificacion from "../domain/Notificacion.js";
import { NotificacionMissingFieldsError } from "../errors/notificacion.errors.js";

describe("Notificacion Domain UNIT", () => {
    test("debería instanciarse con estado 'no leída' por defecto", () => {
        const notificacion = new Notificacion({
            destinatario: "paciente1",
            remitente: "sistema",
            mensaje: "Turno confirmado"
        });

        expect(notificacion.leida).toBe(false);
        expect(notificacion.fechaCreacion).toBeInstanceOf(Date);
        expect(notificacion.fechaLeida).toBeNull();
    });

    test("debería cambiar de estado, marcándose como leída y asignar fecha", () => {
        const notificacion = new Notificacion({
            destinatario: "paciente1",
            remitente: "sistema",
            mensaje: "Turno confirmado"
        });

        notificacion.marcarComoLeida();

        expect(notificacion.leida).toBe(true);
        expect(notificacion.fechaLeida).toBeInstanceOf(Date);
    });

    test("no debería sobreescribir la fecha si la notificación ya estaba leída", () => {
        const fechaLecturaOriginal = new Date("2026-01-01T10:00:00");
        const notificacion = new Notificacion({
            destinatario: "paciente1",
            remitente: "sistema",
            mensaje: "Turno confirmado",
            leida: true,
            fechaLeida: fechaLecturaOriginal
        });

        notificacion.marcarComoLeida(); // Intentamos mutar otra vez

        expect(notificacion.fechaLeida.getTime()).toBe(fechaLecturaOriginal.getTime());
    });

    test("debería bloquear la creación si el objeto no tiene mensaje", () => {
        expect(() => new Notificacion({
            destinatario: "paciente1",
            remitente: "sistema"
        })).toThrow(NotificacionMissingFieldsError);
    });
});