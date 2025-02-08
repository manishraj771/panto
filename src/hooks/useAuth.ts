import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { AUTH_CONFIG } from '../config/auth';

export type Provider = 'github' | 'gitlab' | 'bitbucket';

interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  provider: Provider;
  accessToken: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setUser(response.data);
        }
      } catch (error) {
        localStorage.removeItem('token');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = useCallback((provider: Provider) => {
    const config = AUTH_CONFIG[provider];
    const state = crypto.randomUUID();
    localStorage.setItem('oauth_state', state);
    
    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      response_type: 'code',
      scope: config.scope,
      state,
    });

    // For GitHub, add allow_signup parameter
    if (provider === 'github') {
      params.append('allow_signup', 'true');
    }

    const authUrl = `${config.authUrl}?${params.toString()}`;
    window.location.href = authUrl;
  }, []);

  const handleCallback = useCallback(async (code: string, state: string, provider: Provider) => {
    const savedState = localStorage.getItem('oauth_state');
    if (state !== savedState) {
      throw new Error('Invalid state parameter');
    }

    localStorage.removeItem('oauth_state');
    
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/${provider}/callback`, {
        code,
        redirect_uri: AUTH_CONFIG[provider].redirectUri,
      });

      const { token, user: userData } = response.data;
      localStorage.setItem('token', token);
      setUser(userData);
      navigate('/dashboard');
    } catch (error) {
      console.error('Auth callback error:', error);
      navigate('/login', { state: { error: 'Authentication failed. Please try again.' } });
    }
  }, [navigate]);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setUser(null);
    navigate('/login');
  }, [navigate]);

  return {
    user,
    loading,
    login,
    logout,
    handleCallback,
  };
}