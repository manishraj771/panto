# Phantom Git Manager

Phantom Git Manager is a web-based tool that allows users to connect with GitHub and GitLab to manage repositories efficiently. Users can authenticate using GitHub OAuth, view repositories, enable auto-review, and track code statistics such as total lines of code, commit history, and pull requests.

## Features

- 🔐 Secure OAuth authentication with multiple Git providers:
  - GitHub
  - GitLab
  - Bitbucket
- 📊 Unified dashboard for all your repositories
- 📑 View repository details, including commits, issues, and pull requests
- 🔍 Advanced repository search and filtering
- ⚙️ Auto Review feature for automated repository checks
- 📜 View total lines of code per repository
- 📱 Responsive design for all devices
- 🎨 Modern UI with Tailwind CSS
- ⚡ Built with Vite and React for optimal performance

## Tech Stack

### **Frontend:**
- React 18
- TypeScript
- Tailwind CSS
- Lucide Icons
- React Query
- React Router

### **Backend:**
- Node.js
- Express
- MongoDB (Mongoose ORM)
- JWT Authentication
- GitHub/GitLab/Bitbucket OAuth

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
```

4. Start the backend server:
```bash
node server.js
```

5. Start the frontend development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`.

---

## API Endpoints
#

## 🔗 API Endpoints

| Method | Endpoint                            | Description                          |
| ------ | ----------------------------------- | ------------------------------------ |
| `GET`  | `/api/auth/github`                  | Initiate GitHub OAuth authentication |
| `POST` | `/api/auth/github/callback`         | GitHub OAuth callback                |
| `GET`  | `/api/auth/me`                      | Get authenticated user info          |
| `GET`  | `/api/repos`                        | Fetch user repositories              |
| `POST` | `/api/repos/:id/toggle-auto-review` | Toggle auto-review feature           |
| `GET`  | `/api/repos/:id/stats`              | Get repository statistics            |
| `GET`  | `/api/repos/:id/lines`              | Get total lines of code              |

##



### **Authentication**

#### **GitHub OAuth Login**
- **Endpoint:** `GET /api/auth/github`
- **Description:** Initiates the GitHub OAuth authentication flow.

#### **GitHub OAuth Callback**
- **Endpoint:** `POST /api/auth/github/callback`
- **Description:** Handles GitHub authentication and retrieves user data.

#### **Get Authenticated User**
- **Endpoint:** `GET /api/auth/me`
- **Description:** Returns details of the currently authenticated user.

---

### **Repositories**

#### **Fetch User Repositories**
- **Endpoint:** `GET /api/repos`
- **Headers:**
  - `Authorization: Bearer <token>`
- **Description:** Fetches repositories for the authenticated user.

#### **Get Repository Stats**
- **Endpoint:** `GET /api/repos/:id/stats`
- **Description:** Fetches stats including commit count, pull requests, issues, and contributors for a repository.

#### **Get Total Lines of Code**
- **Endpoint:** `GET /api/repos/:id/lines`
- **Description:** Returns the total number of lines of code in a repository.

#### **Toggle Auto Review**
- **Endpoint:** `POST /api/repos/:id/toggle-auto-review`
- **Description:** Enables or disables auto-review for a repository.

---

## Deployment

### **Backend (Render/Heroku)**
- Deploy the backend to Render or any cloud platform of your choice.
- Set environment variables for MongoDB, JWT, and OAuth credentials.

### **Frontend (Netlify/Vercel)**
- Deploy the frontend to Netlify or Vercel.
- Set `VITE_API_URL` to your deployed backend URL.

To redeploy after changes:
```bash
git add .
git commit -m "Update project"
git push origin main
```
Netlify/Vercel will automatically redeploy the frontend.

---

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

