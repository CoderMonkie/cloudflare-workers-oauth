import type { OAuthConfig, OAuthProvider, OAuthProviderType } from '../types/oauth';
import { GitHubOAuthProvider } from '../providers/github';
import { GoogleOAuthProvider } from '../providers/google';

export class OAuthService {
  private providers: Map<string, OAuthProvider>;

  constructor() {
    this.providers = new Map();
  }

  /**
   * 注册 OAuth 提供商
   * @param type 提供商类型
   * @param config 提供商配置
   * @param providerId 提供商ID，用于区分不同应用的同类型提供商
   */
  registerProvider(type: OAuthProviderType, config: OAuthConfig, providerId?: string): void {
    const id = providerId || type;

    switch (type) {
      case 'github':
        this.providers.set(id, new GitHubOAuthProvider(config));
        break;
      case 'google':
        this.providers.set(id, new GoogleOAuthProvider(config));
        break;
      default:
        throw new Error(`Unsupported OAuth provider type: ${type}`);
    }
  }

  /**
   * 获取 OAuth 提供商实例
   * @param providerId 提供商ID
   */
  getProvider(providerId: string): OAuthProvider {
    const provider = this.providers.get(providerId);
    if (!provider) {
      throw new Error(`OAuth provider not registered: ${providerId}`);
    }
    return provider;
  }

  /**
   * 生成随机状态值
   */
  generateState(): string {
    return crypto.randomUUID();
  }
}
