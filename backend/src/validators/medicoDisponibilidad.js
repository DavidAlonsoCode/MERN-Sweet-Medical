import { MedicoNoDisponibleError, TurnoDuplicatedError } from "../errors/turno.errors.js";
import { MedicoNotFoundError, MedicoAlreadyExistsError } from "../errors/medico.errors.js";

function medicoExists(matricula, medico) {
    return medico
        ? Promise.resolve(medico)
        : Promise.reject(new MedicoNotFoundError(matricula));
}

function medicoNotExists(matricula, medico) {
    return medico
        ? Promise.reject(new MedicoAlreadyExistsError(matricula))
        : Promise.resolve();
}

function medicoAvailable(medico, fechaHoraTurno) {
    return medico.estaDisponible(fechaHoraTurno)
        ? Promise.resolve()
        : Promise.reject(
            new MedicoNoDisponibleError(
                medico.matricula,
                fechaHoraTurno.toLocaleString(),
            ),
        );
}

function medicoHasTurno(turnosMedico, fechaHoraTurno, medico) {
    const duracionMinutos = medico.calcularDuracionTurno();
    const tiempoMinimo = duracionMinutos * 60 * 1000;

    const medicoTieneTurno = turnosMedico.some((turno) => {
        if (turno.estado === "CANCELADO") return false;

        const diferenciaTiempo = Math.abs(
            turno.fechaHora.getTime() - fechaHoraTurno.getTime(),
        );
        return diferenciaTiempo < tiempoMinimo;
    });

    return medicoTieneTurno
        ? Promise.reject(new TurnoDuplicatedError(fechaHoraTurno.toLocaleString()))
        : Promise.resolve();
}

export {
    medicoExists,
    medicoNotExists,
    medicoAvailable,
    medicoHasTurno
};