# 08 · 运行与部署

## 1. 环境要求

- Node.js ≥ 20（Next.js 15 要求）
- npm（或 pnpm/yarn）
- 无需外部数据库：默认 SQLite 文件数据库

## 2. 环境变量

复制 [.env.example](file:///workspace/.env.example) 为 `.env` 并修改：

| 变量 | 必填 | 说明 |
|---|---|---|
| `DATABASE_URL` | ✅ | SQLite 路径，默认 `file:./dev.db` |
| `JWT_SECRET` | ✅（生产必填，缺失启动抛错） | JWT 签名密钥，改成随机长字符串 |
| `IP_HASH_SALT` | ✅（生产必填） | 评论 IP 哈希盐 |
| `SITE_SECRET` | ✅ | 站点验证/免责声明 Cookie 的 HMAC 签名密钥（随机 hex） |
| `NEXT_PUBLIC_SITE_URL` | ✅ | 站点对外地址（SEO/sitemap 用） |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` / `SMTP_FROM` | 邮件功能需要 | SMTP 配置（如 QQ 邮箱 smtp.qq.com:465，PASS 为授权码） |

> 注意：`shared/constants.ts` 中站点域名硬编码为 `www.inklog.cn`（Referer 白名单、403 页），部署到其他域名需同步修改 `SITE_HOST` / `ALLOWED_SITE_HOSTS`。

## 3. 开发运行

```bash
npm install                 # 安装依赖

npm run db:generate         # 生成 Prisma Client
npm run db:push             # 同步 schema 到 SQLite（首次/改模型后）
npm run db:seed             # 写入种子数据（管理员/分类/标签/示例文章）

npm run dev                 # 启动开发服务器（Turbopack）
# 打开 http://localhost:3000
```

其他数据库命令：

```bash
npm run db:studio           # Prisma Studio 可视化管理
```

种子管理员账号见 `prisma/seed.ts`（用户名 `饕餮_adminheibao`，admin 角色）。**生产部署后请立即修改默认密码。**

后台入口：`http://localhost:3000/admin`（未登录自动跳转 `/admin/login`）。

## 4. 生产构建与启动

```bash
npm run build               # 生产构建（typescriptignoreBuildErrors=false，严格类型检查；ESLint 构建时忽略）
npm start                   # next start -H 127.0.0.1（仅监听本机，建议前置 Nginx）
```

## 5. PM2 部署（推荐）

[ecosystem.config.js](file:///workspace/ecosystem.config.js) 已内置：

```bash
pm2 start ecosystem.config.js
pm2 save
```

配置要点：
- `cwd: /home/blog/moji-blog`（按实际路径修改）
- `max_memory_restart: "300M"` 内存保护
- `listen_timeout: 10000` / `kill_timeout: 5000` 零停机滚动重启
- 指数退避重启（`exp_backoff_restart_delay: 200`）
- 日志合并 + 时间戳

## 6. Nginx 反向代理要点

应用监听 `127.0.0.1:3000`，Nginx 需正确转发头（代码依赖它们）：

```nginx
proxy_set_header Host $host;
proxy_set_header X-Real-IP $remote_addr;          # 限流/IP 哈希依赖，不可伪造
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;        # middleware 还原真实 origin
proxy_set_header X-Forwarded-Host $host;
```

- `client_max_body_size` 建议 ≥ 10m（上传限制）。
- Middleware 依赖 `x-real-ip` 作为可信客户端 IP（限流、浏览量去重、评论 IP 哈希）。

## 7. 生产检查清单

- [ ] `.env` 三个密钥（JWT_SECRET / IP_HASH_SALT / SITE_SECRET）均为随机值
- [ ] 修改 seed 管理员默认密码
- [ ] `shared/constants.ts` 站点域名与实际域名一致
- [ ] `NEXT_PUBLIC_SITE_URL` 配置正确（影响 SEO/sitemap/OG）
- [ ] SMTP 可用（评论邮箱验证与管理员敏感操作依赖邮件）
- [ ] `uploads/` 目录持久化（容器部署需挂载卷）
- [ ] SQLite 定期备份；并发/规模增长后可迁移 PostgreSQL（改 prisma provider）

## 8. 项目脚本速查

| 命令 | 说明 |
|---|---|
| `npm run dev` | 开发服务器（Turbopack 热更新） |
| `npm run build` / `npm start` | 生产构建 / 启动（127.0.0.1） |
| `npm run lint` | ESLint 检查 |
| `npm run db:generate` | 生成 Prisma Client |
| `npm run db:push` | schema 同步到数据库 |
| `npm run db:seed` | 运行种子脚本 |
| `npm run db:studio` | 数据库可视化管理 |

## 9. 常见问题

| 现象 | 原因 |
|---|---|
| 生产启动报 "JWT_SECRET environment variable is required" | 未配置环境密钥（security.ts / site-secret.ts 生产模式强制校验） |
| 图片 403 "图片受保护" | Referer 非站点域名且非爬虫 UA；经 Nginx 代理时未转发 Host 头 |
| API 返回 403 "非法请求" | CSRF 校验失败：写请求缺少 `x-requested-with: XMLHttpRequest` 或 `x-csrf-token` 与 `moji_csrf` Cookie 不匹配 |
| 登录提示锁定 | IP 级 15 分钟 5 次限流或用户名连续失败 5 次锁 30 分钟（内存态，重启进程可清） |
| 改了数据前台未更新 | ISR 缓存（300s）；管理端正常写操作会触发 `revalidatePostPages`，直接改库不会 |
