import Notificacion from "../domain/Notificacion.js";
import NotificacionRepository from "../repositories/notificacion.repository.js";
import { NotificacionNotFoundError } from "../errors/notificacion.errors.js";

class NotificacionService {
  constructor({
    notificacionRepository = NotificacionRepository.instance(),
  } = {}) {
    this.notificacionRepository = notificacionRepository;
  }

  async createNotificacion(notificacionData) {
    const nuevaNotificacion = new Notificacion(notificacionData);

    const guardada =
      await this.notificacionRepository.createNotificacion(nuevaNotificacion);
    return new Notificacion(guardada);
  }

  async getAllNotificaciones(filtros = {}, page = 1, limit = 10) {
    const { data, meta } =
      await this.notificacionRepository.getAllNotificaciones(
        filtros,
        page,
        limit,
      );

    return {
      // Mapeamos cada documento de la DB a una instancia del dominio Notificacion
      data: data.map((n) => new Notificacion(n)),
      meta,
    };
  }

  async updateNotificacion(id, notificacionData) {
    const existente = await this.notificacionRepository.getNotificacionById(id);
    if (!existente) {
      throw new NotificacionNotFoundError(id);
    }

    // Extraemos los datos del documento de Mongoose para mezclarlos correctamente
    const existentePlano = existente.toObject
      ? existente.toObject()
      : existente;
    const notificacion = new Notificacion({
      ...existentePlano,
      ...notificacionData,
    });

    const actualizada = await this.notificacionRepository.updateNotificacion(
      id,
      notificacion,
    );

    return new Notificacion(actualizada);
  }

  static instance() {
    this._instance ||= new this();
    return this._instance;
  }
}

export default NotificacionService;
