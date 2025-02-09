import React from 'react';
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
  totalLines?: number;  // ✅ Added totalLines here
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

  // Ensure repo data is available before rendering
  if (!repo) {
    navigate('/dashboard');
    return null;
  }

  // Fetch Repository Statistics including Total Lines
  // const { data: stats, isLoading } = useQuery({
  //   queryKey: ['repo-stats', repo.id],
  //   queryFn: async () => {
  //     const response = await axios.get(
  //       `${import.meta.env.VITE_API_URL}/api/repos/${repo.id}/stats`,
  //       { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
  //     );
  //     return response.data as RepoStats;
  //   },
  // });
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

  // Fetch Total Lines of Code
  const { data: linesData, isLoading: loadingLines, isError } = useQuery({
    queryKey: ['repo-lines', repo.id],
    queryFn: async () => {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/repos/${repo.id}/lines`,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      return response.data.totalLines;
    },
    enabled: !!repo, // Only fetch when repo exists
  });

  // Toggle Auto Review Feature
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button onClick={() => navigate('/dashboard')} className="text-gray-600 hover:text-gray-900">
              <ArrowLeft className="h-6 w-6" />
            </button>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">{repo.name}</h1>
              <p className="text-gray-600">{repo.fullName}</p>
            </div>
          </div>
          <a href={repo.url} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-2 text-gray-600 hover:text-gray-900">
            <ExternalLink className="h-5 w-5" />
            <span>View on GitHub</span>
          </a>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Repository Info */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">About</h2>
              <p className="text-gray-600 mb-6">{repo.description || 'No description provided.'}</p>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center text-gray-600">
                  {repo.private ? (
                    <>
                      <Lock className="h-5 w-5 mr-2 text-red-600" />
                      Private Repository
                    </>
                  ) : (
                    <>
                      <Globe className="h-5 w-5 mr-2 text-green-600" />
                      Public Repository
                    </>
                  )}
                </div>
                <div className="flex items-center text-gray-600">
                  <GitBranch className="h-5 w-5 mr-2" />
                  Default: {repo.defaultBranch}
                </div>
                {repo.stars !== undefined && (
                  <div className="flex items-center text-gray-600">
                    <Star className="h-5 w-5 mr-2 text-yellow-500" />
                    {repo.stars} stars
                  </div>
                )}
                <div className="flex items-center text-gray-600">
                  <Clock className="h-5 w-5 mr-2 text-gray-500" />
                  Updated {new Date(repo.updatedAt).toLocaleDateString()}
                </div>
              </div>
            </div>

            {/* Activity Stats */}
            {!isLoading && stats && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Activity</h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mb-8">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{stats.commitCount}</div>
                    <div className="text-sm text-gray-600">Commits</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{stats.pullRequests}</div>
                    <div className="text-sm text-gray-600">Pull Requests</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">{stats.openIssues}</div>
                    <div className="text-sm text-gray-600">Open Issues</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{stats.contributors}</div>
                    <div className="text-sm text-gray-600">Contributors</div>
                  </div>
                </div>
              </div>
            )}

            {/* Total Lines of Code */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Codebase Metrics</h2>
              <div className="flex items-center text-gray-600">
                <ListOrdered className="h-5 w-5 mr-2 text-blue-600" />
                <span className="font-medium">Total Lines of Code:</span> {loadingLines ? 'Loading...' : (linesData !== undefined ? linesData : 'Not Available')}
              </div>
            </div>
          </div>
          

          {/* Sidebar Actions */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions</h2>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <ToggleRight className={`h-5 w-5 ${repo.autoReviewEnabled ? 'text-green-600' : 'text-gray-400'}`} />
                  <span className="text-sm font-medium text-gray-700">Auto Review</span>
                </div>
                <button
                  onClick={() => toggleAutoReviewMutation.mutate()}
                  className={`px-3 py-1 rounded-full text-sm ${repo.autoReviewEnabled ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  {repo.autoReviewEnabled ? 'Disable' : 'Enable'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

