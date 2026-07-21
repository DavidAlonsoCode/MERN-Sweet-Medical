import { jest } from "@jest/globals";
import PacienteController from "../controllers/paciente.controller.js";

describe("PacienteController UNIT", () => {
    let mockPacienteService;
    let pacienteController;
    let req, res, next;

    beforeEach(() => {
        // 1. Mockeamos el servicio para aislar el controlador (Bajo acoplamiento)
        mockPacienteService = {
            createPaciente: jest.fn(),
            getPacientes: jest.fn(),
            getPacienteByDni: jest.fn(),
            updatePacienteByDni: jest.fn(),
            deletePacienteByDni: jest.fn(),
        };

        pacienteController = new PacienteController({
            pacienteService: mockPacienteService,
        });

        // 2. Mockeamos los objetos de Express (req, res, next)
        req = { body: {}, params: {}, query: {} };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            send: jest.fn(),
        };
        next = jest.fn();
    });

    describe("createPaciente", () => {
        test("debería devolver status 201 y el ID al crear exitosamente", async () => {
            req.body = { dni: "12345678", nombre: "Juan", usuario: "juan123" };
            mockPacienteService.createPaciente.mockResolvedValue("id_mock_123");

            await pacienteController.createPaciente(req, res, next);

            expect(mockPacienteService.createPaciente).toHaveBeenCalledWith(req.body);
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({ id: "id_mock_123" });
            expect(next).not.toHaveBeenCalled();
        });

        test("debería llamar a next(error) si el servicio falla", async () => {
            const mockError = new Error("Error interno");
            mockPacienteService.createPaciente.mockRejectedValue(mockError);

            await pacienteController.createPaciente(req, res, next);

            expect(next).toHaveBeenCalledWith(mockError);
            expect(res.status).not.toHaveBeenCalled();
        });
    });

    describe("getPacienteByDni", () => {
        test("debería devolver status 200 y el paciente solicitado", async () => {
            req.params = { dni: "12345678" };
            req.user = { rol: "PACIENTE", identificador: "12345678" };
            const pacienteMock = { dni: "12345678", nombre: "Juan" };
            mockPacienteService.getPacienteByDni.mockResolvedValue(pacienteMock);

            await pacienteController.getPacienteByDni(req, res, next);

            expect(mockPacienteService.getPacienteByDni).toHaveBeenCalledWith("12345678");
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(pacienteMock);
        });
    });
});