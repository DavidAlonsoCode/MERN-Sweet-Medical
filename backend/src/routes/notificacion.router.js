import express from "express";
import NotificacionController from "../controllers/notificacion.controller.js";
import { verifyUserToken } from "../middlewares/auth.middleware.js";

const notificacionController = NotificacionController.instance();
const router = express.Router();

// Se verifican todas las rutas con verifyUserToken
router
  .route("/")
  // Obtener notificaciones (con filtros dinámicos por query params)
  .get(verifyUserToken, (req, res, next) =>
    notificacionController.getAllNotificaciones(req, res, next)
  )
  // Crear una nueva notificación
  .post(verifyUserToken, (req, res, next) =>
    notificacionController.createNotificacion(req, res, next)
  );

router
  .route("/:id")
  // Actualizar cualquier campo de la notificación (ej: marcar como leída o no leída)
  .patch(verifyUserToken, (req, res, next) =>
    notificacionController.updateNotificacion(req, res, next)
  );

export default router;