import express from "express";
import MaestrosController from "../controllers/maestros.controller.js";

const maestrosController = MaestrosController.instance();
const router = express.Router();

router.get("/especialidades", (req, res, next) => maestrosController.getEspecialidades(req, res, next));
router.get("/practicas", (req, res, next) => maestrosController.getPracticas(req, res, next));
router.get("/sedes", (req, res, next) => maestrosController.getSedes(req, res, next));
router.get("/obras-sociales", (req, res, next) => maestrosController.getObrasSociales(req, res, next));

export default router;