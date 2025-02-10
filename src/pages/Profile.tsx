import { useAuth } from '../hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { LogOut, Mail, Folder, CheckCircle } from 'lucide-react';

export default function Profile() {
  const { user, logout } = useAuth();

  // ✅ Fetch Total Repositories & Auto Reviewed Repos Count
  const { data: repoStats, isLoading } = useQuery({
    queryKey: ['repo-stats'],
    queryFn: async () => {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/repos`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const totalRepos = response.data.length;
      const autoReviewedRepos = response.data.filter((repo: any) => repo.autoReview).length;
      return { totalRepos, autoReviewedRepos };
    },
  });

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
      <div className="max-w-lg w-full bg-gray-800/60 backdrop-blur-lg rounded-2xl shadow-lg p-8 border border-gray-700">
        {/* Profile Header */}
        <div className="flex items-center space-x-6 mb-8">
          <img
            src={user.avatar}
            alt={user.name}
            className="h-24 w-24 rounded-full ring-4 ring-gray-700"
          />
          <div>
            <h1 className="text-2xl font-bold text-gray-100">{user.name}</h1>
            {user.email && (
              <p className="text-gray-400 flex items-center gap-2">
                <Mail className="h-4 w-4 text-blue-400" /> {user.email}
              </p>
            )}
            <p className="text-sm text-gray-500 mt-1">Connected via {user.provider}</p>
          </div>
        </div>

        {/* Statistics */}
        <div className="bg-gray-800/80 p-6 rounded-xl shadow-inner border border-gray-700">
          <h2 className="text-lg font-semibold text-gray-300 mb-4">Repository Statistics</h2>

          {isLoading ? (
            <p className="text-gray-400">Loading repository data...</p>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-gray-900/80 p-3 rounded-lg border border-gray-700">
                <div className="flex items-center space-x-3">
                  <Folder className="h-5 w-5 text-yellow-400" />
                  <span className="text-gray-300 font-medium">Total Repositories</span>
                </div>
                <span className="text-lg font-bold text-gray-100">{repoStats?.totalRepos || 0}</span>
              </div>

              <div className="flex items-center justify-between bg-gray-900/80 p-3 rounded-lg border border-gray-700">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-400" />
                  <span className="text-gray-300 font-medium">Auto Review Enabled</span>
                </div>
                <span className="text-lg font-bold text-gray-100">{repoStats?.autoReviewedRepos || 0}</span>
              </div>
            </div>
          )}
        </div>

        {/* Logout Button */}
        <div className="mt-8 border-t border-gray-700 pt-6 text-center">
          <button
            onClick={logout}
            className="bg-red-600 text-white px-5 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center mx-auto space-x-2"
          >
            <LogOut className="h-5 w-5" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </div>
  );
}


