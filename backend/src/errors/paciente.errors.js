// La clase base de la que heredan los errores de paciente
class PacienteError extends Error {
    constructor(status, message) {
        super(message);
        this.status = status; // Código de estado HTTP
        this.name = this.constructor.name; // El nombre de la clase (ej: "PacienteNotFoundError")
    }
}

// Error para cuando buscamos un paciente y no lo encontramos.
class PacienteNotFoundError extends PacienteError {
    constructor(dni) {
        super(404, `Paciente con DNI: ${dni} no encontrado.`);
    }
}

// Error para cuando intentamos crear un paciente con un DNI que ya existe.
class PacienteAlreadyExistsError extends PacienteError {
    constructor(dni) {
        super(409, `Ya existe un paciente con DNI: ${dni}.`); // 409 = Conflicto.
    }
}

// Error para cuando intentamos crear/actualizar un paciente y faltan campos obligatorios.
class PacienteMissingFieldsError extends PacienteError {
    constructor(pacienteData) {
        // Calcula qué campos faltan para dar un mensaje de error más útil.
        const fields = ["dni", "usuario", "nombre"].filter(
            (field) => !pacienteData[field]
        );
        super(400, `Faltan campos requeridos para el paciente: ${fields.join(", ")}.`); // 400 = Bad Request.
    }
}


class PacienteValidationError extends PacienteError {
    constructor(issues) {
        // Zod devuelve un array de issues, los juntamos todos en un string
        const messages = issues.map((issue) => issue.message).join(" | ");
        super(400, `Error de validación: ${messages}`);
        this.issues = issues;
    }
}

export {
    PacienteError,
    PacienteNotFoundError,
    PacienteAlreadyExistsError,
    PacienteMissingFieldsError,
    PacienteValidationError
};