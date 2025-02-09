import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import axios from 'axios';

import {
  Search,
  Star,
  GitBranch,
  Lock,
  Globe,
  ExternalLink,
  X,
  ChevronDown,
  Code,
  Clock,
  Filter,
  SortAsc,
  SortDesc,
  Settings,
  LogOut,
  Loader2,
} from 'lucide-react';

interface Repository {
  id: string;
  name: string;
  fullName: string;
  description: string;
  url: string;
  stars?: number;
  defaultBranch: string;
  private: boolean;
  updatedAt: string;
  autoReview?: boolean;
}

type SortField = 'name' | 'stars' | 'updated';
type SortOrder = 'asc' | 'desc';
type Filter = 'all' | 'public' | 'private';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [sortField, setSortField] = useState<SortField>('updated');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [showUserMenu, setShowUserMenu] = useState(false);

  const { data: repos, isLoading } = useQuery({
    queryKey: ['repos'],
    queryFn: async () => {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/repos`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      return response.data as Repository[];
    },
  });

  const toggleAutoReview = async (repoId: string) => {
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/repos/${repoId}/toggle-auto-review`
      );
      alert(`Auto Review is now ${response.data.autoReview ? 'Enabled' : 'Disabled'}`);
    } catch (error) {
      console.error('❌ Error toggling Auto Review:', error);
    }
  };

  const getTotalLines = async (repoId: string) => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/repos/${repoId}/lines`
      );
      alert(`Total lines in this repo: ${response.data.totalLines}`);
    } catch (error) {
      console.error('❌ Error fetching total lines:', error);
    }
  };

  const filteredAndSortedRepos = useMemo(() => {
    if (!repos) return [];

    let filtered = repos.filter(repo => {
      const matchesSearch =
        search.trim() === '' ||
        repo.name.toLowerCase().includes(search.toLowerCase()) ||
        repo.description?.toLowerCase().includes(search.toLowerCase());

      const matchesFilter =
        filter === 'all' ||
        (filter === 'private' && repo.private) ||
        (filter === 'public' && !repo.private);

      return matchesSearch && matchesFilter;
    });

    return filtered.sort((a, b) => {
      if (sortField === 'name') {
        return sortOrder === 'asc'
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      }
      if (sortField === 'stars') {
        const starsA = a.stars || 0;
        const starsB = b.stars || 0;
        return sortOrder === 'asc' ? starsA - starsB : starsB - starsA;
      }
      return sortOrder === 'asc'
        ? new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
        : new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }, [repos, search, filter, sortField, sortOrder]);

  return (
    <div className="min-h-screen bg-grdient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm backdrop-blur-md bg-opacity-80 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <Code className="h-8 w-8 text-blue-600" />
                <h1 className="ml-2 text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                  Git Manager
                </h1>
              </div>

              {/* Search Bar */}
              <div className="hidden md:flex items-center max-w-md flex-1">
                <div className="relative w-full">
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search repositories..."
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all bg-gray-50"
                  />
                  <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                </div>
              </div>
            </div>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-3 focus:outline-none group"
              >
                <div className="flex items-center space-x-3 px-4 py-2 rounded-full bg-gray-50 hover:bg-gray-100 transition-all">
                  <img
                    src={user?.avatar}
                    alt={user?.name}
                    className="h-8 w-8 rounded-full ring-2 ring-white"
                  />
                  <span className="text-sm font-medium text-gray-700">{user?.name}</span>
                  <ChevronDown className="h-4 w-4 text-gray-500 group-hover:text-gray-700 transition-colors" />
                </div>
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg py-1 z-10 border border-gray-100">
                  <button
                    onClick={logout}
                    className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full transition-colors"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="mb-8 flex flex-wrap gap-4 items-center justify-between">
          <div className="flex items-center space-x-4">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as Filter)}
              className="px-4 py-2 rounded-lg border border-gray-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
            >
              <option value="all">All Repositories</option>
              <option value="public">Public Only</option>
              <option value="private">Private Only</option>
            </select>

            <div className="flex items-center space-x-2">
              <select
                value={sortField}
                onChange={(e) => setSortField(e.target.value as SortField)}
                className="px-4 py-2 rounded-lg border border-gray-200 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
              >
                <option value="name">Name</option>
                <option value="stars">Stars</option>
                <option value="updated">Last Updated</option>
              </select>

              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
              >
                {sortOrder === 'asc' ? (
                  <SortAsc className="h-5 w-5 text-gray-600" />
                ) : (
                  <SortDesc className="h-5 w-5 text-gray-600" />
                )}
              </button>
            </div>
          </div>

          <div className="text-sm text-gray-500">
            {filteredAndSortedRepos.length} repositories found
          </div>
        </div>

        {/* Repository Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
            <span className="ml-3 text-gray-600">Loading repositories...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAndSortedRepos.map(repo => (
              <div
                key={repo.id}
                className="group bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden border border-gray-100"
              >
                <div 
                  className="p-6 cursor-pointer"
                  onClick={() => navigate(`/repo/${repo.id}`, { state: { repo } })}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {repo.name}
                      </h3>
                      <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                        {repo.description || 'No description'}
                      </p>
                    </div>
                    {repo.private ? (
                      <Lock className="h-5 w-5 text-gray-400 flex-shrink-0" />
                    ) : (
                      <Globe className="h-5 w-5 text-gray-400 flex-shrink-0" />
                    )}
                  </div>

                  <div className="mt-4 flex items-center space-x-4 text-sm text-gray-500">
                    <div className="flex items-center">
                      <GitBranch className="h-4 w-4 mr-1" />
                      {repo.defaultBranch}
                    </div>
                    {repo.stars !== undefined && (
                      <div className="flex items-center">
                        <Star className="h-4 w-4 mr-1" />
                        {repo.stars}
                      </div>
                    )}
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      {new Date(repo.updatedAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                {/* Action Bar */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleAutoReview(repo.id);
                    }}
                    className={`w-full px-4 py-2 rounded-lg font-medium transition-all ${
                      repo.autoReview
                        ? 'bg-green-500 hover:bg-green-600 text-white'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                  >
                    {repo.autoReview ? 'Auto Review Enabled' : 'Enable Auto Review'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
