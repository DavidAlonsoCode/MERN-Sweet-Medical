import { jest } from "@jest/globals";

import PacienteService from "../services/paciente.service.js";

import {
  PacienteAlreadyExistsError,
  PacienteNotFoundError,
} from "../errors/paciente.errors.js";

describe("PacienteService UNIT", () => {
  let pacienteRepository;
  let pacienteService;

  beforeEach(() => {
    // Mock del repository
    pacienteRepository = {
      getPacienteByDni: jest.fn(),
      createPaciente: jest.fn(),
      updatePacienteByDni: jest.fn(),
      deletePacienteByDni: jest.fn(),
      getAllPacientes: jest.fn(),
    };

    // Inyección del mock
    pacienteService = new PacienteService({
      pacienteRepository,
    });
  });

  describe("createPaciente", () => {
    test("debería crear un paciente correctamente", async () => {
      const pacienteData = {
        dni: "40111222",
        nombre: "Juan Perez",
        usuario: "jperez",
        obraSocial: "OSDE",
        plan: "210",
      };

      pacienteRepository.getPacienteByDni.mockResolvedValue(null);

      pacienteRepository.createPaciente.mockResolvedValue({
        _id: "abc123",
      });

      const result = await pacienteService.createPaciente(
        pacienteData
      );

      expect(result).toBe("abc123");

      expect(
        pacienteRepository.getPacienteByDni
      ).toHaveBeenCalledWith("40111222");

      expect(
        pacienteRepository.createPaciente
      ).toHaveBeenCalledTimes(1);
    });

    test("debería fallar si el paciente ya existe", async () => {
      const pacienteData = {
        dni: "40111222",
        nombre: "Juan Perez",
        usuario: "jperez",
        obraSocial: "OSDE",
        plan: "210",
        };

      pacienteRepository.getPacienteByDni.mockResolvedValue({
        dni: "40111222",
        nombre: "Juan Perez",
        usuario: "jperez",
        obraSocial: "OSDE",
        plan: "210",
        })

      await expect(
        pacienteService.createPaciente(pacienteData)
      ).rejects.toThrow(PacienteAlreadyExistsError);

      expect(
        pacienteRepository.createPaciente
      ).not.toHaveBeenCalled();
    });
  });

  describe("getPacienteByDni", () => {
    test("debería devolver un paciente existente", async () => {
      pacienteRepository.getPacienteByDni.mockResolvedValue({
        dni: "40111222",
        nombre: "Juan Perez",
        usuario: "jperez",
        obraSocial: "OSDE",
        plan: "210",
      });

      const result = await pacienteService.getPacienteByDni(
        "40111222"
      );

      expect(result.dni).toBe("40111222");

      expect(
        pacienteRepository.getPacienteByDni
      ).toHaveBeenCalledWith("40111222");
    });

    test("debería fallar si el paciente no existe", async () => {
      pacienteRepository.getPacienteByDni.mockResolvedValue(
        null
      );

      await expect(
        pacienteService.getPacienteByDni("999")
      ).rejects.toThrow(PacienteNotFoundError);
    });
  });

  describe("updatePacienteByDni", () => {
    test("debería actualizar un paciente correctamente", async () => {
      pacienteRepository.getPacienteByDni.mockResolvedValue({
        dni: "40111222",
        nombre: "Juan Perez",
        usuario: "jperez",
        obraSocial: "OSDE",
        plan: "210",
      });

      pacienteRepository.updatePacienteByDni.mockResolvedValue({
        dni: "40111222",
        nombre: "Juan Actualizado",
      });

      await pacienteService.updatePacienteByDni(
        "40111222",
        {
          nombre: "Juan Actualizado",
        }
      );

      expect(
        pacienteRepository.updatePacienteByDni
      ).toHaveBeenCalledTimes(1);
    });

    test("debería fallar al actualizar un paciente inexistente", async () => {
      pacienteRepository.getPacienteByDni.mockResolvedValue(
        null
      );

      await expect(
        pacienteService.updatePacienteByDni("999", {
          nombre: "Nuevo Nombre",
        })
      ).rejects.toThrow(PacienteNotFoundError);
    });
  });

  describe("deletePacienteByDni", () => {
    test("debería eliminar un paciente correctamente", async () => {
      pacienteRepository.deletePacienteByDni.mockResolvedValue({
        dni: "40111222",
      });

      await expect(
        pacienteService.deletePacienteByDni(
          "40111222"
        )
      ).resolves.toBeDefined();

      expect(
        pacienteRepository.deletePacienteByDni
      ).toHaveBeenCalledWith("40111222");
    });

    test("debería fallar si el paciente no existe", async () => {
      pacienteRepository.deletePacienteByDni.mockResolvedValue(
        null
      );

      await expect(
        pacienteService.deletePacienteByDni("999")
      ).rejects.toThrow(PacienteNotFoundError);
    });
  });

  describe("getPacientes", () => {
    test("debería devolver pacientes paginados", async () => {
      pacienteRepository.getAllPacientes.mockResolvedValue({
        data: [
          {
            dni: "40111222",
            nombre: "Juan Perez",
          },
        ],
        meta: {
          totalItems: 1,
          currentPage: 1,
        },
      });

      const result = await pacienteService.getPacientes(
        1,
        10
      );

      expect(result.data.length).toBe(1);

      expect(
        pacienteRepository.getAllPacientes
      ).toHaveBeenCalled();
    });
  });
});

