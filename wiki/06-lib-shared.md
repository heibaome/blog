# 06 · 工具库与共享层（src/lib、src/shared）

## 一、shared/ —— 共享基础层

### db.ts
`export const prisma`：PrismaClient **全局单例**；非生产环境挂到 `globalThis`，避免 dev 热重载重复建连接。全项目唯一数据库入口。

### errors.ts
| 导出 | 说明 |
|---|---|
| `class AppError` | `new AppError(message, statusCode=400, code?)`，业务错误基类 |
| `errorResponse(error)` | 统一错误响应：duck-typing 识别 AppError（避免跨 chunk instanceof 失效）、ZodError→400、P2003→409、其他 P 开头→500、Error→400、未知→500 |
| `successResponse(data, status=200)` | `{data}` 包装 |

### types.ts
Zod schema 单一事实源（页面/路由/服务共用）：
`createPostSchema`（slug 仅小写字母数字连字符、status 枚举 draft/published/archived）、`updatePostSchema`（partial）、`createCommentSchema`（昵称≤10 字符禁特殊字符、邮箱限 qq/gmail/163）、`loginSchema`、`registerSchema`、`updateProfileSchema`（strict）、`updateUsernameSchema`/`updatePasswordSchema`/`updateCredentialsSchema`（discriminatedUnion）、`createTagSchema`、`createCategorySchema`、`postImageUrlSchema`（必须 `/uploads/` 前缀）、`reorderImagesSchema`、`paginationSchema`（page≥1、pageSize≤100 默认 12）及其 `z.infer` 类型；`AuthUser` 接口。

### security.ts（鉴权与密码核心）
| 函数 | 说明 |
|---|---|
| `hashPassword(password)` / `verifyPassword(password, hashed)` | bcryptjs，12 轮 |
| `createToken({userId, role})` | jsonwebtoken 签发，**有效期 3 天**；生产缺失 `JWT_SECRET` 直接抛错 |
| `verifyToken(token)` | 验签，失败抛 `AppError("无效的认证令牌", 401)` |
| `setAuthCookie(token)` / `clearAuthCookie()` / `getTokenFromCookie()` | httpOnly Cookie `moji_token`，3 天，sameSite lax |
| `getCurrentUser()` | 读 Cookie → 查 Token 黑名单 → 验签 → Prisma 查用户（仅 id/username/email/role/avatar） |
| `requireAuth()` / `requireAdmin()` | 未登录 401 / 非 admin 403 |
| `hashIP(ip)` | `sha256(ip + IP_HASH_SALT)` 前 16 位，评论隐私保护 |
| `blacklistToken` | re-export |

### constants.ts
`SITE_HOST="www.inklog.cn"`、`ALLOWED_SITE_HOSTS`（含非 www）、`ALLOWED_EMAIL_DOMAINS`（qq/gmail/163）、`TOKEN_NAME="moji_token"`、`CSRF_COOKIE="moji_csrf"`、`CSRF_HEADER="x-csrf-token"`、`DISCLAIMER_CLIENT_COOKIE="disc_ok"`、`PROTECTED_IMAGE_HTML`（防盗链 403 页）。

### site-secret.ts（Edge 兼容的签名 Cookie）
| 导出 | 说明 |
|---|---|
| `SITE_SECRET` | 启动时读取，缺失抛错 |
| `SITE_VERIFY_COOKIE="site_v"` / `DISCLAIMER_COOKIE="moji_disc"` | Cookie 名 |
| `hmacSha256(msg, secret)` | Web Crypto 实现（Edge 兼容） |
| `timingSafeEqual(a, b)` | 恒定时间比较 |
| `createSiteVerifyToken()/verifySiteToken()` | 站点访问验证 Cookie（24h 有效） |
| `createDisclaimerToken()/verifyDisclaimerToken()` | 免责声明同意 Cookie |
| `ALLOWED_CRAWLERS` / `isAllowedCrawler(ua)` | 搜索引擎与微信爬虫 UA 白名单 |

### files.ts（上传文件清理）
`extractUploadUrls(html)` 正则提取正文中 `/uploads/` 图片；`deleteUploadFile(url)` 路径安全校验（限定 uploads 目录内）后 unlink；`cleanupPostImages(post)` 删除文章时清理图集/封面/正文内嵌图片。

### paginate.ts
`buildPaginationParams(page, pageSize)` → `{skip, take}`；`paginateResult(results, pageSize)` → 取 `pageSize+1` 判断 `hasMore` 并截断。供前台列表类查询使用（管理端列表用 count 精确分页）。

### prisma-helpers.ts
`handlePrismaUniqueError(error, message)`：P2002 唯一冲突转 `AppError`，供 Category/Tag Service 使用。

### cleanup-registry.ts
`registerCleanup(name, fn, intervalMs)` / `unregisterCleanup` / `cleanupAll` / `getRegisteredTasks`：命名周期任务注册表，限流存储、浏览量去重、Token 黑名单清理均经它调度，防止内存泄漏。

### admin-theme.ts
`adminTheme`：后台 UI 设计 token 集中定义。

## 二、lib/ —— 横切工具层

### 安全类
| 文件 | 导出 | 机制 |
|---|---|---|
| [captcha.ts](file:///workspace/src/lib/captcha.ts) | `createCaptcha()` / `verifyCaptcha(token, answer)` | 生成 5 位随机码（剔除 0/O、1/l/I 易混字符）+ 手绘 SVG（贝塞尔干扰线、噪点网格、干扰带）；存 Captcha 表带过期时间，**一次性消费** |
| [account-lockout.ts](file:///workspace/src/lib/account-lockout.ts) | `checkAccountLockout(username)` / `recordLoginFailure(username)` / `clearLoginFailures(username)` | 内存记录登录失败：连续 5 次锁 30 分钟（配合路由层 IP 级限流） |
| [token-blacklist.ts](file:///workspace/src/lib/token-blacklist.ts) | `blacklistToken(token, userId?)` / `blacklistAllUserTokens(userId)` / `isTokenBlacklisted(token)` / `cleanupExpiredTokens()` | 存 `TokenBlacklist` 表（sha256 哈希，不存原 token）；登录时按 userId 全部拉黑实现**单地登录**；定期清理过期项 |
| [csrf.ts](file:///workspace/src/lib/csrf.ts) | `setCsrfCookie()` / `getCsrfTokenFromCookie()` / `clearCsrfCookie()` | 服务端签发/读取 `moji_csrf` Cookie（登录时设置） |
| [csrf-client.ts](file:///workspace/src/lib/csrf-client.ts) | `ensureCsrfToken()` / `getCsrfHeaders()` | 客户端读取 Cookie 并生成 `{x-csrf-token, x-requested-with}` 请求头，所有写请求必须携带 |
| [ratelimit.ts](file:///workspace/src/lib/ratelimit.ts) | `rateLimit(request, options)` / `rateLimitPresets` / `getClientIP(request)` | 内存 Map 固定窗口计数；IP 解析优先 `x-real-ip`（Nginx 不可伪造），兜底 `x-forwarded-for` 左侧；预设：login 5/15min、register 3/h、comment 5/min、general 30/min |
| [content-filter.ts](file:///workspace/src/lib/content-filter.ts) | `checkSensitiveContent` / `checkRestrictedContent` / `checkContent` → `FilterResult` | 敏感词表 + LINK/PHONE 正则 + 社交账号模式（微信/QQ/微博/抖音/小红书/Telegram/Discord）；评论发布前过滤 |
| [sanitize.ts](file:///workspace/src/lib/sanitize.ts) | `sanitizeHtml(html)` / `validateAndSanitizeComment(raw)` / `sanitizeText(text)` | DOMPurify + jsdom：文章 HTML 白名单净化（页面不设 CSP 的 XSS 兜底）；评论严格净化 + 长度校验；纯文本转义 |
| [sanitize-svg.ts](file:///workspace/src/lib/sanitize-svg.ts) | `sanitizeSvg(svgContent)` | SVG 专用净化（防 script/on* 事件注入），上传 SVG 时调用 |
| [email-session.ts](file:///workspace/src/lib/email-session.ts) | `setEmailVerifiedCookie(email)` / `getVerifiedEmail()` / `clearEmailVerifiedCookie()` / `verifyCookieValue(token)` | 匿名评论者邮箱"已验证"签名 Cookie（HMAC），验证一次后续评论免验证 |

### 业务支撑类
| 文件 | 导出 | 说明 |
|---|---|---|
| [mailer.ts](file:///workspace/src/lib/mailer.ts) | `sendVerificationEmail(opts)` | nodemailer SMTP 发送验证码邮件（配置见环境变量 SMTP_*） |
| [admin-email-codes.ts](file:///workspace/src/lib/admin-email-codes.ts) | `adminEmailCodes`（globalThis 单例） | 管理员敏感操作（绑邮箱/改密码/改用户名）的 6 位验证码内存存储 |
| [revalidate.ts](file:///workspace/src/lib/revalidate.ts) | `revalidatePostPages(slug?, oldSlug?)` | 文章写操作后 `revalidatePath` 刷新首页/归档/文章页（新旧 slug）/相关分类与标签页 |
| [seo.ts](file:///workspace/src/lib/seo.ts) | `buildMetadata({...})` | 统一构建页面 metadata（title/description/OG/openGraph），基于 `NEXT_PUBLIC_SITE_URL` |

### 国际化与日期
| 文件 | 导出 | 说明 |
|---|---|---|
| [i18n.ts](file:///workspace/src/lib/i18n.ts) | `Locale`、`Translations`（强类型词典接口，zh/en 两份）、`detectLocale()`、`getTranslations(locale)`、`t(key, locale)`、`getLocaleFromCookie()`、`getLocaleFromAcceptLanguage()`、`getServerLocale()` | 客户端/通用 i18n；解析顺序 Cookie → Accept-Language → zh-CN |
| [i18n-server.ts](file:///workspace/src/lib/i18n-server.ts) | `getServerLocale()` / `getServerTranslations()` | 服务端组件读取 middleware 注入的 `x-moji-locale` 请求头获取语言与词典 |
| [date.ts](file:///workspace/src/lib/date.ts) | `formatDate` / `formatDateTime` / `formatRelative` / `formatDateForArchive` | date-fns 按 locale（zh-CN/en-US）格式化 |

## 三、依赖方向约定

```
lib/*  ──► shared/{db, errors, constants, cleanup-registry}
modules/* ──► shared/* + lib/{sanitize, token-blacklist…}
app/api/* ──► shared/{security, errors, types} + modules/* + lib/*
middleware.ts ──► shared/{constants, site-secret}（仅 Edge 兼容模块，不可引 Prisma）
components/* ──► lib/{csrf-client, i18n…}（客户端安全子集）
```

> 注意：middleware.ts 运行在 Edge Runtime，只能使用 Web Crypto（site-secret.ts）与常量，不能引入 Prisma/Node crypto——JWT 验签因此在 middleware 内独立实现（`verifyTokenEdge`）。
