import React, { useState, useMemo } from 'react';
import { ThemeProvider, CssBaseline, Box, CircularProgress } from '@mui/material';
import { getAppTheme } from './theme/theme.js';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { SocketProvider } from './context/SocketContext.jsx';
import { AuthPage } from './components/auth/AuthPage.jsx';
import { MainLayout } from './components/layout/MainLayout.jsx';

const AppContent = ({ mode, toggleTheme }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <Box
        sx={{
          height: '100vh',
          width: '100vw',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.default',
        }}
      >
        <CircularProgress size={40} thickness={4} />
      </Box>
    );
  }

  if (!isAuthenticated) {
    return <AuthPage />;
  }

  return (
    <SocketProvider>
      <MainLayout mode={mode} toggleTheme={toggleTheme} />
    </SocketProvider>
  );
};

export const App = () => {
  const [mode, setMode] = useState(() => {
    return localStorage.getItem('theme_mode') || 'dark';
  });

  const toggleTheme = () => {
    setMode((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem('theme_mode', next);
      return next;
    });
  };

  const theme = useMemo(() => getAppTheme(mode), [mode]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <AppContent mode={mode} toggleTheme={toggleTheme} />
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
