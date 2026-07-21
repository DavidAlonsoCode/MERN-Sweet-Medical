import { jest } from "@jest/globals";
import MedicoController from "../controllers/medico.controller.js";
import { Unauthorized, AccessDeniedByIDMedico } from "../errors/auth.errors.js";

describe("MedicoController UNIT", () => {
    let mockMedicoService;
    let medicoController;
    let req, res, next;

    beforeEach(() => {
        mockMedicoService = {
            createMedico: jest.fn(),
            getMedicos: jest.fn(),
            getMedicoByMatricula: jest.fn(),
            updateMedicoByMatricula: jest.fn(),
            deleteMedicoByMatricula: jest.fn(),
        };

        medicoController = new MedicoController({ medicoService: mockMedicoService });

        req = { body: {}, params: {}, query: {}, user: {} };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
            send: jest.fn()
        };
        next = jest.fn();
    });

    describe("getMedicos", () => {
        test("debería devolver lista de médicos y status 200", async () => {
            req.query = { especialidad: "Cardiología" };
            mockMedicoService.getMedicos.mockResolvedValue([{ nombre: "Dr. Perez" }]);

            await medicoController.getMedicos(req, res, next);

            expect(mockMedicoService.getMedicos).toHaveBeenCalledWith({ especialidad: "Cardiología" });
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith([{ nombre: "Dr. Perez" }]);
        });
    });

    describe("getMedicoByMatricula", () => {
        test("debería devolver error Unauthorized si no es MEDICO", async () => {
            req.user = { rol: "PACIENTE", identificador: "123" };
            req.params = { matricula: "456" };

            await medicoController.getMedicoByMatricula(req, res, next);

            expect(next).toHaveBeenCalledWith(expect.any(Unauthorized));
            expect(mockMedicoService.getMedicoByMatricula).not.toHaveBeenCalled();
        });

        test("debería devolver error AccessDenied si intenta ver la matricula de otro medico", async () => {
            req.user = { rol: "MEDICO", identificador: "456" };
            req.params = { matricula: "789" };

            await medicoController.getMedicoByMatricula(req, res, next);

            expect(next).toHaveBeenCalledWith(expect.any(AccessDeniedByIDMedico));
            expect(mockMedicoService.getMedicoByMatricula).not.toHaveBeenCalled();
        });

        test("debería devolver 200 si es el mismo medico consultando", async () => {
            req.user = { rol: "MEDICO", identificador: "456" };
            req.params = { matricula: "456" };
            mockMedicoService.getMedicoByMatricula.mockResolvedValue({ matricula: "456", nombre: "Dr. A" });

            await medicoController.getMedicoByMatricula(req, res, next);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ matricula: "456", nombre: "Dr. A" });
        });
    });

    describe("createMedico", () => {
        test("debería crear el médico y devolver 201", async () => {
            req.body = { nombre: "Juan", matricula: "111" };
            mockMedicoService.createMedico.mockResolvedValue("id_nuevo");

            await medicoController.createMedico(req, res, next);

            expect(mockMedicoService.createMedico).toHaveBeenCalledWith(req.body);
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({ id: "id_nuevo" });
        });
    });
});
