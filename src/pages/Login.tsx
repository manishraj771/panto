import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Github, Gitlab as GitlabLogo, Cloud } from 'lucide-react';
import { useAuth, Provider } from '../hooks/useAuth';

export default function Login() {
  const { user, login } = useAuth();
  const [loadingProvider, setLoadingProvider] = useState<Provider | null>(null);

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleLogin = async (provider: Provider) => {
    setLoadingProvider(provider);
    try {
      await login(provider);
    } catch (error) {
      console.error('Login error:', error);
    }
    setLoadingProvider(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to Panto</h1>
          <p className="text-gray-600">Manage all your Git repositories in one place</p>
        </div>

        <div className="space-y-4">
          <button
            onClick={() => handleLogin('github')}
            disabled={loadingProvider === 'github'}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            <Github className="w-5 h-5" />
            {loadingProvider === 'github' ? 'Connecting...' : 'Continue with GitHub'}
          </button>

          <button
            onClick={() => handleLogin('gitlab')}
            disabled={loadingProvider === 'gitlab'}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-[#FC6D26] text-white rounded-lg hover:bg-[#E24329] transition-colors disabled:opacity-50"
          >
            <GitlabLogo className="w-5 h-5" />
            {loadingProvider === 'gitlab' ? 'Connecting...' : 'Continue with GitLab'}
          </button>

          <button
            onClick={() => handleLogin('bitbucket')}
            disabled={loadingProvider === 'bitbucket'}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-[#0052CC] text-white rounded-lg hover:bg-[#0747A6] transition-colors disabled:opacity-50"
          >
            <Cloud className="w-5 h-5" />
            {loadingProvider === 'bitbucket' ? 'Connecting...' : 'Continue with Bitbucket'}
          </button>
        </div>
      </div>
    </div>
  );
}