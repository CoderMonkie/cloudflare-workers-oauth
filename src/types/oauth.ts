import { GitHubProfileFields } from "../providers/github";
import { GoogleProfileFields } from "../providers/google";
import { DingTalkProfileFields } from "../providers/dingtalk";
import { GiteeProfileFields } from "../providers/gitee";

export type OAuthProviderType = 'github' | 'google' | 'dingtalk' | 'qq' | 'gitee';

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
 * 各平台 OAuth 认证响应数据
 */
export interface GitHubOAuthTokenResponse {
  access_token: string;
  token_type: string;
  scope?: string;
}

export interface GoogleOAuthTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  token_type: string;
  scope?: string;
}

export interface DingTalkOAuthTokenResponse {
  accessToken: string;
  expireIn: number;
  refreshToken?: string;
}

export interface QQOAuthTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
}

export interface GiteeOAuthTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope?: string;
  created_at: number;
}

/**
 * OAuth 认证响应数据联合类型
 */
export type OAuthTokenResponse = Partial<GitHubOAuthTokenResponse> & Partial<GoogleOAuthTokenResponse> & Partial<DingTalkOAuthTokenResponse> & Partial<QQOAuthTokenResponse> & Partial<GiteeOAuthTokenResponse>;

export interface CommonUserProfile {
  id: string | number;
  name: string;
  account: string;
  email: string;
  avatar?: string | null;
  provider: string;
}

/**
 * 用户信息
 */
export type UserProfile = CommonUserProfile & (Partial<GitHubProfileFields> | Partial<GoogleProfileFields> | Partial<DingTalkProfileFields> | Partial<GiteeProfileFields>) & {
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
   * @param tokenResponse 访问令牌响应
   */
  getUserProfile(tokenResponse: OAuthTokenResponse): Promise<UserProfile>;
}
