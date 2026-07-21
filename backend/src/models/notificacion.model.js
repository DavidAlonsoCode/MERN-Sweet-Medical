import mongoose from "mongoose";

const notificacionSchema = new mongoose.Schema(
    {
        destinatario: { type: String, required: true },
        remitente: { type: String, required: true },
        mensaje: { type: String, required: true },
        fechaCreacion: { type: Date, default: Date.now },
        fechaLeida: { type: Date, default: null },
        leida: { type: Boolean, default: false },
        deleted: { type: Boolean, default: false },
    },
    {
        versionKey: false,
    }
);

const NotificacionModel = mongoose.model("Notificacion", notificacionSchema);

export default NotificacionModel; //