import { TurnoNotFoundError, TurnoCancelationTimeError } from "../errors/turno.errors.js";

function turnoExists(turno, id) {
    return turno
        ? Promise.resolve(turno)
        : Promise.reject(new TurnoNotFoundError(id));
}

function verifyCancelTime(turno, id) {
    // Validar la regla de negocio: "no debería poder cancelarse a una hora del turno"
    const now = new Date();
    const fechaHoraTurno = turno.fechaHora; // Ya es un objeto Date
    const diffMs = fechaHoraTurno.getTime() - now.getTime();
    const diffMinutes = Math.ceil(diffMs / (1000 * 60));

    if (diffMinutes <= 60) {
        // Si faltan 60 minutos o menos
        throw new TurnoCancelationTimeError(id, diffMinutes);
    }
}

export {
    turnoExists,
    verifyCancelTime
};
