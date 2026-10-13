# Moji Blog · Code Wiki

> 代码 Wiki 导航首页。本 Wiki 基于 v1.1.68 源码分析生成，描述项目整体架构、模块职责、关键类与函数、依赖关系与运行方式。

## 项目概览

| 项 | 值 |
|---|---|
| 名称 | **moji-blog**（站点：inklog.cn，水墨风格个人博客） |
| 版本 | 1.1.68 |
| 技术栈 | Next.js 15 (App Router) + React 19 + TypeScript 5.8 |
| ORM / 数据库 | Prisma 6 + SQLite（`DATABASE_URL=file:./dev.db`） |
| 样式 | Tailwind CSS 4 + 水墨主题 |
| 编辑器 | Tiptap 2（StarterKit + Link/Image/CodeBlockLowlight 等扩展） |
| 认证 | JWT（httpOnly Cookie）+ Token 黑名单 + bcryptjs |
| 语言 | 中英双语（zh-CN / en-US），Cookie + Accept-Language 协商 |

## 文档目录

| 文档 | 内容 |
|---|---|
| [01-架构总览](01-architecture.md) | 分层架构、目录结构、请求流转、渲染与缓存策略、安全架构 |
| [02-数据模型](02-data-model.md) | Prisma 全部 13 个模型、关系图、索引设计 |
| [03-业务模块](03-modules.md) | `src/modules/` 7 个 Service 的方法级说明 |
| [04-API 参考](04-api-reference.md) | `src/app/api/` 全部 30 个路由的方法、鉴权、验证 |
| [05-组件与 Hooks](05-components.md) | `src/components/`、`src/hooks/` 组件清单与职责 |
| [06-工具库与共享层](06-lib-shared.md) | `src/lib/` 与 `src/shared/` 每个文件的导出与机制 |
| [07-依赖关系](07-dependencies.md) | 运行时/开发依赖清单、内部模块依赖图 |
| [08-运行与部署](08-running.md) | 环境变量、开发/构建/部署命令、PM2、数据库操作 |

## 一分钟理解项目

- **前台**：`(public)` 路由组提供首页、归档、分类/标签/搜索页与文章详情页，均为服务端组件 + ISR（`revalidate = 300`）；文章正文以 Tiptap 产生的 HTML 存储，服务端经 DOMPurify 白名单净化后渲染。
- **后台**：`/admin` 由 Edge Middleware 做 JWT 签名校验（Web Crypto 实现），客户端 `useAuth` 二次校验；仪表盘、文章编辑、分类/标签/评论/文件/设置管理。
- **API**：Route Handlers + Zod 白名单校验 + 统一 `errorResponse/successResponse`；写操作经 Middleware 层 CSRF 双重校验。
- **业务层**：`src/modules/*` 按领域划分 Service 类（auth/post/comment/category/tag/search/config），通过全局 Prisma 单例访问数据库。
- **安全横切**：限流（内存）、账号锁定、图形验证码、邮箱验证码、内容敏感词过滤、IP 哈希、上传魔数校验、SVG 净化、图片防盗链。
