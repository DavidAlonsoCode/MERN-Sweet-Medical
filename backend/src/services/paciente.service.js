import Paciente from "../domain/Paciente.js";
import PacienteRepository from "../repositories/paciente.repository.js";
import { PacienteNotFoundError, PacienteAlreadyExistsError } from "../errors/paciente.errors.js";

/*
 Decide si t.odo está en orden antes de mandar a guardar algo.
 Solo sabe de la lógica de "pacientes".
*/

// Funciones para validar si un paciente existe o no.
// Ayudan a que el código de los métodos principales sea más limpio.
const pacienteExists = (dni, paciente) => {
    return paciente ? Promise.resolve(paciente) : Promise.reject(new PacienteNotFoundError(dni));
};

const pacienteNotExists = (dni, paciente) => {
    return paciente ? Promise.reject(new PacienteAlreadyExistsError(dni)) : Promise.resolve(); // Podria ir en un validator
};

class PacienteService {
    constructor({ pacienteRepository = PacienteRepository.instance() } = {}) {
        this.pacienteRepository = pacienteRepository;
    }

    createPaciente(pacienteData) {
        return Promise.resolve()
            .then(() => {
                const nuevoPaciente = new Paciente(pacienteData);

                // 1. Buscamos si el paciente ya existe por DNI
                return this.pacienteRepository
                    .getPacienteByDni(nuevoPaciente.dni)
                    // 2. Validamos (si existe, lanza error)
                    .then((paciente) => pacienteNotExists(nuevoPaciente.dni, paciente))
                    // 3. Mandamos el objeto de dominio al repositorio
                    .then(() => this.pacienteRepository.createPaciente(nuevoPaciente));
            })
            // 4. Devolvemos el ID
            .then((pacienteGuardado) => pacienteGuardado._id.toString());
    }


    // Simplemente le pide todos los pacientes al repositorio, teniendo en cuenta la paginacion.
    getPacientes(page, limit) {
        return this.pacienteRepository.getAllPacientes({}, page, limit); //TODO parametro al pedo
    }

    // Busca un paciente y, si lo encuentra, lo devuelve como un objeto de dominio.
    getPacienteByDni(dni) {
        return this.pacienteRepository
            .getPacienteByDni(dni)
            .then((pacienteData) => pacienteExists(dni, pacienteData)) // Valida que exista.
            .then((pacienteData) => new Paciente(pacienteData)); // Lo convierte en un objeto Paciente.
    }

    // Lógica para actualizar un paciente.
    updatePacienteByDni(dni, pacienteUpdateData) {
        return this.pacienteRepository
            .getPacienteByDni(dni)
            .then((pacienteData) => pacienteExists(dni, pacienteData)) // Asegura que el paciente exista.
            .then((pacienteData) => {
                const paciente = new Paciente(pacienteData);

                // Define qué campos se pueden editar para no cambiar datos sensibles como el DNI.
                const camposEditables = ["nombre", "usuario", "obraSocial", "plan"];
                camposEditables.forEach((campo) => {
                    // Si el dato nuevo viene en el JSON, lo actualiza.
                    if (pacienteUpdateData[campo] !== undefined) {
                        paciente[campo] = pacienteUpdateData[campo];
                    }
                });

                // Vuelve a validar el objeto completo por si algo quedó mal.
                paciente.validar();

                // Manda a guardar el objeto actualizado.
                return this.pacienteRepository.updatePacienteByDni(dni, paciente);
            });
    }

    // Lógica para eliminar un paciente.
    deletePacienteByDni(dni) {
        return this.pacienteRepository
            .deletePacienteByDni(dni)
            // Valida que el paciente que se intentó borrar realmente existía.
            // Si no, pacienteExists tira error 404.
            .then((paciente) => pacienteExists(dni, paciente));
    }

    async getPacienteByUsuario(usuario) {
        return await this.pacienteRepository.getPacienteByUsuario(usuario);
    }

    static instance() {
        this._instance ||= new this();
        return this._instance;
    }
}

export default PacienteService;