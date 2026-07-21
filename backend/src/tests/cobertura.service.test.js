import CoberturaService from "../services/cobertura.service.js";

describe("CoberturaService UNIT", () => {
    let coberturaService;

    beforeEach(() => {
        coberturaService = CoberturaService.instance();
    });

    test("debería devolver NO CUBIERTA y el costo total si el paciente no tiene obra social", () => {
        const result = coberturaService.calcularCobertura(null, null, 10000);
        expect(result.nivelCobertura).toBe("NO CUBIERTA");
        expect(result.montoAbonar).toBe(10000);
    });

    test("debería devolver TOTAL y 0 pesos para planes superiores de OSDE", () => {
        const result410 = coberturaService.calcularCobertura("OSDE", "410", 15000);
        expect(result410.nivelCobertura).toBe("TOTAL");
        expect(result410.montoAbonar).toBe(0);
    });

    test("debería devolver PARCIAL (40% de pago) para planes básicos de OSDE", () => {
        const result210 = coberturaService.calcularCobertura("OSDE", "210", 10000);
        expect(result210.nivelCobertura).toBe("PARCIAL");
        expect(result210.montoAbonar).toBe(4000);
    });

    test("debería devolver TOTAL para los planes superiores de SWISS MEDICAL", () => {
        const result = coberturaService.calcularCobertura("Swiss Medical", "SMG30", 12000);
        expect(result.nivelCobertura).toBe("TOTAL");
        expect(result.montoAbonar).toBe(0);
    });

    test("debería devolver PARCIAL (50% de pago) para otros planes de SWISS MEDICAL", () => {
        const result = coberturaService.calcularCobertura("SWISS MEDICAL", "SMG20", 20000);
        expect(result.nivelCobertura).toBe("PARCIAL");
        expect(result.montoAbonar).toBe(10000);
    });

    test("debería devolver TOTAL siempre para GALENO", () => {
        const result = coberturaService.calcularCobertura("GALENO", "220", 5000);
        expect(result.nivelCobertura).toBe("TOTAL");
        expect(result.montoAbonar).toBe(0);
    });

    test("debería manejar una obra social existente que no está mapeada en las reglas", () => {
        const result = coberturaService.calcularCobertura("IOMA", "Plan A", 8000);
        expect(result.nivelCobertura).toBe("NO CUBIERTA");
        expect(result.montoAbonar).toBe(8000);
    });
});