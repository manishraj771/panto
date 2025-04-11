import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// Define a type for the user object based on your server response
interface User {
  id: string;
  username: string;
  name: string;
  email: string | null;
  avatar: string;
  bio: string;
  followers: number;
  following: number;
  publicRepos: number;
  provider: string;
  accessToken?: string; // Optional, not exposed in /api/auth/me
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token')); // Add token state
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null); // Add error state
  const navigate = useNavigate();

  // Check auth status on mount
  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = localStorage.getItem('token');
      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${storedToken}` },
        });
        setUser(response.data);
        setToken(storedToken); // Sync token state
        setError(null);
      } catch (err) {
        console.error('❌ Error checking auth:', err);
        localStorage.removeItem('token');
        setToken(null);
        setError('Failed to verify session. Please log in again.');
        navigate('/login', { state: { error: 'Session expired' } });
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, [navigate]);

  // Initiate GitHub login
  const login = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/auth/github`);
      const { authUrl, state } = response.data;
      localStorage.setItem('oauth_state', state);
      window.location.href = authUrl;
    } catch (err) {
      console.error('❌ Error starting GitHub login:', err);
      setError('Failed to initiate login');
      setLoading(false);
    }
  }, []);

  // Handle OAuth callback
  const handleCallback = useCallback(
    async (code: string, receivedState: string) => {
      const storedState = localStorage.getItem('oauth_state');
      if (!storedState || receivedState !== storedState) {
        console.error('❌ Invalid state parameter');
        setError('Invalid state parameter');
        navigate('/login', { state: { error: 'Invalid state' } });
        return;
      }

      localStorage.removeItem('oauth_state');
      setLoading(true);

      try {
        const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/github/callback`, {
          code,
          state: receivedState,
        });
        const { token: newToken, user: userData } = response.data;
        localStorage.setItem('token', newToken);
        setToken(newToken);
        setUser(userData);
        setError(null);
        navigate('/dashboard');
      } catch (err) {
        console.error('❌ Auth callback error:', err);
        setError('Authentication failed. Please try again.');
        navigate('/login', { state: { error: 'Authentication failed' } });
      } finally {
        setLoading(false);
      }
    },
    [navigate]
  );

  // Logout
  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setError(null);
    navigate('/login');
  }, [navigate]);

  return { user, token, loading, error, login, handleCallback, logout };
}