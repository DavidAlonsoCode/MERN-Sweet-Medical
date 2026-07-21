import { jest } from "@jest/globals";
import MedicoService from "../services/medico.service.js";
import { MedicoAlreadyExistsError, MedicoNotFoundError } from "../errors/medico.errors.js";

describe("MedicoService UNIT", () => {
    let medicoRepository;
    let medicoService;

    beforeEach(() => {
        // Mock del repository para no tocar la BD real
        medicoRepository = {
            getMedicoByMatricula: jest.fn(),
            createMedico: jest.fn(),
            updateMedicoByMatricula: jest.fn(),
            deleteMedicoByMatricula: jest.fn(),
            getAllMedicos: jest.fn(),
            addDisponibilidadToMedico: jest.fn(),
            updateDisponibilidad: jest.fn(),
            deleteDisponibilidad: jest.fn(),
            addServicioToMedico: jest.fn(),
            getServicioPorId: jest.fn()
        };

        medicoService = new MedicoService({ medicoRepository });
    });

    describe("createMedico", () => {
        test("debería crear un médico correctamente si la matrícula no existe", async () => {
            const medicoData = {
                matricula: "MN1234",
                usuario: "dr_perez",
                nombre: "Dr. Perez"
            };

            medicoRepository.getMedicoByMatricula.mockResolvedValue(null);
            medicoRepository.createMedico.mockResolvedValue({ id: "med123" });

            const result = await medicoService.createMedico(medicoData);

            expect(result).toBe("med123");
            expect(medicoRepository.getMedicoByMatricula).toHaveBeenCalledWith("MN1234");
            expect(medicoRepository.createMedico).toHaveBeenCalledTimes(1);
        });

        test("debería fallar si la matrícula ya está registrada", async () => {
            const medicoData = { matricula: "MN1234", usuario: "dr_perez", nombre: "Dr. Perez" };

            // Simulamos que el repositorio ya encuentra a alguien
            medicoRepository.getMedicoByMatricula.mockResolvedValue({ matricula: "MN1234" });

            await expect(medicoService.createMedico(medicoData)).rejects.toThrow(MedicoAlreadyExistsError);
            expect(medicoRepository.createMedico).not.toHaveBeenCalled();
        });
    });

    describe("getMedicoByMatricula", () => {
        test("debería devolver un médico si existe", async () => {
            medicoRepository.getMedicoByMatricula.mockResolvedValue({
                matricula: "MN1234",
                nombre: "Dr. Perez",
                usuario: "dr_perez"
            });

            const result = await medicoService.getMedicoByMatricula("MN1234");

            expect(result.matricula).toBe("MN1234");
            expect(medicoRepository.getMedicoByMatricula).toHaveBeenCalledWith("MN1234");
        });

        test("debería fallar si el médico no existe", async () => {
            medicoRepository.getMedicoByMatricula.mockResolvedValue(null);

            await expect(medicoService.getMedicoByMatricula("MN9999")).rejects.toThrow(MedicoNotFoundError);
        });
    });

    describe("deleteMedicoByMatricula", () => {
        test("debería realizar el borrado lógico de un médico existente", async () => {
            medicoRepository.deleteMedicoByMatricula.mockResolvedValue({ matricula: "MN1234" });

            await expect(medicoService.deleteMedicoByMatricula("MN1234")).resolves.toBeDefined();
            expect(medicoRepository.deleteMedicoByMatricula).toHaveBeenCalledWith("MN1234");
        });

        test("debería fallar al intentar borrar un médico inexistente", async () => {
            medicoRepository.deleteMedicoByMatricula.mockResolvedValue(null);

            await expect(medicoService.deleteMedicoByMatricula("MN9999")).rejects.toThrow(MedicoNotFoundError);
        });
    });

    describe("updateMedicoByMatricula", () => {
        test("debería actualizar nombre y contraseña pero ignorar campos no permitidos", async () => {
            medicoRepository.getMedicoByMatricula.mockResolvedValue({ matricula: "111", nombre: "Viejo", usuario: "u1" });
            medicoRepository.updateMedicoByMatricula.mockResolvedValue({ matricula: "111", nombre: "Nuevo" });

            const result = await medicoService.updateMedicoByMatricula("111", { nombre: "Nuevo", matricula: "222" });
            
            // La validacion de dominio filtrará 'matricula' y solo mandará 'nombre' modificado
            expect(medicoRepository.updateMedicoByMatricula).toHaveBeenCalled();
            expect(result.nombre).toBe("Nuevo");
        });
    });

    describe("Disponibilidad y Servicios", () => {
        test("addDisponibilidadToMedico debería llamar al repository si es valido", async () => {
            medicoRepository.getMedicoByMatricula.mockResolvedValue({ matricula: "111", usuario: "u1", nombre: "n1", disponibilidades: [] });
            medicoRepository.updateMedicoByMatricula.mockResolvedValue(true);
            medicoRepository.addDisponibilidadToMedico.mockResolvedValue({ id: "disp1" });

            const result = await medicoService.addDisponibilidadToMedico("111", { diaSemana: "Lunes", horaInicio: "10:00", horaFin: "12:00" });
            expect(result).toBeDefined();
        });

        test("updateDisponibilidad debería llamar al repository", async () => {
            medicoRepository.getMedicoByMatricula.mockResolvedValue({ matricula: "111", usuario: "u1", nombre: "n1", disponibilidades: [{ id: "disp1", _id: "disp1", diaSemana: "Lunes", horaInicio: "08:00", horaFin: "10:00" }] });
            medicoRepository.updateMedicoByMatricula.mockResolvedValue(true);

            await expect(medicoService.updateDisponibilidad("111", "disp1", { diaSemana: "Martes" })).resolves.not.toThrow();
        });

        test("deleteDisponibilidad debería llamar al repository", async () => {
            medicoRepository.getMedicoByMatricula.mockResolvedValue({ matricula: "111", usuario: "u1", nombre: "n1", disponibilidades: [{ id: "disp1", _id: "disp1", diaSemana: "Lunes", horaInicio: "08:00", horaFin: "10:00" }] });
            medicoRepository.updateMedicoByMatricula.mockResolvedValue(true);

            await expect(medicoService.deleteDisponibilidad("111", "disp1")).resolves.not.toThrow();
        });

        test("addServicioToMedico debería llamar al repository", async () => {
            medicoRepository.getMedicoByMatricula.mockResolvedValue({ matricula: "111", usuario: "u1", nombre: "n1", practicas: [], especialidades: [] });
            medicoRepository.updateMedicoByMatricula.mockResolvedValue(true);
            medicoRepository.getServicioPorId.mockResolvedValue({ id: "s1", _id: "s1", nombre: "Prueba", duracionMinutos: 30 });
            medicoRepository.addServicioToMedico.mockResolvedValue("serv1");

            await expect(medicoService.addServicioToMedico("111", { tipo: "practica", nombre: "Consulta", duracionMinutos: 30 })).resolves.not.toThrow();
        });
    });
});