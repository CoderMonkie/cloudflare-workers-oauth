import type { OAuthConfig, OAuthTokenResponse, CommonUserProfile, OAuthProvider } from '../types/oauth';


export interface DingTalkProfileFields {
  unionId: string;
  name: string;
  mobile: string;
  stateCode: string;
  avatarUrl: string;
}

export class DingTalkOAuthProvider implements OAuthProvider {
  private config: OAuthConfig;

  constructor(config: OAuthConfig) {
    this.config = config;
  }

  getAuthorizationUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      response_type: 'code',
      scope: this.config.scope?.join(' ') || '',
      state: state,
    });
    return `https://login.dingtalk.com/oauth2/auth?${params}`;
  }

  async getAccessToken(code: string): Promise<OAuthTokenResponse> {
    const response = await fetch('https://api.dingtalk.com/v1.0/oauth2/userAccessToken', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        clientId: this.config.clientId,
        clientSecret: this.config.clientSecret,
        code: code,
        grantType: 'authorization_code',
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(`Failed to exchange token: ${response.status} ${response.statusText} ${JSON.stringify(errorData)}`);
    }

    return response.json();
  }

  async getUserProfile(tokenResponse: OAuthTokenResponse): Promise<CommonUserProfile> {
    // 从 tokenResponse 中提取 accessToken
    const accessToken = tokenResponse.accessToken || tokenResponse.access_token;

    if (!accessToken) {
      throw new Error('Access token not found in token response');
    }

    const response = await fetch('https://api.dingtalk.com/v1.0/contact/users/me', {
      headers: {
        'x-acs-dingtalk-access-token': accessToken,
        'Accept': 'application/json'
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(`Failed to get user info: ${response.status} ${response.statusText} ${JSON.stringify(errorData)}`);
    }

    const data = await response.json() as DingTalkProfileFields;
    console.log('dingtalk', data);

    return {
      provider: 'dingtalk',
      id: data.unionId,
      name: data.name,
      account: data.mobile,
      email: data.stateCode === '86' ? data.mobile + '@dingtalk.com' : '',
      avatar: data.avatarUrl
    };
  }
}
