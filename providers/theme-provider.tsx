'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'

export type Theme = 'light' | 'dark' | 'system'

interface ThemeContextType {
  theme: Theme | null
  systemTheme: 'light' | 'dark'
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme | null>(null)
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>('light')

  // Detect system preference on mount
  useEffect(() => {
    (() => {
      const isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
      setSystemTheme(isDark ? 'dark' : 'light')
    })();
  }, [])

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    (() => {
      try {
        const stored = localStorage.getItem('theme-preference') as Theme | null
        const isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches

        const resolvedTheme: Theme = stored || 'system'
        setThemeState(resolvedTheme)

        // Apply theme to DOM
        applyTheme(resolvedTheme, isDark)
      } catch (e) {
        console.warn('Failed to init theme:', e)
        setThemeState('system')
      }
    })();
  }, [])

  const setTheme = (newTheme: Theme) => {
    try {
      setThemeState(newTheme)
      localStorage.setItem('theme-preference', newTheme)
      const isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
      applyTheme(newTheme, isDark)
    } catch (e) {
      console.warn('Failed to set theme:', e)
    }
  }

  return (
    <ThemeContext.Provider value={{ theme, systemTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

function applyTheme(theme: Theme, systemIsDark: boolean) {
  const html = document.documentElement
  const isDark = theme === 'dark' || (theme === 'system' && systemIsDark)

  if (isDark) {
    html.classList.add('dark')
  } else {
    html.classList.remove('dark')
  }
}
