import Turno from "../domain/Turno.js";
import {
  TurnoEnFuturoError,
  TurnoMandatoryFieldError,
  TurnoServiceRequiredError
} from "../errors/turno.errors.js";
import { jest } from "@jest/globals";

describe("Turno Domain", () => {

  const turnoValidoBase = {
    id: "123",
    pacienteDni: "40111222",
    medicoMatricula: "1234",
    fechaHora: new Date("2026-06-20T10:00:00"),
    sede: "SEDE_CENTRAL",
    especialidad: "Cardiologia",
  }

  describe("Validaciones de instanciación correcta", () => {
    it("debería crear un turno correctamente", () => {
      const turno = new Turno(turnoValidoBase);

      expect(turno.pacienteDni).toBe("40111222");
      expect(turno.estado).toBe("RESERVADO");
      expect(turno.sede).toBe("SEDE_CENTRAL");
    });

    it('debería instanciar correctamente pasando fecha y hora como strings', () => {
      const turnoString = {
        ...turnoValidoBase,
        fechaHora: undefined,
        fecha: '15-05-2026',
        hora: '10:30'
      };

      const turno = new Turno(turnoString);

      // Mes en Date es 0-index (4 = Mayo)
      expect(turno.fechaHora.getFullYear()).toBe(2026);
      expect(turno.fechaHora.getMonth()).toBe(4);
      expect(turno.fechaHora.getHours()).toBe(10);
      expect(turno.fechaHora.getMinutes()).toBe(30);
    });

    it('debería lanzar TurnoServiceRequiredError si no hay especialidad o práctica', () => {
      const turnoSinServicio = { ...turnoValidoBase, especialidad: undefined, practica: undefined };

      expect(() => new Turno(turnoSinServicio)).toThrow(TurnoServiceRequiredError);
    });

    it('debería lanzar TurnoMandatoryFieldError si falta el DNI del paciente', () => {
      const turnoSinDni = { ...turnoValidoBase, pacienteDni: undefined };

      expect(() => new Turno(turnoSinDni)).toThrow(TurnoMandatoryFieldError);
    });
  })


  describe('marcar un turno como realizado', () => {
    beforeAll(() => {
      // Congelamos el tiempo global de Jest para pruebas predecibles
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2026-05-15T15:00:00Z'));
    });

    afterAll(() => {
      jest.useRealTimers();
    });

    it('debería marcar un turno como realizado si la fechaHora es en el pasado', () => {
      const turnoPasado = new Turno({
        ...turnoValidoBase,
        fechaHora: new Date('2026-05-15T10:00:00Z') // 5 horas antes
      });

      turnoPasado.marcarComoRealizado();
      expect(turnoPasado.estado).toBe('REALIZADO');
    });

    it('debería lanzar TurnoEnFuturoError si se intenta marcar como realizado un turno futuro', () => {
      const turnoFuturo = new Turno({
        ...turnoValidoBase,
        fechaHora: new Date('2026-05-15T20:00:00Z') // 5 horas en el futuro
      });

      expect(() => turnoFuturo.marcarComoRealizado()).toThrow(TurnoEnFuturoError);
    });
  })
});

