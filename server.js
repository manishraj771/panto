import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import cookieParser from 'cookie-parser';
import State from './models/State.js';
import Repo from './models/Repo.js';
import { exec } from 'child_process';


dotenv.config();

const app = express();
app.use(cookieParser());
// app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(cors({ origin: 'https://imaginative-gecko-c95b84.netlify.app', credentials: true }));

app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// ✅ Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB Connection Error:', err));

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

// ✅ GitHub OAuth Callback (Verify State from MongoDB)
app.post('/api/auth/github/callback', async (req, res) => {
  try {
    const { code, state } = req.body;

    console.log(`🔹 Received Code: ${code}`);
    console.log(`🔹 Received State: ${state}`);

    if (!state) {
      return res.status(400).json({ error: 'Missing state parameter' });
    }

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
        redirect_uri: process.env.GITHUB_REDIRECT_URI
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

    const user = {
      id: userData.id.toString(),
      name: userData.name || userData.login,
      email: userData.email,
      avatar: userData.avatar_url,
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

// ✅ Fix Missing Route `/api/auth/me`
app.get('/api/auth/me', (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token provided' });

    const user = jwt.verify(token, JWT_SECRET);
    res.json(user);
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// ✅ Fetch User Repositories
app.get('/api/repos', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const user = jwt.verify(token, JWT_SECRET);

    let repos = [];

    switch (user.provider) {
      case 'github':
        const githubResponse = await fetch('https://api.github.com/user/repos?sort=updated', {
          headers: {
            Authorization: `Bearer ${user.accessToken}`,
            Accept: 'application/vnd.github.v3+json',
          },
        });
        const githubRepos = await githubResponse.json();
        repos = await Promise.all(
          githubRepos.map(async (repo) => {
            // ✅ Save to MongoDB
            const savedRepo = await Repo.findOneAndUpdate(
              { id: repo.id.toString() },  // Find by ID
              {
                $set: {
                  id: repo.id.toString(),
                  name: repo.name,
                  fullName: repo.full_name,
                  description: repo.description,
                  url: repo.html_url,
                  stars: repo.stargazers_count,
                  defaultBranch: repo.default_branch,
                  private: repo.private,
                  updatedAt: repo.updated_at,
                  autoReview: false, // Default value
                },
              },
              { new: true, upsert: true } // Create if doesn't exist
            );

            return savedRepo;
          })
        );
        break;

      default:
        return res.status(400).json({ error: 'Unsupported provider' });
    }

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

// app.get('/api/repos/:id/stats', async (req, res) => {
//   try {
//     const { id } = req.params;
//     console.log(`🔹 Fetching stats for repo ID: ${id}`);

//     const repo = await Repo.findOne({ id });
//     if (!repo) {
//       console.error(`❌ Repository not found in DB for ID: ${id}`);
//       return res.status(404).json({ error: 'Repository not found' });
//     }

//     // Mock stats for now (Replace with actual data)
//     const repoStats = {
//       commitCount: Math.floor(Math.random() * 500), // Fake data
//       pullRequests: Math.floor(Math.random() * 50),
//       openIssues: Math.floor(Math.random() * 20),
//       contributors: Math.floor(Math.random() * 10),
//       lastCommit: new Date().toISOString(),
//     };

//     res.json(repoStats);
//   } catch (error) {
//     console.error('❌ Error fetching repo stats:', error);
//     res.status(500).json({ error: 'Failed to fetch repository stats' });
//   }
// });


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
