import type { OAuthConfig, OAuthProvider, OAuthTokenResponse, UserProfile } from '../types/oauth';

export interface GoogleProfileFields {
  sub: string;
  name: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  email: string;
  email_verified: boolean;
  locale?: string;
  hd?: string;
}

export class GoogleOAuthProvider implements OAuthProvider {
  private readonly config: OAuthConfig;
  private readonly authUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
  private readonly tokenUrl = 'https://oauth2.googleapis.com/token';
  private readonly userApiUrl = 'https://www.googleapis.com/oauth2/v3/userinfo';

  constructor(config: OAuthConfig) {
    this.config = {
      ...config,
      scope: config.scope || ['openid', 'profile', 'email'],
    };
  }

  getAuthorizationUrl(state: string): string {
    console.log('getAuthorizationUrl', this.config.redirectUri);
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      response_type: 'code',
      scope: this.config.scope?.join(' ') || '',
      state,
      access_type: 'offline',
      prompt: 'consent'
    });

    return `${this.authUrl}?${params.toString()}`;
  }

  async getAccessToken(code: string): Promise<OAuthTokenResponse> {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      code,
      redirect_uri: this.config.redirectUri,
      grant_type: 'authorization_code'
    });

    try {
      const response = await fetch(this.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
          'Accept': 'application/json',
        },
        body: JSON.stringify(params),
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
    const response = await fetch(this.userApiUrl, {
      headers: {
        'Authorization': `Bearer ${tokenResponse.access_token!}`,
        'Accept': 'application/json; charset=utf-8',
        'Content-Type': 'application/json; charset=utf-8'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to get user profile: ${response.statusText}`);
    }

    const data = await response.json() as GoogleProfileFields;
    return {
      id: data.sub,
      account: data.email,
      name: data.name,
      email: data.email,
      avatar: data.picture,
      provider: 'google',
      email_verified: data.email_verified,
      given_name: data.given_name,
      family_name: data.family_name,
      locale: data.locale,
      hd: data.hd
    };
  }
}
