import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export function useAuth() {
  const [user, setUser] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
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

  const login = useCallback(async () => {
    try {
      // ✅ Fetch state from the backend
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/auth/github`);
      const { authUrl, state } = response.data;

      localStorage.setItem('oauth_state', state); // Store state in localStorage
      window.location.href = authUrl; // Redirect user to GitHub login page
    } catch (error) {
      console.error('❌ Error starting GitHub login:', error);
    }
  }, []);
  const logout = useCallback(() => {
    localStorage.removeItem('token');  // Remove the token
    setUser(null);  // Clear the user state
    navigate('/login');  // Redirect to login page
  }, [navigate]);
  

  const handleCallback = useCallback(async (code: string, receivedState: string) => {
    const storedState = localStorage.getItem('oauth_state');

    // ✅ Ensure the received state matches the stored state
    if (!storedState || receivedState !== storedState) {
      console.error("❌ Invalid state parameter");
      return;
    }

    localStorage.removeItem('oauth_state');

    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/github/callback`, { code, state: receivedState });
      const { token, user: userData } = response.data;
      localStorage.setItem('token', token);
      setUser(userData);
      navigate('/dashboard');
    } catch (error) {
      console.error('❌ Auth callback error:', error);
      navigate('/login', { state: { error: 'Authentication failed. Please try again.' } });
    }
  }, [navigate]);

  return { user, loading, login, handleCallback,logout };
}
