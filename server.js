import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import cookieParser from 'cookie-parser';
import { Server } from 'socket.io';
import http from 'http';
import State from './models/State.js';
import Repo from './models/Repo.js';
import Message from './models/Message.js'; // Import the new model
import { exec } from 'child_process';
import axios from 'axios';


dotenv.config();

const app = express();
const server = http.createServer(app); // Use http server instead of app.listen
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});
app.use(cookieParser());
 app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
//app.use(cors({ origin: 'https://imaginative-gecko-c95b84.netlify.app', credentials: true }));

app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// ✅ Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB Connection Error:', err));


// Existing OAuth and Repo Routes (unchanged for brevity)
// ... (keep /api/auth/github, /api/auth/github/callback, /api/auth/me, /api/repos, etc.)

// Fetch Chat History (optional but useful)
app.get('/api/messages/:receiverId', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token provided' });
    const user = jwt.verify(token, JWT_SECRET);
    const { receiverId } = req.params;

    const messages = await Message.find({
      $or: [
        { senderId: user.id, receiverId },
        { senderId: receiverId, receiverId: user.id },
      ],
    }).sort({ timestamp: 1 });

    res.json(messages);
  } catch (error) {
    console.error('❌ Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});
// New Endpoint: Fetch Followers and Following
app.get('/api/contacts', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token provided' });
    const user = jwt.verify(token, JWT_SECRET);

    const [followersResponse, followingResponse] = await Promise.all([
      fetch('https://api.github.com/user/followers', {
        headers: { Authorization: `Bearer ${user.accessToken}` },
      }),
      fetch('https://api.github.com/user/following', {
        headers: { Authorization: `Bearer ${user.accessToken}` },
      }),
    ]);

    const followers = await followersResponse.json();
    const following = await followingResponse.json();

    const contacts = [
      ...followers.map(f => ({ id: f.id.toString(), username: f.login, avatar: f.avatar_url })),
      ...following.map(f => ({ id: f.id.toString(), username: f.login, avatar: f.avatar_url })),
    ].filter((v, i, a) => a.findIndex(t => t.id === v.id) === i); // Remove duplicates

    res.json(contacts);
  } catch (error) {
    console.error('❌ Error fetching contacts:', error);
    res.status(500).json({ error: 'Failed to fetch contacts' });
  }
});

// Socket.IO Connection
io.on('connection', (socket) => {
  console.log('🔹 User connected:', socket.id);

  socket.on('authenticate', (token) => {
    try {
      const user = jwt.verify(token, JWT_SECRET);
      socket.user = user;
      console.log('🔹 Authenticated user:', user.username);
      socket.join(user.id);
    } catch (error) {
      console.error('❌ Invalid token for socket:', error);
      socket.disconnect();
    }
  });

  socket.on('sendMessage', async ({ receiverId, content }) => {
    if (!socket.user) return socket.emit('error', 'Not authenticated');

    const message = new Message({
      senderId: socket.user.id,
      receiverId,
      content,
      status:'delivered', // Add status to Schema
    });
    await message.save();
    console.log('🔹 Saved message:', message); // Log saved message

    io.to(socket.user.id).emit('newMessage', message);
    io.to(receiverId).emit('newMessage', message);
    console.log('🔹 Broadcasted message to:', socket.user.id, receiverId);
  });

  socket.on('disconnect', () => {
    console.log('🔹 User disconnected:', socket.id);
  });
});
// app.get('/api/github/repos/:username', async (req, res) => {
//   try {
//     const { username } = req.params;
//     const response = await axios.get(`https://api.github.com/users/${username}/repos`, {
//       headers: {
//         Authorization: `Bearer ${process.env.GITHUB_ACCESS_TOKEN}`,
//         Accept: 'application/vnd.github+json',
//       },
//       params: {
//         sort: 'updated',
//         per_page: 6,
//       },
//     });
//     console.log(`🔹 Fetched repos for ${username}:`, response.data.length); // Debug log
//     res.json(response.data);
//   } catch (error) {
//     console.error('Error fetching repos:', error);
//     res.status(500).json({ error: 'Failed to fetch repositories' });
//   }
// });

// app.get('/api/github/commits/:username/:repo', async (req, res) => {
//   try {
//     const { username, repo } = req.params;
//     const response = await axios.get(`https://api.github.com/repos/${username}/${repo}/commits`, {
//       headers: {
//         Authorization: `Bearer ${process.env.GITHUB_ACCESS_TOKEN}`,
//         Accept: 'application/vnd.github+json',
//       },
//       params: {
//         author: username,
//         per_page: 100,
//       },
//     });
//     console.log(`🔹 Fetched commits for ${username}/${repo}:`, response.data.length); // Debug log
//     res.json(response.data);
//   } catch (error) {
//     console.error('Error fetching commits:', error);
//     res.status(500).json({ error: 'Failed to fetch commits' });
//   }
// });


// ✅ GitHub OAuth Login (Fetch State from MongoDB)
app.get('/api/auth/github', async (req, res) => {
  const state = Math.random().toString(36).substring(2);

  try {
    await State.create({ state });

    const authUrl = `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}&redirect_uri=${process.env.GITHUB_REDIRECT_URI}&state=${state}&scope=read:user user:email repo`;
    
    console.log(`🔹 State Stored in MongoDB: ${state}`);
    
    res.json({ authUrl, state });  // ✅ Send the state to the frontend
  } catch (error) {
    console.error("❌ Error storing OAuth state:", error);
    res.status(500).json({ error: 'Failed to store OAuth state' });
  }
});

// GitHub OAuth Callback
app.post('/api/auth/github/callback', async (req, res) => {
  try {
    const { code, state } = req.body;
    console.log(`🔹 Received Code: ${code}`);
    console.log(`🔹 Received State: ${state}`);

    if (!state) return res.status(400).json({ error: 'Missing state parameter' });
    const storedState = await State.findOne({ state });
    if (!storedState) {
      console.error("❌ Invalid state parameter, no match in MongoDB");
      return res.status(400).json({ error: 'Invalid state parameter' });
    }
    await State.deleteOne({ state });
    console.log(`✅ State ${state} validated and deleted from MongoDB`);

    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: process.env.GITHUB_REDIRECT_URI,
      }),
    });

    const tokenData = await tokenResponse.json();
    if (tokenData.error) {
      console.error("❌ GitHub Token Error:", tokenData);
      return res.status(400).json({ error: tokenData.error_description });
    }

    const accessToken = tokenData.access_token;

    const userResponse = await fetch('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!userResponse.ok) throw new Error('Failed to fetch user data');
    const userData = await userResponse.json();

    // Fetch email if not included in initial response
    const emailResponse = await fetch('https://api.github.com/user/emails', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const emails = await emailResponse.json();
    const primaryEmail = emails.find(email => email.primary && email.verified)?.email || userData.email;

    const user = {
      id: userData.id.toString(),
      username: userData.login,
      name: userData.name || userData.login,
      email: primaryEmail,
      avatar: userData.avatar_url,
      bio: userData.bio || '',
      followers: userData.followers || 0,
      following: userData.following || 0,
      publicRepos: userData.public_repos || 0,
      provider: 'github',
      accessToken,
    };

    const token = jwt.sign(user, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token, user });
  } catch (error) {
    console.error('❌ GitHub auth error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// Fetch Current User (Updated with More Details)
app.get('/api/auth/me', (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token provided' });

    const user = jwt.verify(token, JWT_SECRET);
    res.json({
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      bio: user.bio,
      followers: user.followers,
      following: user.following,
      publicRepos: user.publicRepos,
      provider: user.provider,
    });
  } catch (error) {
    console.error('❌ Invalid token:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Fetch User Repositories (Unchanged for brevity)
app.get('/api/repos', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token provided' });
    const user = jwt.verify(token, JWT_SECRET);

    const githubResponse = await fetch('https://api.github.com/user/repos?sort=updated', {
      headers: { Authorization: `Bearer ${user.accessToken}`, Accept: 'application/vnd.github.v3+json' },
    });
    const githubRepos = await githubResponse.json();
    const repos = await Promise.all(
      githubRepos.map(async (repo) => {
        const savedRepo = await Repo.findOneAndUpdate(
          { id: repo.id.toString() },
          {
            id: repo.id.toString(),
            name: repo.name,
            fullName: repo.full_name,
            description: repo.description,
            url: repo.html_url,
            stars: repo.stargazers_count,
            defaultBranch: repo.default_branch,
            private: repo.private,
            updatedAt: repo.updated_at,
            autoReview: false,
          },
          { new: true, upsert: true }
        );
        return savedRepo;
      })
    );
    res.json(repos);
  } catch (error) {
    console.error('❌ Error fetching repositories:', error);
    res.status(500).json({ error: 'Failed to fetch repositories' });
  }
});

app.post('/api/repos/:id/toggle-auto-review', async (req, res) => {
  try {
    const { id } = req.params;
    const repo = await Repo.findOne({ id });

    if (!repo) {
      return res.status(404).json({ error: 'Repository not found' });
    }

    // Toggle auto review status
    repo.autoReview = !repo.autoReview;
    await repo.save();

    res.json({ message: 'Auto Review status updated', autoReview: repo.autoReview });
  } catch (error) {
    console.error('Error toggling auto review:', error);
    res.status(500).json({ error: 'Failed to update Auto Review' });
  }
});
// ✅ Get Total Lines in Repository
app.get('/api/repos/:id/lines', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🔹 Fetching total lines for repo ID: ${id}`);

    const repo = await Repo.findOne({ id });

    if (!repo) {
      console.log("❌ Repository not found in DB");

      return res.status(404).json({ error: 'Repository not found' });
    }
    console.log(`✅ Repository Found: ${repo.name}`);


    // Clone the repo temporarily
    const repoPath = `/tmp/${repo.name}`;
    exec(`rm -rf ${repoPath} && git clone --depth=1 ${repo.url} ${repoPath}`, (error) => {
      if (error) {
        return res.status(500).json({ error: 'Failed to clone repository' });
      }

      // Count lines of code
      exec(`find ${repoPath} -type f -exec wc -l {} + | awk '{sum+=$1} END {print sum}'`, (err, stdout) => {
        if (err) {
          console.error("❌ Error counting lines:", err);
          return res.status(500).json({ error: 'Failed to count lines' });
        }

        const totalLines = parseInt(stdout.trim(), 10);
        console.log(`✅ Total Lines in Repository: ${totalLines}`);

        res.json({ totalLines });
      });
    });
  } catch (error) {
    console.error('❌ Error fetching total lines:', error);
    res.status(500).json({ error: 'Failed to fetch total lines' });
  }
});
app.get('/api/repos/:id/stats', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🔹 Fetching real stats for repo ID: ${id}`);

    const repo = await Repo.findOne({ id });
    if (!repo) {
      console.error(`❌ Repository not found in DB for ID: ${id}`);
      return res.status(404).json({ error: 'Repository not found' });
    }

    const token = process.env.GITHUB_ACCESS_TOKEN;
    const headers = { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github.v3+json' };

    // ✅ Fetch GitHub stats
    const responses = await Promise.all([
      fetch(`https://api.github.com/repos/${repo.fullName}/commits`, { headers }),
      fetch(`https://api.github.com/repos/${repo.fullName}/pulls`, { headers }),
      fetch(`https://api.github.com/repos/${repo.fullName}/issues`, { headers }),
      fetch(`https://api.github.com/repos/${repo.fullName}/contributors`, { headers }),
    ]);

    // ✅ Convert responses to JSON
    const [repoCommits, repoPulls, repoIssues, repoContributors] = await Promise.all(
      responses.map(res => res.json())
    );

    // ✅ Log API responses (check if empty)
    console.log('🔹 Commits Response:', repoCommits);
    console.log('🔹 Pull Requests Response:', repoPulls);
    console.log('🔹 Issues Response:', repoIssues);
    console.log('🔹 Contributors Response:', repoContributors);

    // ✅ Extract data
    const repoStats = {
      commitCount: Array.isArray(repoCommits) ? repoCommits.length : 0,
      pullRequests: Array.isArray(repoPulls) ? repoPulls.length : 0,
      openIssues: Array.isArray(repoIssues) ? repoIssues.length : 0,
      contributors: Array.isArray(repoContributors) ? repoContributors.length : 0,
      lastCommit: repoCommits.length > 0 ? repoCommits[0].commit.author.date : 'Unknown',
    };

    res.json(repoStats);
  } catch (error) {
    console.error('❌ Error fetching repo stats:', error);
    res.status(500).json({ error: 'Failed to fetch repository stats' });
  }
});



const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
