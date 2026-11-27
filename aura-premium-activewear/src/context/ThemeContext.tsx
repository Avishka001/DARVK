import React, { createContext, useState, useEffect, ReactNode } from 'react';

type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    // Always default to dark; only restore if explicitly set by user toggle
    const saved = localStorage.getItem('aura_theme') as Theme | null;
    return saved ?? 'dark';
  });

  useEffect(() => {
    localStorage.setItem('aura_theme', theme);
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    
    if (theme === 'light') {
      document.body.style.backgroundColor = '#ffffff';
      document.body.style.color = '#000000';
    } else {
      document.body.style.backgroundColor = '#050505';
      document.body.style.color = '#ffffff';
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return React.useContext(ThemeContext);
}
