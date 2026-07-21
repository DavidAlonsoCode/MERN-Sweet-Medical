import Medico from "../domain/Medico.js";
import MedicoRepository from "../repositories/medico.repository.js";
import { medicoExists, medicoNotExists } from "../validators/medicoDisponibilidad.js";

class MedicoService {
  constructor({ medicoRepository = MedicoRepository.instance() } = {}) {
    this.medicoRepository = medicoRepository;
  }

  createMedico(medicoData) {
    return Promise.resolve()
      .then(() => {
        const nuevoMedico = new Medico(medicoData);

        // Validar que el medico no exista ya, para evitar repetirlo
        return this.medicoRepository
          .getMedicoByMatricula(nuevoMedico.matricula)
          .then((medico) => medicoNotExists(nuevoMedico.matricula, medico))
          .then(() => this.medicoRepository.createMedico(nuevoMedico));
      })
      .then((medicoGuardado) => medicoGuardado.id);
  }

  getMedicos(filtros = {}) {
    const page = parseInt(filtros.page) || 1;
    const limit = parseInt(filtros.limit) || 10;

    return this.medicoRepository.getAllMedicos(filtros, page, limit)
      .then((resultado) => {
        return {
          data: resultado.data.map((data) => new Medico(data)),
          meta: resultado.meta
        };
      });
  }

  getMedicoByMatricula(matricula) {
    return this.medicoRepository
      .getMedicoByMatricula(matricula)
      .then((medicoData) => medicoExists(matricula, medicoData))
      .then((medicoData) => new Medico(medicoData));
  }

  updateMedicoByMatricula(matricula, medicoUpdateData) {
    return this.medicoRepository
      .getMedicoByMatricula(matricula)
      .then((medicoData) => medicoExists(matricula, medicoData))
      .then((medicoData) => {
        const medico = new Medico(medicoData);

        const camposEditables = [
          "nombre",
          "usuario",
          "especialidades",
          "sedes",
          "practicas",
        ];
        camposEditables.forEach((campo) => {
          if (medicoUpdateData[campo] !== undefined) {
            medico[campo] = medicoUpdateData[campo];
          }
        });

        medico.validar();

        // Almacenar si todo salio bien
        return this.medicoRepository.updateMedicoByMatricula(matricula, medico);
      });
  }

  deleteMedicoByMatricula(matricula) {
    return this.medicoRepository
      .deleteMedicoByMatricula(matricula)
      .then((medico) => medicoExists(matricula, medico));
  }


  getDisponibilidadesByMatricula(matricula) {
    return this.getMedicoByMatricula(matricula)
      .then((medico) => medico.disponibilidades);
  }

    addDisponibilidadToMedico(matricula, dispData) {
        return this.getMedicoByMatricula(matricula).then((medico) => {

            medico.agregarDisponibilidad(null, dispData.dia, dispData.inicio, dispData.fin);

            // Guardo en la base de datos
            return this.medicoRepository.updateMedicoByMatricula(matricula, medico)
                .then(() => {
                    // Tomo la última disponibilidad del array (que es la que acabo de crear)
                    const nuevaDisp = medico.disponibilidades[medico.disponibilidades.length - 1];

                    // La retorno para que llegue al controlador
                    return nuevaDisp;
                });
        });
    }

  updateDisponibilidad(matricula, idDisp, dispData) {
    return this.medicoRepository.getMedicoByMatricula(matricula)
      .then((medicoData) => medicoExists(matricula, medicoData))
      .then((medicoData) => {
        const medico = new Medico(medicoData);
        medico.modificarDisponibilidad(idDisp, dispData.dia, dispData.inicio, dispData.fin);

        return this.medicoRepository.updateMedicoByMatricula(matricula, medico);
      });
  }

  deleteDisponibilidad(matricula, idDisp) {
    return this.medicoRepository.getMedicoByMatricula(matricula)
      .then((medicoData) => medicoExists(matricula, medicoData))
      .then((medicoData) => {
        const medico = new Medico(medicoData);
        medico.eliminarDisponibilidad(idDisp);

        return this.medicoRepository.updateMedicoByMatricula(matricula, medico);
      });
  }

  addServicioToMedico(matricula, servicioData) {
    const { tipo, id } = servicioData;

    return this.medicoRepository.getServicioPorId(tipo, id)
      .then((servicioOriginal) => {
        if (!servicioOriginal) throw new ServicioNoEncontrado(id);

        return this.getMedicoByMatricula(matricula).then((medico) => {

          const servicioDesnormalizado = {
            id: id,
            nombre: servicioOriginal.nombre,
            duracionMinutos: servicioData.duracionMinutos || servicioOriginal.duracionMinutos,
            costo: servicioData.costo || servicioOriginal.costo
          };

          const nuevoId = medico.agregarServicio(tipo, servicioDesnormalizado);

          return this.medicoRepository.updateMedicoByMatricula(matricula, medico)
            .then(() => nuevoId);
        });
      });
  }

  updateServicioMedico(matricula, idServicio, servicioData) {
    return this.getMedicoByMatricula(matricula).then((medico) => {
      medico.modificarServicio(servicioData.tipo, idServicio, servicioData);

      return this.medicoRepository.updateMedicoByMatricula(matricula, medico);
    });
  }

  deleteServicioMedico(matricula, idServicio, tipo) {
    return this.getMedicoByMatricula(matricula).then((medico) => {
      medico.eliminarServicio(tipo, idServicio);
      return this.medicoRepository.updateMedicoByMatricula(matricula, medico);
    });
  }

    async getMedicoByUsuario(usuario) {
        return await this.medicoRepository.getMedicoByUsuario(usuario);
    }

  static instance() {
    this._instance ||= new this();

    return this._instance;
  }
}

export default MedicoService;
