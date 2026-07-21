import jwt from "jsonwebtoken";
import PacienteService from "./paciente.service.js";
import MedicoService from "./medico.service.js";
import TurnoService from "./turno.service.js";
import NotificacionService from "./notificacion.service.js";

class AuthService {
    constructor({
                    pacienteService = PacienteService.instance(),
                    medicoService = MedicoService.instance(),
                    turnoService = TurnoService.instance(),
                    notificacionService = NotificacionService.instance()
                } = {}) {
        this.pacienteService = pacienteService;
        this.medicoService = medicoService;
        this.turnoService = turnoService;
        this.notificacionService = notificacionService;
        this.JWT_SECRET = process.env.JWT_SECRET || "clave_secreta_para_desarrollo";
    }

    async login(usuario, password) {
        let userDoc = null;
        let rol = null;
        let identificador = null;

        // 1. Buscamos a través del servicio de Pacientes
        userDoc = await this.pacienteService.getPacienteByUsuario(usuario);
        console.log("Paciente encontrado:", userDoc);
        if (userDoc) {
            rol = "PACIENTE";
            identificador = userDoc.dni;
        } else {
            // 2. Si no es paciente, buscamos a través del servicio de Médicos
            userDoc = await this.medicoService.getMedicoByUsuario(usuario);
            console.log("Medico encontrado:", userDoc);
            if (userDoc) {
                rol = "MEDICO";
                identificador = userDoc.matricula;
            }
        }

        // 3. Validación Simplificada: Comparación directa en texto plano
        if (!userDoc || password !== userDoc.password) {
            throw new Error("Credenciales inválidas.");
        }

        // 4. Regla de negocio: Recordatorio del día previo al login
        if (rol === "PACIENTE") {
            await this._procesarRecordatorioDiaPrevio(identificador);
        }

        // 5. Firma y emisión del JWT sin estado
        const token = jwt.sign(
            {
                id: userDoc._id || userDoc.id,
                usuario: userDoc.usuario,
                nombre: userDoc.nombre,
                rol: rol,
                identificador: identificador
            },
            this.JWT_SECRET,
            { expiresIn: "4h" }
        );

        return {
            token,
            user: {
                nombre: userDoc.nombre,
                usuario: userDoc.usuario,
                rol,
                identificador
            }
        };
    }

    async _procesarRecordatorioDiaPrevio(pacienteDni) {
        try {
            const mañanaInicio = new Date();
            mañanaInicio.setDate(mañanaInicio.getDate() + 1);
            mañanaInicio.setHours(0, 0, 0, 0);

            const mañanaFin = new Date();
            mañanaFin.setDate(mañanaFin.getDate() + 1);
            mañanaFin.setHours(23, 59, 59, 999);

            const resultado = await this.turnoService.getTurnos(1, 10, {
                pacienteDni,
                fechaDesde: mañanaInicio.toISOString(),
                fechaHasta: mañanaFin.toISOString(),
                estado: "RESERVADO"
            });

            for (const turno of resultado.data) {
                const horaFormateada = new Date(turno.fechaHora).toLocaleTimeString("es-AR", {
                    hour: "2-digit",
                    minute: "2-digit"
                });

                const medico = await this.medicoService.getMedicoByMatricula(turno.medicoMatricula).catch(() => null);
                const nombreMedico = medico ? medico.nombre : turno.medicoMatricula;

                await this.notificacionService.createNotificacion({
                    destinatario: pacienteDni,
                    remitente: "sistema",
                    mensaje: `Recordatorio de inicio de sesión: Mañana tienes un turno programado a las ${horaFormateada} hs con el/la Dr/a. ${nombreMedico}.`
                });
            }
        } catch (error) {
            console.error("Error al procesar el recordatorio del día previo en el login:", error);
        }
    }

    static instance() {
        this._instance ||= new this();
        return this._instance;
    }
}

export default AuthService;