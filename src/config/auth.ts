export const AUTH_CONFIG = {
  github: {
    clientId: import.meta.env.VITE_GITHUB_CLIENT_ID,
    redirectUri: `${window.location.origin}/auth/callback/github`,
    authUrl: 'https://github.com/login/oauth/authorize',
    scope: 'read:user user:email repo',
  },
  gitlab: {
    clientId: import.meta.env.VITE_GITLAB_CLIENT_ID,
    redirectUri: `${window.location.origin}/auth/callback/gitlab`,
    authUrl: 'https://gitlab.com/oauth/authorize',
    scope: 'read_user read_api read_repository',
  },
  bitbucket: {
    clientId: import.meta.env.VITE_BITBUCKET_CLIENT_ID,
    redirectUri: `${window.location.origin}/auth/callback/bitbucket`,
    authUrl: 'https://bitbucket.org/site/oauth2/authorize',
    scope: 'repository account',
  },
};