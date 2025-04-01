import { OAuthHandler } from './oauth-handler';
import { AppConfigManager } from '../config/app-config';
import { OAuthService, OAuthProviderType } from '../services/oauth-service';

export class RouterHandler {
  private readonly appConfigManager: AppConfigManager;
  private readonly oauthService: OAuthService;
  private readonly oauthHandler: OAuthHandler;

  constructor(appConfigManager: AppConfigManager, oauthService: OAuthService) {
    this.appConfigManager = appConfigManager;
    this.oauthService = oauthService;
    this.oauthHandler = new OAuthHandler(oauthService);
  }

  /**
   * 获取OAuth处理程序实例
   * @returns OAuth处理程序实例
   */
  getOAuthHandler(): OAuthHandler {
    return this.oauthHandler;
  }

  /**
   * 处理请求
   * @param request 请求对象
   */
  async handleRequest(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // 获取所有应用的第一个作为默认应用
    const apps = this.appConfigManager.getAllApps();
    const defaultAppId = apps.length > 0 ? apps[0].id : 'main';

    // 处理 OPTIONS 预检请求
    if (request.method === 'OPTIONS') {
      const origin = request.headers.get('Origin');
      return new Response(null, {
        headers: this.appConfigManager.getCorsHeaders(defaultAppId, origin || undefined),
      });
    }

    // 解析路径，提取应用ID和提供商类型
    const result = this.parsePathname(pathname);
    if (!result) {
      const response = new Response('Not Found', { status: 404 });
      const origin = request.headers.get('Origin');
      // 为所有响应添加默认CORS头
      Object.entries(this.appConfigManager.getCorsHeaders(defaultAppId, origin || undefined)).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
      return response;
    }

    const { appId, providerType, action } = result;

    // 获取应用配置
    const appConfig = this.appConfigManager.getApp(appId);
    if (!appConfig) {
      const response = new Response(`Application not found: ${appId}`, { status: 404 });
      // 为所有响应添加默认CORS头
      Object.entries(this.appConfigManager.getCorsHeaders('default')).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
      return response;
    }

    // 获取CORS头
    const corsHeaders = this.appConfigManager.getCorsHeaders(appId);

    // 根据操作类型处理请求
    let response: Response;
    if (action === 'login') {
      response = await this.oauthHandler.handleLogin(appId, providerType as OAuthProviderType);
    } else if (action === 'callback') {
      response = await this.oauthHandler.handleCallback(request, appId, providerType as OAuthProviderType);
    } else {
      response = new Response('Invalid action', { status: 400 });
    }

    // 为响应添加CORS头
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  }

  /**
   * 解析路径
   * @param pathname 路径
   * @returns 解析结果，包含应用ID和提供商类型
   */
  private parsePathname(pathname: string): { appId: string; providerType: string; action: string } | null {
    // 多应用路径格式：/app/{appId}/login/{provider} 或 /app/{appId}/callback/{provider}

    if (pathname.startsWith('/app/')) {
      // 移除开头的 /app/
      const path = pathname.substring('/app/'.length);
      const parts = path.split('/');

      if (parts.length >= 3) {
        const appId = parts[0];
        const action = parts[1];
        const providerType = parts[2];

        if (action === 'login') {
          return { appId, providerType, action };
        } else if (action === 'callback') {
          return { appId, providerType, action: 'callback' };
        }
      }
    }

    return null;
  }
}
