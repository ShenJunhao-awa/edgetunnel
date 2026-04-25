# EdgeTunnel 增强版部署指南

## 概述

本指南介绍如何部署具有时间限制和用户管理功能的EdgeTunnel增强版。

## 部署步骤

### 1. 准备工作

在开始部署前，请确保：
- 已有Cloudflare账户
- 已准备好域名（可选）
- 了解基本的Cloudflare Workers操作

### 2. 创建KV命名空间

1. 登录 Cloudflare Dashboard
2. 进入 Workers & Pages -> KV
3. 点击 "Create namespace"
4. 命名空间名称建议设为 `USERS_KV`
5. 记下生成的命名空间ID

### 3. 部署到Cloudflare Workers

#### 方法一：使用Wrangler CLI（推荐）

1. 安装 Wrangler CLI：
```bash
npm install -g wrangler
```

2. 登录 Cloudflare：
```bash
wrangler login
```

3. 修改 `wrangler.toml` 文件，添加KV绑定：
```toml
[[kv_namespaces]]
binding = "USERS_KV"
id = "your-kv-namespace-id"
preview_id = "your-preview-kv-namespace-id"
```

4. 部署项目：
```bash
wrangler deploy
```

#### 方法二：通过Cloudflare Dashboard上传

1. 将 `_worker.js` 文件压缩成ZIP格式
2. 进入 Cloudflare Dashboard -> Workers & Pages
3. 点击 "Create application" -> "Create worker"
4. 在 "Settings" -> "KV namespace bindings" 中添加绑定：
   - Variable name: `USERS_KV`
   - KV namespace: 选择之前创建的命名空间
5. 在 "Quick edit" 中粘贴修改后的代码
6. 保存并部署

### 4. 配置环境变量

在Cloudflare Workers设置中配置以下环境变量：

- `ADMIN` 或 `PASSWORD`: 管理员密码
- `UUID`: 用户唯一标识符（建议使用标准UUID格式）

## 功能使用说明

### 1. 用户管理

#### 创建用户
通过管理API创建新用户：
```bash
curl -X POST https://your-worker.your-subdomain.workers.dev/admin/users/create \
  -H "Content-Type: application/json" \
  -d '{"userId": "student001", "days": 30}'
```

#### 用户续期
为现有用户延长使用时间：
```bash
curl -X POST https://your-worker.your-subdomain.workers.dev/admin/users/update \
  -H "Content-Type: application/json" \
  -d '{"userId": "student001", "days": 60}'
```

#### 查看用户列表
获取所有用户信息：
```bash
curl -X POST https://your-worker.your-subdomain.workers.dev/admin/users/list \
  -H "Content-Type: application/json" \
  -d '{}'
```

#### 删除用户
移除特定用户：
```bash
curl -X POST https://your-worker.your-subdomain.workers.dev/admin/users/delete \
  -H "Content-Type: application/json" \
  -d '{"userId": "student001"}'
```

### 2. 订阅访问控制

- 有效用户可以正常获取订阅内容
- 过期用户访问订阅链接时会收到403错误
- 订阅中的过期时间会根据用户实际到期时间动态更新

## 管理面板

增强版包含用户管理界面，可以通过以下方式访问：

1. 使用提供的 `user_management_panel.html` 文件作为前端
2. 直接通过API进行管理操作
3. 与原有的管理面板集成

## 安全注意事项

1. **保护管理员凭据**：确保管理员密码足够复杂
2. **定期备份**：定期导出用户数据以防丢失
3. **访问控制**：限制管理API的访问权限
4. **监控使用**：定期检查用户活动和系统日志

## 故障排除

### 常见问题

**Q: 用户创建成功但无法访问服务？**
A: 检查是否正确配置了USERS_KV命名空间，以及用户ID是否正确。

**Q: 过期用户仍能访问服务？**
A: 确认订阅链接是否被缓存，或者检查代码中是否正确实现了过期验证逻辑。

**Q: 管理API返回404错误？**
A: 确认管理员凭据和认证cookie是否正确。

### 日志检查

通过Cloudflare Dashboard的Workers日志功能检查运行状态和错误信息。

## 升级说明

如果从原版EdgeTunnel升级：
1. 备份现有配置
2. 部署增强版代码
3. 配置KV命名空间
4. 迁移现有用户（如有需要）

## 技术支持

如遇到部署或使用问题：
1. 检查Cloudflare Workers日志
2. 确认所有配置项正确
3. 参考官方文档
4. 社区寻求帮助

---
注意：此增强版仅供非商业用途，如教育或个人使用。