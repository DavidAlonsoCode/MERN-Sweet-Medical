import Medico from "../../src/domain/Medico.js";

describe("Medico Domain", () => {
  let medico;

  beforeEach(() => {
    medico = new Medico({
      usuario: "jperez",
      matricula: "1234",
      nombre: "Juan Perez",
      especialidades: [],
      practicas: [],
      sedes: [],
      disponibilidades: [],
    });
  });

  test("debería agregar una disponibilidad", () => {
    medico.agregarDisponibilidad(
      null,
      "Lunes",
      "08:00",
      "12:00"
    );

    expect(medico.disponibilidades.length).toBe(1);
  });

  test("debería eliminar una disponibilidad", () => {
    medico.agregarDisponibilidad(
      "disp1",
      "Lunes",
      "08:00",
      "12:00"
    );

    medico.eliminarDisponibilidad("disp1");

    expect(medico.disponibilidades.length).toBe(0);
  });

  test("no debería permitir disponibilidades superpuestas", () => {
    medico.agregarDisponibilidad(
      "disp1",
      "Lunes",
      "08:00",
      "12:00"
    );

    expect(() => {
      medico.agregarDisponibilidad(
        "disp2",
        "Lunes",
        "10:00",
        "14:00"
      );
    }).toThrow();
  });
});