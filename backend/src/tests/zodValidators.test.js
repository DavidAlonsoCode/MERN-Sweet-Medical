import { medicoSchema } from "../validators/medicoSchemas.js";
import { pacienteSchema, pacienteUpdateSchema } from "../validators/pacienteSchemas.js";

describe("Zod Validators UNIT", () => {
    describe("medicoSchema", () => {
        test("debería validar un objeto medico completo y correcto", () => {
            const data = {
                usuario: "drmario",
                matricula: "MN001",
                nombre: "Mario B",
                password: "password123",
                especialidades: ["5f8d04f1b54764421b7156d1"]
            };
            const result = medicoSchema.safeParse(data);
            expect(result.success).toBe(true);
        });

        test("debería fallar si falta la matricula", () => {
            const data = { usuario: "drmario", nombre: "Mario B", password: "password123" };
            const result = medicoSchema.safeParse(data);
            expect(result.success).toBe(false);
            expect(result.error.issues[0].path).toContain("matricula");
        });

        test("debería fallar si el password es menor a 6 caracteres", () => {
            const data = { usuario: "drmario", matricula: "MN001", nombre: "Mario B", password: "123" };
            const result = medicoSchema.safeParse(data);
            expect(result.success).toBe(false);
            expect(result.error.issues[0].message).toBe("La contraseña debe tener al menos 6 caracteres");
        });

        test("debería fallar si se envia una especialidad con id invalido", () => {
            const data = { usuario: "drmario", matricula: "MN001", nombre: "Mario B", password: "password123", especialidades: ["id_invalido"] };
            const result = medicoSchema.safeParse(data);
            expect(result.success).toBe(false);
            expect(result.error.issues[0].message).toBe("Formato de ID de especialidad inválido");
        });
    });

    describe("pacienteSchema", () => {
        test("debería validar un paciente valido", () => {
            const data = { dni: "1234567", usuario: "userp", nombre: "Paco", password: "password123" };
            const result = pacienteSchema.safeParse(data);
            expect(result.success).toBe(true);
        });

        test("debería fallar si el DNI es menor a 7 caracteres", () => {
            const data = { dni: "123456", usuario: "userp", nombre: "Paco", password: "password123" };
            const result = pacienteSchema.safeParse(data);
            expect(result.success).toBe(false);
            expect(result.error.issues[0].message).toBe("El DNI debe tener al menos 7 caracteres.");
        });

        test("debería fallar si el nombre falta", () => {
            const data = { dni: "12345678", usuario: "userp", password: "password123" };
            const result = pacienteSchema.safeParse(data);
            expect(result.success).toBe(false);
            expect(result.error.issues[0].path).toContain("nombre");
        });
    });

    describe("pacienteUpdateSchema", () => {
        test("debería permitir actualizar solo la obra social", () => {
            const data = { obraSocial: "OSDE" };
            const result = pacienteUpdateSchema.safeParse(data);
            expect(result.success).toBe(true);
        });

        test("debería fallar si se envia un nombre vacio o muy corto", () => {
            const data = { nombre: "A" };
            const result = pacienteUpdateSchema.safeParse(data);
            expect(result.success).toBe(false);
            expect(result.error.issues[0].message).toBe("El nombre debe tener al menos 2 caracteres.");
        });

        test("debería ignorar (o fallar dependiendo de Zod strict) un DNI enviado ya que no esta en el schema", () => {
            const data = { nombre: "Juan", dni: "12345678" };
            const result = pacienteUpdateSchema.safeParse(data);
            // Zod object (sin .strict()) elimina las keys no declaradas pero retorna success
            expect(result.success).toBe(true);
            expect(result.data.dni).toBeUndefined(); // Se filtra el dni
        });
    });
});
