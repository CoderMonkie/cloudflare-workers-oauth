/**
 * 应用配置管理器
 * 用于管理不同应用的OAuth配置
 */

import type { OAuthConfig } from '../types/oauth';

// 应用配置接口
export interface AppConfig {
  id: string;
  name: string;
  allowedOrigins: string[];
  oauthProviders: {
    [key: string]: OAuthConfig;
  };
}

// 环境变量接口
export interface AppEnv {
  // PalmWriter的GitHub OAuth配置
  PALMDOCS_GITHUB_CLIENT_ID: string;
  PALMDOCS_GITHUB_CLIENT_SECRET: string;
  PALMDOCS_GOOGLE_CLIENT_ID: string;
  PALMDOCS_GOOGLE_CLIENT_SECRET: string;
  PALMDOCS_DINGTALK_CLIENT_ID: string;
  PALMDOCS_DINGTALK_CLIENT_SECRET: string;
  PALMDOCS_QQ_CLIENT_ID: string;
  PALMDOCS_QQ_CLIENT_SECRET: string;
  PALMDOCS_GITEE_CLIENT_ID: string;
  PALMDOCS_GITEE_CLIENT_SECRET: string;

  // 应用1的GitHub OAuth配置
  APP1_GITHUB_CLIENT_ID?: string;
  APP1_GITHUB_CLIENT_SECRET?: string;

  // 应用2的GitHub OAuth配置
  APP2_GITHUB_CLIENT_ID?: string;
  APP2_GITHUB_CLIENT_SECRET?: string;

  // 可以根据需要添加更多应用的配置
}

export class AppConfigManager {
  private apps: Map<string, AppConfig>;

  constructor() {
    this.apps = new Map();
  }

  /**
   * 注册应用配置
   * @param appConfig 应用配置
   */
  registerApp(appConfig: AppConfig): void {
    this.apps.set(appConfig.id, appConfig);
  }

  /**
   * 获取应用配置
   * @param appId 应用ID
   */
  getApp(appId: string): AppConfig | undefined {
    return this.apps.get(appId);
  }

  /**
   * 获取所有应用配置
   */
  getAllApps(): AppConfig[] {
    return Array.from(this.apps.values());
  }

  /**
   * 从环境变量初始化应用配置
   * @param env 环境变量
   * @param origin 请求来源
   */
  static initFromEnv(env: AppEnv, origin: string): AppConfigManager {
    const manager = new AppConfigManager();

    // 注册应用1
    if (env.APP1_GITHUB_CLIENT_ID && env.APP1_GITHUB_CLIENT_SECRET) {
      manager.registerApp({
        id: 'app1',
        name: 'Application 1',
        allowedOrigins: ['http://localhost:3000'], // 应用1的允许来源
        oauthProviders: {
          github: {
            clientId: env.APP1_GITHUB_CLIENT_ID,
            clientSecret: env.APP1_GITHUB_CLIENT_SECRET,
            redirectUri: `${origin}/app/app1/callback/github`,
          }
        }
      });
    }

    // 注册应用1
    if (env.APP1_GITHUB_CLIENT_ID && env.APP1_GITHUB_CLIENT_SECRET) {
      manager.registerApp({
        id: 'app1',
        name: 'Application 1',
        allowedOrigins: ['http://localhost:3000'], // 应用1的允许来源
        oauthProviders: {
          github: {
            clientId: env.APP1_GITHUB_CLIENT_ID,
            clientSecret: env.APP1_GITHUB_CLIENT_SECRET,
            redirectUri: `${origin}/app/app1/callback/github`,
          }
        }
      });
    }

    // 注册应用2
    if (env.APP2_GITHUB_CLIENT_ID && env.APP2_GITHUB_CLIENT_SECRET) {
      manager.registerApp({
        id: 'app2',
        name: 'Application 2',
        allowedOrigins: ['http://localhost:8080'], // 应用2的允许来源
        oauthProviders: {
          github: {
            clientId: env.APP2_GITHUB_CLIENT_ID,
            clientSecret: env.APP2_GITHUB_CLIENT_SECRET,
            redirectUri: `${origin}/app/app2/callback/github`,
          }
        }
      });
    }

    // 注册PalmWriter应用
    if (env.PALMDOCS_GITHUB_CLIENT_ID && env.PALMDOCS_GITHUB_CLIENT_SECRET) {
      manager.registerApp({
        id: 'palmdocs',
        name: 'Palm Docs',
        allowedOrigins: ['http://localhost:5180', 'http://localhost:4173', 'http://127.0.0.1:8787', 'https://palmdocs.gocheers.fun'],
        oauthProviders: {
          github: {
            clientId: env.PALMDOCS_GITHUB_CLIENT_ID,
            clientSecret: env.PALMDOCS_GITHUB_CLIENT_SECRET,
            redirectUri: `${origin}/app/palmdocs/callback/github`,
          },
          google: {
            clientId: env.PALMDOCS_GOOGLE_CLIENT_ID,
            clientSecret: env.PALMDOCS_GOOGLE_CLIENT_SECRET,
            redirectUri: `${origin}/app/palmdocs/callback/google`,
          },
          dingtalk: {
            clientId: env.PALMDOCS_DINGTALK_CLIENT_ID,
            clientSecret: env.PALMDOCS_DINGTALK_CLIENT_SECRET,
            redirectUri: `${origin}/app/palmdocs/callback/dingtalk`,
            scope: ['Contact.User.mobile', 'Contact.User.Read'],
          },
          qq: {
            clientId: env.PALMDOCS_QQ_CLIENT_ID,
            clientSecret: env.PALMDOCS_QQ_CLIENT_SECRET,
            redirectUri: `${origin}/app/palmdocs/callback/qq`,
            scope: ['get_user_info'],
          },
          gitee: {
            clientId: env.PALMDOCS_GITEE_CLIENT_ID,
            clientSecret: env.PALMDOCS_GITEE_CLIENT_SECRET,
            redirectUri: `${origin}/app/palmdocs/callback/gitee`,
            // 添加 emails scope 以获取邮箱权限
            scope: ['user_info', 'emails'],
          },
        }
      });
    }

    return manager;
  }

  /**
   * 获取CORS头
   * @param appId 应用ID
   * @param requestOrigin 请求来源
   */
  getCorsHeaders(appId: string, requestOrigin?: string): Record<string, string> {
    const app = this.getApp(appId);
    if (!app) {
      // 默认CORS头
      return {
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, Cookie',
        'Access-Control-Allow-Credentials': 'true',
				// "Content-Security-Policy": "default-src 'self'; script-src 'self' 'unsafe-inline'",
				// "X-Content-Type-Options": "nosniff",
				"Referrer-Policy": "strict-origin-when-cross-origin",
      };
    }

    // 如果提供了请求来源，检查是否在允许的来源列表中
    if (requestOrigin && app.allowedOrigins.includes(requestOrigin)) {
      return {
        'Access-Control-Allow-Origin': requestOrigin,
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, Cookie',
        'Access-Control-Allow-Credentials': 'true',
				"Content-Security-Policy": "default-src 'self'; script-src 'self' 'unsafe-inline'",
				"X-Content-Type-Options": "nosniff",
				"Referrer-Policy": "strict-origin-when-cross-origin",
      };
    }

    // 根据应用配置生成CORS头
    return {
      'Access-Control-Allow-Origin': app.allowedOrigins.join(','),
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, Cookie',
      'Access-Control-Allow-Credentials': 'true',
				"Content-Security-Policy": "default-src 'self'; script-src 'self' 'unsafe-inline'",
			"X-Content-Type-Options": "nosniff",
			"Referrer-Policy": "strict-origin-when-cross-origin",
    };
  }
}
