import { medicoHasTurno } from "../validators/medicoDisponibilidad.js";

describe("Medico Disponibilidad Validators UNIT", () => {
    let mockMedico;

    beforeEach(() => {
        mockMedico = {
            matricula: "MN123",
            // Simulamos que todos sus turnos duran 30 minutos
            calcularDuracionTurno: () => 30
        };
    });

    test("debería permitir agendar si el médico no tiene ningún turno", async () => {
        const turnosMedico = [];
        const fechaHoraTurnoNuevo = new Date("2026-05-20T10:00:00");

        await expect(medicoHasTurno(turnosMedico, fechaHoraTurnoNuevo, mockMedico))
            .resolves.toBeUndefined();
    });

    test("debería rechazar si el turno nuevo pisa exactamente el horario de un turno existente", async () => {
        const turnosMedico = [
            { estado: "RESERVADO", fechaHora: new Date("2026-05-20T10:00:00") }
        ];
        const fechaHoraTurnoNuevo = new Date("2026-05-20T10:00:00");

        await expect(medicoHasTurno(turnosMedico, fechaHoraTurnoNuevo, mockMedico))
            .rejects.toThrow(); // Lanza TurnoDuplicatedError
    });

    test("debería rechazar si el turno nuevo ocurre DURANTE la ejecución de otro turno (colisión)", async () => {
        const turnosMedico = [
            { estado: "RESERVADO", fechaHora: new Date("2026-05-20T10:00:00") } // Termina 10:30
        ];
        // Intentamos agendar 10:15 (faltan 15 min para que termine el anterior)
        const fechaHoraTurnoNuevo = new Date("2026-05-20T10:15:00");

        await expect(medicoHasTurno(turnosMedico, fechaHoraTurnoNuevo, mockMedico))
            .rejects.toThrow();
    });

    test("debería permitir agendar si el turno superpuesto está CANCELADO", async () => {
        const turnosMedico = [
            { estado: "CANCELADO", fechaHora: new Date("2026-05-20T10:00:00") }
        ];
        const fechaHoraTurnoNuevo = new Date("2026-05-20T10:00:00"); // Mismo horario, pero libre

        await expect(medicoHasTurno(turnosMedico, fechaHoraTurnoNuevo, mockMedico))
            .resolves.toBeUndefined();
    });

    test("debería permitir agendar si hay tiempo suficiente entre turnos", async () => {
        const turnosMedico = [
            { estado: "RESERVADO", fechaHora: new Date("2026-05-20T10:00:00") } // Termina 10:30
        ];
        // Intentamos agendar a las 11:00 (hay 30 minutos de margen)
        const fechaHoraTurnoNuevo = new Date("2026-05-20T11:00:00");

        await expect(medicoHasTurno(turnosMedico, fechaHoraTurnoNuevo, mockMedico))
            .resolves.toBeUndefined();
    });
});