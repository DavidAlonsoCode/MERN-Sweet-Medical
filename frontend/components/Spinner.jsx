import { Spinner as HeroSpinner } from "@heroui/react"

// creo este componente para envolver el spinner de HeroUI y no tener que configurarle el color en cada pantalla donde lo use
export default function Spinner({ size = 'md' }) {
    const sizeMap = { sm: 'sm', md: 'md', lg: 'lg' }
    return <HeroSpinner size={sizeMap[size] || 'md'} color="primary" />
}
