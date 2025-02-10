Git Manager

Git Manager is a modern web application that allows you to manage all your Git repositories from different providers (GitHub, GitLab, and Bitbucket) in one centralized dashboard.

Features

🔐 Secure OAuth authentication with multiple Git providers:

GitHub

GitLab

Bitbucket

📊 Unified dashboard for all your repositories

📑 View repository details, including commits, issues, and pull requests

🔍 Advanced repository search and filtering

⚙️ Auto Review feature for automated repository checks

📜 View total lines of code per repository

📱 Responsive design for all devices

🎨 Modern UI with Tailwind CSS

⚡ Built with Vite and React for optimal performance

Tech Stack

Frontend:

React 18

TypeScript

Tailwind CSS

Lucide Icons

React Query

React Router

Backend:

Node.js

Express

MongoDB (Mongoose ORM)

JWT Authentication

GitHub/GitLab/Bitbucket OAuth

Getting Started

Prerequisites

Node.js 18 or higher

npm or yarn

Installation

Clone the repository:

git clone https://github.com/yourusername/git-manager.git
cd git-manager

Install dependencies:

npm install

Create a .env file in the root directory with your OAuth credentials:

# Server Configuration
PORT=5000
JWT_SECRET=your_jwt_secret
MONGO_URI=your_mongodb_connection_string

# GitHub OAuth
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_REDIRECT_URI=https://your-deployed-frontend-url/auth/callback/github

# GitLab OAuth
GITLAB_CLIENT_ID=your_gitlab_client_id
GITLAB_CLIENT_SECRET=your_gitlab_client_secret
GITLAB_REDIRECT_URI=https://your-deployed-frontend-url/auth/callback/gitlab

# Bitbucket OAuth
BITBUCKET_CLIENT_ID=your_bitbucket_client_id
BITBUCKET_CLIENT_SECRET=your_bitbucket_client_secret
BITBUCKET_REDIRECT_URI=https://your-deployed-frontend-url/auth/callback/bitbucket

# API Configuration
VITE_API_URL=https://your-deployed-backend-url

Start the backend server:

node server.js

Start the frontend development server:

npm run dev

The application will be available at http://localhost:5173.

API Endpoints

Authentication

GitHub OAuth Login

Endpoint: GET /api/auth/github

Description: Initiates the GitHub OAuth authentication flow.

GitHub OAuth Callback

Endpoint: POST /api/auth/github/callback

Description: Handles GitHub authentication and retrieves user data.

Get Authenticated User

Endpoint: GET /api/auth/me

Description: Returns details of the currently authenticated user.

Repositories

Fetch User Repositories

Endpoint: GET /api/repos

Headers:

Authorization: Bearer <token>

Description: Fetches repositories for the authenticated user.

Get Repository Stats

Endpoint: GET /api/repos/:id/stats

Description: Fetches stats including commit count, pull requests, issues, and contributors for a repository.

Get Total Lines of Code

Endpoint: GET /api/repos/:id/lines

Description: Returns the total number of lines of code in a repository.

Toggle Auto Review

Endpoint: POST /api/repos/:id/toggle-auto-review

Description: Enables or disables auto-review for a repository.

Deployment

Backend (Render/Heroku)

Deploy the backend to Render or any cloud platform of your choice.

Set environment variables for MongoDB, JWT, and OAuth credentials.

Frontend (Netlify/Vercel)

Deploy the frontend to Netlify or Vercel.

Set VITE_API_URL to your deployed backend URL.

To redeploy after changes:

git add .
git commit -m "Update project"
git push origin main

Netlify/Vercel will automatically redeploy the frontend.

Development

npm run dev - Start the development server

npm run build - Build for production

npm run preview - Preview production build

npm run lint - Run ESLint

Project Structure

git-manager/
├── src/
│   ├── components/     # Reusable UI components
│   ├── hooks/         # Custom React hooks
│   ├── pages/         # Page components
│   ├── App.tsx        # Main application component
│   └── main.tsx       # Application entry point
├── public/            # Static assets
└── server.js          # Backend server

Contributing

Fork the repository

Create your feature branch (git checkout -b feature/amazing-feature)

Commit your changes (git commit -m 'Add some amazing feature')

Push to the branch (git push origin feature/amazing-feature)

Open a Pull Request

License

This project is licensed under the MIT License - see the LICENSE file for details.

Acknowledgments

Vite

React

Tailwind CSS

Lucide Icons

