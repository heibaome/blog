# 02 · 数据模型（Prisma）

> 源文件：[prisma/schema.prisma](file:///workspace/prisma/schema.prisma)。数据库 SQLite，全部模型通过 `@@map` 映射到蛇形命名表。

## 1. ER 关系图

```
User 1──* Post *──* Tag          (PostTag 中间表, 双向 Cascade)
 │          │
 │          │ *                   (Category 自关联树 "CategoryTree")
 │          ▼
 │        Category
 │          │
 │ 1──* Comment *──1 CommentContent   (内容哈希去重, 引用计数)
 │          │
 └──────────┘ (Comment.userId 可选)
Post 1──* PostImage (Cascade)
Post 1──* Comment  (Cascade)
Comment 自关联树 "CommentTree" (parentId, 删除时 SetNull)
```

辅助表：`SiteConfig`（KV 配置）、`TokenBlacklist`（JWT 黑名单）、`Captcha`（图形验证码）、`EmailVerification`（邮箱验证码）。

## 2. 模型明细

### User（users）
| 字段 | 类型 | 说明 |
|---|---|---|
| id | String cuid @id | |
| username | String @unique | 登录名（也支持邮箱登录） |
| email | String @unique | |
| password | String | bcrypt 12 轮哈希 |
| displayName / avatar | String? | 展示信息（作者公开字段仅暴露 displayName/avatar/role） |
| role | String default "author" | admin / author / reader |

关联：`posts[]`、`comments[]`。

### Post（posts）— 核心模型
| 字段 | 类型 | 说明 |
|---|---|---|
| slug | String @unique | URL 标识，`/post/[slug]` |
| title / content / summary | String | 正文为 Tiptap 输出的 HTML |
| coverImage | String? | 封面（仅允许 `/uploads/` 本站路径） |
| status | String default "draft" | draft / published / archived |
| isTop / isEssence / isOutdated | Boolean | 置顶 / 精华 / 过时标记 |
| aiSummary | String? | AI 摘要 |
| viewCount | Int default 0 | 浏览量（异步递增） |
| publishedAt | DateTime? | 首次发布时间，列表排序键 |
| authorId → User | | |
| categoryId → Category? | | |

索引：`status`、`publishedAt`、`authorId`、复合 `(status, publishedAt)`（已发布列表查询）。

### Category（categories）— 自关联树
`parentId → parent` / `children[]`（关系名 "CategoryTree"），`name`/`slug` 双唯一，`sortOrder` 排序。删除前需检查子分类（业务层控制）。

### Tag（tags）+ PostTag（post_tags）
- Tag：`name`/`slug` 双唯一。
- PostTag：复合主键 `(postId, tagId)`，双向 `onDelete: Cascade`。

### Comment（comments）— 自关联树 + 内容外置
| 字段 | 说明 |
|---|---|
| status | default "pending"：pending / approved（管理员自动通过） |
| authorName / authorEmail | 匿名评论者信息（登录用户不存） |
| ipHash | `sha256(ip+salt)` 前 16 位，隐私保护 |
| contentId → CommentContent | 正文外置去重 |
| postId → Post (Cascade) | |
| userId → User? | 登录评论者 |
| parentId → Comment? (SetNull) | 楼中楼；父删除后提升层级 |

索引：`postId`、`status`、`contentId`、`parentId`、复合 `(postId, status)`、`createdAt`。

### CommentContent（comment_contents）— 内容去重
`content` 原文 + `contentHash`（sha256，唯一）+ `refCount` 引用计数。相同内容（trim+lowercase 归一化后哈希一致）只存一份；删除评论时 `refCount-1`，减到 0 才物理删除（见 modules/comment/service.ts）。

### PostImage（post_images）
文章图集：`url`、`sortOrder`（可重排序）、`postId`（Cascade）。删除文章时由业务层同步清理磁盘文件（shared/files.ts）。

### SiteConfig（site_config）
KV 配置表：`key @id` / `value`。ConfigService 使用 `upsert` 写入并提供默认配置兜底。

### TokenBlacklist（token_blacklist）
`tokenHash @id`（sha256）、`userId?`、`exp`（秒级时间戳）。索引 `exp`、`userId`。用于登出失效与"单地登录"踢旧会话；`cleanupExpiredTokens()` 定期清理过期项。

### Captcha（captchas）
`token @id` / `answer` / `expires`。图形验证码一次性消费。

### EmailVerification（email_verifications）
`email` / `code`（6 位）/ `expires`。索引 `email`、`expires`。

## 3. 级联与清理策略

| 操作 | 数据库行为 | 应用层补充 |
|---|---|---|
| 删除 Post | Comment/PostImage 级联删除 | `PostService.deletePost` 先删记录，再删 PostImage 磁盘文件 + 清理正文/封面中引用的 `/uploads/` 文件 |
| 删除 Comment | parentId SetNull | `deleteComment` 先将首个子评论"过继"给父级，再删记录并 `releaseContent()` 释放引用计数 |
| 删除 Tag | PostTag 级联删除 | — |

## 4. 种子数据（prisma/seed.ts）

- 默认管理员：用户名 `饕餮_adminheibao`（admin 角色）
- 默认分类：技术、生活、随笔
- 默认标签：JavaScript、TypeScript、React、Next.js
- 若干示例文章（关联作者/分类/标签/发布时间）

> ⚠️ seed 中含默认密码，生产环境部署后应立即修改。
