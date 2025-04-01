# 部署指南

本文档提供了如何安全部署 Cloudflare Workers OAuth 服务的详细说明，特别是关于如何正确处理敏感信息。

## 敏感信息处理

在 Cloudflare Workers 中，有两种方式存储配置信息：

1. **环境变量 (vars)** - 存储在 `wrangler.jsonc` 中，适合非敏感信息
2. **Secrets** - 通过 Wrangler CLI 设置，适合敏感信息

### 安全最佳实践

- **Client ID** 通常不被视为高度敏感信息，可以存储在 `vars` 中
- **Client Secret** 和其他敏感凭据必须使用 `secrets` 存储

## 设置 Secrets

使用以下命令设置敏感信息作为 secrets：

```bash
# 设置默认应用的 GitHub Client Secret
npx wrangler secret put GITHUB_CLIENT_SECRET

# 如果有多个应用，设置应用特定的 secrets
npx wrangler secret put APP1_GITHUB_CLIENT_SECRET
npx wrangler secret put APP2_GITHUB_CLIENT_SECRET
```

执行命令后，Wrangler 会提示你输入对应的值。这些值不会存储在代码库中，而是安全地存储在 Cloudflare 的服务器上。

## 设置环境变量

在 `wrangler.jsonc` 中设置非敏感的环境变量：

```json
"vars": {
  "APP1_GITHUB_CLIENT_ID": "your-app1-github-client-id",
  "APP2_GITHUB_CLIENT_ID": "your-app2-github-client-id"
}
```

## 本地开发

对于本地开发，可以使用 `.dev.vars` 文件存储所有环境变量（包括敏感信息）：

```secret
APP1_GITHUB_CLIENT_ID=your-app1-github-client-id
APP1_GITHUB_CLIENT_SECRET=your-app1-github-client-secret
```

**注意**：确保 `.dev.vars` 文件已添加到 `.gitignore` 中，避免敏感信息被提交到代码库。

## 部署流程

1. 确保所有敏感信息已使用 `wrangler secret put` 命令设置
2. 在 `wrangler.jsonc` 中配置非敏感的环境变量
3. 执行部署命令：
   ```bash
   npm run deploy
   ```

## 验证部署

部署后，可以通过以下方式验证配置是否正确：

1. 在 Cloudflare Dashboard 中查看 Worker 的环境变量和 secrets
2. 测试 OAuth 流程，确保认证正常工作

## 故障排除

如果遇到与环境变量或 secrets 相关的问题：

1. 确认所有必需的 secrets 已正确设置
2. 检查 `wrangler.jsonc` 中的环境变量配置
3. 查看 Cloudflare Workers 日志以获取更多信息