import { useParams, useNavigate } from 'react-router-dom';

export default function UserProfile() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();

  if (!username) {
    return <div className="text-gray-400 text-center">No user specified</div>;
  }

  return (
    <div className="min-h-screen bg-gray-900 p-8 flex flex-col items-center">
      <div className="w-full max-w-4xl bg-gray-800/60 backdrop-blur-lg rounded-2xl shadow-lg p-6 border border-gray-700">
        <h2 className="text-2xl font-bold text-gray-100 mb-4">{username}'s Profile</h2>
        <div className="flex flex-col items-center gap-4 mb-8">
          <p className="text-gray-100 text-lg">Hello, {username}!</p>
          <div className="flex gap-4">
            <button
              onClick={() => window.open(`https://github.com/${username}`, '_blank')}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Visit GitHub Profile
            </button>
            <button
              onClick={() => navigate('/chat')}
              className="text-gray-400 hover:text-gray-100 transition"
            >
              Back to Chat
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
// import { useEffect, useState } from 'react';
// import { useParams, useNavigate } from 'react-router-dom';
// import axios from 'axios';
// import { useAuth } from '../hooks/useAuth';
// import { useQuery } from '@tanstack/react-query';

// interface UserData {
//   id: string;
//   username: string;
//   avatar: string;
// }

// interface Repo {
//   id: number;
//   name: string;
//   description: string | null;
//   html_url: string;
//   stargazers_count: number;
//   forks_count: number;
// }

// export default function UserProfile() {
//   const { username } = useParams<{ username: string }>();
//   const { token, user } = useAuth();
//   const [profile, setProfile] = useState<UserData | null>(null);
//   const navigate = useNavigate();

//   // Fetch user profile from contacts or auth
//   useEffect(() => {
//     const fetchProfile = async () => {
//       try {
//         if (!token || !username) {
//           console.log('🔹 No token or username');
//           return;
//         }
//         const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/contacts`, {
//           headers: { Authorization: `Bearer ${token}` },
//         });
//         console.log('🔹 Contacts fetched:', response.data);
//         const contact = response.data.find(
//           (c: UserData) => c.username.toLowerCase() === username.toLowerCase()
//         );
//         if (contact) {
//           setProfile(contact);
//         } else if (user?.username.toLowerCase() === username.toLowerCase()) {
//           setProfile({ id: user.id, username: user.username, avatar: user.avatar });
//         } else {
//           console.log('🔹 User not found in contacts or auth');
//           setProfile(null);
//         }
//       } catch (error) {
//         console.error('❌ Error fetching profile:', error);
//       }
//     };
//     fetchProfile();
//   }, [username, token, user]);

//   // Fetch repositories using backend proxy
//   const { data: repos, isLoading: reposLoading, error: reposError } = useQuery({
//     queryKey: ['repos', username],
//     queryFn: async () => {
//       if (!username) {
//         console.log('🔹 No username for repos');
//         return [];
//       }
//       try {
//         const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/github/repos/${username}`);
//         console.log('🔹 Repos fetched:', response.data);
//         return response.data as Repo[];
//       } catch (error) {
//         console.error('❌ Error fetching repos:', error);
//         throw error;
//       }
//     },
//     enabled: !!username,
//   });

//   // Fetch total commits using backend proxy
//   const { data: totalCommits, isLoading: commitsLoading, error: commitsError } = useQuery({
//     queryKey: ['commits', username],
//     queryFn: async () => {
//       if (!repos || !username) {
//         console.log('🔹 No repos or username for commits');
//         return 0;
//       }
//       let total = 0;
//       for (const repo of repos.slice(0, 6)) {
//         try {
//           const response = await axios.get(
//             `${import.meta.env.VITE_API_URL}/api/github/commits/${username}/${repo.name}`
//           );
//           console.log(`🔹 Commits for ${repo.name}:`, response.data.length);
//           total += response.data.length;
//         } catch (error) {
//           console.error(`❌ Error fetching commits for ${repo.name}:`, error);
//         }
//       }
//       return total;
//     },
//     enabled: !!repos && repos.length > 0,
//   });

//   if (!user?.id) return <div className="text-gray-400 text-center">Please log in</div>;
//   if (!profile) return <div className="text-gray-400 text-center">User not found</div>;

//   return (
//     <div className="min-h-screen bg-gray-900 p-8 flex flex-col items-center">
//       <div className="w-full max-w-4xl bg-gray-800/60 backdrop-blur-lg rounded-2xl shadow-lg p-6 border border-gray-700">
//         <h2 className="text-2xl font-bold text-gray-100 mb-4">{profile.username}'s Profile</h2>
//         <div className="flex flex-col items-center gap-4 mb-8">
//           <img
//             src={profile.avatar}
//             alt={profile.username}
//             className="h-24 w-24 rounded-full border-2 border-gray-700"
//           />
//           <p className="text-gray-100 text-lg">{profile.username}</p>
//           {reposError && <p className="text-red-400">Error loading repositories: {reposError.message}</p>}
//           {commitsLoading ? (
//             <p className="text-gray-400">Loading commits...</p>
//           ) : commitsError ? (
//             <p className="text-red-400">Error loading commits: {commitsError.message}</p>
//           ) : (
//             <p className="text-gray-400">Total Commits: {totalCommits || 0}</p>
//           )}
//           <div className="flex gap-4">
//             <button
//               onClick={() => window.open(`https://github.com/${profile.username}`, '_blank')}
//               className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
//             >
//               Visit GitHub Profile
//             </button>
//             <button
//               onClick={() => navigate('/chat')}
//               className="text-gray-400 hover:text-gray-100 transition"
//             >
//               Back to Chat
//             </button>
//           </div>
//         </div>

//         {/* Repositories Section */}
//         <h3 className="text-xl font-bold text-gray-100 mb-4">Repositories</h3>
//         {reposLoading ? (
//           <p className="text-gray-400 text-center">Loading repositories...</p>
//         ) : !repos || repos.length === 0 ? (
//           <p className="text-gray-400 text-center">No public repositories found</p>
//         ) : (
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//             {repos.map((repo) => (
//               <div
//                 key={repo.id}
//                 className="bg-gray-700/50 rounded-lg p-4 border border-gray-600 hover:bg-gray-700 transition"
//               >
//                 <a
//                   href={repo.html_url}
//                   target="_blank"
//                   rel="noopener noreferrer"
//                   className="text-blue-400 font-semibold hover:underline"
//                 >
//                   {repo.name}
//                 </a>
//                 <p className="text-gray-300 text-sm mt-1">
//                   {repo.description || 'No description'}
//                 </p>
//                 <div className="flex gap-4 mt-2 text-gray-400 text-sm">
//                   <span>⭐ {repo.stargazers_count}</span>
//                   <span>🍴 {repo.forks_count}</span>
//                 </div>
//               </div>
//             ))}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }




// import { useEffect, useState } from 'react';
// import { useParams, useNavigate } from 'react-router-dom';
// import axios from 'axios';
// import { useAuth } from '../hooks/useAuth';
// import { useQuery } from '@tanstack/react-query';

// interface UserData {
//   id: string;
//   username: string;
//   avatar: string;
// }

// interface Repo {
//   id: number;
//   name: string;
//   description: string | null;
//   html_url: string;
//   stargazers_count: number;
//   forks_count: number;
// }

// export default function UserProfile() {
//   const { username } = useParams<{ username: string }>();
//   const { token, user } = useAuth();
//   const [profile, setProfile] = useState<UserData | null>(null);
//   const navigate = useNavigate();

//   // Fetch user profile from contacts or auth
//   useEffect(() => {
//     const fetchProfile = async () => {
//       try {
//         if (!token || !username) return;
//         const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/contacts`, {
//           headers: { Authorization: `Bearer ${token}` },
//         });
//         console.log('🔹 Contacts fetched:', response.data);
//         const contact = response.data.find(
//           (c: UserData) => c.username.toLowerCase() === username.toLowerCase()
//         );
//         if (contact) {
//           setProfile(contact);
//         } else if (user?.username.toLowerCase() === username.toLowerCase()) {
//           setProfile({ id: user.id, username: user.username, avatar: user.avatar });
//         } else {
//           setProfile(null);
//         }
//       } catch (error) {
//         console.error('❌ Error fetching profile:', error);
//       }
//     };
//     fetchProfile();
//   }, [username, token, user]);

//   // Fetch repositories using GitHub API
//   const { data: repos, isLoading: reposLoading, error: reposError } = useQuery({
//     queryKey: ['repos', username],
//     queryFn: async () => {
//       if (!username) return [];
//       const response = await axios.get(`https://api.github.com/users/${username}/repos`, {
//         headers: {
//           Authorization: `Bearer ${import.meta.env.VITE_GITHUB_TOKEN}`,
//           Accept: 'application/vnd.github+json',
//         },
//         params: {
//           sort: 'updated',
//           per_page: 6,
//         },
//       });
//       console.log('🔹 Repos fetched:', response.data);
//       return response.data as Repo[];
//     },
//     enabled: !!username,
//   });

//   // Fetch total commits for all repos
//   const { data: totalCommits, isLoading: commitsLoading, error: commitsError } = useQuery({
//     queryKey: ['commits', username],
//     queryFn: async () => {
//       if (!repos || !username) return 0;
//       let total = 0;
//       for (const repo of repos.slice(0, 6)) {
//         try {
//           const response = await axios.get(
//             `https://api.github.com/repos/${username}/${repo.name}/commits`,
//             {
//               headers: {
//                 Authorization: `Bearer ${import.meta.env.VITE_GITHUB_TOKEN}`,
//                 Accept: 'application/vnd.github+json',
//               },
//               params: {
//                 author: username,
//                 per_page: 100,
//               },
//             }
//           );
//           console.log(`🔹 Commits for ${repo.name}:`, response.data.length);
//           total += response.data.length;
//         } catch (error) {
//           console.error(`❌ Error fetching commits for ${repo.name}:`, error);
//         }
//       }
//       return total;
//     },
//     enabled: !!repos && repos.length > 0,
//   });

//   if (!user?.id) return <div className="text-gray-400 text-center">Please log in</div>;
//   if (!profile) return <div className="text-gray-400 text-center">User not found</div>;

//   return (
//     <div className="min-h-screen bg-gray-900 p-8 flex flex-col items-center">
//       <div className="w-full max-w-4xl bg-gray-800/60 backdrop-blur-lg rounded-2xl shadow-lg p-6 border border-gray-700">
//         <h2 className="text-2xl font-bold text-gray-100 mb-4">{profile.username}'s Profile</h2>
//         <div className="flex flex-col items-center gap-4 mb-8">
//           <img
//             src={profile.avatar}
//             alt={profile.username}
//             className="h-24 w-24 rounded-full border-2 border-gray-700"
//           />
//           <p className="text-gray-100 text-lg">{profile.username}</p>
//           {reposError && <p className="text-red-400">Error loading repositories</p>}
//           {commitsLoading ? (
//             <p className="text-gray-400">Loading commits...</p>
//           ) : commitsError ? (
//             <p className="text-red-400">Error loading commits</p>
//           ) : (
//             <p className="text-gray-400">Total Commits: {totalCommits || 0}</p>
//           )}
//           <div className="flex gap-4">
//             <button
//               onClick={() => window.open(`https://github.com/${profile.username}`, '_blank')}
//               className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
//             >
//               Visit GitHub Profile
//             </button>
//             <button
//               onClick={() => navigate('/chat')}
//               className="text-gray-400 hover:text-gray-100 transition"
//             >
//               Back to Chat
//             </button>
//           </div>
//         </div>

//         {/* Repositories Section */}
//         <h3 className="text-xl font-bold text-gray-100 mb-4">Repositories</h3>
//         {reposLoading ? (
//           <p className="text-gray-400 text-center">Loading repositories...</p>
//         ) : !repos || repos.length === 0 ? (
//           <p className="text-gray-400 text-center">No public repositories found</p>
//         ) : (
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//             {repos.map((repo) => (
//               <div
//                 key={repo.id}
//                 className="bg-gray-700/50 rounded-lg p-4 border border-gray-600 hover:bg-gray-700 transition"
//               >
//                 <a
//                   href={repo.html_url}
//                   target="_blank"
//                   rel="noopener noreferrer"
//                   className="text-blue-400 font-semibold hover:underline"
//                 >
//                   {repo.name}
//                 </a>
//                 <p className="text-gray-300 text-sm mt-1">
//                   {repo.description || 'No description'}
//                 </p>
//                 <div className="flex gap-4 mt-2 text-gray-400 text-sm">
//                   <span>⭐ {repo.stargazers_count}</span>
//                   <span>🍴 {repo.forks_count}</span>
//                 </div>
//               </div>
//             ))}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }