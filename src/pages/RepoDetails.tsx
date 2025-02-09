import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

import {
  ArrowLeft, GitBranch, Star, Clock, Lock, Globe, ExternalLink, GitCommit,
  GitPullRequest, AlertCircle, Users, Code, Activity, ToggleRight
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

  // Ensure we have repo data before proceeding
  if (!repo) {
    navigate('/dashboard');
    return null;
  }

  // Fetch Repository Statistics
  const { data: stats, isLoading } = useQuery({
    queryKey: ['repo-stats', repo.id],
    queryFn: async () => {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/repos/${repo.id}/stats`,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      return response.data as RepoStats;
    },
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
                  className={`px-3 py-1 rounded-full text-sm ${
                    repo.autoReviewEnabled ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
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
  );
}

// import React, { useEffect } from 'react';
// import { useLocation, useNavigate } from 'react-router-dom';
// import { ArrowLeft, GitBranch, Lock, Globe, Star, Clock, Users, Bug, GitPullRequest, Activity } from 'lucide-react';

// interface CommitActivity {
//   date: string;
//   count: number;
// }

// interface RepoStats {
//   commitCount: number;
//   pullRequests: number;
//   openIssues: number;
//   contributors: number;
//   lastCommit: string;
//   commitActivity: CommitActivity[];
// }

// export default function RepoDetails() {
//   const navigate = useNavigate();
//   const location = useLocation();
//   const repo = location.state?.repo;
//   const stats: RepoStats | undefined = location.state?.stats; // Ensure stats are available

//   // ✅ Prevents navigation loop if repo is undefined
//   useEffect(() => {
//     if (!repo) {
//       navigate('/dashboard', { replace: true });
//     }
//   }, [repo, navigate]);

//   if (!repo) return null;

//   return (
//     <div className="min-h-screen bg-gray-100 py-8">
//       <div className="max-w-4xl mx-auto bg-white shadow-md rounded-lg p-6">
//         {/* Back Button */}
//         <div className="flex items-center gap-4 mb-6">
//           <button
//             onClick={() => navigate('/dashboard')}
//             className="text-gray-600 hover:text-gray-900 flex items-center"
//           >
//             <ArrowLeft className="h-6 w-6 mr-2" />
//             Back to Dashboard
//           </button>
//         </div>

//         {/* Repo Title */}
//         <h1 className="text-3xl font-bold text-gray-900">{repo.name}</h1>
//         <p className="text-gray-600 mt-2">{repo.description || 'No description available.'}</p>

//         {/* Repo Details */}
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
//           <div className="flex items-center text-gray-700">
//             <GitBranch className="h-5 w-5 mr-2 text-blue-600" />
//             <span className="font-medium">Branch:</span> {repo.defaultBranch}
//           </div>

//           <div className="flex items-center text-gray-700">
//             {repo.private ? (
//               <Lock className="h-5 w-5 mr-2 text-red-600" />
//             ) : (
//               <Globe className="h-5 w-5 mr-2 text-green-600" />
//             )}
//             <span className="font-medium">{repo.private ? 'Private' : 'Public'}</span>
//           </div>

//           {repo.stars !== undefined && (
//             <div className="flex items-center text-gray-700">
//               <Star className="h-5 w-5 mr-2 text-yellow-500" />
//               <span className="font-medium">Stars:</span> {repo.stars}
//             </div>
//           )}

//           <div className="flex items-center text-gray-700">
//             <Clock className="h-5 w-5 mr-2 text-gray-500" />
//             <span className="font-medium">Last Updated:</span> {new Date(repo.updatedAt).toLocaleDateString()}
//           </div>
//         </div>

//         {/* Repo Statistics */}
//         {stats && (
//           <div className="mt-8 bg-gray-50 p-6 rounded-lg">
//             <h2 className="text-xl font-semibold text-gray-900 mb-4">Repository Statistics</h2>
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//               <div className="flex items-center text-gray-700">
//                 <Activity className="h-5 w-5 mr-2 text-blue-600" />
//                 <span className="font-medium">Commits:</span> {stats.commitCount}
//               </div>

//               <div className="flex items-center text-gray-700">
//                 <GitPullRequest className="h-5 w-5 mr-2 text-purple-600" />
//                 <span className="font-medium">Pull Requests:</span> {stats.pullRequests}
//               </div>

//               <div className="flex items-center text-gray-700">
//                 <Bug className="h-5 w-5 mr-2 text-red-600" />
//                 <span className="font-medium">Open Issues:</span> {stats.openIssues}
//               </div>

//               <div className="flex items-center text-gray-700">
//                 <Users className="h-5 w-5 mr-2 text-green-600" />
//                 <span className="font-medium">Contributors:</span> {stats.contributors}
//               </div>

//               <div className="flex items-center text-gray-700 col-span-2">
//                 <Clock className="h-5 w-5 mr-2 text-gray-500" />
//                 <span className="font-medium">Last Commit:</span> {new Date(stats.lastCommit).toLocaleString()}
//               </div>
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }
