# 墨迹博客 (Moji Blog)

基于 Next.js 15 构建的个人博客系统，支持富文本编辑、评论审核、多层级安全防护。

线上地址：[inklog.cn](https://www.inklog.cn)

## 功能特性

- **富文本编辑器** — 基于 Tiptap，支持图片上传/压缩/删除、代码高亮、链接校验
- **评论系统** — 邮箱验证码、两级嵌套回复、自动审核（管理员邮箱免审）、内容过滤
- **管理后台** — 文章 CRUD、分类/标签管理、评论审核、统计数据、个人设置（改密/改用户名）
- **阅读体验** — 阅读进度条、滚动渐入动画、⌘K 全局搜索、阅读时间估算、上一篇/下一篇导航
- **多层级安全** — JWT 签名认证、CSRF 防护、多层速率限制、账号锁定、内容敏感词过滤、XSS 防护
- **高性能渲染** — ISR 增量静态再生（首页 5min、文章页 5min）、图片自动压缩（sharp）
- **SEO 友好** — 动态 sitemap、meta 标签、搜索引擎爬虫 UA 白名单

## 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | Next.js 15 (App Router) |
| 语言 | TypeScript |
| 数据库 | SQLite + Prisma ORM |
| 样式 | Tailwind CSS v4 |
| 编辑器 | Tiptap v2 |
| 动画 | Framer Motion |
| 认证 | JWT + bcryptjs |
| 邮件 | Nodemailer (SMTP) |
| 内容安全 | DOMPurify + 自建关键词过滤 |
| 图片处理 | sharp |

## 快速开始

### 环境要求

- Node.js >= 20
- npm >= 10

### 安装

```bash
# 克隆仓库
git clone git@github.com:heibaome/blog.git
cd blog

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 填入实际值
```

### 环境变量

参考 `.env.example`：

| 变量 | 说明 |
|------|------|
| `DATABASE_URL` | SQLite 数据库路径，默认 `file:./dev.db` |
| `NEXT_PUBLIC_SITE_URL` | 站点 URL，如 `https://www.inklog.cn` |
| `JWT_SECRET` | JWT 签名密钥，64 字符随机字符串 |
| `IP_HASH_SALT` | IP 哈希盐值，32 字符随机字符串 |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` / `SMTP_FROM` | 邮件服务配置 |
| `SITE_SECRET` | 站点验证 Cookie 签名密钥，64 字符十六进制 |

### 开发

```bash
npm run dev          # 启动开发服务器 (Turbopack)
npm run db:push      # 同步数据库 schema
npm run db:generate  # 生成 Prisma 客户端
npm run db:seed      # 填充种子数据
npm run db:studio    # 打开 Prisma Studio
```

打开 http://localhost:3000 查看效果。

### 构建与部署

```bash
npm run build   # 生产构建
npm start       # 启动生产服务器 (监听 127.0.0.1)
```

## 项目结构

```
src/
├── app/                    # Next.js App Router
│   ├── (public)/          # 公开页面（首页/文章/归档/搜索）
│   ├── admin/             # 管理后台
│   ├── api/               # API 路由
│   └── disclaimer/        # 免责声明页
├── components/            # React 组件
│   ├── layout/           # 布局（Header/Footer）
│   ├── motion/           # 动画组件（滚动渐入/搜索面板/进度条）
│   ├── editor/           # 编辑器组件
│   ├── comment/          # 评论区组件
│   └── ui/               # 基础 UI 组件
├── lib/                   # 工具函数（认证/限速/过滤/邮件/CSRF）
├── modules/               # 业务逻辑服务（Post/Comment/Auth/Category/Tag）
├── shared/                # 共享类型、常量、数据库连接
├── hooks/                 # 自定义 Hooks
└── styles/                # 全局样式
```

详细架构说明见 [ARCHITECTURE.md](./ARCHITECTURE.md)。

## 部署

推荐使用 PM2 + Nginx 反向代理部署：

```bash
# PM2 管理
pm2 start ecosystem.config.js
pm2 save
pm2 startup

# Nginx 反向代理到 127.0.0.1:3000
# 配置 HTTPS (Let's Encrypt)
```

`.env.example` 已列出所有必需环境变量，部署时务必替换为真实值。

## 安全特性

| 层级 | 措施 |
|------|------|
| 传输层 | HTTPS + HSTS、Nginx 速率限制（登录 1r/s、通用 10r/s） |
| 应用层 | JWT 签名验证、CSRF 双 Cookie 令牌、API 速率限制 |
| 认证层 | bcrypt 密码哈希、账号锁定（5 次/30min）、邮箱验证码 |
| 内容层 | 敏感词过滤、链接/手机号/社媒拦截、DOMPurify XSS 防护 |
| 数据层 | IP 哈希匿名化、文件上传路径遍历防护、SQLite 注入防护（Prisma） |
| 运维层 | 空 UA 拦截、server_tokens off、上传大小限制 |

## 更新日志

详见 [CHANGELOG.md](./CHANGELOG.md)。
