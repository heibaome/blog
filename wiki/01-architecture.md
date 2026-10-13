# 01 · 架构总览

> 🏠 [Wiki 首页](README.md) ｜ **当前：01 架构总览** ｜ 下一章 → [02-数据模型](02-data-model.md)

**本文包含**：[1. 技术分层](#1-技术分层) · [2. 目录结构](#2-目录结构) · [3. 请求流转](#3-请求流转) · [4. 渲染与缓存](#4-渲染与缓存策略) · [5. 安全架构](#5-安全架构) · [6. 国际化](#6-国际化i18n) · [7. 清理任务](#7-后台清理任务)

---

## 1. 技术分层

```mermaid
flowchart TB
    subgraph L1["🔒 Edge Middleware 层 (src/middleware.ts)"]
        direction LR
        MW1[CSRF 双重校验] --- MW2[JWT 验签·Web Crypto] --- MW3[CSP·防盗链] --- MW4[Locale 协商]
    end
    subgraph L2["页面层 src/app"]
        P1["(public)/ 前台<br/>服务端组件 + ISR"]
        P2["admin/ 后台<br/>客户端组件 + useAuth"]
        P3["api/ Route Handlers<br/>30 个 route.ts"]
    end
    subgraph L3["表现支撑层"]
        C1["components/ 布局·动效·评论·编辑器"]
        H1["hooks/ useAuth·useDebounce…"]
    end
    subgraph L4["业务层 src/modules"]
        S1["7 个领域 Service 类"]
    end
    subgraph L5["横切与共享层"]
        B1["lib/ 安全·限流·i18n·邮件·净化"]
        B2["shared/ db·errors·types·security…"]
    end
    subgraph L6["数据层"]
        D1[("Prisma 单例 → SQLite")]
    end
    L1 --> L2 --> L3 --> L4 --> L5 --> L6
    B2 -.被各层复用.-> L2 & L4 & B1
```

> 💡 分层铁律：**页面/路由 → Service → shared**，禁止页面直接操作 Prisma；唯一例外是 `api/stats` 等只读聚合直接使用 prisma 单例。

## 2. 目录结构

```
moji-blog/
├── prisma/
│   ├── schema.prisma          # 数据模型（13 个模型）→ 详见 02-数据模型
│   └── seed.ts                # 初始化管理员/分类/标签/示例文章
├── public/                    # 静态资源（favicon、manifest、OG 图）
├── src/
│   ├── middleware.ts          # 🔒 Edge 中间件（安全 + locale）
│   ├── app/
│   │   ├── (public)/          # 前台路由组（首页/归档/文章/分类/标签/搜索）
│   │   ├── admin/             # 后台（login/dashboard/posts/editor/…）
│   │   ├── api/               # API 路由 → 详见 04-API 参考
│   │   ├── layout.tsx         # 根布局 + 全局 Provider 链
│   │   └── page.tsx not-found.tsx robots.ts sitemap.ts
│   ├── components/            # → 详见 05-组件与 Hooks
│   ├── hooks/                 # 4 个自定义 Hook
│   ├── lib/                   # 横切工具 → 详见 06-工具库
│   ├── modules/               # 业务服务 → 详见 03-业务模块
│   ├── shared/                # 共享基础 → 详见 06-工具库
│   └── styles/globals.css     # Tailwind 4 + 水墨主题
├── next.config.ts             # rewrites: /uploads/* → /api/uploads/*
├── ecosystem.config.js        # PM2 配置（max_memory_restart 300M）
└── .env.example               # 环境变量模板 → 详见 08-运行与部署
```

## 3. 请求流转

### 3.1 页面请求（前台）

```mermaid
sequenceDiagram
    autonumber
    participant B as 浏览器
    participant MW as Edge Middleware
    participant RSC as RSC 渲染 (ISR 300s)
    participant C as 客户端水合

    B->>MW: GET /post/xxx
    MW->>MW: /admin/* ? JWT 验签(verifyTokenEdge)
    MW->>MW: 种站点验证 Cookie site_v (HMAC, 24h)
    MW->>MW: Cookie/Accept-Language → x-moji-locale 头
    MW->>RSC: 放行
    RSC-->>B: 缓存 HTML（300s 内直接命中）
    B->>C: 水合（Theme/Reading/Locale/Toast Providers）
    C->>C: 增强行为：ViewCounter 上报、TOC 高亮、ImageZoom
```

### 3.2 API 请求

```mermaid
sequenceDiagram
    autonumber
    participant B as 客户端
    participant MW as Edge Middleware
    participant H as Route Handler
    participant S as Service
    participant DB as SQLite

    B->>MW: POST /api/comments（带 x-csrf-token 头）
    MW->>MW: CSRF：自定义头 + Double-Submit Cookie 恒定时间比较
    alt 校验失败
        MW-->>B: 403 非法请求
    end
    MW->>H: 放行（响应强制 CSP: default-src 'none'）
    H->>H: rateLimit() 内存限流（按 IP）
    H->>H: zod schema.parse() 白名单校验
    H->>H: requireAuth()/requireAdmin()
    H->>S: 业务调用
    S->>DB: Prisma 查询
    H-->>B: successResponse / errorResponse
    Note over H: 写操作后 revalidatePostPages() 刷新 ISR 缓存
```

### 3.3 上传文件访问

```mermaid
flowchart LR
    B["GET /uploads/a.png"] --> MW{Middleware}
    MW -->|Referer ∈ inklog.cn| OK[放行]
    MW -->|UA ∈ 爬虫白名单| OK
    MW -->|都不满足| X["403 图片受保护页<br/>PROTECTED_IMAGE_HTML"]
    OK --> RW["rewrite → /api/uploads/a.png<br/>(next.config.ts)"]
```

> 💡 防盗链不依赖 Cookie，避免首次加载时 Cookie 时序问题导致图片裂图。

## 4. 渲染与缓存策略

| 页面 | 方式 | 缓存 |
|---|---|---|
| 首页 `/` | 服务端组件 | `revalidate = 300`（ISR） |
| 文章详情 `/post/[slug]` | 服务端组件 | `revalidate = 300` + `generateStaticParams` 预生成 |
| 归档/分类/标签 | 服务端组件 | ISR；搜索页动态 |
| robots.ts / sitemap.ts | Metadata Routes | sitemap 动态含已发布文章 |
| `/admin/*` | 客户端组件 | 不缓存 |

🔄 **缓存失效链路**：文章/分类/标签写操作 → [revalidatePostPages()](06-lib-shared.md#revalidatets) 刷新首页、归档页、新旧 slug 文章页及分类、标签页缓存。

## 5. 安全架构

### 5.1 认证与会话

```mermaid
flowchart TB
    Login["登录 POST /api/auth/login"] --> Captcha[图形验证码] --> RL[限流 5次/15min] --> Lock["账号锁定检查<br/>(IP + 用户名)"]
    Lock --> BC["bcrypt 验证"]
    BC -->|成功| Kick["🔒 单地登录<br/>blacklistAllUserTokens 踢旧会话"]
    Kick --> JWT["签发 JWT (3天)<br/>httpOnly Cookie moji_token"]
    JWT --> Edge["Edge 验签<br/>verifyTokenEdge (Web Crypto)"]
    JWT --> Node["Node 验签<br/>verifyToken + 黑名单检查"]
```

- **角色**：`admin / author / reader`；注册接口已关闭（403），账号由管理员后台创建 🔒
- **Token 黑名单**：登出拉黑 + 单地登录，存 `TokenBlacklist` 表（仅存 sha256 哈希）
- **密码**：bcrypt 12 轮

### 5.2 请求防护矩阵

| 机制 | 实现 | 位置 |
|---|---|---|
| 🔒 CSRF | 自定义头 + Double-Submit Cookie 恒定时间比较；仅非幂等方法 | [middleware.ts](file:///workspace/src/middleware.ts) `checkCsrf()` |
| 限流 | 内存 Map 固定窗口：login 5/15min · register 3/h · comment 5/min · general 30/min | [lib/ratelimit.ts](file:///workspace/src/lib/ratelimit.ts) |
| 账号锁定 | IP 级 5 次/15min + 用户名连续 5 次锁 30min | lib/account-lockout.ts |
| 图形验证码 | SVG 干扰线 + 一次性消费 | lib/captcha.ts |
| 邮箱验证码 | 6 位码 + 过期表；管理员敏感操作独立内存码 | lib/mailer.ts · lib/admin-email-codes.ts |
| 内容过滤 | 敏感词 / URL / 手机号 / 社交账号正则 | lib/content-filter.ts |
| 🔒 XSS | DOMPurify 白名单（正文/评论）+ SVG 专用净化 | lib/sanitize.ts · lib/sanitize-svg.ts |
| IP 隐私 | 评论仅存 `sha256(ip+salt)` 前 16 位 | shared/security.ts `hashIP()` |
| 🔒 防盗链 | Referer 白名单 + 爬虫 UA 白名单 | middleware.ts + shared/site-secret.ts |
| 🔒 CSP | API：`default-src 'none'`；页面因 ISR 不加 CSP，靠 sanitize 兜底 | middleware.ts |
| 🔒 SSRF | `images.remotePatterns: []` 禁远程图片优化 | next.config.ts |

### 5.3 上传安全（/api/upload）

类型白名单 → **魔数校验** → SVG 净化 → sharp 压缩 → 仅允许本站 `/uploads/` 路径入库（`postImageUrlSchema` 强约束）。

## 6. 国际化（i18n）

```mermaid
flowchart LR
    C["moji-locale Cookie"] --> R{解析}
    AL["Accept-Language"] --> R
    R -->|"middleware 注入 x-moji-locale"| SRV["服务端：i18n-server.getServerTranslations()"]
    R -->|"LocaleProvider"| CLI["客户端：Translated 组件 + t()"]
    SRV --> D["强类型词典 Translations<br/>zh-CN / en-US"]
    CLI --> D
    D --> DF["date-fns 本地化日期 (lib/date.ts)"]
```

## 7. 后台清理任务

[cleanup-registry.ts](file:///workspace/src/shared/cleanup-registry.ts) 提供命名定时任务注册表 `registerCleanup(name, fn, intervalMs)`：

| 任务 | 周期 | 目的 |
|---|---|---|
| ratelimit-cleanup | 60s | 清理过期限流条目 |
| view-dedup-cleanup | 60s | 清理浏览量去重窗口 |
| token 黑名单清理 | 定期 | 清理过期 token |

> 💡 设计目的：限流/去重均基于内存 Map，不注册清理会造成长期运行内存泄漏。

---

*⬅️ [Wiki 首页](README.md) ｜ ➡️ 下一章 [02-数据模型](02-data-model.md)*
