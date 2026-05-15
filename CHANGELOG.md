# Changelog

## [1.1.68] - 2026-04-06

### Fix — 安全加固与代码质量修复

- **修复 Prisma 全局实例逻辑反转**：生产环境未将 Prisma 实例挂载到 globalThis，导致模块重加载时创建多余数据库连接。改为所有环境统一复用全局实例。
  - Modified: `src/shared/db.ts` — 移除 NODE_ENV 条件判断，始终挂载 globalForPrisma

- **验证码接口添加速率限制**：/api/auth/captcha 原无任何限速，可被恶意批量请求消耗数据库和 CPU。添加 30 次/分钟/IP 限制。
  - Modified: `src/app/api/auth/captcha/route.ts` — 引入 rateLimit + rateLimitPresets.general

- **修复登录接口数据库异常崩溃**：resolveUsername() 查询邮箱时若数据库异常直接抛错导致登录 500。增加 try-catch 容错，查询失败时 fallback 到原始输入。
  - Modified: `src/app/api/auth/login/route.ts` — resolveUsername() 包裹 try-catch

- **修复 Referer 域名校验误匹配**：原 SITE_HOST 为裸域名 heibao2.us.ci，endsWith("." + SITE_HOST) 会匹配 evilheibao2.us.ci 等恶意域名。改为精确匹配白名单。
  - Modified: `src/shared/constants.ts` — 新增 ALLOWED_SITE_HOSTS 数组
  - Modified: `src/middleware.ts` — Referer 检查改用 ALLOWED_SITE_HOSTS.includes()
  - Modified: `src/app/api/uploads/[...path]/route.ts` — 同步修改

- **修复手机号正则误匹配日期/版本号**：原正则第二个分支匹配任意 3-4+7-8 位数字组合，会误拦截 2026-04-06 等日期格式。移除无前缀匹配，仅保留 +86/0 开头的明确格式。
  - Modified: `src/lib/content-filter.ts` — PHONE_PATTERN 重写

- **收紧 QQ 号独立匹配范围**：从 5-13 位缩减为 5-10 位，减少对技术内容中长数字串的误拦截。
  - Modified: `src/lib/content-filter.ts` — SOCIAL_MEDIA_PATTERNS 最后一条

- **邮件域名白名单精确匹配**：endsWith("@gmail.com") 会误放行 fake@gmail.comx.com。改为提取邮箱域名部分做精确比较。
  - Modified: `src/shared/types.ts` — createCommentSchema 中 authorEmail 的 refine

- **修复文章删除时序风险**：原 deletePost 先删文件再删数据库，若数据库删除失败则文件已丢失。调整为先删数据库再删文件。
  - Modified: `src/modules/post/service.ts` — deletePost() 操作顺序调整

- **Tiptap 编辑器链接 URL scheme 校验**：setLink 未校验 URL 协议，可注入 javascript: 等危险 scheme。添加白名单校验（http/https/mailto/tel）。
  - Modified: `src/components/editor/TiptapEditor.tsx` — addLink() 增加 safeScheme 正则校验

- **生产环境移除 console.log**：upload 路由的 console.log 泄露服务器路径信息。改为仅 dev 模式输出。
  - Modified: `src/app/api/upload/route.ts` — 三处 console.log 加 NODE_ENV 条件

- **SMTP secure 根据端口自动判断**：原硬编码 secure: true 不兼容 587 端口（STARTTLS）。改为 465 端口 secure=true，其他端口 secure=false。
  - Modified: `src/lib/mailer.ts` — secure 改为端口判断

- **统计接口权限收紧**：/api/stats 原 requireAuth() 允许任意登录用户访问后台统计数据。改为 requireAdmin()。
  - Modified: `src/app/api/stats/route.ts` — requireAuth → requireAdmin

- **验证码查询过滤过期记录**：verify-code 查询未在数据库层过滤过期验证码，增加枚举攻击面。添加 expires > now 条件。
  - Modified: `src/app/api/comments/verify-code/route.ts` — findFirst where 增加 expires 过滤



## [1.1.67] - 2026-04-06

### Fix — 评论系统重构与数据完整性修复

- **评论嵌套层级改为两级**：取消多级嵌套回复，改为扁平化两级结构（顶级评论 + 所有回复）。无论回复多深，子评论一律归到顶级父评论下展示。
  - Modified: `src/modules/comment/service.ts` — getPostComments() 改为扁平建树，按顶级祖先归组
  - Modified: `src/components/comment/CommentSection.tsx` — MAX_DEPTH 从 3 改为 1

- **评论删除逻辑：子承父位**：删除父评论时，最早的子评论自动升级为新的父级评论，其余子评论归到其名下。不再级联删除子评论。
  - Modified: `src/modules/comment/service.ts` — deleteComment() 重写，支持继承逻辑

- **修复评论删除失败（P2003 外键约束）**：comments.content_id 外键设置为 RESTRICT，旧代码先删 CommentContent 再删 Comment 导致外键冲突。修复为先删 Comment 再清理 CommentContent。
  - Modified: `src/modules/comment/service.ts` — 调整 deleteComment() 中删除顺序

- **findRootId 循环保护**：评论树构建时增加 visited 集合检测循环引用，防止异常数据导致死循环。
  - Modified: `src/modules/comment/service.ts` — findRootId() 改为迭代实现，增加循环检测

- **releaseContent 异常容错**：CommentContent 不存在时不再抛错，静默跳过。
  - Modified: `src/modules/comment/service.ts` — releaseContent() 增加 try-catch

- **Schema 调整**：CommentTree 自关联外键 onDelete 改为 SetNull，由应用层处理子评论继承逻辑。
  - Modified: `prisma/schema.prisma`

- **移除验证码邮件地理位置查询**：删除 ip-api.com 第三方接口调用，邮件中不再显示地理位置，仅保留 IP 地址。
  - Modified: `src/app/api/comments/verify-email/route.ts` — 删除 getIPLocation() 函数及调用
  - Modified: `src/lib/mailer.ts` — 移除 location 字段，邮件模板仅显示 IP

## [1.1.66] - 2026-04-04

### Enhance — 用户体验功能

- **阅读进度条**：页面顶部 2px 渐变细线（朱砂→翡翠），随滚动进度增长，使用 framer-motion spring 物理动画平滑过渡。固定在最顶层（z-60），不遮挡内容。
  - Added: `src/components/motion/ReadingProgress.tsx`
  - Modified: `src/components/ConditionalLayout.tsx` — 公共页面引入 ReadingProgress

- **首页 Hero 增强**：标题上方添加装饰性墨点，标题与副标题之间加入菱形分隔线，增加中国风辨识度和视觉层次。
  - Modified: `src/components/i18n/Translated.tsx` — HomeHero 增加装饰元素

- **⌘K 全局搜索**：按 `⌘K`（Mac）或 `Ctrl+K`（Windows）弹出搜索面板，输入即搜，支持键盘上下键导航和 Enter 跳转。移动端 Header 增加搜索图标按钮触发同一面板。模态窗口带半透明毛玻璃遮罩。
  - Added: `src/components/motion/CmdKSearch.tsx`
  - Modified: `src/components/ConditionalLayout.tsx` — 引入 CmdKSearch
  - Modified: `src/components/layout/Header.tsx` — 移动端增加搜索按钮

- **文章阅读时间**：根据正文内容自动估算阅读时间（中文 ~400字/分钟，英文 ~250词/分钟），显示在文章头部元信息区。
  - Modified: `src/app/(public)/post/[slug]/page.tsx` — 新增 `estimateReadingTime()` 函数和 Clock 图标显示

- **上一篇 / 下一篇**：文章底部根据发布时间自动推荐相邻文章，左侧显示"上一篇"，右侧显示"下一篇"，点击跳转。无相邻文章时自动隐藏对应区域。
  - Modified: `src/modules/post/service.ts` — 新增 `getAdjacentPosts()` 方法
  - Modified: `src/app/(public)/post/[slug]/page.tsx` — 底部增加 prev/next 导航


## [1.1.65] - 2026-04-04

### Enhance — 用户体验流畅度

- **滚动渐入动画系统**：新建 `ScrollReveal`、`StaggerList`、`StaggerItem` 组件（基于 framer-motion），替代全局同时触发动画。内容在进入视口时才播放入场效果，产生层次感。
  - Added: `src/components/motion/ScrollReveal.tsx` — 三个动画组件

- **文章列表交错入场**：首页、搜索结果、评论列表使用 `StaggerList` 包裹，列表项依次以 60-80ms 间隔入场，产生节奏感而非"一堆东西同时出现"。
  - Modified: `src/app/page.tsx` — 首页文章列表用 StaggerList
  - Modified: `src/app/(public)/search/page.tsx` — 搜索结果用 StaggerList
  - Modified: `src/components/comment/CommentSection.tsx` — 评论列表用 StaggerList

- **归档页月份分组交错入场**：每月分组区块依次渐入，而非一次性全部展开。
  - Modified: `src/app/(public)/archive/page.tsx` — 月份区块用 StaggerList

- **浮动回到顶部按钮**：向下滚动超过 400px 后右下角出现圆形按钮，点击平滑回到顶部。使用 AnimatePresence 控制显隐，带缩放+淡入淡出过渡。
  - Added: `src/components/motion/BackToTop.tsx`
  - Modified: `src/components/ConditionalLayout.tsx` — 引入 BackToTop

- **文章卡片 hover 微交互**：hover 时标题微右移、标签背景变色、底部分隔线变为强调色。
  - Modified: `src/components/post/PostCard.tsx` — 移除自身 `animate-slide-up`（改由父容器 StaggerList 控制），增加 hover 过渡

- **文章详情页渐入**：服务端组件无法直接使用 framer-motion，创建 `PostReveal` 客户端 wrapper 替代 CSS `animate-fade-in`，提供更可控的入场动画。
  - Added: `src/components/motion/PostReveal.tsx`
  - Modified: `src/app/(public)/post/[slug]/page.tsx` — 使用 PostReveal

- **CSS 增强**：
  - 添加 `prefers-reduced-motion` 媒体查询，尊重用户系统动画偏好（减弱动画模式下禁用所有动画和过渡）
  - 链接和按钮添加统一过渡属性（color, background-color, border-color, opacity, transform，200ms ease-out）
  - 输入框聚焦添加过渡效果
  - Modified: `src/styles/globals.css`


## [1.1.64] - 2026-04-04

### Fix

- **site_v Cookie 签名加入日期轮转**：此前 `createSiteVerifyToken()` 使用固定字符串 + secret 生成静态 token，所有访客拿到相同值且永久有效。改为按 UTC 日期轮转（`moji-blog-visitor:2026-04-04`），每天 token 自动更换；验证时同时接受当天和前一天的 token，防止跨 UTC 日边界时 cookie 突然失效。
  - Modified: `src/shared/site-secret.ts` — 新增 `getDayString()` 工具函数；`createSiteVerifyToken()` 加入日期参数；`verifySiteToken()` 验证当天 + 前一天

- **Nginx 空 UA 拦截改用 map 指令**：原配置在 server 块中使用 `if ($http_user_agent = "")` 直接比较，Nginx 官方文档明确指出 `if` 在 server/location 块中存在副作用（继承问题、意外的 `rewrite` 行为等）。改为在 http 块用 `map` 预计算 `$empty_ua` 变量，server 块中仅检查变量值。
  - Modified: `/etc/nginx/sites-enabled/moji-blog` — 新增 `map $http_user_agent $empty_ua` 指令；server 块 `if` 改为检查 `$empty_ua`

- **搜索大小写不敏感**：Prisma 在 SQLite 上的 `contains` 使用 `instr()` 函数，对英文大小写敏感（搜索 `Hello` 匹配不到 `hello`）。为前台搜索和后台搜索的 `title`/`content`/`summary` 字段统一添加 `mode: "insensitive"`。
  - Modified: `src/modules/post/service.ts` — `getPublishedPosts()` 和 `getAllPosts()` 的搜索条件添加 `mode: "insensitive"`
  - Modified: `src/modules/search/service.ts` — `search()` 方法的搜索条件添加 `mode: "insensitive"`

- **useAuth 添加错误状态**：此前 `useAuth` 中 `/api/auth/me` 请求失败时静默吞掉错误（`.catch(() => setUser(null))`），用户无从得知认证服务异常。新增 `error` 状态字段，区分"未登录"（401，正常）和"服务异常"（网络错误/500）；添加 cleanup 防止组件卸载后 setState；logout 请求失败时仍完成本地状态清理。
  - Modified: `src/lib/hooks.ts` — 新增 `error` 状态；区分 HTTP 状态码处理；添加 `cancelled` 标记防竞态

- **Nginx 上传大小与应用层对齐**：应用层 `/api/upload` 限制 5MB，但 Nginx `client_max_body_size` 为 10MB，导致超大文件能通过 Nginx 到达应用层后被拒绝，浪费带宽和连接资源。统一为 5MB。
  - Modified: `/etc/nginx/sites-enabled/moji-blog` — `client_max_body_size` 从 10M 改为 5M

- **PostImage sortOrder 去掉默认值**：Schema 中 `sortOrder @default(0)` 导致所有图片默认排序值相同，如果通过非标准路径创建记录会排序混乱。去掉 `@default(0)`，强制应用层显式传入 sortOrder（已有 `POST /api/posts/[id]/images` 的自增逻辑）。
  - Modified: `prisma/schema.prisma` — PostImage.sortOrder 移除 `@default(0)`


## [1.1.63] - 2026-04-04

### Fix

- **搜索页添加防抖（debounce）**：此前 `search/page.tsx` 在每次按键时都立即发起搜索请求，无任何防抖。引入已有 `useDebounce` hook，400ms 延迟后才触发搜索，大幅减少无效请求。
  - Modified: `src/app/(public)/search/page.tsx` — 引入 `useDebounce(query, 400)`，搜索逻辑从 onChange 直接调用改为 useEffect 监听 debouncedQuery

- **修复图片上传删除按钮不可见**：`ImageUploader` 中删除按钮使用 `group-hover:opacity-100` 控制显隐，但父元素 `div` 缺少 `group` class，导致 Tailwind 的 `group-hover` 不生效，删除按钮永远处于 `opacity: 0` 状态。
  - Modified: `src/components/editor/ImageUploader.tsx` — 图片容器 div 添加 `group` class

- **移除 Footer 死链**：Footer 中 RSS 链接指向 `/api/rss`，但该路由不存在，用户点击返回 404。
  - Modified: `src/components/layout/Footer.tsx` — 移除不存在的 RSS 链接及相关分隔符

- **修复评论邮箱验证 IP 定位阻塞邮件发送**：`verify-email/route.ts` 中注释写"异步查询地理位置（不阻塞邮件发送）"，但实际用 `await` 等待 ip-api.com 响应（0-3秒）后才发送邮件。改为真正异步：fire-and-forget 地理位置查询，立即发送邮件。
  - Modified: `src/app/api/comments/verify-email/route.ts` — `getIPLocation` 改为 `.then().catch()` 异步模式，不 await

### Refactor

- **统一评论区邮箱域名白名单**：`CommentSection.tsx` 自行定义 `ALLOWED_DOMAINS` 常量与 `shared/constants.ts` 的 `ALLOWED_EMAIL_DOMAINS` 完全重复。改为统一导入。
  - Modified: `src/components/comment/CommentSection.tsx` — 移除本地 `ALLOWED_DOMAINS`，改为从 `@/shared/constants` 导入 `ALLOWED_EMAIL_DOMAINS`

- **集中管理后台颜色 token**：7 个管理页面各自硬编码同一套暗色主题颜色变量（card、border、accent 等），维护时需同步修改多处。抽到独立模块统一管理。
  - Added: `src/shared/admin-theme.ts` — 集中定义 `adminTheme` 对象
  - Modified: `src/app/admin/dashboard/page.tsx` — 从 `admin-theme.ts` 导入
  - Modified: `src/app/admin/editor/[id]/page.tsx` — 同上
  - Modified: `src/app/admin/posts/page.tsx` — 同上
  - Modified: `src/app/admin/comments/page.tsx` — 同上
  - Modified: `src/app/admin/categories/page.tsx` — 同上
  - Modified: `src/app/admin/tags/page.tsx` — 同上
  - Modified: `src/app/admin/settings/page.tsx` — 同上
## [1.1.62] - 2026-04-04

### Optimize

- **优化内容过滤器 `getCategory` 性能**：原实现中 `checkKeywords` 每次命中关键词后，`getCategory` 函数需遍历全部关键词库（政治/色情/赌博/毒品共约 60 个）做正则 source 字符串比较，时间复杂度 O(n^2)。改为构建时用 Map 将每个 pattern 直接关联其分类，命中时 O(1) 查表。
  - Modified: `src/lib/content-filter.ts` -- 新增 CATEGORY_MAP 和 buildPatterns() 工具函数；KEYWORD_PATTERNS 构建时同步注册分类映射；checkKeywords 改用映射表获取分类；移除旧的 getCategory() 函数

- **修复 `verifiedUsers` Map 内存泄漏**：`api/auth/update-credentials/route.ts` 中的 verifiedUsers 用于记录邮箱验证码已验证的用户（5分钟有效期内免重复验证），但无清理机制。服务长期运行后 Map 持续增长。改为 globalThis 持久化 + cleanup-registry 每分钟清理过期条目，与项目其他内存存储保持一致。
  - Modified: `src/app/api/auth/update-credentials/route.ts` -- verifiedUsers 改为 globalThis 持久化；新增定时清理（60秒间隔）

- **规范化 `hashIP` import 方式**：`shared/security.ts` 的 hashIP() 函数内联使用 require("crypto")，与文件顶部 ES import 风格不一致，且每次调用都执行 require 解析。改为顶部 import 统一风格。
  - Modified: `src/shared/security.ts` -- 顶部新增 import crypto；hashIP() 移除内联 require

### Fix

- **恢复误删的 `uploads/[...path]/route.ts`**：前次 rsync 操作因本地 tar 提取遗漏方括号路径文件，配合 --delete 参数误删了远程的上传文件服务路由。已从 .next 编译产物还原完整逻辑。
  - Added: `src/app/api/uploads/[...path]/route.ts` -- 从编译产物逆向还原，包含路径遍历防护、MIME 白名单、三层鉴权（Cookie/Referer/UA）

### Refactor

- **删除死代码 `getPostBySlug`**：该方法从未被任何路由或组件调用，前台使用 `getPostBySlugStatic` + 独立 `/api/view` 接口管理浏览量。
  - Modified: `src/modules/post/service.ts` — 移除 `getPostBySlug` 方法

- **简化 `checkContent` 复用已有函数**：原实现手动重复了 `checkSensitiveContent`（关键词检查）和 `checkRestrictedContent`（链接/手机/社媒检查）的内部逻辑。改为直接组合调用这两个已有的导出函数。
  - Modified: `src/lib/content-filter.ts` — `checkContent` 改为 `checkSensitiveContent` + `checkRestrictedContent` 组合

- **提取通用 Prisma 唯一键冲突处理**：`CategoryService` 和 `TagService` 的 create/update 方法各有完全相同的 P2002 错误捕获代码。抽成通用工具函数消除重复。
  - Added: `src/shared/prisma-helpers.ts` — 新增 `handlePrismaUniqueError(error, message)` 工具函数
  - Modified: `src/modules/category/service.ts` — `createCategory`、`updateCategory` 改用 `handlePrismaUniqueError`
  - Modified: `src/modules/tag/service.ts` — `createTag`、`updateTag` 改用 `handlePrismaUniqueError`

- **简化 `account-lockout.ts` 冗余逻辑**：`recordLoginFailure` 中锁定过期后的条件判断前半段永远为真（上一个 if 已排除 >now），已精简。
  - Modified: `src/lib/account-lockout.ts` — 移除冗余条件判断

- **提取 `SITE_SECRET` 到共享模块，消除 3 处硬编码**：站点访问验证密钥此前在 middleware.ts、uploads route、disclaimer accept 三处各硬编码一份相同的字符串。改为统一从共享模块读取，优先使用环境变量 `SITE_SECRET`。
  - Added: `src/shared/site-secret.ts` — 导出 `SITE_SECRET`、`SITE_VERIFY_COOKIE`、`DISCLAIMER_COOKIE` 常量
  - Modified: `src/middleware.ts` — 移除硬编码，改为从 `@/shared/site-secret` 导入
  - Modified: `src/app/api/uploads/[...path]/route.ts` — 同上
  - Modified: `src/app/api/disclaimer/accept/route.ts` — 同上

- **集中管理 `setInterval` 定时清理器**：此前 5 个模块各自在顶层执行 `setInterval` 注册清理任务，dev 模式热重载时会导致 interval 泄漏（重复注册）。改为统一注册到清理注册表，自动防重。
  - Added: `src/shared/cleanup-registry.ts` — 统一清理任务注册表，支持按名称防重复注册
  - Modified: `src/lib/token-blacklist.ts` — 移除顶层 setInterval，改用 registerCleanup
  - Modified: `src/lib/ratelimit.ts` — 同上
  - Modified: `src/lib/account-lockout.ts` — 同上
  - Modified: `src/lib/admin-email-codes.ts` — 同上
  - Modified: `src/app/api/view/route.ts` — 同上

## [1.1.60] - 2026-04-04

### Fix

- **修复 `sanitizeText` 反斜杠替换正则 bug**：`sanitizeText()` 用于纯文本字段（昵称等）的净化，其中 `.replace(/\\/, "")` 仅替换第一个反斜杠，攻击者可通过后续反斜杠绕过过滤。
  - Modified: `src/lib/sanitize.ts` — `.replace(/\\/, "")` 改为 `.replace(/\\/g, "")`，全局替换所有反斜杠

- **修复分类/标签创建的唯一性检查竞态条件**：`createCategory` 和 `createTag` 使用 `findFirst` + `create` 两步操作，存在并发请求同时通过检查后创建重复记录的窗口。
  - Modified: `prisma/schema.prisma` — `Category.name` 新增 `@unique` 约束（此前仅有 `slug` 的唯一约束）
  - Modified: `src/modules/category/service.ts` — `createCategory` 和 `updateCategory` 改为直接 `create`/`update`，捕获 Prisma `P2002` 唯一约束冲突错误返回 409
  - Modified: `src/modules/tag/service.ts` — `createTag` 和 `updateTag` 同样改为原子操作 + 捕获 `P2002`

### Refactor

- **消除邮箱域名白名单重复定义**：`@/shared/types.ts` 的 Zod schema 和 `api/comments/route.ts` 各自定义了一份邮箱域名白名单（`@qq.com`、`@gmail.com`、`@163.com`），修改时需同步两处。
  - Added: `src/shared/types.ts` — 新增导出常量 `ALLOWED_EMAIL_DOMAINS`
  - Modified: `src/shared/types.ts` — `createCommentSchema` 的 `authorEmail` refine 改用 `ALLOWED_EMAIL_DOMAINS`
  - Modified: `src/app/api/comments/route.ts` — 移除局部定义，改为从 `@/shared/types` 导入 `ALLOWED_EMAIL_DOMAINS`

## [1.1.59] - 2026-04-04

### Optimize

- **前台分页查询省略 count**：前台三个文章列表方法（首页、分类页、标签页）此前每次查询都同时执行 `findMany` + `count` 两条 SQL。改为 `take(pageSize+1)` 技巧：多取一条数据，通过结果长度判断是否存在更多内容，省去独立的 `count` 查询。
  - Modified: `src/modules/post/service.ts` — `getPublishedPosts`、`getPostsByCategory`、`getPostsByTag` 三个方法：移除 `prisma.count()` 调用和 `Promise.all` 并行查询；改为单次 `findMany` 取 `pageSize + 1` 条，结果超长则 `slice(0, pageSize)` 截断并标记 `hasMore: true`
  - 返回值变更：`{ total, totalPages }` → `{ hasMore }`（前台方法）。后台管理方法（`getAllPosts`、`getAllComments`）不受影响，仍保留 `total`/`totalPages` 用于数字分页 UI
  - 效果：每个前台列表查询减少 1 条 SQL（从 2 条变 1 条），SQLite 场景下 `COUNT(*)` 全表扫描成本被消除
  - 兼容性：前台页面（首页、分类、标签）仅展示列表，不使用分页控件，返回值变更无影响

## [1.1.58] - 2026-04-04

### Optimize

- **浏览量写入增加 IP + 文章去重**：此前 `/api/view` POST 接口仅有通用 API 限速（30 次/分钟/IP），不限制对同一文章的重复刷量。前端 sessionStorage 防刷可被清空绕过。新增服务端按 IP + 文章 slug 的去重机制，同一 IP 对同一文章在 5 分钟窗口内仅计一次浏览量。
  - Modified: `src/app/api/view/route.ts` — 新增内存级去重存储（`Map<IP:slug, 过期时间>`），每分钟自动清理过期条目；POST 处理逻辑新增第二层防护：先检查 `shouldCountView(ip, slug)`，窗口内重复请求直接返回当前浏览量而不递增
  - 去重窗口：5 分钟（`VIEW_WINDOW_MS = 5 * 60 * 1000`），同一 IP 对同一文章 5 分钟内最多写入一次
  - 三层防护体系：Nginx 通用限速（10r/s）→ 应用层 API 限速（30 次/分钟/IP）→ IP+文章去重（5 分钟/次）→ 前端 sessionStorage
  - 兼容性：不影响正常用户浏览（不同文章独立计数）；不影响 GET 查询接口；重复请求返回正确浏览量值（静默去重，前端无感知）

## [1.1.57] - 2026-04-04

### Optimize

- **首页从 SSR 改为 ISR 静态渲染**：此前首页使用 `force-dynamic`，每次访问都执行服务端渲染并查询数据库，对内容更新频率低的首页来说是不必要的开销。改为 ISR（增量静态再生）后，页面返回静态 HTML，每 5 分钟自动检查更新。
  - Modified: `src/app/page.tsx` — `export const dynamic = "force-dynamic"` 替换为 `export const revalidate = 300`（5 分钟 ISR 周期）
  - 效果：首次访问后生成静态 HTML，后续请求直接返回缓存页面，不再每次查库；文章发布/修改/删除已通过 `revalidatePath` 立即刷新首页缓存（[1.1.47] 已实现），无需等待 ISR 周期
  - 兼容性：与文章详情页（`/post/[slug]`）的 ISR 配置保持一致；首页的 `metadata` 仍正常生成；不影响其他页面

## [1.1.56] - 2026-04-04

### Security

- **停止以 root 运行的 Prisma Studio 进程**：安全审计发现 Prisma Studio（数据库管理面板）以 root 身份在端口 5555 监听所有网卡（`*:5555`）。虽然 UFW 防火墙已封禁 5555 端口对外不可达，但该进程以 root 权限运行且绑定所有接口，存在防火墙规则被误改时数据库直接暴露的风险。
  - 修复：kill 相关 Prisma Studio 进程（pid 137917/137919/137938/137939），确认端口 5555 已关闭，无残留进程
  - 影响：数据库管理面板不再后台常驻，需手动启动（`su - blog -c "npx prisma studio --port 5556"`），用完即关
  - 关联审计项：Prisma Studio 以 root 运行中、端口 5555 监听所有网卡


## [1.1.55] - 2026-04-03


### Feature

- **后台设置页新增修改用户名和修改密码功能**：管理员可在后台「个人设置」页面修改登录用户名和密码，此前这两个字段无法在后台修改。
    - 「修改密码」：旧密码 + 新密码 + 确认密码，修改成功后自动跳转登录页（旧会话已失效）
  - 安全设计：修改密码需验证旧密码（防 cookie 被盗后直接改密）；新旧密码不能相同；改密码后自动踢掉所有旧会话（`blacklistAllUserTokens`）；用户名唯一性校验
  - 兼容性：不影响邮箱绑定流程（独立区块，逻辑不变）；不影响显示名称修改；未绑定邮箱时两个修改区块显示引导提示

- **管理员邮箱发评论自动通过审核**：使用已绑定管理员邮箱的用户发评论时，不再需要人工审核，评论自动通过并关联管理员用户 ID（显示 👑 标识）。此前仅登录状态下的管理员评论自动通过。
  - Modified: `src/modules/comment/service.ts` — `createComment` 方法新增管理员邮箱匹配逻辑：当 `userRole !== "admin"` 时，查询数据库是否存在 `role: "admin"` 且邮箱匹配的用户，匹配则自动通过并关联 userId
  - 兼容性：不影响匿名用户评论（仍走 pending 审核）；不影响已登录管理员评论；敏感词过滤对所有人生效（管理员也不豁免）

### Security

- **评论邮箱验证地理位置查询改用 HTTPS**：此前 `verify-email` 路由调用 ip-api.com 查询用户地理位置时使用 HTTP 明文传输，存在中间人窃听风险。改为 HTTPS 后，请求链路全程加密。
  - Modified: `src/app/api/comments/verify-email/route.ts` — `fetch` URL 从 `http://ip-api.com/json/...` 改为 `https://ip-api.com/json/...`
  - 影响：每次评论邮箱验证时的 IP 查询请求不再以明文传输

- **全站安全审计**：对博客系统进行了全方位安全审计，覆盖认证、API、输入校验、文件上传、会话管理、CSRF、速率限制、Nginx 配置、环境变量等层面。审计结果：中风险 3 项（已记录待修复）、低风险 5 项（已记录）。

## [1.1.54] - 2026-04-03

### Security

- **安全审计确认 Nginx Server 信息泄露防护已就位**：经外部安全审计检查，确认 `server_tokens off` 已在 `/etc/nginx/nginx.conf` 的 `http` 块中正确配置。Nginx 响应头仅返回 `Server: nginx`（不含版本号），符合安全最佳实践。无需额外修改。
  - 验证方式：`curl -sI https://heibao2.us.ci | grep Server` 返回 `Server: nginx`（无版本信息）
  - 涉及文件：`/etc/nginx/nginx.conf`（`server_tokens off` 已存在于 `http` 块）
  - 关联审计项：响应头信息泄露、服务器指纹防护

## [1.1.53] - 2026-04-03

### Fix

- **修复图片上传区域删除按钮不可见**：图片上传区域的删除按钮（×）在移动端和 PC 端均无法显示，原因是 Tailwind v4 CSS 构建缓存未清理导致部分关键类未生成。
  - 原因：Tailwind v4 的 Oxide CSS 扫描器在增量构建时未生成 `ImageUploader.tsx` 中的部分类（`bg-black/70`、`sm:opacity-0`、`sm:group-hover:opacity-100`、`active:bg-red-600`），删除按钮因无背景色而在深色卡片上完全不可见
  - 修复：删除按钮背景色改用 `style={{ background: "rgba(0,0,0,0.7)" }}` 内联样式，不再依赖 Tailwind 类生成；悬停行为改为 `hover:opacity-100`，移除有问题的 `sm:group-hover` 组合变体；父容器移除 `group` class（同样未被扫描器生成）
  - 构建：清理 `.next` 缓存目录后重新执行 `npm run build`，确保所有 Tailwind 类正确编译
  - 权限：修复 `.next` 目录属主为 blog 用户（此前以 root 构建导致 PM2 blog 用户无法写入 prerender 缓存）

## [1.1.52] - 2026-04-03

### Fix

- **禁用键盘删除图片，仅允许通过删除按钮移除**：此前编辑器中的图片可通过键盘 Backspace/Delete 键删除（Tiptap Image 扩展的默认行为，图片作为 atom 节点可被光标邻接时按键删除），容易误操作。
  - Modified: `CustomImage` 扩展 — 新增 `addKeyboardShortcuts()` 方法，拦截 Backspace 和 Delete 键：检测光标邻接或选中的节点是否为 image 类型，命中则返回 `true` 阻止事件传播
  - Modified: `CustomImage` 扩展 — 通过 `.extend({ draggable: false })` 禁止拖拽图片节点
  - 效果：Backspace/Delete 键无法删除图片；图片不可拖拽移除；仅能通过 hover 显示的删除按钮（×）移除图片
  - 兼容性：不影响图片上传、插入、展示；不影响其他内容的键盘编辑操作；仅拦截图片节点邻接/选中时的删除键

## [1.1.51] - 2026-04-03

### Feature

- **编辑器图片删除按钮**：编辑器中上传的图片现在支持一键删除，同时清理服务器上的文件。此前删除图片只能通过手动编辑 HTML 或删除整个文章实现。
  - Added: `ImageNodeView` React 组件 — 使用 Tiptap `ReactNodeViewRenderer` 自定义图片渲染，图片上叠加半透明圆形删除按钮（X 图标），hover 时显示
  - Added: `CustomImage` 扩展 — 继承 `@tiptap/extension-image`，通过 `addNodeView()` 注入 `ImageNodeView`
  - Modified: `TiptapEditor.tsx` — Image 扩展从 `Image.configure(...)` 替换为 `CustomImage.configure(...)`
  - 删除流程：点击删除按钮 → toast 提示"删除图片中..." → 调用 `DELETE /api/upload` 删除服务器文件 → 从编辑器中移除图片节点 → toast 提示"图片已删除"
  - 安全校验：仅 `/uploads/` 开头的本站图片调用服务器删除接口（外部图片链接仅从编辑器移除，不调用 API）；删除接口已有 `requireAdmin()` + 路径遍历防护（`path.resolve` 前缀检查）
  - 兼容性：不影响已发布的文章内容（NodeView 仅在编辑器内生效）；不影响前台图片展示；图片上传流程不变；移除了未使用的 `RemoveFormatting` 图标 import，替换为 `X` 图标
  - 交互细节：删除按钮默认隐藏，hover 图片时以 150ms 过渡显示；按钮设 `contentEditable={false}` 防止编辑器光标进入按钮内部

## [1.1.50] - 2026-04-03

### Fix

- **修复编辑文章时标题变更覆盖手动设置的 slug**：新建文章时，输入标题会自动生成 slug（符合预期）。但当用户手动修改 slug 后再次编辑标题，自动生成功能会覆盖掉已手动设置的 slug 值，导致用户需要反复重新填写。
  - Added: `slugManuallyEdited` ref（`useRef(false)`）— 追踪用户是否手动编辑过 slug 字段
  - Modified: 标题 `onChange` 处理逻辑 — 自动生 slug 的条件从 `if (isNew)` 改为 `if (isNew && !slugManuallyEdited.current)`，用户手动编辑过 slug 后不再自动覆盖
  - Modified: slug 输入框 `onChange` — 新增 `slugManuallyEdited.current = true`，用户手动输入时立即标记
  - Modified: 加载已有文章时 — 设 `slugManuallyEdited.current = true`，已有文章的 slug 不应被标题变更覆盖
  - 兼容性：不影响发布流程、slug 校验规则（`/^[a-z0-9-]+$/`）、slug 自动生成的默认行为；仅改变自动覆盖的触发条件

## [1.1.49] - 2026-04-03

### Security

- **中间件 JWT 签名验证**：此前中间件的 `isTokenFormatValid` 函数仅校验 JWT 三段式格式、base64 编码合法性、payload 中的过期时间和必需字段（userId, role），但不验证 HMAC-SHA256 签名。攻击者可自行拼接任意 payload（含有效的 userId 和 role），生成格式正确但签名无效的 token，通过中间件守卫直接访问 `/admin` 下所有页面。虽然 API 路由仍由 `requireAuth()` 进行完整签名验证（API 数据不会泄露），但页面级访问控制形同虚设。
  - Added: `base64UrlDecode()` 函数 — 将 JWT 的 base64url 编码段解码为 Uint8Array，处理 padding 和 URL 安全字符替换
  - Added: `constantTimeEqual()` 函数 — Uint8Array 恒定时间比较，防止时序攻击（与已有 HMAC 验证逻辑一致）
  - Added: `verifyTokenEdge()` 函数 — 使用 Web Crypto API（Edge Runtime 兼容）实现完整的 JWT HMAC-SHA256 签名验证：导入 JWT_SECRET 为 HMAC key → 签名 header.payload → 与 token 中的 signature 段恒定时间比较；同时检查 payload 过期时间和必需字段
  - Modified: `src/middleware.ts` — `isTokenFormatValid(token)` 替换为 `await verifyTokenEdge(token)`，受保护路由（/admin）现在执行完整的签名验证
  - 兼容性：签名算法与服务端 `jsonwebtoken` 库（`jwt.verify()`）完全一致（HMAC-SHA256），现有合法 token 无需重新签发；Web Crypto API 为 Edge Runtime 原生支持，无额外依赖；JWT_SECRET 从 `process.env.JWT_SECRET` 动态读取，与 API 路由共享同一密钥
  - 性能影响：仅影响 `/admin` 路由的请求（公共页面和 API 路由不受影响）；HMAC-SHA256 签名验证为微秒级操作，无感知延迟
  - 测试验证：伪造 payload + 无效签名的 token 现在返回 307 重定向到登录页（此前返回 200 进入后台）

## [1.1.48] - 2026-04-03

### Security

- **全站免责声明强制（服务端强制）**：首次访问博客任意公共页面时，必须阅读并同意免责声明后才能浏览。此前版本的实现基于 `localStorage` 且仅作用于首页，用户可在浏览器控制台一行代码绕过，且通过导航栏可直接访问其他页面。现改为服务端中间件全站强制执行。
  - Added: src/app/api/disclaimer/accept/route.ts - 免责声明接受接口（POST），使用 `crypto.createHmac("sha256")` 签发 `moji_disc` Cookie（httpOnly + Secure + SameSite=lax，有效期 1 年）
  - Added: src/app/disclaimer/page.tsx - 免责声明页面（服务端渲染），包含内容合规、信息准确性、评论责任、版权、隐私保护、免责条款六项声明；纯 HTML form 提交，不依赖客户端 JS
  - Modified: src/middleware.ts - 新增 `checkDisclaimerCookie` 函数（Web Crypto API HMAC-SHA256 验证，恒定时间比较）；所有公共页面（非 `/api`、非 `/admin`、非 `/disclaimer`）检查 `moji_disc` Cookie，无效则 307 到 `/disclaimer`；搜索引擎爬虫 UA 豁免（Googlebot、Baiduspider 等 13 种），避免 SEO 影响；`/api/disclaimer/accept` 接口豁免 CSRF 检查（公开表单提交）
  - 移除: src/components/DisclaimerModal.tsx - 删除旧的 localStorage 方案
  - Modified: src/app/page.tsx - 移除 DisclaimerModal 组件引用
  - 兼容性：`/admin` 页面不受影响（已有独立登录验证）；`/api/*` 接口不受影响；`/disclaimer` 页面本身不被重定向（避免循环）；静态资源不经过此逻辑
  - 防篡改机制：Cookie 值为 HMAC-SHA256 签名，密钥与站点访问验证 Cookie 共用，伪造值无法通过中间件校验；httpOnly 阻止前端 JS 读写；Secure 确保仅 HTTPS 传输

## [1.1.47] - 2026-04-03

### Security

- **文章详情页 SSR → ISR 静态渲染**：此前文章详情页使用 SSR（服务端渲染），每次请求都执行服务端代码，HTML 中包含 `__NEXT_DATA__` 脚本暴露页面 props 和数据结构，且存在 19 个 script 标签扩大了 XSS 攻击面。改为 ISR（增量静态再生）后，页面始终返回纯静态 HTML，`__NEXT_DATA__` 彻底消除。
  - Modified: src/app/(public)/post/[slug]/page.tsx - 新增 `generateStaticParams` 预生成所有已发布文章；`export const revalidate = 300` 设置 5 分钟 ISR 周期；浏览量展示从服务端直出改为客户端 `ViewCounter` 组件
  - Added: src/components/post/ViewCounter.tsx - 客户端浏览量组件，页面挂载后异步调用 `/api/view` 递增并更新显示；sessionStorage 防止同一会话重复计数
  - Added: src/app/api/view/route.ts - 浏览量 API 端点（POST 递增 / GET 查询），应用层限速 30 次/分钟
  - Modified: src/modules/post/service.ts - 新增 `getPostBySlugStatic`（不递增浏览量）、`incrementViewCount`、`getViewCount` 方法，与原 `getPostBySlug`（SSR 用）共存
  - 效果：`__NEXT_DATA__` 从有到无；script 标签 19 → 18；`x-nextjs-prerender: 1` 确认静态预渲染；`Cache-Control: s-maxage=300, stale-while-revalidate=31535700`
  - 兼容性：发布/修改/删除文章后最多 5 分钟自动生效（ISR），无需手动 build

- **文章增删改自动刷新页面缓存**：配合 ISR 改造，文章创建/更新/删除后通过 `revalidatePath` 立即刷新相关页面缓存（首页、归档页、文章详情页、分类/标签页），无需等待 ISR 周期或手动构建。
  - Added: src/lib/revalidate.ts - `revalidatePostPages(slug?, oldSlug?)` 工具函数，统一刷新文章相关页面
  - Modified: src/app/api/posts/route.ts - POST 创建文章后调用 `revalidatePostPages`
  - Modified: src/app/api/posts/[id]/route.ts - PUT 更新后调用（含旧 slug 刷新）、DELETE 删除后调用

- **验证码邮件附带 IP 和地理位置**：发送邮箱验证码时，在邮件中附带请求来源的 IP 地址和大概地理位置（如"中国 四川 泸州"），让邮箱主人识别异常登录行为。
  - Modified: src/lib/mailer.ts - `sendVerificationEmail` 签名从 `(to, code)` 改为 `({ to, code, ip?, location? })`；邮件模板新增"请求来源"信息行
  - Modified: src/app/api/comments/verify-email/route.ts - 新增 `getIPLocation` 函数（调用 ip-api.com 免费接口，3 秒超时）；发邮件前获取客户端 IP 并查询地理位置
  - Modified: src/app/api/auth/send-email-code/route.ts - 适配新函数签名，附带 IP 信息

## [1.1.46] - 2026-04-02

### Security

- **公开 API 保留管理员标识（回滚调整）**：上一版 [1.1.45] 中 author select 同时移除了 `role` 字段，导致文章详情页的博主标识（👑）丢失。现仅移除 `id` 和 `username`，保留 `role` 字段以维持前台博主标识功能。
  - Modified: src/modules/post/service.ts - 四个公开方法的 author select 从 `{ displayName, avatar }` 恢复为 `{ displayName, avatar, role }`
  - Modified: src/app/(public)/post/[slug]/page.tsx - 恢复博主标识（👑）展示逻辑
  - 最终状态：公开 API 暴露 `displayName`、`avatar`、`role`；`id`（数据库内部 ID）和 `username`（管理员登录名）仍被移除

## [1.1.45] - 2026-04-02

### Security

- **公开 API 移除内部用户字段**：公开接口 `/api/posts`、文章详情、分类/标签文章列表的 author 关联查询此前暴露了 `id`（数据库内部 ID）、`username`（管理员登录用户名），攻击者可利用 `username` 结合已暴露的登录入口进行定向暴力破解。
  - Modified: src/modules/post/service.ts - `getPublishedPosts`、`getPostBySlug`、`getPostsByCategory`、`getPostsByTag` 四个公开方法的 author select 移除 `id` 和 `username` 字段
  - Modified: src/app/(public)/post/[slug]/page.tsx - 作者名称展示从 `displayName || username` 改为 `displayName || "墨迹"`
  - 后台管理接口不受影响，仍完整返回所有用户字段

## [1.1.44] - 2026-04-02

### Security

- **Nginx 登录限速加固**：此前 Nginx 仅对整个 `/api/` 路径设置了通用限速（10r/s + burst=20），登录接口 `/api/auth/login` 与普通 API 共享同一配额，攻击者可在应用层限速触发前瞬间打入大量请求，浪费服务器资源。
  - Modified: Nginx sites-enabled/default - 新增两个独立限速区域：
    - `login` 区域（1r/s + burst=3）：作用于 `/api/auth/login`，比通用 API 限速严格 10 倍；Nginx 层直接返回 429，请求不进入 Next.js 应用
    - `login_page` 区域（3r/s + burst=5）：作用于 `/admin/login` 页面，防止对登录页面的资源耗尽攻击（大量 GET 请求消耗 Node.js 进程资源）
  - 与应用层防护形成三层防御：Nginx 层（直接拒绝）→ 应用层 IP 限速（5 次/15 分钟）→ 应用层账号锁定（5 次失败锁定 30 分钟）
  - 验证：15 个并发登录页面请求中 9 个被 Nginx 拦截（429）；10 个并发登录 API 请求中多数被 Nginx 拦截，少数到达应用层后被 CSRF 检查拦截


## [1.1.43] - 2026-04-02

### UX

- **评论提交成功提示**：普通用户提交评论后，因需审核不会立即出现在评论列表中，此前无任何成功反馈，用户可能误以为发送失败而重复提交。
  - Modified: src/lib/i18n.ts - 新增 `comment_success` 中英文文案（中文：「评论已提交，审核通过后将展示 ✨」，英文：「Comment submitted — it will appear after review ✨」）
  - Modified: src/components/comment/CommentSection.tsx - 新增 `submitSuccess` 状态；评论提交成功后展示绿色提示条，5 秒自动消失；用户开始输入新评论时立即清除提示；前端已有 `submitting` 状态防止重复点击

## [1.1.42] - 2026-04-02

### Security

- **评论内容过滤**：新增服务端内容审核，拦截政治敏感、色情、赌博、毒品相关内容，以及链接、手机号、社交媒体账号。管理员仅受敏感关键词限制，不受链接/手机/社媒限制。
  - Added: src/lib/content-filter.ts - 关键词库（政治敏感、色情、赌博、毒品四类）+ 正则规则（链接、手机号、社媒账号）；导出 `checkSensitiveContent()` 和 `checkRestrictedContent()` 两个函数
  - Modified: src/app/api/comments/route.ts - 在 `createCommentSchema.parse()` 之前新增两层检查：`checkSensitiveContent()` 对所有人生效（含管理员）；`checkRestrictedContent()` 仅对普通用户生效（管理员豁免）；同时检查评论内容和昵称字段
  - 检测规则：链接匹配 http/https/ftp/裸域名；手机号匹配中国大陆 11 位（1 开头）及国际格式 +86；社媒匹配微信/QQ/微博/抖音/小红书/TG/Discord 及引导加好友类关键词
  - 命中即拒绝（不入库），返回明确错误提示，前端通过现有 `submitError` 展示
  - Security：作为第一道防线，配合人工审核使用；关键词库可按需扩展

## [1.1.41] - 2026-04-02

### Security

- **上传图片访问鉴权增强**：新增 Cookie 验证层，防止图片被直接盗链，同时保证隐私浏览器正常访问。
  - Modified: src/middleware.ts - 新增 \`site_v\` 站点访问验证 Cookie（HMAC-SHA256 签名，Web Crypto API，Edge Runtime 兼容）；uploads 鉴权从二层（Referer + UA）升级为三层降级：Cookie → Referer → UA 白名单
  - Modified: src/app/api/uploads/[...path]/route.ts - API 路由同步增加 Cookie 验证逻辑（此前仅检查 Referer/UA，与 middleware 层级不一致导致 Cookie 验证通过后仍被 API 路由拦截）
  - Cookie 属性：\`HttpOnly\` + \`Secure\` + \`SameSite=Lax\`，有效期 24 小时，页面首次访问时签发，已有则跳过
  - 验证逻辑：三层任一通过即放行；HMAC 签名使用恒定时间比较，防时序攻击；与现有 \`moji_token\`（登录态）、\`moji_csrf\`（CSRF 防护）互不干扰
  - 兼容性：不影响搜索引擎爬虫（UA 白名单兜底）、不影响微信分享（UA 白名单兜底）、不影响站内正常浏览（Cookie/Referer 均可放行）


## [1.1.40] - 2026-04-02

### UX

- **上传图片反馈通知**：替换原有的 `alert()` 弹窗为 `react-hot-toast` 通知，提供更流畅的上传状态反馈。
  - Added: src/components/providers/ToastProvider.tsx - 全局 Toast 组件（暗色主题，匹配博客风格）
  - Modified: src/app/layout.tsx - 引入 `<ToastProvider />` 为全局提供通知能力
  - Modified: src/components/editor/TiptapEditor.tsx - 所有 `alert()` 替换为 toast 通知：上传中显示 loading 提示，成功/失败显示对应结果，文件类型和大小校验也改为 toast 提示
  - 通知位置：页面顶部居中，3 秒自动消失

## [1.1.39] - 2026-04-02

### Optimize

- **上传图片自动压缩**：后台编辑器上传图片时自动进行服务端压缩，减少存储占用和页面加载带宽。
  - Added: package.json - 新增 `sharp ^0.34.5` 显式依赖（此前仅为 Next.js 间接依赖）
  - Modified: src/app/api/upload/route.ts - 新增 `compressImage()` 函数，在文件写入磁盘前对 JPEG/PNG/WebP 进行压缩
  - 压缩策略：JPEG 质量 80%（mozjpeg 优化）、PNG compressionLevel 9、WebP 质量 80%；宽度超过 1920px 自动缩放；GIF（动图）和 SVG（矢量图）跳过压缩
  - 日志输出压缩前后大小及压缩率，便于监控效果
  - 兼容性：不改变上传接口，前端无需修改，现有已上传图片不受影响

## [1.1.38] - 2026-04-02

### Fix

- **修复上传图片后无法显示的问题**：图片通过编辑器上传后保存成功，但在页面中显示"无法显示"。
  - 原因1：Next.js 15 生产模式（`next start`）缓存 `public/` 目录文件列表，运行期间新增的静态文件不会被识别，返回 404
  - 修复：Nginx 新增 `location /uploads/` 配置，直接从文件系统提供上传文件，绕过 Next.js 静态文件缓存；同时设置 30 天浏览器缓存（`Cache-Control: public, immutable`）
  - 原因2：`/home/blog` 目录权限为 `750`，Nginx 工作进程（www-data）无权穿越该目录，导致 `stat()` 返回 Permission denied
  - 修复：`chmod o+x /home/blog`，仅开放目录穿越权限，不影响文件读写安全
  - Added: Nginx `location /uploads/` 块，alias 指向 `/home/blog/moji-blog/public/uploads/`，配合 try_files 直接返回文件
  - Added: src/app/api/upload/route.ts - 添加上传过程调试日志（cwd、uploadDir、filename、写入结果）
  - 教训：Next.js 生产模式下 `public/` 目录的文件变化不会被自动检测。对于用户动态上传的文件，应由反向代理（Nginx）直接提供服务，既解决问题又提升性能

## [1.1.37] - 2026-04-02

### Security

- **评论昵称输入安全加固**：对匿名评论的昵称字段增加严格的长度限制和内容安全校验，防止 XSS、SQL 注入及其他攻击性输入。
  - Modified: src/shared/types.ts - `authorName` 验证从 `max(50)` 改为 `min(1).max(10)`；新增正则 `/^[^<>&"'\u0000-\u001f\u007f]*$/` 拦截 HTML 标签字符、引号、控制字符
  - Modified: src/lib/sanitize.ts - 新增 `sanitizeText()` 纯文本净化函数：去除 HTML 标签、控制字符、HTML 实体编码、反斜杠转义
  - Modified: src/modules/comment/service.ts - `authorName` 字段改用 `sanitizeText()` 替代 `sanitizeHtml()`（纯文本字段无需 HTML 净化器）
  - Modified: src/components/comment/CommentSection.tsx - 输入框加 `maxLength={10}` 前端即时限制
  - Modified: src/lib/i18n.ts - 中英文 placeholder 更新为提示10字符限制
  - Security: 四层防御（前端输入限制 → Zod schema 验证 → 服务端 sanitizeText 净化 → Prisma 参数化查询）；昵称作为纯文本字段，不允许任何特殊字符

## [1.1.36] - 2026-04-02

### Fix

- **修复仪表盘统计数据全部为 0 的问题**：仪表盘的"总浏览量"、"已发布文章"、"草稿"、"待审核评论"四个指标硬编码为 0，无法反映真实数据。
  - Added: src/app/api/stats/route.ts - 新增统计 API，一次查询返回 totalPosts、publishedPosts、draftPosts、totalViews（aggregate sum）、totalComments、pendingComments
  - Modified: src/app/admin/dashboard/page.tsx - 从调用两个分页列表 API 改为调用单一 /api/stats 接口；所有卡片数据来源从硬编码改为真实数据库查询
  - 注意：文章浏览量计数（getPostBySlug 中的 viewCount increment）本身是正常工作的，只是仪表盘没有读取

## [1.1.35] - 2026-04-02

### Fix

- **修复 CSP nonce 阻止预渲染页面 JavaScript 执行导致后台无法登录**：中间件为所有页面路由设置了 nonce-based CSP（`script-src 'nonce-xxx'`），但 Next.js 15 对部分页面做静态预渲染（SSG），预渲染 HTML 中的 script 标签在构建时生成，不含 nonce 属性。浏览器执行时发现脚本缺少匹配的 nonce，直接阻止了所有 JS 加载，导致登录页按钮无响应、接口请求不发出、页面持续转圈。
  - Modified: src/middleware.ts - 页面路由不再设置 nonce-based CSP（Next.js 中间件无法可靠区分预渲染和动态渲染页面）；API 路由保持独立的严格 CSP（`default-src 'none'`）不变
  - 教训：nonce-based CSP 要求服务端在渲染 HTML 时将 nonce 注入每个 script 标签，这只对 SSR（服务端渲染）页面有效。对于 SSG（静态生成）页面，HTML 在构建时固定，运行时的 nonce 无法注入，CSP 会误杀所有合法脚本。在 Next.js 混合使用 SSG + SSR 的架构中，中间件层无法预知哪些页面是预渲染的，因此不宜在中间件统一施加 nonce CSP。安全策略应分层：API 路由独立设严格 CSP，页面路由的安全由 Nginx 安全头（X-Content-Type-Options、X-Frame-Options、HSTS 等）+ 应用层措施（CSRF、速率限制、输入校验）保障

## [1.1.34] - 2026-04-02

### Fix

- **修复反向代理下后台登录重定向地址错误**：在 Nginx 反向代理后运行时，middleware 生成的重定向 URL 使用了内部地址 (localhost:3000)，导致浏览器无法跳转到登录页。
  - Modified: src/middleware.ts - 新增 getOrigin() 函数，从 X-Forwarded-Proto / X-Forwarded-Host / Host 请求头还原真实外部域名；admin 登录重定向使用 getOrigin(request) 替代 request.nextUrl.origin
  - Fix: 访问 /admin 时重定向到 https://localhost:3000/admin/login 的问题；现在正确重定向到 https://heibao2.us.ci/admin/login

## [1.1.33] - 2026-04-02

### Security

- **Single-Session Login Enforcement**: Admin login now enforces single-session: logging in from a new location automatically invalidates all previous sessions for that account.
  - Modified: prisma/schema.prisma - added userId field to TokenBlacklist model with index; enables querying tokens by user
  - Modified: src/lib/token-blacklist.ts - added blacklistAllUserTokens() that writes a session-reset marker per user; isTokenBlacklisted() now checks if a token was issued before the users latest session reset by comparing JWT iat against the reset records createdAt; reset markers auto-expire after 7 days
  - Modified: src/modules/auth/service.ts - login() now calls blacklistAllUserTokens(user.id) before issuing a new token, invalidating all prior sessions
  - Modified: src/app/api/auth/logout/route.ts - logout now records userId alongside the blacklisted token for consistency
  - Security: prevents concurrent sessions on the same account; old sessions are invalidated at login time without requiring token enumeration (session-reset marker pattern)
## [1.1.32] - 2026-04-02

### Security

- **Enhanced Captcha Anti-OCR**: Strengthened SVG captcha generation to resist automated OCR recognition while remaining human-readable.
  - Modified: src/lib/captcha.ts - increased characters from 4 to 5; widened character set to exclude visually ambiguous pairs (0/O, 1/l/I); added Bezier curve interference lines replacing straight lines; added layered noise (background micro-dots, mid-layer blur bands, foreground overlay circles); per-character random affine transforms (translate, rotate, scale) with larger rotation range (-35 to +35 degrees); random font selection from 4 monospace families; expanded SVG canvas from 140x48 to 180x56; added foreground line cuts across character contours; varied dot sizes, colors, and opacities across 5 interference layers
  - Modified: src/components/comment/CommentSection.tsx - updated captcha input maxLength from 4 to 5; adjusted captcha image display dimensions to match new SVG size (180x56)
  - Security: multi-layer noise and affine character distortion significantly increase OCR error rate; Bezier curves are harder for segmentation algorithms to separate from characters than straight lines; random transforms ensure each captcha is structurally unique

## [1.1.31] - 2026-04-02

### Security

- **Remove Legacy emailToken Verification**: Removed the weak time-based HMAC emailToken fallback from the comment submission flow. Email verification now relies solely on the HttpOnly signed cookie session (7-day expiry), eliminating a 2-minute validity window token that added attack surface without meaningful benefit.
  - Modified: src/app/api/comments/verify-code/route.ts - removed emailToken generation (crypto.createHmac with minute-level timestamps); simplified response to { verified: true, email }; removed unused crypto import
  - Modified: src/app/api/comments/route.ts - POST handler now checks cookie session exclusively for email verification; removed emailToken validation logic and the 2-minute time window HMAC check; removed unused crypto import
  - Modified: src/components/comment/CommentSection.tsx - removed emailToken state variable and all references; removed emailToken from comment submission payload; verification status now determined entirely by server-side cookie
  - Security: eliminates a weak verification path where a leaked or intercepted emailToken (valid only ~2 minutes, predictable from timestamp + secret) could bypass email verification; cookie session uses HMAC-SHA256 signing with constant-time comparison and is not accessible to JavaScript (HttpOnly)

## [1.1.30] - 2026-04-02

### Security

- **Account Login Lockout**: Added per-username lockout mechanism to prevent brute-force attacks against specific accounts, complementing the existing IP-level rate limiting.
  - Added: src/lib/account-lockout.ts - in-memory lockout tracker keyed by lowercase username; tracks consecutive failed attempts and auto-locks for 30 minutes after 5 failures; clears counter on successful login; auto-cleans expired entries every 5 minutes
  - Modified: src/app/api/auth/login/route.ts - checks account lockout status before authentication; returns 429 with remaining lockout time on locked accounts; records failed attempts after login failure; clears failure counter on successful login; error message does not distinguish between wrong password and non-existent user (prevents username enumeration)
  - Security: IP rate limiting (5 attempts / 15 min) and account lockout (5 failures / 30 min) work together - IP limit prevents distributed scanning, account lockout prevents targeted brute-force of specific usernames

## [1.1.29] - 2026-04-02

### Security

- **CSP Script Nonce (Fix unsafe-inline)**: Replaced `script-src 'unsafe-inline'` with per-request cryptographic nonces to block XSS script injection while preserving legitimate Next.js hydration scripts.
  - Modified: src/middleware.ts - generates a random 16-byte nonce per page request using Web Crypto API (Edge Runtime compatible); sets CSP response header with `script-src 'self' 'nonce-{nonce}' 'strict-dynamic'`; passes nonce to Next.js via `x-nonce` request header so auto-generated script tags receive the nonce automatically; API routes get strict CSP (`default-src 'none'`); static assets skip CSP entirely
  - Modified: Nginx config (sites-enabled/default) - removed `Content-Security-Policy` header (now handled by Next.js middleware to allow per-request nonces); other security headers remain in Nginx
  - Security: `style-src 'unsafe-inline'` retained (required by Tailwind CSS runtime and next/font); `strict-dynamic` added to allow nonce-bearing scripts to load additional trusted scripts per CSP L3 spec
  - Impact: inline `<script>` tags without a valid nonce are now blocked by the browser, preventing XSS payloads from executing even if injected through user-generated content

## [1.1.28] - 2026-04-02

### Optimize

- **Email Verification Session Persistence**: Email verification now creates a persistent session (HttpOnly cookie, 7-day expiry) so users only verify their email once. Subsequent comments skip email verification as long as the session is valid and the email matches.
  - Added: src/lib/email-session.ts - cookie signing/verification utilities using HMAC-SHA256; provides setEmailVerifiedCookie(), getVerifiedEmail(), clearEmailVerifiedCookie(); cookie is HttpOnly + Secure + SameSite=Lax to prevent XSS and CSRF
  - Added: src/app/api/comments/verify-status/route.ts - new endpoint for frontend to check if current session has a valid email verification
  - Modified: src/app/api/comments/verify-code/route.ts - on successful verification, sets a signed HttpOnly cookie containing the email; still returns token for backward compatibility
  - Modified: src/app/api/comments/route.ts - POST handler now checks for valid email session cookie first; if cookie email matches authorEmail, skips emailToken validation; falls back to existing emailToken check if cookie is missing/invalid or email changed
  - Modified: src/components/comment/CommentSection.tsx - on mount, calls /api/comments/verify-status to check for existing session; if verified, pre-fills email and hides email verification UI; email change still resets verification
  - Security: cookie signed with HMAC-SHA256 using JWT_SECRET; constant-time comparison prevents timing attacks; backend validates cookie email matches submitted email
