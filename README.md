# Git Manager

Git Manager is a modern web application that allows you to manage all your Git repositories from different providers (GitHub, GitLab, and Bitbucket) in one centralized dashboard.

## Features

- 🔐 Secure OAuth authentication with multiple Git providers:
  - GitHub
  - GitLab
  - Bitbucket
- 📊 Unified dashboard for all your repositories
- 🔍 Advanced repository search and filtering
- 📱 Responsive design for all devices
- 🎨 Modern UI with Tailwind CSS
- ⚡ Built with Vite and React for optimal performance

## Tech Stack

- **Frontend:**
  - React 18
  - TypeScript
  - Tailwind CSS
  - Lucide Icons
  - React Query
  - React Router

- **Backend:**
  - Node.js
  - Express
  - JWT Authentication

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/git-manager.git
cd git-manager
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with your OAuth credentials:
```env
# Server Configuration
PORT=3000
JWT_SECRET=your_jwt_secret

# GitHub
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_REDIRECT_URI=http://localhost:5173/auth/callback/github

# GitLab
GITLAB_CLIENT_ID=your_gitlab_client_id
GITLAB_CLIENT_SECRET=your_gitlab_client_secret
GITLAB_REDIRECT_URI=http://localhost:5173/auth/callback/gitlab

# Bitbucket
BITBUCKET_CLIENT_ID=your_bitbucket_client_id
BITBUCKET_CLIENT_SECRET=your_bitbucket_client_secret
BITBUCKET_REDIRECT_URI=http://localhost:5173/auth/callback/bitbucket

# API Configuration
VITE_API_URL=http://localhost:3000
```

4. Start the development server:
```bash
npm run dev
```

5. Start the backend server:
```bash
node server.js
```

The application will be available at `http://localhost:5173`.

## Development

- `npm run dev` - Start the development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Project Structure

```
git-manager/
├── src/
│   ├── components/     # Reusable UI components
│   ├── config/        # Configuration files
│   ├── hooks/         # Custom React hooks
│   ├── pages/         # Page components
│   ├── App.tsx        # Main application component
│   └── main.tsx       # Application entry point
├── public/            # Static assets
└── server.js          # Backend server
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Vite](https://vitejs.dev/)
- [React](https://reactjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Lucide Icons](https://lucide.dev/)