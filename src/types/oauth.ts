import { GitHubProfileFields } from "../providers/github";
import { GoogleProfileFields } from "../providers/google";

export type OAuthProviderType = 'github' | 'google';

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

interface CommonUserProfile {
  id: string|number;
  name: string;
  account: string;
  email: string;
  avatar?: string | null;
  provider: string;
}

/**
 * 用户信息
 */
// 移除重复的GoogleProfileFields定义
export type UserProfile = CommonUserProfile & (Partial<GitHubProfileFields> | Partial<GoogleProfileFields>) & {
  [key: string]: any;
};

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
