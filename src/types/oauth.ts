/**
 * OAuth 提供商的配置接口
 */
export interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scope?: string[];
}

/**
 * OAuth 认证响应数据
 */
export interface OAuthTokenResponse {
  access_token: string;
  token_type: string;
  scope?: string;
}

/**
 * 用户信息接口
 */
export interface UserProfile {
  id: string;
  name: string;
  account: string;
  email?: string;
  avatar?: string;
  provider: string;
}

/**
 * OAuth 提供商接口
 */
export interface OAuthProvider {
  /**
   * 获取认证 URL
   * @param state 状态参数，用于防止 CSRF 攻击
   */
  getAuthorizationUrl(state: string): string;

  /**
   * 使用授权码获取访问令牌
   * @param code 授权码
   */
  getAccessToken(code: string): Promise<OAuthTokenResponse>;

  /**
   * 获取用户信息
   * @param accessToken 访问令牌
   */
  getUserProfile(accessToken: string): Promise<UserProfile>;
}