import { OAuthService } from './services/oauth-service';
import { AppConfigManager, AppEnv } from './config/app-config';
import { RouterHandler } from './handlers/router-handler';
import type { OAuthProviderType } from './types/oauth';

// 扩展Env接口以支持多应用配置
interface Env extends AppEnv {
  // 基础配置已在AppEnv中定义
}

// CORS配置将由AppConfigManager动态生成

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // 初始化应用配置管理器
    const configManager = AppConfigManager.initFromEnv(env, url.origin);

    // 初始化 OAuth 服务
    const oauthService = new OAuthService();

    // 创建RouterHandler
    const routerHandler = new RouterHandler(configManager, oauthService);

    // 获取OAuthHandler实例
    const oauthHandler = routerHandler.getOAuthHandler();

    // 注册所有应用的OAuth提供商
    configManager.getAllApps().forEach(appConfig => {
      Object.entries(appConfig.oauthProviders).forEach(([provider, config]) => {
        // 为每个应用的每个提供商生成唯一的提供商ID
        const providerId = `${appConfig.id}_${provider}`;

        // 注册OAuth提供商
        oauthService.registerProvider(provider as OAuthProviderType, config, providerId);

        // 在OAuthHandler中注册应用ID与提供商ID的映射
        oauthHandler.registerAppProvider(appConfig.id, provider as OAuthProviderType, providerId);
      });
    });

    // 使用RouterHandler处理请求
    return await routerHandler.handleRequest(request);
  }
} satisfies ExportedHandler<Env>;
