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
  LogOut
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

  // Fetch repositories
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

  // ✅ Function to Toggle Auto Review
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

  // ✅ Function to Get Total Lines
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

  // ✅ Filter & Sort Repositories
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Code className="h-8 w-8 text-blue-600" />
              <h1 className="ml-2 text-xl font-bold text-gray-900">Git Manager</h1>
            </div>

            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-3 focus:outline-none"
              >
                <img
                  src={user?.avatar}
                  alt={user?.name}
                  className="h-8 w-8 rounded-full ring-2 ring-white"
                />
                <span className="text-sm font-medium text-gray-700">{user?.name}</span>
                <ChevronDown className="h-4 w-4 text-gray-500" />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 border border-gray-200">
                  <button
                    onClick={logout}
                    className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100 w-full"
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Repository List */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin h-10 w-10 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading repositories...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAndSortedRepos.map(repo => (
              <div
                key={repo.id}
                className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition cursor-pointer"
                onClick={() => navigate(`/repo/${repo.id}`, { state: { repo } })}
              >
                <h3 className="text-lg font-semibold text-gray-900">{repo.name}</h3>
                <p className="text-sm text-gray-600">{repo.description || 'No description'}</p>

                <p className="mt-2 text-sm text-gray-500 flex items-center">
                  <GitBranch className="h-4 w-4 mr-1" /> {repo.defaultBranch}
                </p>
                <p className="mt-1 text-sm text-gray-500 flex items-center">
                  <Clock className="h-4 w-4 mr-1" /> Updated {new Date(repo.updatedAt).toLocaleDateString()}
                </p>

                {/* Auto Review Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent navigating to RepoDetails
                    toggleAutoReview(repo.id);
                  }}
                  className={`mt-3 px-4 py-2 rounded-md ${
                    repo.autoReview ? 'bg-green-500 text-white' : 'bg-gray-300 text-black'
                  }`}
                >
                  {repo.autoReview ? 'Disable Auto Review' : 'Enable Auto Review'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// import React, { useState, useMemo } from 'react';
// import { useQuery } from '@tanstack/react-query';
// import { useNavigate } from 'react-router-dom';
// import { useAuth } from '../hooks/useAuth';
// import axios from 'axios';

// import {
//   Search,
//   Star,
//   GitBranch,
//   Lock,
//   Globe,
//   ExternalLink,
//   X,
//   ChevronDown,
//   Code,
//   Clock,
//   Filter,
//   SortAsc,
//   SortDesc,
//   Settings,
//   LogOut
// } from 'lucide-react';

// interface Repository {
//   id: string;
//   name: string;
//   fullName: string;
//   description: string;
//   url: string;
//   stars?: number;
//   defaultBranch: string;
//   private: boolean;
//   updatedAt: string;
//   autoReview?: boolean;
// }

// type SortField = 'name' | 'stars' | 'updated';
// type SortOrder = 'asc' | 'desc';
// type Filter = 'all' | 'public' | 'private';

// export default function Dashboard() {
//   const navigate = useNavigate();
//   const { user, logout } = useAuth();
//   const [search, setSearch] = useState('');
//   const [filter, setFilter] = useState<Filter>('all');
//   const [sortField, setSortField] = useState<SortField>('updated');
//   const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
//   const [showUserMenu, setShowUserMenu] = useState(false);

  

//   // Fetch repositories
//   const { data: repos, isLoading } = useQuery({
//     queryKey: ['repos'],
//     queryFn: async () => {
//       const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/repos`, {
//         headers: {
//           Authorization: `Bearer ${localStorage.getItem('token')}`,
//         },
//       });
//       return response.data as Repository[];
//     },
//   });

//   // ✅ Function to Toggle Auto Review
//   const toggleAutoReview = async (repoId: string) => {
//     try {
//       const response = await axios.post(
//         `${import.meta.env.VITE_API_URL}/api/repos/${repoId}/toggle-auto-review`
//       );
//       alert(`Auto Review is now ${response.data.autoReview ? 'Enabled' : 'Disabled'}`);
//     } catch (error) {
//       console.error('❌ Error toggling Auto Review:', error);
//     }
//   };

//   // ✅ Function to Get Total Lines
//   const getTotalLines = async (repoId: string) => {
//     try {
//       const response = await axios.get(
//         `${import.meta.env.VITE_API_URL}/api/repos/${repoId}/lines`
//       );
//       alert(`Total lines in this repo: ${response.data.totalLines}`);
//     } catch (error) {
//       console.error('❌ Error fetching total lines:', error);
//     }
//   };

//   // ✅ Filter & Sort Repositories
//   const filteredAndSortedRepos = useMemo(() => {
//     if (!repos) return [];

//     let filtered = repos.filter(repo => {
//       const matchesSearch =
//         search.trim() === '' ||
//         repo.name.toLowerCase().includes(search.toLowerCase()) ||
//         repo.description?.toLowerCase().includes(search.toLowerCase());

//       const matchesFilter =
//         filter === 'all' ||
//         (filter === 'private' && repo.private) ||
//         (filter === 'public' && !repo.private);

//       return matchesSearch && matchesFilter;
//     });

//     return filtered.sort((a, b) => {
//       if (sortField === 'name') {
//         return sortOrder === 'asc'
//           ? a.name.localeCompare(b.name)
//           : b.name.localeCompare(a.name);
//       }
//       if (sortField === 'stars') {
//         const starsA = a.stars || 0;
//         const starsB = b.stars || 0;
//         return sortOrder === 'asc' ? starsA - starsB : starsB - starsA;
//       }
//       return sortOrder === 'asc'
//         ? new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
//         : new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
//     });
//   }, [repos, search, filter, sortField, sortOrder]);

//   return (
//     <div className="min-h-screen bg-gray-50">
//       {/* Header */}
//       <div className="bg-white border-b border-gray-200">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="flex justify-between items-center h-16">
//             <div className="flex items-center">
//               <Code className="h-8 w-8 text-blue-600" />
//               <h1 className="ml-2 text-xl font-bold text-gray-900">Git Manager</h1>
//             </div>

//             <div className="relative">
//               <button
//                 onClick={() => setShowUserMenu(!showUserMenu)}
//                 className="flex items-center space-x-3 focus:outline-none"
//               >
//                 <img
//                   src={user?.avatar}
//                   alt={user?.name}
//                   className="h-8 w-8 rounded-full ring-2 ring-white"
//                 />
//                 <span className="text-sm font-medium text-gray-700">{user?.name}</span>
//                 <ChevronDown className="h-4 w-4 text-gray-500" />
//               </button>

//               {showUserMenu && (
//                 <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 border border-gray-200">
//                   <button
//                     onClick={logout}
//                     className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100 w-full"
//                   >
//                     <LogOut className="h-4 w-4 mr-2" />
//                     Logout
//                   </button>
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>
//       </div>

//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
//         {/* Repository List */}
//         {isLoading ? (
//           <div className="text-center py-12">
//             <div className="animate-spin h-10 w-10 border-b-2 border-gray-900 mx-auto"></div>
//             <p className="mt-2 text-gray-600">Loading repositories...</p>
//           </div>
//         ) : (
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//             {filteredAndSortedRepos.map(repo => (
//               <div key={repo.id} className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition">
//                 <h3 className="text-lg font-semibold text-gray-900">{repo.name}</h3>
//                 <p className="text-sm text-gray-600">{repo.description || 'No description'}</p>

//                 <p className="mt-2 text-sm text-gray-500 flex items-center">
//                   <GitBranch className="h-4 w-4 mr-1" /> {repo.defaultBranch}
//                 </p>
//                 <p className="mt-1 text-sm text-gray-500 flex items-center">
//                   <Clock className="h-4 w-4 mr-1" /> Updated {new Date(repo.updatedAt).toLocaleDateString()}
//                 </p>

//                 {/* Auto Review Button */}
//                 <button
//                   onClick={() => toggleAutoReview(repo.id)}
//                   className={`mt-3 px-4 py-2 rounded-md ${
//                     repo.autoReview ? 'bg-green-500 text-white' : 'bg-gray-300 text-black'
//                   }`}
//                 >
//                   {repo.autoReview ? 'Disable Auto Review' : 'Enable Auto Review'}
//                 </button>

//                 {/* Show Total Lines Button */}
//                 <button
//                   onClick={() => getTotalLines(repo.id)}
//                   className="mt-3 ml-2 px-4 py-2 bg-blue-500 text-white rounded-md"
//                 >
//                   Show Total Lines
//                 </button>
//               </div>
//             ))}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }
