import { turnoSchema, turnoCambioSchema } from "../validators/turnoSchemas.js";

describe("Turno Zod Schemas UNIT", () => {

    describe("turnoSchema", () => {
        test("debería ser válido con todos los campos correctos", () => {
            const datosValidos = {
                pacienteDni: "35123456",
                medicoMatricula: "MN1234",
                sede: "Sede Central",
                especialidad: "Cardiologia",
                fecha: "25-10-2026",
                hora: "10:30"
            };

            const result = turnoSchema.safeParse(datosValidos);
            expect(result.success).toBe(true);
        });

        test("debería fallar si no se envía ni especialidad ni práctica", () => {
            const datosIncompletos = {
                pacienteDni: "35123456",
                medicoMatricula: "MN1234",
                sede: "Sede Central",
                fecha: "25-10-2026",
                hora: "10:30"
            }; // Falta especialidad y practica

            const result = turnoSchema.safeParse(datosIncompletos);
            expect(result.success).toBe(false);
            expect(result.error.issues[0].message).toBe("El turno debe tener asociada una especialidad o una práctica.");
        });

        test("debería fallar si el formato de la fecha es incorrecto", () => {
            const datosFechaMala = {
                pacienteDni: "35123456",
                medicoMatricula: "MN1234",
                sede: "Sede Central",
                especialidad: "Cardiologia",
                fecha: "2026/10/25", // Formato incorrecto
                hora: "10:30"
            };

            const result = turnoSchema.safeParse(datosFechaMala);
            expect(result.success).toBe(false);
            expect(result.error.issues[0].message).toBe("El formato de la fecha debe ser DD-MM-AAAA.");
        });
    });

    describe("turnoCambioSchema (SuperRefine)", () => {
        test("debería rechazar una fecha anterior al día actual", () => {
            // Configuramos una fecha claramente en el pasado
            const payload = {
                fecha: "01-01-2000",
                hora: "10:30"
            };

            const result = turnoCambioSchema.safeParse(payload);

            expect(result.success).toBe(false);
            expect(result.error.issues.some(issue =>
                issue.message === "La nueva fecha del turno no puede ser anterior al día actual."
            )).toBe(true);
        });
    });
});