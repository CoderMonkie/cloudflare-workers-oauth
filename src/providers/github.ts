import { OAuthConfig, OAuthProvider, OAuthTokenResponse, UserProfile } from '../types/oauth';

// 定义 GitHub API 返回的用户数据结构
export interface GitHubProfileFields {
  id: number;
  login: string;
  name: string;
  email: string;
  avatar_url: string;
  node_id: string;
  //
  html_url: string | null;
  bio: string | null;
  location: string | null;
  company: string | null;
  blog: string | null;
  twitter_username: string | null;
  created_at: string;
  updated_at: string;
  public_repos: number;
  followers: number;
  following: number;
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
        'Accept': 'application/json; charset=utf-8',
        'User-Agent': 'Cloudflare-Workers-OAuth',
        'Content-Type': 'application/json; charset=utf-8',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get user profile: ${response.statusText}`);
    }

    const data = await response.json() as GitHubProfileFields;
    return {
      id: data.id.toString(),
      account: data.login,
      name: data.name || data.login,
      email: data.email,
      avatar: data.avatar_url,
      provider: 'github',
      //
      bio: data.bio,  // 用户简介
      location: data.location || null,  // 地理位置
      company: data.company || null,  // 公司
      blog: data.blog || null,  // 个人网站
      html_url: data.html_url,  // 用户主页
      twitter_username: data.twitter_username || null,  // Twitter用户名
      created_at: data.created_at,  // 账号创建时间
      updated_at: data.updated_at,  // 账号更新时间
      public_repos: data.public_repos || 0,  // 公开仓库数
      followers: data.followers || 0,  // 粉丝数
      following: data.following || 0,  // 关注数
    };
  }
}
