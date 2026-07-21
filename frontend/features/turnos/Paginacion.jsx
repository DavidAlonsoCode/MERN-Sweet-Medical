'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from "@heroui/react"

export default function Paginacion({ meta, onChangePage }) {
    if (!meta || meta.totalPages <= 1) return null

    const { currentPage, totalPages, totalItems, itemsPerPage } = meta

    // matematicas simples: calculo desde que registro hasta que registro estoy mostrando en base a la pagina en la que estoy
    const desde = (currentPage - 1) * itemsPerPage + 1
    const hasta = Math.min(currentPage * itemsPerPage, totalItems)

    return (
        <div className="flex flex-row items-center justify-between gap-2 mt-6 bg-sky-200/90 backdrop-blur-md py-2 px-3 border border-sky-300 rounded-full shadow-sm w-full">
            {/* Botón Anterior */}
            <Button
                size="sm"
                variant="light"
                isIconOnly
                isDisabled={currentPage === 1}
                onPress={() => onChangePage(currentPage - 1)}
                aria-label="Página anterior"
                className="text-sky-900 hover:bg-sky-300/50 rounded-full"
            >
                <ChevronLeft size={20} />
            </Button>

            {/* Texto Central */}
            <p className="text-sm font-bold text-sky-900 text-center flex-1">
                Página {currentPage} - Mostrando {desde}–{hasta} de {totalItems} turnos
            </p>

            {/* Botón Siguiente */}
            <Button
                size="sm"
                variant="light"
                isIconOnly
                isDisabled={currentPage === totalPages}
                onPress={() => onChangePage(currentPage + 1)}
                aria-label="Página siguiente"
                className="text-sky-900 hover:bg-sky-300/50 rounded-full"
            >
                <ChevronRight size={20} />
            </Button>
        </div>
    )
}