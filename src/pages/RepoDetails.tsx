import { useLocation, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

import {
  ArrowLeft, GitBranch, Star, Clock, Lock, Globe, ExternalLink, GitCommit,
  GitPullRequest, AlertCircle, Users, Code, Activity, ToggleRight, ListOrdered
} from 'lucide-react';

interface CommitActivity {
  date: string;
  count: number;
}

interface RepoStats {
  commitCount: number;
  pullRequests: number;
  openIssues: number;
  contributors: number;
  lastCommit: string;
  totalLines?: number;
  commitActivity: CommitActivity[];
}

interface Repository {
  id: string;
  name: string;
  fullName: string;
  url: string;
  description: string;
  private: boolean;
  defaultBranch: string;
  stars?: number;
  updatedAt: string;
  autoReviewEnabled: boolean;
}

export default function RepoDetails() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const repo = location.state?.repo as Repository;

  if (!repo) {
    navigate('/dashboard');
    return null;
  }

  const { data: stats, isLoading } = useQuery({
    queryKey: ['repo-stats', repo.id],
    queryFn: async () => {
      const statsResponse = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/repos/${repo.id}/stats`,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
  
      const linesResponse = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/repos/${repo.id}/lines`,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
  
      return { ...statsResponse.data, totalLines: linesResponse.data.totalLines };
    },
  });

  const { data: linesData, isLoading: loadingLines, isError } = useQuery({
    queryKey: ['repo-lines', repo.id],
    queryFn: async () => {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/repos/${repo.id}/lines`,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      return response.data.totalLines;
    },
    enabled: !!repo,
  });

  const toggleAutoReviewMutation = useMutation({
    mutationFn: async () => {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/repos/${repo.id}/toggle-auto-review`,
        {},
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['repos'] });
    },
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 bg-gray-800/60 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-gray-700">
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => navigate('/dashboard')} 
              className="text-gray-400 hover:text-gray-200 transition-colors duration-200 p-2 hover:bg-gray-700/50 rounded-xl"
            >
              <ArrowLeft className="h-6 w-6" />
            </button>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                {repo.name}
              </h1>
              <p className="text-gray-400 font-medium">{repo.fullName}</p>
            </div>
          </div>
          <a 
            href={repo.url} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="flex items-center space-x-2 text-gray-400 hover:text-blue-400 transition-colors duration-200 px-4 py-2 rounded-xl hover:bg-gray-800/50"
          >
            <ExternalLink className="h-5 w-5" />
            <span className="font-medium">View on GitHub</span>
          </a>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Repository Info */}
            <div className="bg-gray-800/60 backdrop-blur-lg rounded-2xl p-6 shadow-lg transition-all duration-300 hover:shadow-xl border border-gray-700">
              <h2 className="text-xl font-bold text-gray-200 mb-4">About</h2>
              <p className="text-gray-400 mb-6 leading-relaxed">{repo.description || 'No description provided.'}</p>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center text-gray-300 p-3 rounded-xl bg-gray-800/80 backdrop-blur transition-all duration-300 hover:bg-gray-700/80 border border-gray-700">
                  {repo.private ? (
                    <>
                      <Lock className="h-5 w-5 mr-2 text-red-400" />
                      <span className="font-medium">Private Repository</span>
                    </>
                  ) : (
                    <>
                      <Globe className="h-5 w-5 mr-2 text-emerald-400" />
                      <span className="font-medium">Public Repository</span>
                    </>
                  )}
                </div>
                <div className="flex items-center text-gray-300 p-3 rounded-xl bg-gray-800/80 backdrop-blur transition-all duration-300 hover:bg-gray-700/80 border border-gray-700">
                  <GitBranch className="h-5 w-5 mr-2 text-blue-400" />
                  <span className="font-medium">Default: {repo.defaultBranch}</span>
                </div>
                {repo.stars !== undefined && (
                  <div className="flex items-center text-gray-300 p-3 rounded-xl bg-gray-800/80 backdrop-blur transition-all duration-300 hover:bg-gray-700/80 border border-gray-700">
                    <Star className="h-5 w-5 mr-2 text-amber-400" />
                    <span className="font-medium">{repo.stars} stars</span>
                  </div>
                )}
                <div className="flex items-center text-gray-300 p-3 rounded-xl bg-gray-800/80 backdrop-blur transition-all duration-300 hover:bg-gray-700/80 border border-gray-700">
                  <Clock className="h-5 w-5 mr-2 text-purple-400" />
                  <span className="font-medium">Updated {new Date(repo.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            {/* Activity Stats */}
            {!isLoading && stats && (
              <div className="bg-gray-800/60 backdrop-blur-lg rounded-2xl p-6 shadow-lg transition-all duration-300 hover:shadow-xl border border-gray-700">
                <h2 className="text-xl font-bold text-gray-200 mb-6">Activity</h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mb-8">
                  <div className="text-center p-4 rounded-xl bg-gray-800/80 backdrop-blur transition-all duration-300 hover:bg-gray-700/80 hover:shadow-md border border-gray-700">
                    <div className="text-3xl font-bold text-blue-400 mb-1">{stats.commitCount}</div>
                    <div className="text-sm font-medium text-gray-400">Commits</div>
                  </div>
                  <div className="text-center p-4 rounded-xl bg-gray-800/80 backdrop-blur transition-all duration-300 hover:bg-gray-700/80 hover:shadow-md border border-gray-700">
                    <div className="text-3xl font-bold text-purple-400 mb-1">{stats.pullRequests}</div>
                    <div className="text-sm font-medium text-gray-400">Pull Requests</div>
                  </div>
                  <div className="text-center p-4 rounded-xl bg-gray-800/80 backdrop-blur transition-all duration-300 hover:bg-gray-700/80 hover:shadow-md border border-gray-700">
                    <div className="text-3xl font-bold text-amber-400 mb-1">{stats.openIssues}</div>
                    <div className="text-sm font-medium text-gray-400">Open Issues</div>
                  </div>
                  <div className="text-center p-4 rounded-xl bg-gray-800/80 backdrop-blur transition-all duration-300 hover:bg-gray-700/80 hover:shadow-md border border-gray-700">
                    <div className="text-3xl font-bold text-emerald-400 mb-1">{stats.contributors}</div>
                    <div className="text-sm font-medium text-gray-400">Contributors</div>
                  </div>
                </div>
              </div>
            )}

            {/* Total Lines of Code */}
            <div className="bg-gray-800/60 backdrop-blur-lg rounded-2xl p-6 shadow-lg transition-all duration-300 hover:shadow-xl border border-gray-700">
              <h2 className="text-xl font-bold text-gray-200 mb-4">Codebase Metrics</h2>
              <div className="flex items-center bg-gray-800/80 backdrop-blur p-4 rounded-xl transition-all duration-300 hover:bg-gray-700/80 border border-gray-700">
                <ListOrdered className="h-6 w-6 mr-3 text-blue-400" />
                <div>
                  <span className="font-medium text-gray-300">Total Lines of Code:</span>
                  <span className="ml-2 text-lg font-semibold text-blue-400">
                    {loadingLines ? 'Loading...' : (linesData !== undefined ? linesData.toLocaleString() : 'Not Available')}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Actions */}
          <div className="space-y-6">
            <div className="bg-gray-800/60 backdrop-blur-lg rounded-2xl p-6 shadow-lg transition-all duration-300 hover:shadow-xl border border-gray-700">
              <h2 className="text-xl font-bold text-gray-200 mb-4">Actions</h2>
              <div className="bg-gray-800/80 backdrop-blur rounded-xl p-4 transition-all duration-300 hover:bg-gray-700/80 border border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${repo.autoReviewEnabled ? 'bg-emerald-400/10' : 'bg-gray-700'}`}>
                      <ToggleRight className={`h-6 w-6 ${repo.autoReviewEnabled ? 'text-emerald-400' : 'text-gray-500'}`} />
                    </div>
                    <div>
                      <p className="font-medium text-gray-200">Auto Review</p>
                      <p className="text-sm text-gray-400">Automated code review for pull requests</p>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleAutoReviewMutation.mutate()}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                      repo.autoReviewEnabled 
                        ? 'bg-emerald-400/10 text-emerald-400 hover:bg-emerald-400/20' 
                        : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                    }`}
                  >
                    {repo.autoReviewEnabled ? 'Disable' : 'Enable'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
