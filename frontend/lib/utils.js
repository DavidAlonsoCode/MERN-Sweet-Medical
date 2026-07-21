import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

// esta funcion es estandar en Tailwind. sirve para mezclar clases CSS sin que se pisen entre si de forma fea
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}