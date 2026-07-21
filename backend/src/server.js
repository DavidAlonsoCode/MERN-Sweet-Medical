import app from "./app.js";
import { connectDB } from "./database.js";
import { recuperarRecordatoriosProgramados } from "./jobs/turno.jobs.js";

connectDB().then(() => {
  const HOST = "0.0.0.0";
  const PORT = process.env.PORT || 3000;

  // Recuperar recordatorios dinámicos programados tras un reinicio
  recuperarRecordatoriosProgramados();

  // Se abre el puerto 3000 local para recibir requests
  app.listen(PORT, HOST, () => {
    console.log(`🚀 Servidor corriendo en http://${HOST}:${PORT}`);
    console.log(`\n📋 Endpoints disponibles:`);
    console.log(`   GET    http://${HOST}:${PORT}/healthcheck`); // Health Check

    console.log(`\n--- Endpoints de Médicos ---`);
    console.log(`   GET    http://${HOST}:${PORT}/medicos`);
    console.log(`   GET    http://${HOST}:${PORT}/medicos/:matricula`);
    console.log(`   POST   http://${HOST}:${PORT}/medicos`);
    console.log(`   PUT    http://${HOST}:${PORT}/medicos/:matricula`);
    console.log(`   DELETE http://${HOST}:${PORT}/medicos/:matricula`);

    console.log(`\n---  Endpoints de Disponibilidades ---`);
    console.log(
      `     GET    http://${HOST}:${PORT}/medicos/:matricula/disponibilidades`,
    );
    console.log(
      `     POST    http://${HOST}:${PORT}/medicos/:matricula/disponibilidades`,
    );
    console.log(
      `     PUT    http://${HOST}:${PORT}/medicos/:matricula/disponibilidades/:idDisp`,
    );
    console.log(
      `     DELETE    http://${HOST}:${PORT}/medicos/:matricula/disponibilidades/:idDisp`,
    );

    console.log(`\n---  Endpoints de Servicios ---`);
    console.log(
      `     POST    http://${HOST}:${PORT}/medicos/:matricula/servicios`,
    );
    console.log(
      `     PUT    http://${HOST}:${PORT}/medicos/:matricula/servicios/:idServicio`,
    );
    console.log(
      `     DELETE    http://${HOST}:${PORT}/medicos/:matricula/servicios/:idServicio`,
    );

    console.log(`\n--- Endpoints de Turnos ---`);
    console.log(`   GET    http://${HOST}:${PORT}/turnos`);
    console.log(`   GET    http://${HOST}:${PORT}/turnos/:id`);
    console.log(`   POST   http://${HOST}:${PORT}/turnos`);
    console.log(`   PATCH http://${HOST}:${PORT}/turnos/:id`);
    console.log(`   DELETE http://${HOST}:${PORT}/turnos/:id`);

    console.log(`\n--- Endpoints de Notificaciones ---`);
    console.log(`   GET    http://${HOST}:${PORT}/notificaciones`);
    console.log(
      `   GET    http://${HOST}:${PORT}/notificaciones?leida=false&destinatario=id (Filtros)`,
    );
    console.log(`   POST   http://${HOST}:${PORT}/notificaciones`);
    console.log(`   PATCH  http://${HOST}:${PORT}/notificaciones/:id`);

    console.log(`\n--- Endpoints de Pacientes ---`);
    console.log(`   GET    http://${HOST}:${PORT}/pacientes`);
    console.log(`   GET    http://${HOST}:${PORT}/pacientes/:dni`);
    console.log(`   POST   http://${HOST}:${PORT}/pacientes`);
    console.log(`   PUT    http://${HOST}:${PORT}/pacientes/:dni`);
    console.log(`   DELETE http://${HOST}:${PORT}/pacientes/:dni`);
  });
});
