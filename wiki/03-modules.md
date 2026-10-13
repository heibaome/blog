# 03 · 业务模块（src/modules）

> 业务逻辑层采用面向服务架构（Service Class）。每个模块导出单例（如 `postService`），统一通过 `@/shared/db` 的 Prisma 单例访问数据库，错误统一抛 `AppError`（shared/errors.ts）。

## 1. 模块清单

| 模块 | 文件 | 职责 | 主要数据模型 |
|---|---|---|---|
| auth | [auth/service.ts](file:///workspace/src/modules/auth/service.ts) | 登录/注册/资料 | User |
| post | [post/service.ts](file:///workspace/src/modules/post/service.ts) | 文章全生命周期 | Post, PostImage, PostTag |
| comment | [comment/service.ts](file:///workspace/src/modules/comment/service.ts) | 评论树/审核/去重 | Comment, CommentContent |
| category | [category/service.ts](file:///workspace/src/modules/category/service.ts) | 分类树 CRUD | Category |
| tag | [tag/service.ts](file:///workspace/src/modules/tag/service.ts) | 标签 CRUD | Tag |
| search | [search/service.ts](file:///workspace/src/modules/search/service.ts) | 公开搜索 | Post |
| config | [config/service.ts](file:///workspace/src/modules/config/service.ts) | 站点配置 KV | SiteConfig |

## 2. AuthService

```ts
class AuthService {
  async login(input: LoginInput): Promise<{ token, user }>       // 用户名或邮箱登录
  async register(input: RegisterInput): Promise<{ token, user }> // 注册（当前路由层已关闭）
  async getProfile(userId: string)                               // 资料含 _count.posts
  async updateProfile(userId, data: { displayName?, avatar?, email? })
}
export const authService = new AuthService();
```

关键行为：
- `login`：`input.username` 含 `@` 按 email 查，否则按 username 查；bcrypt 校验；成功后 `blacklistAllUserTokens(user.id)` **踢掉所有旧会话（单地登录）**，再签发新 JWT。
- `updateProfile`：字段级增量更新；email 更新前查重（409）。

## 3. PostService

模块级共享导出：
- `AUTHOR_PUBLIC_SELECT` = `{ displayName, avatar, role }` —— 前台作者公开字段
- `AUTHOR_ADMIN_SELECT` = `{ id, username }` —— 后台作者字段
- `buildSearchWhere(search, fields?)` —— 构造 `OR: [{field: {contains}}]`，与 SearchService 共用

| 方法 | 签名要点 | 说明 |
|---|---|---|
| `getPublishedPosts` | `(PaginationInput)` → `{posts, page, pageSize, hasMore}` | 前台列表；`status=published`，排序 `[isTop desc, publishedAt desc]`，含作者/分类/标签/评论数；取 `pageSize+1` 判断 hasMore |
| `getPostBySlugStatic` | `(slug)` → Post | 静态渲染用，不递增浏览量；含 images（按 sortOrder） |
| `incrementViewCount` | `(slug)` → `{viewCount}` | `update viewCount: {increment:1}`；P2025 转 404 |
| `getViewCount` | `(slug)` → `{viewCount}` | 只读 |
| `getAllPosts` | `(PaginationInput & {status?})` → `{posts, total, totalPages}` | 后台列表；搜索仅 title/summary；`Promise.all` 并行取数与计数 |
| `getPostById` | `(id)` | 后台编辑用，含 tags/images |
| `createPost` | `(CreatePostInput, authorId)` | slug 查重（409）；`status=published` 时写入 `publishedAt`；tagIds 建关联 |
| `updatePost` | `(id, UpdatePostInput)` | **显式白名单**逐字段拷贝，防止意外写入；slug 变更查重；状态从非 published→published 时补 `publishedAt`；tagIds 用 `deleteMany + create` 全量替换 |
| `deletePost` | `(id)` | 先删 DB 记录（PostImage 级联）→ 再删图片磁盘文件 → `cleanupPostImages()` 清理正文/封面内嵌图片 |
| `getPostsByCategory` | `(categorySlug, PaginationInput)` | 分类不存在抛 404，返回 `{category, posts, hasMore}` |
| `getPostsByTag` | `(tagSlug, PaginationInput)` | `tags: {some: {tagId}}` 过滤，返回 `{tag, posts, hasMore}` |
| `getArchive` | `()` → `Record<"YYYY-MM", Post[]>` | 按月分组归档，`take: 1000` 上限保护 |
| `getAdjacentPosts` | `(publishedAt, currentId)` | 上一篇（`lt` 取最近）/下一篇（`gt` 取最早） |

## 4. CommentService

内部工具函数（模块私有）：
- `normalizeContent(raw)` / `contentHash(normalized)` —— trim+lowercase 后 sha256
- `getOrCreateContent(raw)` —— 哈希命中则 `refCount+1`，否则新建
- `releaseContent(contentId)` —— `refCount-1`，减到 0 删除记录
- `formatComment(c)` —— 剥离 `authorEmail/ipHash` 敏感字段，注入 `content` 文本与空 `replies`
- `buildCommentTree(all)` —— **O(n) 两遍扫描**（Map 索引）构建楼中楼树

| 方法 | 说明 |
|---|---|
| `getPostComments(postId)` | 前台：仅 `status=approved`，按时间升序，O(n) 建树 |
| `createComment(input, userId?, ip?, userRole?)` | ① 校验 post 存在、parentId 属于同一 post；② 自动通过判定：`userRole==="admin"`，或匿名邮箱匹配到 admin 用户邮箱（并归属其 userId）；③ `validateAndSanitizeComment()` 净化；④ 内容去重入库；⑤ 匿名评论存 `sanitizeText(authorName)`（默认"匿名用户"）与 `hashIP(ip)`，否则不存；⑥ 状态 `autoApprove ? approved : pending` |
| `getAllComments({page,pageSize,status?,search?,postId?})` | 后台：搜索覆盖评论内容/昵称/用户名；关联 post、user |
| `getPostOptions()` | 最近 100 篇文章 `{id,title}`，供后台评论筛选下拉 |
| `updateCommentStatus(id, status)` | 单条审核 |
| `batchUpdateStatus(ids, status)` | `updateMany`，上限 100 条 |
| `batchDelete(ids)` | 逐条调 `deleteComment`，失败跳过，返回成功数 |
| `deleteComment(id)` | 子评论处理：长子过继给祖父，其余挂到长子；删除后释放 CommentContent |

## 5. CategoryService / TagService

- `CategoryService`：分类 CRUD；处理父子分类与 `sortOrder`；唯一约束冲突（P2002）经 `handlePrismaUniqueError` 转友好报错；删除前检查子分类存在性。
- `TagService`：标签 CRUD；创建/更新做 slug 唯一性处理；删除前存在性校验。

## 6. SearchService

复用 `PostService.buildSearchWhere`，仅查 `status=published`，按 `publishedAt desc` 排序，返回摘要与分类信息，供 `/api/search`（Cmd+K 全局搜索与搜索页）使用。

## 7. ConfigService

站点配置 KV 读写：读取时提供默认配置兜底，写入用 `prisma.siteConfig.upsert`（按 key 创建或更新）。

## 8. 模块间依赖

```
SearchService ──复用──► PostService.buildSearchWhere
CommentService ──► lib/sanitize（净化）、shared/security（hashIP）
PostService ──► shared/files（图片清理）、shared/paginate（分页）
全部 Service ──► shared/db（prisma 单例）、shared/errors（AppError）
API 路由 ──► shared/security（requireAuth/requireAdmin）──► modules/*Service
```
