# 05 · 组件与 Hooks（src/components、src/hooks）

> 除特别说明外均为客户端组件（`"use client"`）。动画统一基于 framer-motion。

## 1. 布局与全局（app 根 + components）

| 文件 | 类型 | 职责 |
|---|---|---|
| [app/layout.tsx](file:///workspace/src/app/layout.tsx) | 服务端 | 根布局：全局 metadata、favicon/manifest、**主题与阅读偏好防闪烁内联脚本**；Provider 嵌套顺序 `ThemeProvider → ReadingProvider → LocaleProvider → ToastProvider → ConditionalLayout` |
| [components/ConditionalLayout.tsx](file:///workspace/src/components/ConditionalLayout.tsx) | 客户端 | 非 admin 页渲染 `Header/Footer/ReadingProgress/CmdKSearch/BackToTop`；文章页附加 `TableOfContents`；整体包 `DisclaimerGate` |

### layout/
| 组件 | 职责 |
|---|---|
| `Header.tsx` | 顶部导航（logo、导航链接、语言/主题切换入口、Cmd+K 搜索入口） |
| `Footer.tsx` | 页脚（tagline、归档/搜索/订阅链接） |
| `MobileSettingsSheet.tsx` | 移动端设置抽屉（主题/阅读偏好/语言/专注模式） |

## 2. 动效组件（components/motion/）

| 组件 | 职责 |
|---|---|
| `PageTransition.tsx` | 路由切换过渡动画 |
| `ScrollReveal.tsx` | 进视口淡入/位移（`useInView`）；导出 `StaggerList`/`StaggerItem` 级联动画 |
| `PostReveal.tsx` | 文章内容揭示动画 |
| `ReadingProgress.tsx` | 顶部阅读进度条 |
| `BackToTop.tsx` | 返回顶部按钮 |
| `TableOfContents.tsx` | 从 `.prose` 提取 h1/h2/h3 生成目录；IntersectionObserver 高亮当前节；桌面侧栏 + 移动端导航两种形态 |
| `ImageZoom.tsx` | medium-zoom 实现 `.prose` 内图片点击放大，卸载时销毁 |
| `CmdKSearch.tsx` | Cmd/Ctrl+K 全局搜索弹层，调 `/api/search` |
| `FocusMode.tsx` | 专注模式（隐藏干扰元素） |

## 3. 功能组件

### comment/
- `CommentSection.tsx` — 完整评论区：拉取 `/api/comments?postId=`；支持匿名评论的**邮箱验证码流程**（verify-email → verify-code → 提交）与图形验证码；登录用户直接提交；提交后刷新列表。

### disclaimer/
- `DisclaimerGate.tsx` — 检查 `disc_ok` Cookie，未接受时渲染 Modal；同意后调 `/api/disclaimer/accept` 签发服务端 Cookie 并播放退出动画。
- `DisclaimerModal.tsx` — 免责声明弹窗（多段文案 + 同意按钮 + 滚动锁定）。

### editor/（后台文章编辑器核心）
- `TiptapEditor.tsx` — 基于 `@tiptap/react`：StarterKit + Underline/Link/Image/Highlight/CodeBlockLowlight(lowlight)/Placeholder/Typography 扩展；`getHTML()` 同步内容到表单。
- `ImageUploader.tsx` — 文章图集管理：拖拽/触摸排序、上传 `/api/upload`、关联 `/api/posts/{id}/images`、排序 `/api/posts/{id}/images/reorder`、预览。

### post/
- `PostCard.tsx` — 文章卡片（标题/摘要/分类/标签/阅读时长/浏览与评论数）。
- `ViewCounter.tsx` — 挂载时 POST `/api/view` 上报并展示浏览量（服务端 IP+slug 去重防刷）。

### providers/（全局 Context）
| Provider | 职责 |
|---|---|
| `ThemeProvider` | 明/暗/跟随系统主题，localStorage 持久化 |
| `ReadingProvider` | 阅读偏好（字号/行高/字体），作用于 `.prose` |
| `LocaleProvider` | zh-CN/en-US 切换，`moji-locale` Cookie 持久化 |
| `ToastProvider` | react-hot-toast 封装 |

### reading/
- `ReadingProvider.tsx` / `ReadingSettings.tsx` — 阅读偏好上下文与设置面板。

### theme/
- `ThemeProvider.tsx` / `ThemeToggle.tsx` — 主题上下文与切换按钮。

### ui/
- `Button.tsx` / `Input.tsx` — 基础 UI 原子组件（clsx 组合 className）。

### i18n/
- `Translated.tsx` — 客户端翻译渲染组件，配合 LocaleProvider 使用。

## 4. 自定义 Hooks（src/hooks/，index.ts 统一导出）

| Hook | 职责 |
|---|---|
| `useAuth` | 当前用户状态（调 `/api/auth/me`），admin 布局与编辑器鉴权依赖它 |
| `useDebounce` | 值防抖（搜索输入） |
| `useScrollLock` | 弹窗打开时锁定页面滚动 |
| `useEscapeKey` | Esc 关闭弹层 |

## 5. 前台页面（src/app/(public)/）

| 页面 | 关键实现 |
|---|---|
| 首页 `page.tsx` | `revalidate=300`；`generateMetadata`；服务端取最新 10 篇 |
| `about/page.tsx` | 关于页 |
| `archive/page.tsx` | 归档页（按月分组，`postService.getArchive()`） |
| `post/[slug]/page.tsx` | `revalidate=300` + `generateStaticParams`；`generateMetadata`（含 OG）；正文 `sanitizeHtml(post.content)` 后 `dangerouslySetInnerHTML` 渲染；展示阅读时长、浏览量、分类标签、上一篇/下一篇、评论区 |
| `category/[slug]/page.tsx` | 分类文章列表；`getPostsByCategory`；无结果 `notFound()` |
| `tag/[slug]/page.tsx` | 标签文章列表；`getPostsByTag` |
| `search/page.tsx` | 搜索页（客户端 + 防抖请求 `/api/search`） |

辅助 Metadata Routes：`robots.ts`（禁 /api/ 与 /admin/）、`sitemap.ts`（动态含已发布文章）、`not-found.tsx`（水墨风 404）。

## 6. 后台页面（src/app/admin/）

| 页面 | 功能 |
|---|---|
| `layout.tsx` | 客户端鉴权壳：`useAuth()` 校验，未登录重定向 `/admin/login`（Middleware 已做 Edge 层 JWT 校验，此为二次校验） |
| `login/page.tsx` | 登录页（图形验证码 + CSRF） |
| `dashboard/page.tsx` | 仪表盘（/api/stats 数据可视化） |
| `posts/page.tsx` | 文章管理列表（状态筛选/搜索/置顶/精华等操作） |
| `editor/[id]/page.tsx` | 新建/编辑文章：TiptapEditor + ImageUploader；有 `postId` 走 PUT `/api/posts/{id}`，否则 POST `/api/posts`；支持保存草稿/发布 |
| `categories/page.tsx` | 分类树管理 |
| `tags/page.tsx` | 标签管理 |
| `comments/page.tsx` | 评论审核（单条/批量通过、拒绝、删除） |
| `files/page.tsx` | 上传文件管理（/api/upload/list） |
| `settings/page.tsx` | 站点设置（ConfigService） |

后台视觉规范：`shared/admin-theme.ts` 集中定义 `adminTheme` 设计 token。
