import { z } from "zod";

// Define el esquema de Zod para la creación de un turno
export const turnoSchema = z
  .object({
    pacienteDni: z
      .string()
      .min(1, "El DNI del paciente es obligatorio."),
    medicoMatricula: z
      .string()
      .min(1, "La matrícula del médico es obligatoria."),
    especialidad: z.string().optional(), // (opcional por sí solo)
    practica: z.string().optional(),     // (opcional por sí solo)
    sede: z
      .string()
      .min(1, "La sede de atención es obligatoria."),
    fecha: z
      .string()
      .regex(
        /^\d{2}-\d{2}-\d{4}$/,
        "El formato de la fecha debe ser DD-MM-AAAA.",
      ),
    hora: z
      .string()
      .regex(/^\d{2}:\d{2}$/, "El formato de la hora debe ser HH:MM."),
  })
  .superRefine((data, ctx) => {
    // 1. Validar que tenga especialidad o práctica
    if (!data.especialidad && !data.practica) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "El turno debe tener asociada una especialidad o una práctica.",
      });
    };
    // 2. Parsear DD-MM-AAAA a un objeto Date
    const parseDateDDMMYYYY = (dateString) => {
      const [day, month, year] = dateString.split("-").map(Number);
      return new Date(year, month - 1, day);
    };

    const inputDateOnly = parseDateDDMMYYYY(data.fecha);
    inputDateOnly.setHours(0, 0, 0, 0);


    // Validar que la fecha no sea anterior a hoy (solo el día)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (inputDateOnly < today) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "La fecha del turno no puede ser anterior al día actual.",
        path: ["fecha"], // Asociar el error al campo 'fecha'
      });
    } else {
      // Validar que la fecha y hora combinadas no sean anteriores al momento actual
      const [day, month, year] = data.fecha.split("-").map(Number);
      const [hours, minutes] = data.hora.split(":").map(Number);
      const fechaHoraTurno = new Date(year, month - 1, day, hours, minutes);

      if (fechaHoraTurno <= new Date()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "La hora del turno no puede ser anterior al momento actual.",
          path: ["hora"], // Asociar el error al campo 'hora'
        });
      }
    }
  });

export const turnoUpdateSchema = z
    .object({
        estado: z.enum(["CONFIRMADO", "REALIZADO", "CANCELADO", "RESERVADO"]).optional(),
        fecha: z.string().regex(/^\d{2}-\d{2}-\d{4}$/, "El formato de la fecha debe ser DD-MM-AAAA.").optional(),
        hora: z.string().regex(/^\d{2}:\d{2}$/, "El formato de la hora debe ser HH:MM.").optional(),
        rol: z.enum(["PACIENTE", "MEDICO"]).optional(),
    })
    .superRefine((data, ctx) => {
        // Solo hacemos la validación de tiempo si efectivamente nos mandan fecha y hora (Reprogramación)
        if (data.fecha && data.hora) {
            const parseDateDDMMYYYY = (dateString) => {
                const [day, month, year] = dateString.split("-").map(Number);
                return new Date(year, month - 1, day);
            };

            const inputDateOnly = parseDateDDMMYYYY(data.fecha);
            inputDateOnly.setHours(0, 0, 0, 0);

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (inputDateOnly < today) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: "La nueva fecha del turno no puede ser anterior al día actual.",
                    path: ["fecha"],
                });
            } else {
                const [day, month, year] = data.fecha.split("-").map(Number);
                const [hours, minutes] = data.hora.split(":").map(Number);
                const fechaHoraTurno = new Date(year, month - 1, day, hours, minutes);

                if (fechaHoraTurno <= new Date()) {
                    ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        message: "La nueva hora del turno no puede ser anterior al momento actual.",
                        path: ["hora"],
                    });
                }
            }
        } else if ((data.fecha && !data.hora) || (!data.fecha && data.hora)) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Para reprogramar debes enviar tanto la fecha como la hora.",
                path: ["fecha"],
            });
        }
    });

export const turnoCambioSchema = turnoUpdateSchema;
