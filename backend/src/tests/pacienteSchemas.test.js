import { pacienteSchema, pacienteUpdateSchema } from "../validators/pacienteSchemas.js";

describe("Paciente Zod Schemas UNIT", () => {

    describe("pacienteSchema (Creación)", () => {
        test("debería aprobar un paciente con todos los datos correctos y obra social opcional", () => {
            const datosValidos = {
                dni: "35123456",
                usuario: "juanp",
                password: "password123", // <-- AGREGADO
                nombre: "Juan Perez",
                obraSocial: "6a03ad88f02e9ee201078196",
                plan: "210"
            };

            const result = pacienteSchema.safeParse(datosValidos);
            expect(result.success).toBe(true);
        });

        test("debería fallar si el DNI tiene menos de 7 caracteres", () => {
            const datosDniCorto = {
                dni: "123456",
                usuario: "juanp",
                password: "password123", // <-- AGREGADO
                nombre: "Juan Perez"
            };

            const result = pacienteSchema.safeParse(datosDniCorto);
            expect(result.success).toBe(false);
            expect(result.error.issues[0].message).toBe("El DNI debe tener al menos 7 caracteres.");
        });
    });

    describe("pacienteUpdateSchema (Actualización Parcial)", () => {
        test("debería permitir actualizar SOLAMENTE el nombre sin requerir el DNI", () => {
            const payloadActualizacion = {
                nombre: "Juan Carlos Perez"
            };

            const result = pacienteUpdateSchema.safeParse(payloadActualizacion);
            expect(result.success).toBe(true);
        });
    });
});