import NotificacionModel from "../models/notificacion.model.js";

class NotificacionRepository {
  constructor() {}

  async getAllNotificaciones(filtros = {}, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const query = { deleted: { $ne: true } };

    for (const [key, value] of Object.entries(filtros)) {
      if (
        key === "page" ||
        key === "limit" ||
        value === undefined ||
        value === ""
      )
        continue;

      switch (key) {
        case "mensaje":
          query.mensaje = { $regex: value, $options: "i" };
          break;

        case "leida":
          query.leida = value === true || value === "true";
          break;

        case "fechaDesde":
          query.fechaCreacion = {
            ...query.fechaCreacion,
            $gte: new Date(value),
          };
          break;
        case "fechaHasta":
          query.fechaCreacion = {
            ...query.fechaCreacion,
            $lte: new Date(value),
          };
          break;

        case "destinatario":
        case "remitente":
        case "_id":
          query[key] = value;
          break;

        default:
          query[key] = value;
          break;
      }
    }

    const [data, totalItems] = await Promise.all([
      NotificacionModel.find(query)
        .sort({ fechaCreacion: -1 })
        .skip(skip)
        .limit(limit),
      NotificacionModel.countDocuments(query),
    ]);

    return {
      data,
      meta: {
        totalItems,
        itemsPerPage: Number(limit),
        currentPage: Number(page),
        totalPages: Math.ceil(totalItems / limit),
      },
    };
  }

  async getNotificacionById(id) {
    return await NotificacionModel.findById(id);
  }

  async createNotificacion(notificacionData) {
    const nuevaNotificacion = new NotificacionModel(notificacionData);
    return await nuevaNotificacion.save();
  }

  async updateNotificacion(id, notificacionData) {
    return await NotificacionModel.findByIdAndUpdate(id, notificacionData, {
      returnDocument: "after",
    });
  }

  async deleteNotificacionById(id) {
    return await NotificacionModel.findByIdAndUpdate(
      id,
      { deleted: true },
      { returnDocument: "after" },
    );
  }

  static instance() {
    this._instance ||= new this();
    return this._instance;
  }
}

export default NotificacionRepository;
