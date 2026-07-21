import { jest } from "@jest/globals";
import request from 'supertest';
import app from '../app.js';
import { connectTestDB, closeTestDB, clearTestDB, generateTestToken } from './setup-p.js';

import SedeModel from '../models/sede.model.js';
import EspecialidadModel from '../models/especialidad.model.js';
import PacienteModel from '../models/paciente.model.js';
import MedicoModel from '../models/medico.model.js';
import TurnoModel from '../models/turno.model.js';

jest.setTimeout(60000);

beforeAll(async () => {
    await connectTestDB();
});

afterEach(async () => {
    await clearTestDB();
});

afterAll(async () => {
    await closeTestDB();
});

describe('Flujo de Integración: API de Turnos', () => {
    let idSedePrueba;
    let idEspecialidadPrueba;
    const pacienteDniPrueba = "35123456";
    const medicoMatriculaPrueba = "56998774";

    beforeEach(async () => {
        const especialidad = await EspecialidadModel.create({ nombre: "Cardiología" });
        idEspecialidadPrueba = especialidad._id.toString();

        const sede = await SedeModel.create({ nombre: "Sede Central", direccion: "Calle Falsa 123" });
        idSedePrueba = sede._id.toString();

        await PacienteModel.create({
            dni: pacienteDniPrueba,
            nombre: "David Alonso",
            usuario: "dalonso",
            password: "123456", // <-- AGREGADO
            plan: "210"
        });

        await MedicoModel.create({
            matricula: medicoMatriculaPrueba,
            nombre: "Axel Herbas",
            usuario: "aherbas",
            password: "123456", // <-- AGREGADO
            especialidades: [{ id: idEspecialidadPrueba, nombre: "Cardiología" }],
            sedes: [{ id: idSedePrueba, nombre: "Sede Central" }],
            disponibilidades: [
                { dia: "Miércoles", inicio: "09:00", fin: "18:00" }
            ]
        });
    });

    const getProximoMiercoles = () => {
        const fecha = new Date();
        const diasHastaMiercoles = (3 - fecha.getDay() + 7) % 7;
        const diasASumar = diasHastaMiercoles === 0 ? 7 : diasHastaMiercoles;
        fecha.setDate(fecha.getDate() + diasASumar);

        const dia = String(fecha.getDate()).padStart(2, '0');
        const mes = String(fecha.getMonth() + 1).padStart(2, '0');
        const anio = fecha.getFullYear();
        return `${dia}-${mes}-${anio}`;
    };

    it('1. POST /turnos - Debería agendar un turno correctamente si el horario está libre', async () => {
        const fechaTest = getProximoMiercoles();

        const turnoPayload = {
            pacienteDni: pacienteDniPrueba,
            medicoMatricula: medicoMatriculaPrueba,
            sede: idSedePrueba,
            especialidad: idEspecialidadPrueba,
            fecha: fechaTest,
            hora: "10:30"
        };

        const token = generateTestToken({ rol: "PACIENTE", identificador: pacienteDniPrueba });
        const response = await request(app)
            .post('/turnos')
            .set("Authorization", `Bearer ${token}`)
            .send(turnoPayload);

        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('id');

        const turnoEnBD = await TurnoModel.findById(response.body.id);
        expect(turnoEnBD).not.toBeNull();
        expect(turnoEnBD.estado).toBe("RESERVADO");
    });

    it('2. POST /turnos - Debería fallar si el médico ya tiene un turno en ese horario', async () => {
        const fechaTest = getProximoMiercoles();
        const [dia, mes, anio] = fechaTest.split('-');
        const fechaHoraOcupada = new Date(`${anio}-${mes}-${dia}T10:30:00`);

        await TurnoModel.create({
            pacienteDni: "99888777",
            medicoMatricula: medicoMatriculaPrueba,
            sede: { id: idSedePrueba, nombre: "Sede Central" },
            especialidad: { id: idEspecialidadPrueba, nombre: "Cardiología" },
            fechaHora: fechaHoraOcupada,
            estado: "RESERVADO"
        });

        const turnoPayloadDuplicado = {
            pacienteDni: pacienteDniPrueba,
            medicoMatricula: medicoMatriculaPrueba,
            sede: idSedePrueba,
            especialidad: idEspecialidadPrueba,
            fecha: fechaTest,
            hora: "10:30"
        };

        const token = generateTestToken({ rol: "PACIENTE", identificador: pacienteDniPrueba });
        const response = await request(app)
            .post('/turnos')
            .set("Authorization", `Bearer ${token}`)
            .send(turnoPayloadDuplicado);

        expect(response.status).toBeGreaterThanOrEqual(400);
    });
});