import { PacienteMissingFieldsError } from "../errors/paciente.errors.js";


// Su principal responsabilidad es asegurarse de que un paciente siempre tenga datos válidos.
class Paciente {
    constructor({
                    usuario,
                    password,
                    dni,
                    nombre,
                    obraSocial = null, // Si no viene, por defecto es null.
                    plan = null
                }) {
        this.usuario = usuario;
        this.password = password;
        this.dni = dni;
        this.nombre = nombre;
        this.obraSocial = obraSocial;
        this.plan = plan;

        //Apenas se crea un objeto, se valida a sí mismo.
        // Esto hace que nunca tengamos un objeto Paciente inválido.
        this.validar();
    }

    // Contiene la regla de negocio fundamental: qué campos son obligatorios.
    validar() {
        const requiredFields = ["dni", "usuario", "nombre"];
        // some revisa si al menos un campo de la lista es "falsy" (null, undefined, vacío...).
        const isMissingFields = requiredFields.some((field) => !this[field]);

        if (isMissingFields) {
            // Si falta algún campo, lanza un error específico que sabe qué campos faltan.
            throw new PacienteMissingFieldsError(this);
        }
    }
}

export default Paciente;