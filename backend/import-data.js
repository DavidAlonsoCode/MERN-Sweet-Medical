import { connectDB } from './src/database.js';
import Especialidad from './src/models/especialidad.model.js';
import Practica from './src/models/practica.model.js';
import Sede from './src/models/sede.model.js';
import ObraSocial from './src/models/obraSocial.model.js';

const importarExistentes = async () => {
    try {
        await connectDB();

        // 1. Limpiar colecciones maestras
        await Promise.all([
            Especialidad.deleteMany({}),
            Practica.deleteMany({}),
            Sede.deleteMany({}),
            ObraSocial.deleteMany({})
        ]);

        console.log("--- Base de datos maestra reseteada ---");

        const espCardio = await Especialidad.create({ nombre: "Cardiología", duracionMinutos: 40 });
        const espPediatria = await Especialidad.create({ nombre: "Pediatría", duracionMinutos: 40 });
        const espMedInterna = await Especialidad.create({ nombre: "Medicina Interna", duracionMinutos: 40 });

        await Practica.insertMany([
            { nombre: "Electrocardiograma", duracionMinutos: 40, especialidad: espCardio._id },
            { nombre: "Ergometría", duracionMinutos: 40, especialidad: espCardio._id },
            { nombre: "Control Niño Sano", duracionMinutos: 40, especialidad: espPediatria._id }
        ]);

        await Sede.insertMany([
            { nombre: "Sanatorio Finochietto", barrio: "Balvanera" },
            { nombre: "Hospital Italiano", barrio: "Almagro" }
        ]);

        await ObraSocial.insertMany([
            { nombre: "OSDE", planes: ["210", "310", "410"] },
            { nombre: "Swiss Medical", planes: ["SMG20", "SMG30"] },
            { nombre: "Galeno", planes: ["220", "Oro"] },
            { nombre: "Sancor Salud", planes: ["1000B"] }
        ]);

        console.log("✅ Datos existentes importados con éxito.");
        process.exit(0);
    } catch (error) {
        console.error("❌ Error importando datos:", error);
        process.exit(1);
    }
};

importarExistentes();

//node import-data.js