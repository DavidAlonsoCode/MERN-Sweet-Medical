import { User, MapPin, Calendar, Clock, DollarSign } from 'lucide-react'
import { Card, Chip, Button } from "@heroui/react"

const coberturaBadge = {
    ALTA: 'success',
    MEDIA: 'warning',
    BAJA: 'danger',
    SIN_COBERTURA: 'default',
}

export default function TurnoCard({ turno, enCarrito, onToggleCarrito }) {
    const badgeColor = coberturaBadge[turno.nivelCobertura] || 'default'

    // le doy formato al texto de la cobertura para que quede mas presentable (ej: "SIN_COBERTURA" -> "sin cobertura")
    const coberturaTexto = turno.nivelCobertura
        ? turno.nivelCobertura.toLowerCase().replace('_', ' ')
        : '-'

    return (
        <Card className={`hover:shadow-lg transition-all duration-300 border ${enCarrito ? 'border-emerald-400 bg-emerald-50/10' : 'border-sky-100 hover:border-sky-300'}`}>
            <div className="flex gap-3 justify-between items-start p-4 pb-3 border-b border-sky-50">
                <div className="flex gap-3 items-center">
                    <div className="flex justify-center items-center w-11 h-11 rounded-full bg-gradient-to-tr from-sky-500 to-blue-600 shadow-sm shrink-0">
                        <User size={22} className="text-white" />
                    </div>
                    <div className="flex flex-col">
                        <p className="text-base font-bold text-sky-900 leading-none">{turno.medico}</p>
                        <p className="text-xs font-medium text-sky-600 mt-1">{turno.especialidad}</p>
                    </div>
                </div>
                <Chip size="sm" color={badgeColor} variant="flat" className="capitalize shrink-0 font-bold border">
                    {coberturaTexto}
                </Chip>
            </div>

            <div className="py-3 px-4 flex-1 bg-slate-50/50">
                <div className="grid grid-cols-2 gap-3 text-xs text-slate-600">
                    <div className="flex items-center gap-1.5 font-medium"><Calendar size={14} className="text-sky-500" /><span>{turno.fecha}</span></div>
                    <div className="flex items-center gap-1.5 font-medium"><Clock size={14} className="text-sky-500" /><span>{turno.hora} hs</span></div>
                    <div className="flex items-center gap-1.5 font-medium"><MapPin size={14} className="text-sky-500" /><span className="truncate">{turno.sede}</span></div>
                    <div className="flex items-center gap-1.5 font-medium"><DollarSign size={14} className="text-sky-500" />
                        <span>{turno.costoEstimado != null ? `$${Number(turno.costoEstimado).toLocaleString('es-AR')}` : '-'}</span>
                    </div>
                </div>
            </div>

            {onToggleCarrito && (
                <div className="p-4 pt-3 bg-white rounded-b-medium">
                    <Button 
                        fullWidth 
                        size="sm" 
                        className={`font-bold border shadow-sm ${enCarrito ? 'border-emerald-300 bg-emerald-100 text-emerald-800 hover:bg-emerald-200' : '!border-sky-300 !bg-sky-200/90 hover:!bg-sky-300 !text-sky-900'}`} 
                        onPress={() => onToggleCarrito(turno)}
                    >
                        {enCarrito ? 'Quitar del carrito' : 'Añadir al carrito'}
                    </Button>
                </div>
            )}
        </Card>
    )
}