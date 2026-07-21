import { jest } from "@jest/globals";
import jwt from "jsonwebtoken";
import AuthService from "../services/auth.services.js";

describe("AuthService UNIT", () => {
    let mockPacienteService;
    let mockMedicoService;
    let mockTurnoService;
    let mockNotificacionService;
    let authService;

    beforeEach(() => {
        mockPacienteService = { getPacienteByUsuario: jest.fn() };
        mockMedicoService = { getMedicoByUsuario: jest.fn(), getMedicoByMatricula: jest.fn() };
        mockTurnoService = { getTurnos: jest.fn() };
        mockNotificacionService = { createNotificacion: jest.fn() };

        authService = new AuthService({
            pacienteService: mockPacienteService,
            medicoService: mockMedicoService,
            turnoService: mockTurnoService,
            notificacionService: mockNotificacionService
        });
    });

    describe("login", () => {
        test("debería lanzar error si credenciales son inválidas (usuario no existe)", async () => {
            mockPacienteService.getPacienteByUsuario.mockResolvedValue(null);
            mockMedicoService.getMedicoByUsuario.mockResolvedValue(null);

            await expect(authService.login("userX", "pass123")).rejects.toThrow("Credenciales inválidas.");
        });

        test("debería lanzar error si password es incorrecto", async () => {
            mockPacienteService.getPacienteByUsuario.mockResolvedValue({ password: "correct_password" });

            await expect(authService.login("userX", "wrong_password")).rejects.toThrow("Credenciales inválidas.");
        });

        test("debería loguear a un paciente, emitir token y disparar recordatorio", async () => {
            const mockPaciente = { _id: "1", usuario: "paciente1", nombre: "Juan", dni: "123", password: "123" };
            mockPacienteService.getPacienteByUsuario.mockResolvedValue(mockPaciente);
            
            authService._procesarRecordatorioDiaPrevio = jest.fn().mockResolvedValue();

            const res = await authService.login("paciente1", "123");

            expect(res.token).toBeDefined();
            expect(res.user).toEqual({ nombre: "Juan", usuario: "paciente1", rol: "PACIENTE", identificador: "123" });
            expect(authService._procesarRecordatorioDiaPrevio).toHaveBeenCalledWith("123");
        });

        test("debería loguear a un medico, emitir token y NO disparar recordatorio", async () => {
            mockPacienteService.getPacienteByUsuario.mockResolvedValue(null);
            const mockMedico = { _id: "2", usuario: "medico1", nombre: "Dr. A", matricula: "456", password: "abc" };
            mockMedicoService.getMedicoByUsuario.mockResolvedValue(mockMedico);

            authService._procesarRecordatorioDiaPrevio = jest.fn().mockResolvedValue();

            const res = await authService.login("medico1", "abc");

            expect(res.token).toBeDefined();
            expect(res.user).toEqual({ nombre: "Dr. A", usuario: "medico1", rol: "MEDICO", identificador: "456" });
            expect(authService._procesarRecordatorioDiaPrevio).not.toHaveBeenCalled();
        });

        test("debería firmar el JWT con los datos correctos", async () => {
            const mockPaciente = { _id: "1", usuario: "paciente1", nombre: "Juan", dni: "123", password: "123" };
            mockPacienteService.getPacienteByUsuario.mockResolvedValue(mockPaciente);
            authService._procesarRecordatorioDiaPrevio = jest.fn().mockResolvedValue();

            const jwtSignSpy = jest.spyOn(jwt, "sign");
            
            await authService.login("paciente1", "123");

            expect(jwtSignSpy).toHaveBeenCalledWith(
                {
                    id: "1",
                    usuario: "paciente1",
                    nombre: "Juan",
                    rol: "PACIENTE",
                    identificador: "123"
                },
                expect.any(String),
                { expiresIn: "4h" }
            );
            jwtSignSpy.mockRestore();
        });
    });
});
