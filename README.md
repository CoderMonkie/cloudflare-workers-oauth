# Cloudflare Workers OAuth 多应用支持服务

这是一个基于 Cloudflare Workers 的 OAuth 认证服务，支持多个应用使用不同的 OAuth 配置。

## 线上应用示例

应用：[Palm Docs](https://palmdocs.gocheers.fun)

这里约定给 workers 区分应用的编码为`palmdocs`，所以：

- Github登录的地址为：https://oauth.gocheers.fun/app/palmdocs/login/github
- Google登录地址为：https://oauth.gocheers.fun/app/palmdocs/login/google

> 其中域名为我自己的域名，你如果没有绑定域名，默认就是 cloudflare 分配的域名，它的地址格式是 `https://your-worker-name.your-CF-user-name.workers.dev`

## 功能特点

- 支持多个应用使用不同的 OAuth 提供商配置
- 支持 GitHub OAuth 认证（可扩展支持其他提供商）
- 基于 Cloudflare Workers，无需服务器
- 简单的 URL 路由格式

## URL 路由格式

URL 路由格式如下：

- 登录：`/app/{appId}/login/{provider}`
- 回调：`/app/{appId}/callback/{provider}`

其中：
- `{appId}` 是应用ID，如 `app1`, `app2` 等
- `{provider}` 是OAuth提供商类型，目前支持 `github`

## 环境变量配置

在 `wrangler.jsonc` 中配置以下环境变量：

```json
{
  "vars": {

    // 应用1的GitHub OAuth配置
    "APP1_GITHUB_CLIENT_ID": "your-app1-github-client-id",

    // 应用2的GitHub OAuth配置
    "APP2_GITHUB_CLIENT_ID": "your-app2-github-client-id",
  }
}
```

## 密钥配置

使用以下命令设置敏感信息作为 secrets：
```bash
wrangler secret put APP1_GITHUB_CLIENT_SECRET
# 然后等待提示输入密钥值
wrangler secret put APP2_GITHUB_CLIENT_SECRET
# 然后等待提示输入密钥值
```
通过以上命令，与在 CloudFlare 页面操作中添加是一样的效果，`wrangler`会自动将密钥值加密后存储在Cloudflare上。

## 使用方法

1. 在前端应用中，使用以下 URL 进行 OAuth 登录：

```javascript
const width = 640,
  height = 800;
const left = screen.width / 2 - width / 2;
const top = screen.height / 2 - height / 2;
window.open(
  `https://your-worker-domain.workers.dev/app/app1/login/github`,
  'OAuth Login',
  `toolbar=no,menubar=no,width=${width},height=${height},top=${top},left=${left}`
);
```

2. 在调`window.open`的页面中，接收OAuth认证结果：

```javascript
window.addEventListener('message', (event) => {
  const { token, userProfile } = event.data;
  // 处理认证结果
  console.log('Token:', token);
  console.log('User Profile:', userProfile);
});
```

## 自定义配置

可以在 `app-config.ts` 文件中修改应用配置，包括允许的来源、重定向URI等。

## 开发与部署

0. 将本项目 fork 到自己的 GitHub 仓库，然后将项目 clone 到本地。

1. 安装依赖：

```bash
npm install
```

2. 本地开发：

> 可将密钥配置倒`.dev.vars`文件中，此文件仅存在本地，不会被提交到代码库。
如：

```bash
APP1_GITHUB_CLIENT_SECRET=your-app1-github-client-secret
```

然后在终端中执行：

```bash
npm run dev
```

这样本地运行就有完整的环境变量了。

3. 部署到Cloudflare Workers：

```bash
npm run deploy
```

如果本仓库对你有所帮助，麻烦给个 Star 支持一下。
