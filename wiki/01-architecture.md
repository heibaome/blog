# 01 · 架构总览

## 1. 技术分层

```
┌────────────────────────────────────────────────────────────┐
│  Edge Middleware (src/middleware.ts)                       │
│  CSRF 校验 · JWT 签名校验(Web Crypto) · CSP · 防盗链 · Locale│
├────────────────────────────────────────────────────────────┤
│  页面层  src/app                                            │
│  ├── (public)/  前台页面（服务端组件 + ISR revalidate=300）   │
│  ├── admin/     管理后台（客户端组件 + useAuth）             │
│  └── api/       Route Handlers（30 个 route.ts）            │
├────────────────────────────────────────────────────────────┤
│  组件层  src/components（布局/动画/评论/编辑器/主题/阅读…）    │
│  Hooks 层 src/hooks（useAuth/useDebounce/useScrollLock…）   │
├────────────────────────────────────────────────────────────┤
│  业务层  src/modules（AuthService/PostService/… 7 个领域）   │
├────────────────────────────────────────────────────────────┤
│  横切层  src/lib（安全/限流/i18n/邮件/净化/SEO）              │
│  共享层  src/shared（db/errors/types/security/constants…）  │
├────────────────────────────────────────────────────────────┤
│  数据层  Prisma Client（src/shared/db.ts 全局单例） → SQLite │
└────────────────────────────────────────────────────────────┘
```

## 2. 目录结构

```
moji-blog/
├── prisma/
│   ├── schema.prisma          # 数据模型（13 个模型）
│   └── seed.ts                # 初始化管理员/分类/标签/示例文章
├── public/                    # 静态资源（favicon、manifest、OG 图）
├── src/
│   ├── middleware.ts          # Edge 中间件（安全 + locale）
│   ├── app/
│   │   ├── (public)/          # 前台路由组
│   │   │   ├── about/ archive/ search/
│   │   │   ├── category/[slug]/ tag/[slug]/
│   │   │   └── post/[slug]/   # 文章详情（ISR + generateStaticParams）
│   │   ├── admin/             # 后台（login/dashboard/posts/editor/…）
│   │   ├── api/               # API 路由（auth/posts/comments/…）
│   │   ├── layout.tsx         # 根布局 + 全局 Provider
│   │   ├── page.tsx           # 首页（ISR 300s）
│   │   ├── not-found.tsx robots.ts sitemap.ts
│   ├── components/            # 见 05-组件与 Hooks
│   ├── hooks/                 # useAuth/useDebounce/useEscapeKey/useScrollLock
│   ├── lib/                   # 横切工具（见 06）
│   ├── modules/               # 业务服务（见 03）
│   ├── shared/                # 共享基础（见 06）
│   └── styles/globals.css     # Tailwind + 水墨主题样式
├── next.config.ts             # rewrites: /uploads/* → /api/uploads/*
├── ecosystem.config.js        # PM2 部署配置（max_memory_restart 300M）
└── .env.example               # 环境变量模板
```

## 3. 请求流转

### 3.1 页面请求（前台）

```
浏览器 → Edge Middleware
          ├─ 非 /api、非 /uploads：种站点验证 Cookie（site_v，HMAC 签名）
          ├─ 解析 moji-locale Cookie / Accept-Language → 注入 x-moji-locale 响应头
          └─ /admin/*：Edge 端 verifyTokenEdge() 校验 JWT（HMAC-SHA256，Web Crypto）
       → RSC 渲染（ISR 缓存 300s）
       → 客户端水合（ThemeProvider/ReadingProvider/LocaleProvider/ToastProvider）
       → 客户端增强（ViewCounter 上报浏览量、TableOfContents、ImageZoom 等）
```

### 3.2 API 请求

```
客户端（fetch 带 x-requested-with: XMLHttpRequest + x-csrf-token）
  → Middleware：
      ├─ 非幂等方法校验 CSRF（自定义头 + Double-Submit Cookie 恒定时间比较）
      └─ API 响应强制 CSP: default-src 'none'
  → Route Handler：
      ├─ rateLimit()（内存限流，按 IP）
      ├─ zod schema.parse() 白名单校验
      ├─ requireAuth()/requireAdmin()（JWT Cookie → Prisma 查用户）
      ├─ 调用 modules/*Service 业务方法
      └─ 写操作后 revalidatePostPages() 刷新 ISR 缓存
  → errorResponse()/successResponse() 统一响应
```

### 3.3 上传文件访问

```
/uploads/<file> ──rewrite(next.config.ts)──► /api/uploads/<file>
       ▲
Middleware 先行拦截：Referer 属于 inklog.cn 或爬虫 UA 白名单才放行，
否则返回 403 PROTECTED_IMAGE_HTML（"图片受保护"页）。
```

## 4. 渲染与缓存策略

| 页面 | 方式 | 缓存 |
|---|---|---|
| 首页 `/` | 服务端组件 | `revalidate = 300`（ISR） |
| 文章详情 `/post/[slug]` | 服务端组件 | `revalidate = 300` + `generateStaticParams` 预生成 |
| 归档/分类/标签/搜索 | 服务端组件 | 分类/标签页 ISR；搜索页动态 |
| robots.ts / sitemap.ts | Metadata Routes | sitemap 查询已发布文章动态生成 |
| `/admin/*` | 客户端组件 | 不缓存 |

文章/分类/标签写操作通过 `revalidatePostPages()`（lib/revalidate.ts）刷新首页、归档页、当前/旧 slug 文章页及分类、标签页缓存。

## 5. 安全架构

### 5.1 认证与会话

- **JWT**：`createToken()`（shared/security.ts）签发 `{userId, role}`，有效期 3 天，存 httpOnly Cookie `moji_token`。
- **Edge 校验**：middleware 中 `verifyTokenEdge()` 用 Web Crypto 重实现 HMAC-SHA256 验签 + 过期 + 必需字段校验（恒定时间比较），不依赖 Node API。
- **Token 黑名单**：lib/token-blacklist.ts 存入 `TokenBlacklist` 表（tokenHash）。登出加入黑名单；登录时 `blacklistAllUserTokens()` 实现"单地登录"踢掉旧会话。
- **角色**：`admin` / `author` / `reader`（types.ts `AuthUser`）。注册接口已关闭（403），账号由后台管理；写文章等管理操作要求 `requireAdmin()`。
- **密码**：bcrypt 12 轮哈希。

### 5.2 请求防护

| 机制 | 实现 | 位置 |
|---|---|---|
| CSRF | `x-requested-with` 头 + Double-Submit Cookie（`moji_csrf`）恒定时间比较；仅非幂等方法 | middleware.ts `checkCsrf()` |
| 限流 | 内存 Map 窗口计数，预设 login(5/15min)、register(3/h)、comment(5/min)、general(30/min) | lib/ratelimit.ts |
| 账号锁定 | IP 级 15 分钟 5 次 + 用户名级连续失败 5 次锁 30 分钟 | lib/account-lockout.ts |
| 图形验证码 | SVG 干扰线/噪点生成，`Captcha` 表存储，一次性消费 | lib/captcha.ts |
| 邮箱验证码 | 6 位码 + `EmailVerification` 表；管理员敏感操作用 `adminEmailCodes`（内存） | lib/mailer.ts、lib/admin-email-codes.ts |
| 内容过滤 | 敏感词、URL、手机号、社交账号（微信/QQ/微博/抖音等）正则检测 | lib/content-filter.ts |
| XSS | DOMPurify 白名单净化正文/评论（sanitizeHtml/validateAndSanitizeComment）、SVG 专用净化 | lib/sanitize.ts、lib/sanitize-svg.ts |
| IP 隐私 | 评论只存 `sha256(ip + IP_HASH_SALT)` 前 16 位 | shared/security.ts `hashIP()` |
| 图片防盗链 | Referer 域名白名单 + 搜索引擎/微信爬虫 UA 白名单 | middleware.ts + shared/site-secret.ts `isAllowedCrawler()` |
| CSP | API 路由 `default-src 'none'`；页面路由因 ISR 不加 CSP，靠 sanitize 白名单兜底 | middleware.ts |
| SSRF | `next.config.ts` `images.remotePatterns: []` 禁止远程图片优化 | next.config.ts |

### 5.3 上传安全（/api/upload）

类型白名单（JPEG/PNG/WebP/GIF/SVG）+ 文件魔数（magic number）校验 + SVG 经 `sanitizeSvg()` 净化 + sharp 处理/压缩；仅允许本站 `/uploads/` 路径关联到文章（`postImageUrlSchema` 强约束）。

## 6. 国际化（i18n）

- 词典：lib/i18n.ts 内置 zh-CN / en-US 两份 `Translations`（强类型 key）。
- 服务端：middleware 注入 `x-moji-locale` → lib/i18n-server.ts `getServerLocale()/getServerTranslations()`。
- 客户端：LocaleProvider + `Translated` 组件；解析顺序 Cookie(`moji-locale`) → Accept-Language → 默认 zh-CN。
- 日期格式化：lib/date.ts 基于 date-fns 按语言输出。

## 7. 后台清理任务

shared/cleanup-registry.ts 提供命名定时清理注册表：限流存储（60s）、浏览量去重存储（60s）、验证码/黑名单过期数据等由各模块 `registerCleanup(name, fn, intervalMs)` 自行注册，避免内存泄漏。
