import { jest } from "@jest/globals";
import TurnoController from "../controllers/turno.controller.js";

describe("TurnoController UNIT", () => {
    let mockTurnoService;
    let turnoController;
    let req, res, next;

    beforeEach(() => {
        mockTurnoService = {
            createTurno: jest.fn(),
            getTurnos: jest.fn(),
            cambiarHorarioTurno: jest.fn(),
        };

        turnoController = new TurnoController({ turnoService: mockTurnoService });

        req = { body: {}, params: {}, query: {} };
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };
        next = jest.fn();
    });

    describe("createTurno", () => {
        test("debería devolver 201 y el ID del turno si la creación es exitosa", async () => {
            req.body = { pacienteDni: "123", medicoMatricula: "456", fecha: "20-05-2026", hora: "10:00" };
            mockTurnoService.createTurno.mockResolvedValue("id_turno_999");

            // Agregamos "next" a la llamada por buenas prácticas
            await turnoController.createTurno(req, res, next);

            expect(mockTurnoService.createTurno).toHaveBeenCalledWith(req.body);
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({ id: "id_turno_999" });
            expect(next).not.toHaveBeenCalled(); // Validamos que no haya errores
        });

        test("debería atrapar el error del servicio y delegarlo a next()", async () => {
            const mockError = new Error("El médico ya tiene un turno");
            mockError.statusCode = 409;
            mockTurnoService.createTurno.mockRejectedValue(mockError);

            // Ahora sí le pasamos "next" para que el .catch(next) funcione
            await turnoController.createTurno(req, res, next);

            // Validamos que el controlador haya delegado la responsabilidad al middleware de errores
            expect(next).toHaveBeenCalledWith(mockError);

            // Validamos que el controlador no haya intentado responder por su cuenta
            expect(res.status).not.toHaveBeenCalled();
            expect(res.json).not.toHaveBeenCalled();
        });
    });

    describe("getAllTurnos (Paginación)", () => {
        test("debería separar page y limit y pasarlos al servicio junto con los filtros", async () => {
            req.query = { page: "2", limit: "5", estado: "RESERVADO" };
            const respuestaMock = { data: [], meta: { currentPage: 2 } };

            mockTurnoService.getTurnos.mockResolvedValue(respuestaMock);

            await turnoController.getAllTurnos(req, res, next);

            // Verificamos que parsea a enteros y separa correctamente el objeto de filtros
            expect(mockTurnoService.getTurnos).toHaveBeenCalledWith(2, 5, { estado: "RESERVADO" });
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(respuestaMock);
        });
    });

    describe("cambiarHorarioTurno", () => {
        test("debería devolver mensaje de éxito con status 200", async () => {
            req.params = { id: "turno123" };
            req.body = { fecha: "25-05-2026", hora: "16:00" };

            mockTurnoService.cambiarHorarioTurno.mockResolvedValue("turno123");

            await turnoController.cambiarHorarioTurno(req, res, next);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                message: "El horario del turno con ID turno123 ha sido modificado exitosamente."
            });
        });
    });

    describe("cancelTurno", () => {
        test("debería lanzar error si un paciente intenta cancelar turno de otro", async () => {
            req.user = { rol: "PACIENTE", identificador: "111" };
            req.params = { id: "turno1" };
            mockTurnoService.getTurnoById = jest.fn().mockResolvedValue({ pacienteDni: "222", medicoMatricula: "333" });

            await turnoController.cancelTurno(req, res, next);

            expect(mockTurnoService.getTurnoById).toHaveBeenCalledWith("turno1");
            expect(next).toHaveBeenCalledWith(expect.any(Error)); // AccessDeniedByIDTurno
        });

        test("debería cancelar el turno si el paciente es el dueño", async () => {
            req.user = { rol: "PACIENTE", identificador: "111" };
            req.params = { id: "turno1" };
            mockTurnoService.getTurnoById = jest.fn().mockResolvedValue({ pacienteDni: "111", medicoMatricula: "333" });
            mockTurnoService.cancelTurno = jest.fn().mockResolvedValue(true);

            await turnoController.cancelTurno(req, res, next);

            expect(mockTurnoService.cancelTurno).toHaveBeenCalledWith("turno1");
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ message: "Turno con ID turno1 cancelado exitosamente." });
        });
    });

    describe("updateTurno", () => {
        test("debería lanzar error si el usuario no es el dueño", async () => {
            req.user = { rol: "MEDICO", identificador: "999" };
            req.params = { id: "t1" };
            req.body = { estado: "CONFIRMADO" };
            mockTurnoService.getTurnoById = jest.fn().mockResolvedValue({ medicoMatricula: "888" });

            await turnoController.updateTurno(req, res, next);

            expect(next).toHaveBeenCalledWith(expect.any(Error));
        });

        test("debería confirmar turno y devolver 200", async () => {
            req.user = { rol: "MEDICO", identificador: "888" };
            req.params = { id: "t1" };
            req.body = { estado: "CONFIRMADO" };
            mockTurnoService.getTurnoById = jest.fn().mockResolvedValue({ medicoMatricula: "888" });
            mockTurnoService.confirmarTurno = jest.fn().mockResolvedValue("t1");

            await turnoController.updateTurno(req, res, next);

            expect(mockTurnoService.confirmarTurno).toHaveBeenCalledWith("t1");
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ message: "Turno t1 confirmado exitosamente." });
        });

        test("debería marcar como REALIZADO y devolver 200", async () => {
            req.user = { rol: "MEDICO", identificador: "888" };
            req.params = { id: "t1" };
            req.body = { estado: "REALIZADO" };
            mockTurnoService.getTurnoById = jest.fn().mockResolvedValue({ medicoMatricula: "888" });
            mockTurnoService.marcarTurnoComoRealizado = jest.fn().mockResolvedValue("t1");

            await turnoController.updateTurno(req, res, next);

            expect(mockTurnoService.marcarTurnoComoRealizado).toHaveBeenCalledWith("t1");
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ message: "Turno t1 marcado como REALIZADO." });
        });
    });
});