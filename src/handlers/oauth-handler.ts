import { OAuthService } from '../services/oauth-service';
import type { OAuthProviderType } from '../types/oauth';

export class OAuthHandler {
  private readonly oauthService: OAuthService;
  private readonly appProviderMap: Map<string, Map<string, string>>;

  constructor(oauthService: OAuthService) {
    this.oauthService = oauthService;
    this.appProviderMap = new Map();
  }

  /**
   * 注册应用ID与提供商类型的映射
   * @param appId 应用ID
   * @param providerType 提供商类型
   * @param providerId 提供商ID
   */
  registerAppProvider(appId: string, providerType: OAuthProviderType, providerId: string): void {
    if (!this.appProviderMap.has(appId)) {
      this.appProviderMap.set(appId, new Map());
    }

    const providerMap = this.appProviderMap.get(appId);
    if (providerMap) {
      providerMap.set(providerType, providerId);
    }
  }

  /**
   * 获取应用的提供商ID
   * @param appId 应用ID
   * @param providerType 提供商类型
   * @returns 提供商ID
   */
  getProviderId(appId: string, providerType: OAuthProviderType): string | undefined {
    const providerMap = this.appProviderMap.get(appId);
    if (providerMap) {
      return providerMap.get(providerType);
    }
    return undefined;
  }

  /**
   * 处理登录请求
   * @param appId 应用ID
   * @param provider OAuth提供商类型
   */
  async handleLogin(appId: string, provider: OAuthProviderType): Promise<Response> {
    const state = this.oauthService.generateState();

    // 获取应用的提供商ID
    const providerId = this.getProviderId(appId, provider);
    if (!providerId) {
      return new Response(`Provider not found for app: ${appId}`, { status: 404 });
    }

    const oauthProvider = this.oauthService.getProvider(providerId);
    const authUrl = oauthProvider.getAuthorizationUrl(state);

    const headers = new Headers();
    headers.append('Location', authUrl);

    return new Response(null, {
      status: 302,
      headers,
    });
  }

  /**
   * 处理OAuth回调
   * @param request 请求对象
   * @param appId 应用ID
   * @param provider OAuth提供商类型
   */
  async handleCallback(request: Request, appId: string, provider: OAuthProviderType): Promise<Response> {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');

    if (!code || !state) {
      return new Response('Missing code or state', { status: 400 });
    }

    try {
      // 获取应用的提供商ID
      const providerId = this.getProviderId(appId, provider);
      if (!providerId) {
        return new Response(`Provider not found for app: ${appId}`, { status: 404 });
      }

      const oauthProvider = this.oauthService.getProvider(providerId);
      const tokenResponse = await oauthProvider.getAccessToken(code);
      const { access_token, token_type } = tokenResponse;
      const userProfile = await oauthProvider.getUserProfile(`${token_type} ${access_token}`);

      // 在用户资料中添加应用ID信息
      const enhancedUserProfile = {
        ...userProfile,
        appId
      };

      // 生成随机 nonce 值用于 CSP
      const nonce = crypto.randomUUID();

      return new Response(
        `<script nonce="${nonce}">
          window.opener.postMessage({eventType: 'oauth_success', token: "${access_token}", userProfile: ${JSON.stringify(enhancedUserProfile)}}, "*");
          window.close();
        </script>`,
        {
          headers: {
            "Content-Type": "text/html",
            // 修改 CSP 头，使用更宽松的设置允许内联脚本执行
            "Content-Security-Policy": `default-src 'self'; script-src 'self' 'unsafe-inline' 'nonce-${nonce}'`
          }
        }
      );
    } catch (error) {
      return new Response(error instanceof Error ? error.message : 'Authentication failed', {
        status: 500,
      });
    }
  }
}