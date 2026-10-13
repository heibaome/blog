# 04 · API 参考（src/app/api）

> 全部 30 个 `route.ts`、44 个方法。统一约定：
> - **CSRF**：所有非幂等方法经 Middleware 双重校验（`x-requested-with: XMLHttpRequest` + `x-csrf-token` 头匹配 `moji_csrf` Cookie），唯一豁免 `/api/disclaimer/accept`。
> - **响应**：`successResponse(data)` → `{data}`；`errorResponse(error)` 统一映射 `AppError`/`ZodError`/Prisma 错误。
> - **鉴权**：`requireAuth()`（登录）与 `requireAdmin()`（管理员），定义于 shared/security.ts。
> - API 响应强制 `CSP: default-src 'none'`。

## 1. Auth（/api/auth）

| 路由 | 方法 | 鉴权 | 功能 | 关键逻辑 |
|---|---|---|---|---|
| `/api/auth/captcha` | GET | 公开 | 获取图形验证码 | `createCaptcha()` 返回 `{token, svg(base64)}`，存 Captcha 表 |
| `/api/auth/login` | POST | 公开 | 登录 | ① `rateLimit(login)`（5 次/15min/IP）② 图形验证码校验 ③ `loginSchema` 校验 ④ 账号锁定检查（IP 5 次/15min；用户名连续失败 5 次锁 30min，lib/account-lockout.ts）⑤ `authService.login()`（单地登录踢旧会话）⑥ 写 `moji_token` + `moji_csrf` Cookie |
| `/api/auth/logout` | POST | 公开 | 登出 | 当前 token 加入黑名单 → 清除 auth/CSRF Cookie |
| `/api/auth/me` | GET | 公开 | 获取当前用户 | `getCurrentUser()`，未登录返回 null |
| `/api/auth/me` | PATCH | 登录 | 更新资料 | `updateProfileSchema`（strict 白名单）→ `authService.updateProfile()` |
| `/api/auth/register` | POST | — | 注册 | **已关闭**：固定返回 403（仅管理员后台创建账号） |
| `/api/auth/bind-email` | POST | 登录 | 绑定邮箱 | 校验邮箱格式/域名白名单/唯一性 + `adminEmailCodes` 6 位验证码 → `authService.updateProfile({email})` |
| `/api/auth/send-email-code` | POST | 登录 | 发送邮箱验证码 | 限流 → 邮箱域名/唯一性校验 → 生成 6 位码 → `sendVerificationEmail()`（nodemailer） |
| `/api/auth/update-credentials` | POST | 登录 | 修改用户名/密码 | `updateCredentialsSchema` 判别联合（type: username/password）；支持管理员邮箱验证码或会话已验证状态；改用户名查重，改密码校验旧密码 |

## 2. Posts（/api/posts）

| 路由 | 方法 | 鉴权 | 功能 |
|---|---|---|---|
| `/api/posts` | GET | 公开 | 公开文章列表；`paginationSchema`（page/pageSize≤100/search）；`postService.getPublishedPosts()` |
| `/api/posts` | POST | **admin** | 创建文章；`createPostSchema`；`status=published` 时 `revalidatePostPages(slug)` 刷新 ISR 缓存 |
| `/api/posts/[id]` | GET | **admin** | 后台编辑用详情（含 tags/images） |
| `/api/posts/[id]` | PUT | **admin** | 更新；`updatePostSchema`；刷新缓存 |
| `/api/posts/[id]` | DELETE | **admin** | 删除；清理关联图片文件 |
| `/api/posts/[id]/images` | GET/POST/DELETE | **admin** | 图集查询/新增（`postImageUrlSchema`，仅允许 `/uploads/` 路径）/删除 |
| `/api/posts/[id]/images/reorder` | PUT | **admin** | 图集排序（`reorderImagesSchema`，传 id 顺序数组） |

## 3. Comments（/api/comments）

| 路由 | 方法 | 鉴权 | 功能 |
|---|---|---|---|
| `/api/comments?postId=` | GET | 公开 | 前台评论树（仅 approved）；`commentService.getPostComments()` |
| `/api/comments` | POST | 可选登录 | 发表评论：限流 comment 预设（5 次/min）→ `createCommentSchema`（昵称≤10 字符且禁特殊字符；邮箱限 qq/gmail/163 域名）→ 登录者 `requireAuth()` → 内容过滤（敏感词/链接/手机号/社交账号）→ 匿名需邮箱验证码流程（verify-email/verify-code）→ `commentService.createComment()` |
| `/api/comments/[id]` | PATCH | **admin** | 审核状态变更 |
| `/api/comments/[id]` | DELETE | **admin** | 删除（子评论过继 + 释放内容引用） |
| `/api/comments/batch` | POST | **admin** | 批量操作（状态/删除，单次 ≤100） |
| `/api/comments/post-options` | GET | 登录 | 最近 100 篇文章下拉选项 |
| `/api/comments/stats` | GET | 登录 | 评论统计 |
| `/api/comments/verify-email` | POST | 公开 | 发送评论者邮箱验证码（限流 + 域名白名单） |
| `/api/comments/verify-code` | POST | 公开 | 校验邮箱验证码，通过后写"已验证"签名 Cookie（lib/email-session.ts） |
| `/api/comments/verify-status` | GET | 公开 | 查询当前邮箱验证状态 |

## 4. Categories / Tags（管理端均为 admin）

| 路由 | 方法 | 鉴权 |
|---|---|---|
| `/api/categories` | GET（公开）/ POST（**admin**） | 列表 / 创建（`createCategorySchema`：name/slug/parentId/sortOrder） |
| `/api/categories/[id]` | PUT / DELETE（**admin**） | 更新（唯一约束冲突转 409）/ 删除（有子分类时拒绝） |
| `/api/tags` | GET（公开）/ POST（**admin**） | 列表 / 创建（`createTagSchema`） |
| `/api/tags/[id]` | PUT / DELETE（**admin**） | 更新 / 删除 |

## 5. Upload（/api/upload）

| 路由 | 方法 | 鉴权 | 功能 |
|---|---|---|---|
| `/api/upload` | POST | **admin** | 图片上传：类型白名单 + **魔数（magic number）校验** + SVG `sanitizeSvg()` 净化 + sharp 处理；存 `uploads/`，返回 `/uploads/<file>` 路径 |
| `/api/upload` | DELETE | **admin** | 删除上传文件 |
| `/api/upload/list` | GET | **admin** | 已上传文件列表（后台文件管理页） |

> 访问链路：`/uploads/:path*` 经 next.config.ts rewrite 到 `/api/uploads/:path*`；Middleware 对 `/uploads/` 做 Referer/爬虫白名单防盗链（403 返回"图片受保护"页）。

## 6. 其他

| 路由 | 方法 | 鉴权 | 功能 |
|---|---|---|---|
| `/api/search` | GET | 公开 | 全文搜索（title/content/summary contains）；供 Cmd+K 与搜索页 |
| `/api/stats` | GET | **admin** | 仪表盘：文章/浏览/评论/分类/标签/用户计数、近 7 天发文趋势、分类与 Top15 标签统计、最近 5 篇文章与 5 条评论 |
| `/api/view` | POST | 公开 | 浏览量递增：两层防护（general 限流 + **IP+slug 5 分钟去重窗口**，内存 Map） |
| `/api/view?slug=` | GET | 公开 | 读取当前浏览量（ViewCounter 组件用） |
| `/api/disclaimer/accept` | POST | 公开（CSRF 豁免） | 接受免责声明：签发 HMAC `moji_disc` httpOnly Cookie（site-secret.ts），前端另设 `disc_ok` 提示 Cookie |

## 7. 错误响应约定（shared/errors.ts）

| 场景 | 状态码 |
|---|---|
| AppError（自定义业务错误） | 按传入 statusCode（400/401/403/404/409/429…） |
| ZodError | 400（取第一条 issue 的 message） |
| Prisma P2003（外键约束） | 409 "该记录存在关联数据，无法删除" |
| 其他 Prisma Pxxxx | 500 "数据库操作失败" |
| 普通 Error | 400（取 message） |
| 未知 | 500 "服务器内部错误" |
