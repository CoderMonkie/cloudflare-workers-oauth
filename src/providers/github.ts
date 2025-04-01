import { OAuthConfig, OAuthProvider, OAuthTokenResponse, UserProfile } from '../types/oauth';

// 定义 GitHub API 返回的用户数据结构
interface GitHubUserResponse {
  id: number;
  login: string;
  name: string;
  email: string;
  avatar_url: string;
  // 可以根据需要添加更多 GitHub API 返回的字段
}

export class GitHubOAuthProvider implements OAuthProvider {
  private readonly config: OAuthConfig;
  private readonly authUrl = 'https://github.com/login/oauth/authorize';
  private readonly tokenUrl = 'https://github.com/login/oauth/access_token';
  private readonly userApiUrl = 'https://api.github.com/user';

  constructor(config: OAuthConfig) {
    this.config = {
      ...config,
      scope: config.scope || ['read:user', 'user:email'],
    };
  }

  getAuthorizationUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      // redirect_uri: this.config.redirectUri,
      scope: this.config.scope?.join(' ') || '',
      state,
    });

    return `${this.authUrl}?${params.toString()}`;
  }

  async getAccessToken(code: string): Promise<OAuthTokenResponse> {
		const params = new URLSearchParams({
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      code,
      // redirect_uri: this.config.redirectUri,
    });

    try {
      const response = await fetch(`${this.tokenUrl}?${params.toString()}`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Cloudflare-Workers-OAuth',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('GitHub OAuth error:', response.status, errorText);
        throw new Error(`Failed to get access token: ${response.status} ${response.statusText} - ${errorText}`);
      }

      return response.json();
    } catch (error) {
      console.error('Error exchanging code for token:', error);
      throw error;
    }
  }

  async getUserProfile(accessToken: string): Promise<UserProfile> {
    const response = await fetch(this.userApiUrl, {
      headers: {
        'Authorization': accessToken,
        'Accept': 'application/json',
        'User-Agent': 'Cloudflare-Workers-OAuth',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get user profile: ${response.statusText}`);
    }

    const data = await response.json() as GitHubUserResponse;
    return {
      id: data.id.toString(),
      account: data.login,
      name: data.name || data.login,
      email: data.email,
      avatar: data.avatar_url,
      provider: 'github',
    };
  }
}