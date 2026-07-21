'use client'

import * as React from 'react'
import {
  ThemeProvider as NextThemesProvider,
} from 'next-themes'

// este componente es parte de la configuracion automatica de shadcn/ui para soportar modo oscuro y claro (aunque nosotros fijamos los colores de la marca para que siempre se vea bien)
export function ThemeProvider({ children, ...props }) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}