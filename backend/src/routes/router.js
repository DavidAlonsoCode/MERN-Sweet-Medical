import express from "express";
import medicoRouter from "./medico.router.js";
import turnoRouter from "./turno.router.js";
import notificacionRouter from "./notificacion.router.js";
import pacienteRouter from "./paciente.router.js";
import maestrosRouter from "./maestros.router.js";
import authRouter from "./auth.router.js";

const router = express.Router();

router.use("/auth", authRouter);
router.use("/medicos", medicoRouter);
router.use("/turnos", turnoRouter);
router.use("/notificaciones", notificacionRouter);
router.use("/pacientes", pacienteRouter);
router.use("/maestros", maestrosRouter);

export default router;
