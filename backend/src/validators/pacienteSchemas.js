import { z } from "zod";

export const pacienteSchema = z.object({
    dni: z.string().min(7, "El DNI debe tener al menos 7 caracteres."),
    usuario: z.string().min(3, "El usuario debe tener al menos 3 caracteres."),
    nombre: z.string().min(2, "El nombre es obligatorio y debe ser válido."),
    obraSocial: z.string().optional(),
    plan: z.string().optional(),
    password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres")
});

export const pacienteUpdateSchema = z.object({
    nombre: z.string().min(2, "El nombre debe tener al menos 2 caracteres.").optional(),
    usuario: z.string().min(3, "El usuario debe tener al menos 3 caracteres.").optional(),
    obraSocial: z.string().optional(),
    plan: z.string().optional()
});