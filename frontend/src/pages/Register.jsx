import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Box, Button, Paper, TextField, Typography } from '@mui/material';
import axios from 'axios';

function Register() {
  const [searchParams] = useSearchParams();
  const token = useMemo(() => searchParams.get('token') || '', [searchParams]);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!token) {
      setError('Missing invitation token in URL');
      return;
    }
    if (!username || !password) {
      setError('Please fill in username and password');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post('http://localhost:8000/api/auth/register-with-token', {
        token,
        username,
        password,
      });
      setMessage(response.data?.message || 'Registration completed');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', p: 2, background: '#f8fafc' }}>
      <Paper sx={{ width: '100%', maxWidth: 420, p: 4, borderRadius: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
          Employee Registration
        </Typography>
        <Typography variant="body2" sx={{ color: '#64748b', mb: 3 }}>
          Complete your account setup from invitation link.
        </Typography>

        <Box component="form" onSubmit={handleSubmit} sx={{ display: 'grid', gap: 2 }}>
          <TextField
            label="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            fullWidth
          />
          <TextField
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            fullWidth
          />
          <Button type="submit" variant="contained" disabled={loading}>
            {loading ? 'Submitting...' : 'Create Account'}
          </Button>
        </Box>

        {message && (
          <Typography sx={{ mt: 2, color: '#16a34a', fontWeight: 600 }}>
            {message}
          </Typography>
        )}
        {error && (
          <Typography sx={{ mt: 2, color: '#dc2626', fontWeight: 600 }}>
            {error}
          </Typography>
        )}
      </Paper>
    </Box>
  );
}

export default Register;
