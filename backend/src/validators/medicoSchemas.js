import { z } from "zod";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const medicoSchema = z.object({
    usuario: z.string().min(3, "El usuario debe tener al menos 3 caracteres."),
    matricula: z.string().min(4, "La matrícula es obligatoria."),
    nombre: z.string().min(2, "El nombre es obligatorio."),

    // Los arrays son opcionales, pero si los mandan, validamos que los IDs adentro sean de Mongo
    especialidades: z.array(z.string().regex(objectIdRegex, "Formato de ID de especialidad inválido")).optional(),
    practicas: z.array(z.string().regex(objectIdRegex, "Formato de ID de práctica inválido")).optional(),
    sedes: z.array(z.string().regex(objectIdRegex, "Formato de ID de sede inválido")).optional(),
    password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres")
});