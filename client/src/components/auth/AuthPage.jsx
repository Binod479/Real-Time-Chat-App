import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Tabs,
  Tab,
  Alert,
  CircularProgress,
  Chip,
  Stack,
  Divider,
  InputAdornment,
  IconButton,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  ChatBubbleOutline,
  LockOutlined,
  PersonOutline,
  EmailOutlined,
  SpeedOutlined,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext.jsx';

export const AuthPage = () => {
  const { login, register, authError, setAuthError } = useAuth();
  const [tabIndex, setTabIndex] = useState(0); // 0 = Login, 1 = Register

  // Form states
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleTabChange = (event, newValue) => {
    setTabIndex(newValue);
    if (setAuthError) setAuthError(null);
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!identifier || !password) return;
    setLoading(true);
    try {
      await login(identifier, password);
    } catch {
      // Error handled in context
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!username || !email || !password) return;
    setLoading(true);
    try {
      await register({ username, email, password, displayName });
    } catch {
      // Error handled in context
    } finally {
      setLoading(false);
    }
  };

  // Quick autofill demo accounts
  const fillDemoAccount = (demoUsername) => {
    setTabIndex(0);
    setIdentifier(demoUsername);
    setPassword('Password123!');
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100vw',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: (theme) =>
          theme.palette.mode === 'dark'
            ? 'radial-gradient(circle at 50% 20%, #1e1b4b 0%, #0b0f19 70%)'
            : 'radial-gradient(circle at 50% 20%, #e0e7ff 0%, #f8fafc 70%)',
        p: 2,
      }}
    >
      <Card
        elevation={6}
        sx={{
          maxWidth: 460,
          width: '100%',
          borderRadius: 4,
          backdropFilter: 'blur(16px)',
          border: (theme) => `1px solid ${theme.palette.divider}`,
          boxShadow: (theme) =>
            theme.palette.mode === 'dark'
              ? '0 20px 40px rgba(0,0,0,0.6)'
              : '0 20px 40px rgba(99,102,241,0.08)',
        }}
      >
        <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
          {/* Brand Logo & Title */}
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                bgcolor: 'primary.main',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                mb: 1.5,
                boxShadow: '0 8px 24px rgba(99, 102, 241, 0.4)',
              }}
            >
              <ChatBubbleOutline sx={{ fontSize: 30 }} />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 800 }}>
              SphereChat
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Real-Time PERN Messaging Platform
            </Typography>
          </Box>

          {/* Tabs */}
          <Tabs
            value={tabIndex}
            onChange={handleTabChange}
            variant="fullWidth"
            sx={{
              mb: 3,
              borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
              '& .MuiTab-root': { fontWeight: 600 },
            }}
          >
            <Tab label="Sign In" />
            <Tab label="Create Account" />
          </Tabs>

          {authError && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
              {authError}
            </Alert>
          )}

          {/* Login Form */}
          {tabIndex === 0 && (
            <form onSubmit={handleLoginSubmit}>
              <Stack spacing={2.5}>
                <TextField
                  label="Username or Email"
                  placeholder="e.g. alice or alice@example.com"
                  fullWidth
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonOutline fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                />

                <TextField
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  fullWidth
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockOutlined fontSize="small" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" size="small">
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  fullWidth
                  disabled={loading}
                  sx={{ py: 1.3 }}
                >
                  {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
                </Button>
              </Stack>
            </form>
          )}

          {/* Register Form */}
          {tabIndex === 1 && (
            <form onSubmit={handleRegisterSubmit}>
              <Stack spacing={2}>
                <TextField
                  label="Username"
                  placeholder="e.g. alex99"
                  fullWidth
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonOutline fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                />

                <TextField
                  label="Display Name (Optional)"
                  placeholder="e.g. Alex Johnson"
                  fullWidth
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />

                <TextField
                  label="Email Address"
                  type="email"
                  placeholder="alex@example.com"
                  fullWidth
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailOutlined fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                />

                <TextField
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  fullWidth
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  helperText="At least 6 characters"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockOutlined fontSize="small" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" size="small">
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  fullWidth
                  disabled={loading}
                  sx={{ py: 1.3 }}
                >
                  {loading ? <CircularProgress size={24} color="inherit" /> : 'Create Account'}
                </Button>
              </Stack>
            </form>
          )}

          {/* Quick Demo Accounts Helper */}
          <Box sx={{ mt: 3 }}>
            <Divider sx={{ mb: 2 }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <SpeedOutlined sx={{ fontSize: 14 }} /> QUICK DEMO USERS (Password123!)
              </Typography>
            </Divider>
            <Stack direction="row" spacing={1} justifyContent="center" flexWrap="wrap" useFlexGap>
              {['alice', 'bob', 'charlie', 'diana'].map((demo) => (
                <Chip
                  key={demo}
                  label={demo}
                  size="small"
                  clickable
                  variant="outlined"
                  onClick={() => fillDemoAccount(demo)}
                  sx={{ textTransform: 'capitalize', fontWeight: 500 }}
                />
              ))}
            </Stack>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default AuthPage;
