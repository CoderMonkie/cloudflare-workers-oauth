import { OAuthConfig, OAuthProvider, OAuthTokenResponse, UserProfile } from '../types/oauth';

// 定义 Gitee API 返回的用户数据结构
export interface GiteeProfileFields {
  id: number;
  login: string;
  name: string;
  email: string;
  avatar_url: string;
  url: string;
  html_url: string;
  remark: string;
  followers_url: string;
  following_url: string;
  gists_url: string;
  starred_url: string;
  subscriptions_url: string;
  organizations_url: string;
  repos_url: string;
  events_url: string;
  received_events_url: string;
  type: string;
  blog: string | null;
  weibo: string | null;
  bio: string | null;
  public_repos: number;
  public_gists: number;
  followers: number;
  following: number;
  stared: number;
  watched: number;
  created_at: string;
  updated_at: string;
}

export class GiteeOAuthProvider implements OAuthProvider {
  private readonly config: OAuthConfig;
  private readonly authUrl = 'https://gitee.com/oauth/authorize';
  private readonly tokenUrl = 'https://gitee.com/oauth/token';
  private readonly userApiUrl = 'https://gitee.com/api/v5/user';

  constructor(config: OAuthConfig) {
    this.config = {
      ...config,
      scope: config.scope || ['user_info'],
    };
  }

  getAuthorizationUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      response_type: 'code',
      scope: this.config.scope?.join(' ') || 'user_info',
      state,
    });

    return `${this.authUrl}?${params.toString()}`;
  }

  async getAccessToken(code: string): Promise<OAuthTokenResponse> {
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      client_secret: this.config.clientSecret,
    });

    try {
      const response = await fetch(this.tokenUrl, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded',
          // 尝试使用更标准的 User-Agent
          'User-Agent': 'OAuth-Client/1.0 (Cloudflare Workers)',
        },
        body: params.toString(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Gitee OAuth error:', response.status, errorText);
        console.error('Request params:', {
          client_id: this.config.clientId,
          redirect_uri: this.config.redirectUri,
          // 不要在日志中输出 client_secret
        });
        throw new Error(`Failed to get access token: ${response.status} ${response.statusText} - ${errorText}`);
      }

      return response.json();
    } catch (error) {
      console.error('Error exchanging code for token:', error);
      throw error;
    }
  }

  async getUserProfile(tokenResponse: OAuthTokenResponse): Promise<UserProfile> {
    const accessToken = tokenResponse.access_token;

    // 获取用户基本信息
    const userResponse = await fetch(`${this.userApiUrl}?access_token=${accessToken}`, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Cloudflare-Workers-OAuth',
        'Accept-Charset': 'utf-8',
      },
    });


    if (!userResponse.ok) {
      throw new Error(`Failed to get user profile: ${userResponse.statusText}`);
    }

    const userData = await userResponse.json() as GiteeProfileFields;

    return {
      id: userData.id.toString(),
      account: userData.login,
      name: userData.name || userData.login,
      email: userData.email,
      avatar: userData.avatar_url,
      provider: 'gitee',
      bio: userData.bio,
      blog: userData.blog,
      location: null,
      company: null,
      public_repos: userData.public_repos,
      followers: userData.followers,
      following: userData.following,
      created_at: userData.created_at,
      updated_at: userData.updated_at,
    };
  }
}
