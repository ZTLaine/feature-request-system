'use client'

import * as React from 'react'
import {
  ThemeProvider as NextThemesProvider,
  type ThemeProviderProps,
} from 'next-themes'

type ReadonlyThemeProviderProps = Readonly<ThemeProviderProps>

export function ThemeProvider({ children, ...props }: ReadonlyThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
