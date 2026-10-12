import { createTheme } from '@mui/material/styles';

export const getAppTheme = (mode = 'dark') => {
  const isDark = mode === 'dark';

  return createTheme({
    palette: {
      mode,
      primary: {
        main: '#6366f1',
        light: '#818cf8',
        dark: '#4f46e5',
        contrastText: '#ffffff',
      },
      secondary: {
        main: '#10b981', // Online presence green
        light: '#34d399',
        dark: '#059669',
      },
      background: {
        default: isDark ? '#0b0f19' : '#f8fafc',
        paper: isDark ? '#111827' : '#ffffff',
        elevated: isDark ? '#1f2937' : '#f1f5f9',
      },
      text: {
        primary: isDark ? '#f3f4f6' : '#0f172a',
        secondary: isDark ? '#9ca3af' : '#64748b',
      },
      divider: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
      action: {
        hover: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.04)',
        selected: isDark ? 'rgba(99, 102, 241, 0.15)' : 'rgba(99, 102, 241, 0.1)',
      },
    },
    typography: {
      fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif",
      h5: {
        fontWeight: 700,
        letterSpacing: '-0.02em',
      },
      h6: {
        fontWeight: 600,
        letterSpacing: '-0.01em',
      },
      subtitle1: {
        fontWeight: 600,
      },
      subtitle2: {
        fontWeight: 500,
      },
      body1: {
        fontSize: '0.9375rem',
      },
      body2: {
        fontSize: '0.84rem',
      },
      button: {
        textTransform: 'none',
        fontWeight: 600,
      },
    },
    shape: {
      borderRadius: 12,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            padding: '8px 18px',
            boxShadow: 'none',
            '&:hover': {
              boxShadow: isDark
                ? '0 4px 14px 0 rgba(99, 102, 241, 0.35)'
                : '0 4px 14px 0 rgba(99, 102, 241, 0.25)',
            },
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: '#6366f1',
              borderWidth: '1.5px',
            },
          },
        },
      },
    },
  });
};
