import Paciente from "../domain/Paciente.js";
import { PacienteMissingFieldsError } from "../errors/paciente.errors.js";

describe("Paciente Domain UNIT", () => {
    test("debería instanciar correctamente con todos los campos válidos", () => {
        const paciente = new Paciente({
            usuario: "jperez",
            dni: "12345678",
            nombre: "Juan Perez",
            obraSocial: "OSDE",
            plan: "210"
        });

        expect(paciente.dni).toBe("12345678");
        expect(paciente.obraSocial).toBe("OSDE");
    });

    test("debería fallar al intentar crearse si falta el DNI (Regla de integridad)", () => {
        expect(() => new Paciente({
            usuario: "jperez",
            nombre: "Juan Perez"
        })).toThrow(PacienteMissingFieldsError);
    });

    test("debería permitir la instanciación de pacientes particulares sin obra social ni plan", () => {
        const paciente = new Paciente({
            usuario: "jperez",
            dni: "12345678",
            nombre: "Juan Perez"
        });

        expect(paciente.obraSocial).toBeNull();
        expect(paciente.plan).toBeNull();
    });
});