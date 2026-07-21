import NotificacionService from "../services/notificacion.service.js";
import { createNotificacionSchema } from "../validators/notificacionSchema.js";
import { Unauthorized, AccessDeniedByNotificacion } from "../errors/auth.errors.js";

class NotificacionController {
  constructor({ notificacionService = NotificacionService.instance() } = {}) {
    this.notificacionService = notificacionService;
  }

  async createNotificacion(req, res, next) {
    try {
      const result = createNotificacionSchema.safeParse(req.body);

      // Obligamos a que se creen notificaciones del mismo remitente
      if (req.user && req.user.identificador) {
        // Si intenta filtrar por un destinatario que no es él mismo, denegamos
        if (req.body.remitente && req.body.remitente !== req.user.identificador) {
          throw new Unauthorized();
        }
      }

      if (!result.success) {
        return res.status(400).json({
          error: result.error.issues.map(e =>
            e.code === "invalid_type"
              ? `El campo ${e.path[0]} es obligatorio.`
              : e.message
          ),
        });
      }

      const nuevaNotificacion = await this.notificacionService.createNotificacion(result.data);
      return res.status(201).json(nuevaNotificacion);
    } catch (error) {
      next(error);
    }
  }

  async getAllNotificaciones(req, res, next) {
    try {
      // Extraemos page y limit, y agrupamos el resto en 'filtros'
      const { page = 1, limit = 10, ...filtros } = req.query;

      // Obligamos a que el usuario solo traiga sus propias notificaciones
      if (req.user && req.user.identificador) {
        // Si intenta filtrar por un remitente que no es él mismo, denegamos
        if (filtros.remitente && filtros.remitente !== req.user.identificador) {
          throw new AccessDeniedByNotificacion();
        }
        // Por ahora se evita que se pueda filtrar por destinatarios, se puede pensar como filtrarlo de otra forma
        if (filtros.destinatario && filtros.destinatario !== req.user.identificador) {
          throw new AccessDeniedByNotificacion();
        }
        // Si no manda ni remitente ni destinatario, debemos forzar a que sea él mismo
        if (!filtros.remitente && !filtros.destinatario) {
          filtros.destinatario = req.user.identificador;
        }
      }

      const result = await this.notificacionService.getAllNotificaciones(filtros, page, limit);

      return res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async updateNotificacion(req, res, next) {
    try {
      const id = req.params.id;
      const updateData = req.body;

      // Buscamos la notificación primero usando el service aprovechando getAll
      const resultado = await this.notificacionService.getAllNotificaciones({ _id: id });
      const notificacion = resultado.data[0];

      // Verificamos que el destinatario sea el usuario actual
      if (req.user && notificacion.destinatario !== req.user.identificador) {
        throw new AccessDeniedByNotificacion();
      }

      const notificacionActualizada = await this.notificacionService.updateNotificacion(id, updateData);

      return res.status(200).json(notificacionActualizada);
    } catch (error) {
      next(error);
    }
  }

  static instance() {
    this._instance ||= new this();
    return this._instance;
  }
}

export default NotificacionController;