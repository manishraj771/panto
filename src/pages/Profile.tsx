import { useAuth } from '../hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom'; // Add for navigation
import axios from 'axios';
import { LogOut, Mail, Folder, CheckCircle, Users, UserPlus, GitCommit, MessageSquare } from 'lucide-react'; // Add MessageSquare

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate(); // Hook for navigation

  // Fetch enriched user profile
  const { data: userProfile, isLoading: userLoading, error: userError } = useQuery({
    queryKey: ['user-profile'],
    queryFn: async () => {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      console.log('✅ User Profile Received:', response.data);
      return response.data;
    },
    enabled: !!user,
  });

  // Fetch repository stats
  const { data: repoStats, isLoading: repoLoading, error: repoError } = useQuery({
    queryKey: ['repo-stats'],
    queryFn: async () => {
      console.log('🔹 Fetching repository stats...');
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/repos`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      console.log('✅ Repo Stats Received:', response.data);
      const totalRepos = response.data.length;
      const autoReviewedRepos = response.data.filter((repo: any) => repo.autoReview).length;
      return { totalRepos, autoReviewedRepos };
    },
    enabled: !!user,
  });
  console.log('🚀 userProfile:', userProfile);

  if (!user) return null;
  if (userLoading) return <div className="text-gray-400 text-center">Loading profile...</div>;
  if (userError) return <div className="text-red-400 text-center">Error: {userError.message}</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
      <div className="max-w-lg w-full bg-gray-800/60 backdrop-blur-lg rounded-2xl shadow-lg p-8 border border-gray-700">
        {/* Profile Header */}
        <div className="flex items-center space-x-6 mb-8">
          <img
            src={userProfile?.avatar || user.avatar}
            alt={userProfile?.name || user.name}
            className="h-24 w-24 rounded-full ring-4 ring-gray-700"
          />
          <div>
            <h1 className="text-2xl font-bold text-gray-100">{userProfile?.name || user.name}</h1>
            {userProfile?.username && (
              <p className="text-gray-400 text-sm">@{userProfile.username}</p>
            )}
            {userProfile?.email && (
              <p className="text-gray-400 flex items-center gap-2 mt-1">
                <Mail className="h-4 w-4 text-blue-400" /> {userProfile.email}
              </p>
            )}
            {userProfile?.bio && (
              <p className="text-gray-300 mt-2 italic">"{userProfile.bio}"</p>
            )}
            <p className="text-sm text-gray-500 mt-1">Connected via {userProfile?.provider || user.provider}</p>
          </div>
        </div>

        {/* Social Stats */}
        {userProfile && (
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="text-center">
              <Users className="h-5 w-5 text-blue-400 mx-auto" />
              <p className="text-gray-100 font-bold">{userProfile.followers}</p>
              <p className="text-gray-400 text-sm">Followers</p>
            </div>
            <div className="text-center">
              <UserPlus className="h-5 w-5 text-blue-400 mx-auto" />
              <p className="text-gray-100 font-bold">{userProfile.following}</p>
              <p className="text-gray-400 text-sm">Following</p>
            </div>
            <div className="text-center">
              <GitCommit className="h-5 w-5 text-blue-400 mx-auto" />
              <p className="text-gray-100 font-bold">{userProfile.publicRepos}</p>
              <p className="text-gray-400 text-sm">Public Repos</p>
            </div>
          </div>
        )}

        {/* Repository Statistics */}
        <div className="bg-gray-800/80 p-6 rounded-xl shadow-inner border border-gray-700">
          <h2 className="text-lg font-semibold text-gray-300 mb-4">Repository Statistics</h2>
          {repoLoading ? (
            <p className="text-gray-400">Loading repository data...</p>
          ) : repoError ? (
            <p className="text-red-400">Error loading stats: {repoError.message}</p>
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

        {/* Navigation and Logout Buttons */}
        <div className="mt-8 border-t border-gray-700 pt-6 text-center">
          <div className="flex justify-center gap-4">
            <button
              onClick={() => navigate('/chat')}
              className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <MessageSquare className="h-5 w-5" />
              <span>Chat</span>
            </button>
            <button
              onClick={logout}
              className="flex items-center gap-2 px-5 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <LogOut className="h-5 w-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
// import { useAuth } from '../hooks/useAuth';
// import { useQuery } from '@tanstack/react-query';
// import axios from 'axios';
// import { LogOut, Mail, Folder, CheckCircle, Users, UserPlus, GitCommit } from 'lucide-react';

// export default function Profile() {
//   const { user, logout } = useAuth();

//   // Fetch enriched user profile
//   const { data: userProfile, isLoading: userLoading, error: userError } = useQuery({
//     queryKey: ['user-profile'],
//     queryFn: async () => {
//       const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/auth/me`, {
//         headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
//       });
//       console.log("✅ User Profile Received:", response.data);
//       return response.data;
//     },
//     enabled: !!user, // Only fetch if user exists
//   });

//   // Fetch repository stats
//   const { data: repoStats, isLoading: repoLoading, error: repoError } = useQuery({
//     queryKey: ['repo-stats'],
//     queryFn: async () => {
//       console.log("🔹 Fetching repository stats...");
//       const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/repos`, {
//         headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
//       });
//       console.log("✅ Repo Stats Received:", response.data);
//       const totalRepos = response.data.length;
//       const autoReviewedRepos = response.data.filter((repo: any) => repo.autoReview).length;
//       return { totalRepos, autoReviewedRepos };
//     },
//     enabled: !!user,
//   });
//   console.log('🚀 userProfile:', userProfile);

//   if (!user) return null;
//   if (userLoading) return <div className="text-gray-400 text-center">Loading profile...</div>;
//   if (userError) return <div className="text-red-400 text-center">Error: {userError.message}</div>;

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
//       <div className="max-w-lg w-full bg-gray-800/60 backdrop-blur-lg rounded-2xl shadow-lg p-8 border border-gray-700">
//         {/* Profile Header */}
//         <div className="flex items-center space-x-6 mb-8">
//           <img
//             src={userProfile?.avatar || user.avatar}
//             alt={userProfile?.name || user.name}
//             className="h-24 w-24 rounded-full ring-4 ring-gray-700"
//           />
//           <div>
//             <h1 className="text-2xl font-bold text-gray-100">{userProfile?.name || user.name}</h1>
//             {userProfile?.username && (
//               <p className="text-gray-400 text-sm">@{userProfile.username}</p>
//             )}
//             {userProfile?.email && (
//               <p className="text-gray-400 flex items-center gap-2 mt-1">
//                 <Mail className="h-4 w-4 text-blue-400" /> {userProfile.email}
//               </p>
//             )}
//             {userProfile?.bio && (
//               <p className="text-gray-300 mt-2 italic">"{userProfile.bio}"</p>
//             )}
//             <p className="text-sm text-gray-500 mt-1">Connected via {userProfile?.provider || user.provider}</p>
//           </div>
//         </div>

//         {/* Social Stats */}
//         {userProfile && (
//           <div className="grid grid-cols-3 gap-4 mb-8">
//             <div className="text-center">
//               <Users className="h-5 w-5 text-blue-400 mx-auto" />
//               <p className="text-gray-100 font-bold">{userProfile.followers}</p>
//               <p className="text-gray-400 text-sm">Followers</p>
//             </div>
//             <div className="text-center">
//               <UserPlus className="h-5 w-5 text-blue-400 mx-auto" />
//               <p className="text-gray-100 font-bold">{userProfile.following}</p>
//               <p className="text-gray-400 text-sm">Following</p>
//             </div>
//             <div className="text-center">
//               <GitCommit className="h-5 w-5 text-blue-400 mx-auto" />
//               <p className="text-gray-100 font-bold">{userProfile.publicRepos}</p>
//               <p className="text-gray-400 text-sm">Public Repos</p>
//             </div>
//           </div>
//         )}

//         {/* Repository Statistics */}
//         <div className="bg-gray-800/80 p-6 rounded-xl shadow-inner border border-gray-700">
//           <h2 className="text-lg font-semibold text-gray-300 mb-4">Repository Statistics</h2>
//           {repoLoading ? (
//             <p className="text-gray-400">Loading repository data...</p>
//           ) : repoError ? (
//             <p className="text-red-400">Error loading stats: {repoError.message}</p>
//           ) : (
//             <div className="space-y-4">
//               <div className="flex items-center justify-between bg-gray-900/80 p-3 rounded-lg border border-gray-700">
//                 <div className="flex items-center space-x-3">
//                   <Folder className="h-5 w-5 text-yellow-400" />
//                   <span className="text-gray-300 font-medium">Total Repositories</span>
//                 </div>
//                 <span className="text-lg font-bold text-gray-100">{repoStats?.totalRepos || 0}</span>
//               </div>
//               <div className="flex items-center justify-between bg-gray-900/80 p-3 rounded-lg border border-gray-700">
//                 <div className="flex items-center space-x-3">
//                   <CheckCircle className="h-5 w-5 text-green-400" />
//                   <span className="text-gray-300 font-medium">Auto Review Enabled</span>
//                 </div>
//                 <span className="text-lg font-bold text-gray-100">{repoStats?.autoReviewedRepos || 0}</span>
//               </div>
//             </div>
//           )}
//         </div>

//         {/* Logout Button */}
//         <div className="mt-8 border-t border-gray-700 pt-6 text-center">
//           <button
//             onClick={logout}
//             className="bg-red-600 text-white px-5 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center mx-auto space-x-2"
//           >
//             <LogOut className="h-5 w-5" />
//             <span>Logout</span>
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }