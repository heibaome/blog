# Moji Blog 架构文档

## 项目概述
- **名称**: Moji Blog
- **版本**: 1.1.68
- **技术栈**: Next.js 15 + TypeScript + Prisma + Tailwind CSS
- **数据库**: SQLite (开发环境)

## 目录结构

```
src/
├── app/                    # Next.js App Router
│   ├── (public)/          # 公开页面
│   ├── admin/             # 管理后台
│   └── api/               # API 路由
├── components/            # React 组件
│   ├── layout/           # 布局组件
│   ├── motion/           # 动画组件
│   ├── ui/               # 基础UI组件
│   └── [feature]/        # 功能组件
├── lib/                   # 工具函数
├── modules/               # 业务逻辑服务
├── shared/                # 共享类型和工具
└── hooks/                 # 自定义 React Hooks (待创建)
```

## 核心架构

### 1. 数据层
- **数据库**: Prisma ORM + SQLite
- **模型**: 用户、文章、分类、标签、评论等
- **连接**: 全局 Prisma 客户端实例

### 2. 业务逻辑层
- **位置**: `src/modules/`
- **模式**: 面向服务的架构 (Service Classes)
- **示例**: `PostService`, `CommentService`, `AuthService`

### 3. API 层
- **框架**: Next.js Route Handlers
- **验证**: Zod schema 验证
- **错误处理**: 统一的 AppError 类
- **安全**: CSRF 防护、速率限制、内容过滤

### 4. 前端层
- **框架**: Next.js App Router
- **状态管理**: React Context + Local Storage
- **样式**: Tailwind CSS + CSS Modules
- **动画**: Framer Motion

## 安全架构

### 认证与授权
- JWT 令牌认证
- 角色权限系统 (admin/author/reader)
- 邮箱验证码机制

### 数据安全
- 密码哈希: bcryptjs
- 敏感数据过滤
- SQL 注入防护 (Prisma)
- XSS 防护 (DOMPurify)

### 请求安全
- CSRF 令牌
- 速率限制
- IP 哈希记录
- 请求体大小限制

## 性能优化

### 服务端
- Prisma 连接池
- 数据库索引优化
- 分页查询
- 缓存策略

### 客户端
- 图片懒加载
- 代码分割
- 预加载关键资源
- 防抖搜索

## 开发规范

### 代码风格
- TypeScript 严格模式
- ESLint + Prettier
- 组件命名: PascalCase
- 函数命名: camelCase

### 提交规范
- Conventional Commits
- 提交前代码检查
- 自动化测试 (待添加)

## 部署架构

### 进程管理
- PM2 进程守护
- 零停机部署
- 内存限制: 300MB
- 日志轮转

### 监控
- 进程健康检查
- 错误日志收集
- 性能监控 (待添加)

## 待优化项

1. **错误监控**: 集成 Sentry 或类似服务
2. **测试覆盖**: 添加单元测试和集成测试
3. **CI/CD**: 自动化部署流程
4. **数据库迁移**: 生产环境考虑 PostgreSQL
5. **缓存层**: Redis 缓存集成

## 维护指南

### 开发环境
```bash
# 安装依赖
npm install

# 开发服务器
npm run dev

# 数据库迁移
npm run db:push

# 生成 Prisma 客户端
npm run db:generate
```

### 生产环境
```bash
# 构建
npm run build

# 启动
npm start

# PM2 管理
pm2 start ecosystem.config.js
```

---

*最后更新: 2026-04-11*
