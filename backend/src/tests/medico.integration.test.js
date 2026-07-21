import { jest } from "@jest/globals";
import request from 'supertest';                                                    // supertest me deja hacer requests HTTP directamente a la app sin levantar un server real
import app from '../app.js';
import { connectTestDB, closeTestDB, clearTestDB, generateTestToken } from './setup-p.js'; // Helpers que conectan/limpian/cierran la BD de test y generan JWTs falsos
jest.setTimeout(60000); // Le doy 60 segundos a cada test porque la conexión a Mongo puede tardar

beforeAll(async () => {
    await connectTestDB(); // Levanto la conexión a la BD de test antes de arrancar cualquier cosa
});

afterEach(async () => {
    await clearTestDB(); // Limpio todas las colecciones después de cada test para que los datos no "ensucien" los siguientes
});

afterAll(async () => {
    await closeTestDB(); // Cierro la conexión al final para que Jest pueda salir sin quedar colgado
});

describe('Flujo de Integración: API de Médicos', () => {
    // Payload de médico que reutilizo en todos los tests. La matrícula es el identificador único del médico en el sistema.
    const medicoPayload = {
        usuario: "dr_house",
        password: "securepassword",     // Requerido por el schema de Mongo; no hay hash por ahora
        matricula: "MN1234",            // Identificador único; también es lo que va en el JWT como 'identificador'
        nombre: "Gregory House",
        especialidades: [],             // Pueden estar vacíos al crear; se agregan después vía /servicios
        practicas: [],
        sedes: []
    };

    it('1. POST /medicos - Debería crear un médico y cumplir con Swagger', async () => {
        // Llamo sin token porque la ruta POST /medicos es pública por ahora (eventualmente la manejaría un admin)
        const response = await request(app)
            .post('/medicos')
            .send(medicoPayload);

        expect(response.status).toBe(201);          // 201 = Created, el médico quedó guardado en Mongo
        expect(response.body).toHaveProperty('id'); // El controller responde con el _id generado por Mongo
    });

    it('2. GET /medicos/:matricula - Debería obtener el médico recién creado', async () => {
        await request(app).post('/medicos').send(medicoPayload); // Primero creo el médico que voy a buscar

        // El endpoint GET /:matricula requiere token y solo permite que el médico vea su propia info;
        // por eso genero un token con rol MEDICO y el identificador igual a la matrícula que quiero consultar
        const token = generateTestToken({ rol: "MEDICO", identificador: medicoPayload.matricula });
        const response = await request(app)
            .get(`/medicos/${medicoPayload.matricula}`)
            .set("Authorization", `Bearer ${token}`); // El middleware verifyUserToken valida esto antes de llegar al controller

        expect(response.status).toBe(200);
        expect(response.body.matricula).toBe(medicoPayload.matricula); // Verifico que la matrícula coincida con la que creé
        expect(response.body.nombre).toBe(medicoPayload.nombre);       // Y también el nombre para asegurarme de que es el mismo médico
    });

    it('3. POST /medicos - Debería fallar al intentar crear un duplicado por matrícula', async () => {
        await request(app).post('/medicos').send(medicoPayload); // Creo el médico una primera vez

        // Intento crearlo de nuevo con el mismo payload: la matrícula tiene unique:true en el schema de Mongo,
        // así que debería rechazarlo con un error de clave duplicada
        const response = await request(app)
            .post('/medicos')
            .send(medicoPayload);

        expect(response.status).toBeGreaterThanOrEqual(400); // Puede ser 409 Conflict o 400 según cómo lo maneje el error handler
    });
});