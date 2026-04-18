import React, { createContext, useContext, useState } from 'react';

const ThemeContext = createContext();

const lightColors = {
  background: '#ffffff',
  card: '#f8fafc',
  primaryText: '#0f172a',
  secondaryText: '#64748b',
  accent: '#5b21b6',
  success: '#34C759',
  muted: '#e2e8f0',
  placeholder: '#64748b',
};

const darkColors = {
  background: '#0f1117',
  card: '#1a1d26',
  primaryText: '#ffffff',
  secondaryText: '#6b7280',
  accent: '#5b21b6',
  success: '#34C759',
  muted: '#252831',
  placeholder: '#6b7280',
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('dark');

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  const colors = theme === 'dark' ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);