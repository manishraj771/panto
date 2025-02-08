import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import jwt from 'jsonwebtoken';

dotenv.config();

const app = express();

// Configure CORS with specific options
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// GitHub OAuth callback
app.post('/api/auth/github/callback', async (req, res) => {
  try {
    const { code } = req.body;
    console.log('Received code:', code);
    
    // Exchange code for access token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: process.env.GITHUB_REDIRECT_URI
      }),
    });
    
    const tokenData = await tokenResponse.json();
    console.log('Token response:', tokenData);
    
    if (tokenData.error) {
      console.error('GitHub token error:', tokenData);
      return res.status(400).json({ error: tokenData.error_description || 'Failed to get access token' });
    }
    
    const accessToken = tokenData.access_token;

    // Get user data
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Git-Manager'
      },
    });
    
    if (!userResponse.ok) {
      console.error('User data error:', await userResponse.text());
      throw new Error('Failed to fetch user data');
    }
    
    const userData = await userResponse.json();
    console.log('User data:', userData);

    // Create user object
    const user = {
      id: userData.id.toString(),
      name: userData.name || userData.login,
      email: userData.email,
      avatar: userData.avatar_url,
      provider: 'github',
      accessToken,
    };

    // Create JWT token
    const token = jwt.sign(user, JWT_SECRET);

    res.json({ token, user });
  } catch (error) {
    console.error('GitHub auth error:', error);
    res.status(500).json({ error: 'Authentication failed', details: error.message });
  }
});

// GitLab OAuth callback
app.post('/api/auth/gitlab/callback', async (req, res) => {
  try {
    const { code } = req.body;
    
    // Exchange code for access token
    const tokenResponse = await fetch('https://gitlab.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.GITLAB_CLIENT_ID,
        client_secret: process.env.GITLAB_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
        redirect_uri: process.env.GITLAB_REDIRECT_URI,
      }),
    });
    
    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Get user data
    const userResponse = await fetch('https://gitlab.com/api/v4/user', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    
    const userData = await userResponse.json();

    // Create user object
    const user = {
      id: userData.id.toString(),
      name: userData.name,
      email: userData.email,
      avatar: userData.avatar_url,
      provider: 'gitlab',
      accessToken,
    };

    // Create JWT token
    const token = jwt.sign(user, JWT_SECRET);

    res.json({ token, user });
  } catch (error) {
    console.error('GitLab auth error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// Bitbucket OAuth callback
app.post('/api/auth/bitbucket/callback', async (req, res) => {
  try {
    const { code } = req.body;
    
    // Exchange code for access token
    const tokenResponse = await fetch('https://bitbucket.org/site/oauth2/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(
          `${process.env.BITBUCKET_CLIENT_ID}:${process.env.BITBUCKET_CLIENT_SECRET}`
        ).toString('base64')}`,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
      }).toString(),
    });
    
    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Get user data
    const userResponse = await fetch('https://api.bitbucket.org/2.0/user', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    
    const userData = await userResponse.json();

    // Create user object
    const user = {
      id: userData.uuid,
      name: userData.display_name,
      email: userData.email,
      avatar: userData.links.avatar.href,
      provider: 'bitbucket',
      accessToken,
    };

    // Create JWT token
    const token = jwt.sign(user, JWT_SECRET);

    res.json({ token, user });
  } catch (error) {
    console.error('Bitbucket auth error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// Get user repositories
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
        repos = githubRepos.map(repo => ({
          id: repo.id.toString(),
          name: repo.name,
          fullName: repo.full_name,
          description: repo.description,
          url: repo.html_url,
          stars: repo.stargazers_count,
          defaultBranch: repo.default_branch,
          private: repo.private,
          updatedAt: repo.updated_at,
        }));
        break;

      case 'gitlab':
        const gitlabResponse = await fetch('https://gitlab.com/api/v4/projects?membership=true', {
          headers: {
            Authorization: `Bearer ${user.accessToken}`,
          },
        });
        const gitlabRepos = await gitlabResponse.json();
        repos = gitlabRepos.map(repo => ({
          id: repo.id.toString(),
          name: repo.name,
          fullName: repo.path_with_namespace,
          description: repo.description,
          url: repo.web_url,
          stars: repo.star_count,
          defaultBranch: repo.default_branch,
          private: repo.visibility !== 'public',
          updatedAt: repo.last_activity_at,
        }));
        break;

      case 'bitbucket':
        const bitbucketResponse = await fetch('https://api.bitbucket.org/2.0/repositories?role=member', {
          headers: {
            Authorization: `Bearer ${user.accessToken}`,
          },
        });
        const bitbucketData = await bitbucketResponse.json();
        repos = bitbucketData.values.map(repo => ({
          id: repo.uuid,
          name: repo.name,
          fullName: repo.full_name,
          description: repo.description,
          url: repo.links.html.href,
          defaultBranch: repo.mainbranch?.name,
          private: repo.is_private,
          updatedAt: repo.updated_on,
        }));
        break;
    }

    res.json(repos);
  } catch (error) {
    console.error('Error fetching repositories:', error);
    res.status(500).json({ error: 'Failed to fetch repositories' });
  }
});

// Verify user session
app.get('/api/auth/me', (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const user = jwt.verify(token, JWT_SECRET);
    res.json(user);
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});