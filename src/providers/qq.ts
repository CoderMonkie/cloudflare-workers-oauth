import type { OAuthConfig, OAuthProvider, OAuthTokenResponse, UserProfile } from '../types/oauth';

export interface QQProfileFields {
  ret: number;
  msg: string;
  nickname: string;
  figureurl: string;
  figureurl_1: string;
  figureurl_2: string;
  figureurl_qq_1: string;
  figureurl_qq_2: string;
  gender: string;
}

export interface QQOpenIDResponse {
  client_id: string;
  openid: string;
}

export class QQOAuthProvider implements OAuthProvider {
  private readonly config: OAuthConfig;
  private readonly authUrl = 'https://graph.qq.com/oauth2.0/authorize';
  private readonly tokenUrl = 'https://graph.qq.com/oauth2.0/token';
  private readonly openidUrl = 'https://graph.qq.com/oauth2.0/me';
  private readonly userApiUrl = 'https://graph.qq.com/user/get_user_info';

  constructor(config: OAuthConfig) {
    this.config = {
      ...config,
      scope: config.scope || ['get_user_info'],
    };
  }

  getAuthorizationUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      response_type: 'code',
      scope: this.config.scope?.join(',') || '',
      state,
    });

    return `${this.authUrl}?${params.toString()}`;
  }

  async getAccessToken(code: string): Promise<OAuthTokenResponse> {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      code,
      redirect_uri: this.config.redirectUri,
      grant_type: 'authorization_code',
      fmt: 'json'
    });

    try {
      const response = await fetch(`${this.tokenUrl}?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Cloudflare-Workers-OAuth',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(`Failed to exchange token: ${response.status} ${response.statusText} ${JSON.stringify(errorData)}`);
      }

      return response.json();
    } catch (error) {
      console.error('Error exchanging code for token:', error);
      throw error;
    }
  }

  async getUserProfile(tokenResponse: OAuthTokenResponse): Promise<UserProfile> {
    // 1. 获取 OpenID
    const openidResponse = await fetch(`${this.openidUrl}?access_token=${tokenResponse.access_token}&fmt=json`, {
      headers: {
        'Accept': 'application/json',
      }
    });

    if (!openidResponse.ok) {
      throw new Error(`Failed to get OpenID: ${openidResponse.statusText}`);
    }

    const openidData = await openidResponse.json() as QQOpenIDResponse;

    // 2. 获取用户信息
    const userInfoParams = new URLSearchParams({
      access_token: tokenResponse.access_token!,
      oauth_consumer_key: this.config.clientId,
      openid: openidData.openid,
    });

    const userInfoResponse = await fetch(`${this.userApiUrl}?${userInfoParams.toString()}`, {
      headers: {
        'Accept': 'application/json',
      }
    });

    if (!userInfoResponse.ok) {
      throw new Error(`Failed to get user profile: ${userInfoResponse.statusText}`);
    }

    const data = await userInfoResponse.json() as QQProfileFields;

    if (data.ret !== 0) {
      throw new Error(`QQ API error: ${data.msg}`);
    }

    return {
      id: openidData.openid,
      account: openidData.openid,
      name: data.nickname,
      email: '', // QQ OAuth 默认不提供邮箱
      avatar: data.figureurl_qq_2 || data.figureurl_qq_1,
      provider: 'qq',
      gender: data.gender,
    };
  }
}
