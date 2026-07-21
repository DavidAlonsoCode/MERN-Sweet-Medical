import { jest } from "@jest/globals";
import request from "supertest";
import mongoose from "mongoose";
import app from "../app.js";
import { connectTestDB, clearTestDB, closeTestDB, generateTestToken } from "./setup-p.js";

import PacienteModel from "../models/paciente.model.js";
import MedicoModel from "../models/medico.model.js";
import TurnoModel from "../models/turno.model.js";
import EspecialidadModel from "../models/especialidad.model.js";
import SedeModel from "../models/sede.model.js";

jest.setTimeout(60000);

describe("Pruebas de Estrés y Colisiones en MongoDB", () => {
    beforeAll(async () => {
        await connectTestDB();
    });

    afterEach(async () => {
        await clearTestDB();
    });

    afterAll(async () => {
        await closeTestDB();
    });

    describe("Bloque A: Violación de Índices Únicos Estrictos", () => {
        test("1. Debería explotar (Error 11000) si dos procesos insertan la misma matrícula", async () => {
            const medicoPayload = {
                usuario: "dr_choque",
                password: "password123", // <-- AGREGADO
                matricula: "MN9999",
                nombre: "Dr. Choque"
            };

            await MedicoModel.create(medicoPayload);

            let errorAtrapado = null;
            try {
                await MedicoModel.create(medicoPayload);
            } catch (error) {
                errorAtrapado = error;
            }

            expect(errorAtrapado).not.toBeNull();
            expect(errorAtrapado.code).toBe(11000);
        });

        test("2. Debería explotar (Error 11000) si dos procesos insertan el mismo DNI de paciente", async () => {
            const pacientePayload = {
                dni: "11222333",
                usuario: "paciente_choque",
                password: "password123", // <-- AGREGADO
                nombre: "Paciente Choque",
                plan: "Basico"
            };

            await PacienteModel.create(pacientePayload);

            let errorAtrapado = null;
            try {
                await PacienteModel.create(pacientePayload);
            } catch (error) {
                errorAtrapado = error;
            }

            expect(errorAtrapado).not.toBeNull();
            expect(errorAtrapado.code).toBe(11000);
        });
    });

    describe("Bloque B: Race Conditions en Operaciones Upsert", () => {
        test("3. Concurrencia Upsert: 10 peticiones creando el MISMO paciente a la vez no deberían duplicarlo", async () => {
            const pacientePayload = {
                dni: "55555555",
                usuario: "usuario_concurrente",
                password: "password123", // <-- AGREGADO
                nombre: "Flash Gordon",
                plan: "Premium"
            };

            const promesas = [];
            for (let i = 0; i < 10; i++) {
                promesas.push(request(app).post("/pacientes").send(pacientePayload));
            }

            const resultados = await Promise.all(promesas);
            const cantidadEnBD = await PacienteModel.countDocuments({ dni: "55555555" });

            expect(cantidadEnBD).toBe(1);

            const exitosos = resultados.filter(res => res.status === 201 || res.status === 200);
            expect(exitosos.length).toBeGreaterThan(0);
        });
    });

    describe("Bloque C: El test definitivo de Doble-Booking (Turnos)", () => {
        let idSede, idEspecialidad, medicoMatricula, pacienteDni;

        beforeEach(async () => {
            const especialidad = await EspecialidadModel.create({ nombre: "Endocrinología" });
            idEspecialidad = especialidad._id.toString();

            const sede = await SedeModel.create({ nombre: "Clínica Mayo" });
            idSede = sede._id.toString();

            pacienteDni = "88888888";
            await PacienteModel.create({ dni: pacienteDni, nombre: "Tony Stark", usuario: "ts", password: "123456", plan: "210" }); // <-- AGREGADO PASSWORD

            medicoMatricula = "MN0001";
            await MedicoModel.create({
                matricula: medicoMatricula,
                nombre: "Dr. Strange",
                usuario: "house_md",
                password: "123456", // <-- AGREGADO PASSWORD
                especialidades: [{ id: idEspecialidad, nombre: "Endocrinología" }],
                sedes: [{ id: idSede, nombre: "Clínica Mayo" }],
                disponibilidades: [{ dia: "Viernes", inicio: "08:00", fin: "18:00" }]
            });
        });

        const getProximoViernes = () => {
            const d = new Date();
            d.setDate(d.getDate() + ((5 - d.getDay() + 7) % 7 || 7));
            return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
        };

        test("4. Estallido de Turnos: 20 pacientes intentan sacar exactamente el mismo turno a la vez", async () => {
            const fechaViernes = getProximoViernes();

            const payloadBase = {
                medicoMatricula: medicoMatricula,
                sede: idSede,
                especialidad: idEspecialidad,
                fecha: fechaViernes,
                hora: "10:00"
            };

            const promesas = [];
            for (let i = 1; i <= 20; i++) {
                const cloneDni = `100000${i}`;
                await PacienteModel.create({ dni: cloneDni, nombre: `Clon ${i}`, usuario: `c${i}`, password: "123456", plan: "210" }); // <-- AGREGADO PASSWORD

                const payloadAtaque = { ...payloadBase, pacienteDni: cloneDni };
                const token = generateTestToken({ rol: "PACIENTE", identificador: cloneDni });
                promesas.push(
                    request(app)
                        .post("/turnos")
                        .set("Authorization", `Bearer ${token}`)
                        .send(payloadAtaque)
                );
            }

            const resultados = await Promise.all(promesas);

            const turnosAprobados = resultados.filter(res => res.status === 201);
            const turnosRechazados = resultados.filter(res => res.status >= 400);

            const [dia, mes, anio] = fechaViernes.split("-");
            const fechaHoraBusqueda = new Date(`${anio}-${mes}-${dia}T10:00:00`);

            const turnosEnDB = await TurnoModel.countDocuments({
                medicoMatricula,
                fechaHora: fechaHoraBusqueda,
                estado: { $in: ['RESERVADO', 'REALIZADO'] }
            });

            expect(turnosEnDB).toBe(1);
            expect(turnosAprobados.length).toBe(1);
            expect(turnosRechazados.length).toBe(19);
        });

        test("5. Colisión de modificación: Permite crear un turno en un horario donde antes hubo uno CANCELADO", async () => {
            const fechaViernes = getProximoViernes();
            const [dia, mes, anio] = fechaViernes.split("-");
            const fechaHoraReal = new Date(`${anio}-${mes}-${dia}T10:00:00`);

            await TurnoModel.create({
                pacienteDni: "9999",
                medicoMatricula: medicoMatricula,
                sede: { id: idSede, nombre: "Clínica Mayo" },
                especialidad: { id: idEspecialidad, nombre: "Endocrinología" },
                fechaHora: fechaHoraReal,
                estado: "CANCELADO"
            });

            const turnoPayload = {
                pacienteDni: pacienteDni,
                medicoMatricula: medicoMatricula,
                sede: idSede,
                especialidad: idEspecialidad,
                fecha: fechaViernes,
                hora: "10:00"
            };

            const token = generateTestToken({ rol: "PACIENTE", identificador: pacienteDni });
            const response = await request(app)
                .post("/turnos")
                .set("Authorization", `Bearer ${token}`)
                .send(turnoPayload);

            expect(response.status).toBe(201);

            const countTotal = await TurnoModel.countDocuments({ fechaHora: fechaHoraReal });
            expect(countTotal).toBe(2);
        });
    });
});