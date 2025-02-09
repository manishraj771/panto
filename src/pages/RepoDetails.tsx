import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, GitBranch, Lock, Globe, Star, Clock, Users, Bug, GitPullRequest, Activity } from 'lucide-react';

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

export default function RepoDetails() {
  const navigate = useNavigate();
  const location = useLocation();
  const repo = location.state?.repo;
  const stats: RepoStats | undefined = location.state?.stats; // Ensure stats are available

  // ✅ Prevents navigation loop if repo is undefined
  useEffect(() => {
    if (!repo) {
      navigate('/dashboard', { replace: true });
    }
  }, [repo, navigate]);

  if (!repo) return null;

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-4xl mx-auto bg-white shadow-md rounded-lg p-6">
        {/* Back Button */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-gray-600 hover:text-gray-900 flex items-center"
          >
            <ArrowLeft className="h-6 w-6 mr-2" />
            Back to Dashboard
          </button>
        </div>

        {/* Repo Title */}
        <h1 className="text-3xl font-bold text-gray-900">{repo.name}</h1>
        <p className="text-gray-600 mt-2">{repo.description || 'No description available.'}</p>

        {/* Repo Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div className="flex items-center text-gray-700">
            <GitBranch className="h-5 w-5 mr-2 text-blue-600" />
            <span className="font-medium">Branch:</span> {repo.defaultBranch}
          </div>

          <div className="flex items-center text-gray-700">
            {repo.private ? (
              <Lock className="h-5 w-5 mr-2 text-red-600" />
            ) : (
              <Globe className="h-5 w-5 mr-2 text-green-600" />
            )}
            <span className="font-medium">{repo.private ? 'Private' : 'Public'}</span>
          </div>

          {repo.stars !== undefined && (
            <div className="flex items-center text-gray-700">
              <Star className="h-5 w-5 mr-2 text-yellow-500" />
              <span className="font-medium">Stars:</span> {repo.stars}
            </div>
          )}

          <div className="flex items-center text-gray-700">
            <Clock className="h-5 w-5 mr-2 text-gray-500" />
            <span className="font-medium">Last Updated:</span> {new Date(repo.updatedAt).toLocaleDateString()}
          </div>
        </div>

        {/* Repo Statistics */}
        {stats && (
          <div className="mt-8 bg-gray-50 p-6 rounded-lg">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Repository Statistics</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center text-gray-700">
                <Activity className="h-5 w-5 mr-2 text-blue-600" />
                <span className="font-medium">Commits:</span> {stats.commitCount}
              </div>

              <div className="flex items-center text-gray-700">
                <GitPullRequest className="h-5 w-5 mr-2 text-purple-600" />
                <span className="font-medium">Pull Requests:</span> {stats.pullRequests}
              </div>

              <div className="flex items-center text-gray-700">
                <Bug className="h-5 w-5 mr-2 text-red-600" />
                <span className="font-medium">Open Issues:</span> {stats.openIssues}
              </div>

              <div className="flex items-center text-gray-700">
                <Users className="h-5 w-5 mr-2 text-green-600" />
                <span className="font-medium">Contributors:</span> {stats.contributors}
              </div>

              <div className="flex items-center text-gray-700 col-span-2">
                <Clock className="h-5 w-5 mr-2 text-gray-500" />
                <span className="font-medium">Last Commit:</span> {new Date(stats.lastCommit).toLocaleString()}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
