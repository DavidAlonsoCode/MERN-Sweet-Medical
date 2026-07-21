'use client'

import { Search, RotateCcw, X } from 'lucide-react'
import { useMaestros } from './useMaestros'
import { Select, Label, ListBox, TextField, Input, Button } from "@heroui/react"

export default function FiltrosTurnos({ filtros, onChange, onBuscar, onLimpiar, loading }) {
    const { especialidades, practicas, sedes, medicos, loading: loadingMaestros } = useMaestros()  // traigo todas las opciones posibles de la base de datos usando mi hook global

    const selectedMedico = medicos.find((m) => m.matricula === filtros.medicoMatricula)  // busco si hay algun medico seleccionado para filtrar las otras listas en base a el

    const isIncluded = (medicoArray, nombreBuscado) => {
        if (!medicoArray) return false;
        return medicoArray.some(item => item === nombreBuscado || item.nombre === nombreBuscado);
    }

    const filteredMedicos = medicos.filter(m => {
        let match = true;
        if (filtros.medicoMatricula) match = match && m.matricula === filtros.medicoMatricula;
        if (filtros.especialidad) match = match && isIncluded(m.especialidades, filtros.especialidad);
        if (filtros.practica) match = match && isIncluded(m.practicas, filtros.practica);
        if (filtros.sede) match = match && isIncluded(m.sedes, filtros.sede);
        return match;
    });

    const extraerOpcionesUnicas = (medicosFiltrados, propiedad) => {
        const opciones = new Set();
        medicosFiltrados.forEach(m => {
            if (m[propiedad]) {
                m[propiedad].forEach(item => opciones.add(typeof item === 'string' ? item : item.nombre));
            }
        });
        return opciones;
    };

    const especialidadesDisponibles = extraerOpcionesUnicas(filteredMedicos, 'especialidades');
    const filteredEspecialidades = especialidades.filter(e => especialidadesDisponibles.has(e.nombre));

    const practicasDisponibles = extraerOpcionesUnicas(filteredMedicos, 'practicas');
    const filteredPracticas = practicas.filter(p => practicasDisponibles.has(p.nombre));

    const sedesDisponibles = extraerOpcionesUnicas(filteredMedicos, 'sedes');
    const filteredSedes = sedes.filter(s => sedesDisponibles.has(s.nombre));

    const handleChange = (name, value) => {
        let newFiltros = { ...filtros, [name]: value }

        // magia de auto-limpieza: si eligen un medico, limpio las practicas/especialidades que el no hace
        if (name === 'medicoMatricula' && value) {
            const medico = medicos.find((m) => m.matricula === value)
            if (medico) {
                if (newFiltros.especialidad && !isIncluded(medico.especialidades, newFiltros.especialidad)) {
                    newFiltros.especialidad = ''
                }
                if (newFiltros.practica && !isIncluded(medico.practicas, newFiltros.practica)) {
                    newFiltros.practica = ''
                }
                if (newFiltros.sede && !isIncluded(medico.sedes, newFiltros.sede)) {
                    newFiltros.sede = ''
                }
            }
        }

        onChange(newFiltros)
    }

    const handleSubmit = (e) => {
        e.preventDefault()  // evito el refresh de la pagina al darle Enter al buscador
        onBuscar()
    }

    // armo una crucecita customizada para poder limpiar los combos (simulando el isClearable)
    const ClearButton = ({ onClear }) => (
        <div
            role="button"
            aria-label="Borrar selección"
            className="p-1 -mr-1 rounded-full text-default-400 hover:text-default-700 hover:bg-default-200 transition-all cursor-pointer z-10"
            // Atrapamos el evento onPointerDown antes de que HeroUI abra el desplegable
            onPointerDown={(e) => {
                e.stopPropagation();
                e.preventDefault();
            }}
            onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onClear();
            }}
        >
            <X size={14} />
        </div>
    )

    return (
        <form onSubmit={handleSubmit} className="!bg-sky-200/90 backdrop-blur-md border !border-sky-300 rounded-2xl p-4 shadow-sm w-full">
            <h2 className="text-sm font-bold text-sky-900 mb-4">Buscar turnos disponibles</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

                <Select
                    placeholder="Todos los profesionales"
                    isDisabled={loadingMaestros}
                    value={filtros.medicoMatricula || null}
                    onChange={(val) => handleChange("medicoMatricula", val)}
                >
                    <Label>Profesional</Label>
                    <Select.Trigger>
                        <Select.Value />
                        {/* Renderizamos la crucecita solo si hay algo seleccionado */}
                        {filtros.medicoMatricula && (
                            <ClearButton onClear={() => handleChange("medicoMatricula", "")} />
                        )}
                        <Select.Indicator />
                    </Select.Trigger>
                    <Select.Popover>
                        <ListBox>
                            {filteredMedicos.map((m) => (
                                <ListBox.Item key={m.matricula} id={m.matricula} textValue={m.nombre}>
                                    {m.nombre}
                                </ListBox.Item>
                            ))}
                        </ListBox>
                    </Select.Popover>
                </Select>

                <Select
                    placeholder="Todas las especialidades"
                    isDisabled={loadingMaestros}
                    value={filtros.especialidad || null}
                    onChange={(val) => handleChange("especialidad", val)}
                >
                    <Label>Especialidad</Label>
                    <Select.Trigger>
                        <Select.Value />
                        {filtros.especialidad && (
                            <ClearButton onClear={() => handleChange("especialidad", "")} />
                        )}
                        <Select.Indicator />
                    </Select.Trigger>
                    <Select.Popover>
                        <ListBox>
                            {filteredEspecialidades.map((e) => (
                                <ListBox.Item key={e.nombre} id={e.nombre} textValue={e.nombre}>
                                    {e.nombre}
                                </ListBox.Item>
                            ))}
                        </ListBox>
                    </Select.Popover>
                </Select>

                <Select
                    placeholder="Todas las prácticas"
                    isDisabled={loadingMaestros}
                    value={filtros.practica || null}
                    onChange={(val) => handleChange("practica", val)}
                >
                    <Label>Práctica</Label>
                    <Select.Trigger>
                        <Select.Value />
                        {filtros.practica && (
                            <ClearButton onClear={() => handleChange("practica", "")} />
                        )}
                        <Select.Indicator />
                    </Select.Trigger>
                    <Select.Popover>
                        <ListBox>
                            {filteredPracticas.map((p) => (
                                <ListBox.Item key={p.nombre} id={p.nombre} textValue={p.nombre}>
                                    {p.nombre}
                                </ListBox.Item>
                            ))}
                        </ListBox>
                    </Select.Popover>
                </Select>

                <Select
                    placeholder="Todas las sedes"
                    isDisabled={loadingMaestros}
                    value={filtros.sede || null}
                    onChange={(val) => handleChange("sede", val)}
                >
                    <Label>Sede</Label>
                    <Select.Trigger>
                        <Select.Value />
                        {filtros.sede && (
                            <ClearButton onClear={() => handleChange("sede", "")} />
                        )}
                        <Select.Indicator />
                    </Select.Trigger>
                    <Select.Popover>
                        <ListBox>
                            {filteredSedes.map((s) => (
                                <ListBox.Item key={s.nombre} id={s.nombre} textValue={s.nombre}>
                                    {s.nombre}
                                </ListBox.Item>
                            ))}
                        </ListBox>
                    </Select.Popover>
                </Select>

                <TextField>
                    <Label>Desde</Label>
                    <Input
                        type="date"
                        name="fechaDesde"
                        value={filtros.fechaDesde}
                        onChange={(e) => handleChange("fechaDesde", e.target.value)}
                    />
                </TextField>

                <TextField>
                    <Label>Hasta</Label>
                    <Input
                        type="date"
                        name="fechaHasta"
                        value={filtros.fechaHasta}
                        onChange={(e) => handleChange("fechaHasta", e.target.value)}
                    />
                </TextField>
            </div>

            <div className="flex items-center gap-3 mt-5">
                <Button type="submit" isDisabled={loading} className="flex items-center gap-2 border !border-sky-300 !bg-sky-200/90 hover:!bg-sky-300 !text-sky-900 shadow-sm font-bold">
                    {!loading && <Search size={16} />}
                    {loading ? "Buscando..." : "Buscar"}
                </Button>
                <Button type="button" variant="flat" onPress={onLimpiar} className="flex items-center gap-2">
                    <RotateCcw size={16} />
                    Limpiar
                </Button>
            </div>
        </form>
    )
}