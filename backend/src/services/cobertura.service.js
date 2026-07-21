class CoberturaService {

    // Recibe los strings que vienen del Paciente y el costo base que viene del Medico
    calcularCobertura(obraSocial, plan, costoBase) {
        // Si el paciente no tiene obra social, paga particular
        if (!obraSocial || !plan) {
            return {
                nivelCobertura: "NO CUBIERTA",
                montoAbonar: costoBase
            };
        }

        const os = obraSocial.toUpperCase();
        const p = plan.toUpperCase();

        // REGLAS MOCKEADAS (Simulando la BD de Obras Sociales del diagrama del TP)
        // CAMBIAR LUEGO
        // TODO

        if (os === "OSDE") {
            if (p === "410" || p === "510") {
                return { nivelCobertura: "TOTAL", montoAbonar: 0 };
            }
            if (p === "210" || p === "310") {
                return { nivelCobertura: "PARCIAL", montoAbonar: costoBase * 0.4 }; // Paga el 40%
            }
        }

        if (os === "SWISS MEDICAL") {
            if (p === "SMG30" || p === "SMG50") {
                return { nivelCobertura: "TOTAL", montoAbonar: 0 };
            }
            return { nivelCobertura: "PARCIAL", montoAbonar: costoBase * 0.5 }; // Paga la mitad
        }

        if (os === "GALENO") {
            return { nivelCobertura: "TOTAL", montoAbonar: 0 };
        }

        // Si la obra social existe pero no la tenemos mapeada en nuestras reglas
        return {
            nivelCobertura: "NO CUBIERTA",
            montoAbonar: costoBase
        };
    }

    static instance() {
        this._instance ||= new this();
        return this._instance;
    }
}

export default CoberturaService;