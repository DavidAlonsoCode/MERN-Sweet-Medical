import { z } from "zod";

export const createNotificacionSchema = z.object({
  destinatario: z.string({
    required_error: "El destinatario es obligatorio.",
  }).min(1, "El destinatario es obligatorio."),

  remitente: z.string({
    required_error: "El remitente es obligatorio.",
  }).min(1, "El remitente es obligatorio."),

  mensaje: z.string({
    required_error: "El mensaje es obligatorio.",
  }).min(1, "El mensaje es obligatorio."),
  
});