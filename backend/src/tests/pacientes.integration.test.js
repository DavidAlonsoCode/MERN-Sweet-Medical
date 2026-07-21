import { jest } from "@jest/globals";
import request from "supertest";         // supertest me deja hacer requests HTTP a la app sin levantar un server real
import mongoose from "mongoose";

import app from "../app.js";

import {
  connectTestDB,
  clearTestDB,
  closeTestDB,
  generateTestToken,
} from "./setup-p.js"; // Helpers que conectan/limpian/cierran la BD de test y generan JWTs falsos

import ObraSocialModel from "../models/obraSocial.model.js";

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

describe("Flujo de Integración: API de Pacientes", () => {
  let obraSocial; // La guardo en una variable de bloque para reutilizarla en todos los tests

  beforeEach(async () => {
    // Creo una obra social antes de cada test porque el paciente la requiere.
    // La BD se limpia entre tests (clearTestDB), así que necesito recrearla cada vez.
    obraSocial = await ObraSocialModel.create({
      nombre: "OSDE",
      planes: ["210", "310"],  // El paciente usa el plan "210", que tiene que existir en la obra social
    });
  });

  const pacientePayload = {
    usuario: "emanuel123",
    password: "securepassword",  // Requerido por el schema de Mongo; no hay hash por ahora
    dni: "40111222",             // Identificador único; también es lo que va en el JWT como 'identificador'
    nombre: "Emanuel Lucangioli",
    plan: "210",                 // Tiene que ser un plan que exista en la obra social que le asignemos
  };

  it("1. POST /pacientes - debería crear un paciente", async () => {
    // La ruta POST /pacientes es pública por ahora (correspondería al sign up del paciente).
    // Le agrego el _id de la obra social como string porque el body espera el ObjectId de Mongo.
    const response = await request(app)
        .post("/pacientes")
        .send({
          ...pacientePayload,
          obraSocial: obraSocial._id.toString(), // El service busca la obra social por este ID y la embebe en el documento
        });

    expect(response.status).toBe(201);          // 201 = Created
    expect(response.body).toHaveProperty("id"); // El controller responde con el _id generado por Mongo
  });

  it("2. GET /pacientes/:dni - debería obtener el paciente creado", async () => {
    await request(app)
        .post("/pacientes")
        .send({
          ...pacientePayload,
          obraSocial: obraSocial._id.toString(),
        }); // Primero creo el paciente que voy a buscar

    // El endpoint GET /:dni requiere token y sólo permite que el paciente vea su propia info
    // (o el médico ve una versión reducida). El controller lo controla con el identificador del JWT.
    const token = generateTestToken({ rol: "PACIENTE", identificador: pacientePayload.dni });
    const response = await request(app)
        .get(`/pacientes/${pacientePayload.dni}`)
        .set("Authorization", `Bearer ${token}`); // El middleware verifyUserToken valida esto antes de llegar al controller

    expect(response.status).toBe(200);
    expect(response.body.dni).toBe(pacientePayload.dni);       // Verifico que el DNI coincida
    expect(response.body.nombre).toBe(pacientePayload.nombre); // Y también el nombre para asegurarme de que es el mismo paciente
  });

  it("3. POST /pacientes - debería fallar por DNI duplicado", async () => {
    await request(app)
        .post("/pacientes")
        .send({
          ...pacientePayload,
          obraSocial: obraSocial._id.toString(),
        }); // Creo el paciente una primera vez

    // Intento crearlo de nuevo con el mismo DNI: el schema tiene unique:true en ese campo,
    // y el service (o el error handler de Mongo) debería devolver un 409 Conflict
    const response = await request(app)
        .post("/pacientes")
        .send({
          ...pacientePayload,
          obraSocial: obraSocial._id.toString(),
        });

    expect(response.status).toBe(409); // Acá sí espero 409 específicamente, a diferencia del médico
  });

  it("4. PUT /pacientes/:dni - debería actualizar un paciente", async () => {
    await request(app)
        .post("/pacientes")
        .send({
          ...pacientePayload,
          obraSocial: obraSocial._id.toString(),
        }); // Primero creo el paciente que voy a actualizar

    // La ruta PUT /:dni requiere token y sólo permite que el propio paciente modifique su info
    const token = generateTestToken({ rol: "PACIENTE", identificador: pacientePayload.dni });
    const response = await request(app)
        .put(`/pacientes/${pacientePayload.dni}`)
        .set("Authorization", `Bearer ${token}`)
        .send({
          nombre: "Emanuel Updated", // Solo mando los campos que quiero cambiar; el schema de update es parcial
        });

    expect(response.status).toBe(200);
    expect(response.body.nombre).toBe("Emanuel Updated"); // Verifico que el service devuelva el objeto actualizado
  });

  it("5. DELETE /pacientes/:dni - debería eliminar un paciente", async () => {
    await request(app)
        .post("/pacientes")
        .send({
          ...pacientePayload,
          obraSocial: obraSocial._id.toString(),
        }); // Primero creo el paciente que voy a borrar

    // La ruta DELETE /:dni es pública por ahora (eventualmente la manejaría un admin),
    // así que no necesito token para este caso
    const response = await request(app).delete(
        `/pacientes/${pacientePayload.dni}`
    );

    expect(response.status).toBe(204); // 204 = No Content: todo ok pero no devuelve body
  });

  it("6. GET /pacientes/:dni - debería devolver 404 si no existe", async () => {
    // No creo ningún paciente: quiero verificar que el sistema responda correctamente cuando busco un DNI que no está
    const token = generateTestToken({ rol: "PACIENTE", identificador: "99999999" });
    const response = await request(app)
        .get("/pacientes/99999999") // DNI que con certeza no existe en la BD de test
        .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(404); // El service tira NotFound y el error handler lo convierte en 404
  });

  it("7. POST /pacientes - debería fallar por datos inválidos", async () => {
    // Mando un body con datos que no cumplen el schema de Zod (DNI demasiado corto, usuario demasiado corto, faltan campos obligatorios).
    // El middleware validatePacienteSchemaMiddleware valida esto antes de llegar al controller y devuelve 400.
    const response = await request(app)
        .post("/pacientes")
        .send({
          dni: "12",      // DNI inválido: demasiado corto
          usuario: "ab", // Usuario inválido: demasiado corto, y faltan campos como nombre, plan, etc.
        });

    expect(response.status).toBe(400); // 400 = Bad Request: el schema Zod rechazó el body antes de que llegue al service
  });
});