import React, { createContext, useState, useEffect } from 'react';

export const ThemeContext = createContext({
  theme: 'light',
  setLight: () => {},
  setDark: () => {},
});

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('app-theme') || 'light';
    } catch (e) {
      return 'light';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('app-theme', theme);
    } catch (e) {}
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const setLight = () => setTheme('light');
  const setDark = () => setTheme('dark');

  return (
    <ThemeContext.Provider value={{ theme, setLight, setDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export default ThemeProvider;
