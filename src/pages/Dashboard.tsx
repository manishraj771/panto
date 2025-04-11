import  { useState, useMemo } from 'react';
import { useQuery,useMutation,useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import axios from 'axios';

import {
  Search,
  Star,
  GitBranch,
  Lock,
  Globe,
  Mail,
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

  const queryClient = useQueryClient();
  const [autoReviewState, setAutoReviewState] = useState<{ [key: string]: boolean }>({});

  
  const toggleAutoReview = async (repoId: string) => {
    console.log("🔹 Dashboard - Toggling Auto Review for Repo:", repoId);

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/repos/${repoId}/toggle-auto-review`
      );
      console.log("✅ Dashboard - API Response:", response.data);

      // ✅ Update local state immediately
    setAutoReviewState((prevState) => ({
      ...prevState,
      [repoId]: response.data.autoReview,
    }));

      // ✅ UI ko update karne ke liye React Query ka cache invalidate karein
      queryClient.invalidateQueries({ queryKey: ['repos'] });
  
    } catch (error) {
      console.error('❌ Error toggling Auto Review:', error);
    }
  };



  
 // this is for filter & sort code hai
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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <div className="bg-gray-900/50 shadow-lg backdrop-blur-lg border-b border-gray-700/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <Code className="h-8 w-8 text-blue-400" />
                <h1 className="ml-2 text-xl font-bold bg-gradient-to-r from-blue-400 to-blue-200 bg-clip-text text-transparent">
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
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-700 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all bg-gray-800/50 text-gray-100 placeholder-gray-400"
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
                <div className="flex items-center space-x-3 px-4 py-2 rounded-full bg-gray-800/50 hover:bg-gray-700/50 transition-all border border-gray-700/50">
                  <img
                    src={user?.avatar}
                    alt={user?.name}
                    className="h-8 w-8 rounded-full ring-2 ring-gray-700"
                  />
                  <span className="text-sm font-medium text-gray-200">{user?.name}</span>
                  <ChevronDown className="h-4 w-4 text-gray-400 group-hover:text-gray-200 transition-colors" />
                </div>
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-xl shadow-xl py-1 z-10 border border-gray-700">
                  {/* ✅ Navigate to Profile */}
                  <button
                    onClick={() => navigate('/profile')}
                    className="flex items-center px-4 py-2 text-sm text-gray-200 hover:bg-gray-700/50 w-full transition-colors"
                  >
                    Profile
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
              className="px-4 py-2 rounded-lg border border-gray-700 bg-gray-800/50 text-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all"
            >
              <option value="all">All Repositories</option>
              <option value="public">Public Only</option>
              <option value="private">Private Only</option>
            </select>

            <div className="flex items-center space-x-2">
              <select
                value={sortField}
                onChange={(e) => setSortField(e.target.value as SortField)}
                className="px-4 py-2 rounded-lg border border-gray-700 bg-gray-800/50 text-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all"
              >
                <option value="name">Name</option>
                <option value="stars">Stars</option>
                <option value="updated">Last Updated</option>
              </select>

              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="p-2 rounded-lg border border-gray-700 bg-gray-800/50 hover:bg-gray-700/50 transition-colors"
              >
                {sortOrder === 'asc' ? (
                  <SortAsc className="h-5 w-5 text-gray-400" />
                ) : (
                  <SortDesc className="h-5 w-5 text-gray-400" />
                )}
              </button>
            </div>
          </div>

          <div className="text-sm text-gray-400">
            {filteredAndSortedRepos.length} repositories found
          </div>
        </div>

        {/* Repository Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 text-blue-400 animate-spin" />
            <span className="ml-3 text-gray-400">Loading repositories...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAndSortedRepos.map(repo => (
              <div
                key={repo.id}
                className="group relative bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-700/50 hover:border-blue-500/50 hover:-translate-y-1"
              >
                {/* Glow Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/5 to-purple-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <div 
                  className="relative p-6 cursor-pointer"
                  onClick={() => navigate(`/repo/${repo.id}`, { state: { repo } })}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-100 group-hover:text-blue-400 transition-colors">
                        {repo.name}
                      </h3>
                      <p className="mt-1 text-sm text-gray-400 line-clamp-2">
                        {repo.description || 'No description'}
                      </p>
                    </div>
                    {repo.private ? (
                      <Lock className="h-5 w-5 text-gray-500 group-hover:text-blue-400 transition-colors flex-shrink-0" />
                    ) : (
                      <Globe className="h-5 w-5 text-gray-500 group-hover:text-blue-400 transition-colors flex-shrink-0" />
                    )}
                  </div>

                  <div className="mt-4 flex items-center space-x-4 text-sm text-gray-400">
                    <div className="flex items-center group-hover:text-blue-300 transition-colors">
                      <GitBranch className="h-4 w-4 mr-1" />
                      {repo.defaultBranch}
                    </div>
                    {repo.stars !== undefined && (
                      <div className="flex items-center group-hover:text-blue-300 transition-colors">
                        <Star className="h-4 w-4 mr-1" />
                        {repo.stars}
                      </div>
                    )}
                    <div className="flex items-center group-hover:text-blue-300 transition-colors">
                      <Clock className="h-4 w-4 mr-1" />
                      {new Date(repo.updatedAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                {/* Action Bar */}
                <div className="relative px-6 py-4 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 border-t border-gray-700/50">
                <button
  onClick={() => toggleAutoReview(repo.id)}
  className={`mt-3 px-4 py-2 rounded-md ${
    autoReviewState[repo.id] ?? repo.autoReview ? 'bg-green-500 text-white' : 'bg-gray-300 text-black'
  }`}
>
  {autoReviewState[repo.id] ?? repo.autoReview ? 'Disable Auto Review' : 'Enable Auto Review'}
</button>





                  {/* <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleAutoReview(repo.id);
                    }}
                    className={`w-full px-4 py-2 rounded-lg font-medium transition-all ${
                      repo.autoReview
                        ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg shadow-blue-500/20'
                        : 'bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 text-gray-200 shadow-lg shadow-gray-900/20'
                    }`}
                  >
                    {repo.autoReview ? 'Auto Review Enabled' : 'Enable Auto Review'}
                  </button> */}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}