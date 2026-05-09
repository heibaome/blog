# Moji Blog 安全审计报告

**项目**: Moji Blog (Next.js TypeScript)
**审计日期**: 2026-05-09
**技术栈**: Next.js 15 + TypeScript + Prisma + SQLite + Tailwind CSS

---

## 执行摘要

本报告对 Moji Blog 项目进行了全面的安全审计，基于 Next.js 和 React 安全最佳实践指南。审计范围涵盖认证、CSRF、XSS、SQL 注入、输入验证、敏感数据保护等关键安全领域。

**总体评估**: 项目安全状况良好，核心安全机制已正确实现，但仍存在一些需要关注的安全问题需要修复。

---

## 发现的漏洞

### 🔴 严重 (Critical)

#### NEXT-SESS-001: 会话 Cookie 安全属性配置问题

- **规则 ID**: NEXT-SESS-001
- **严重程度**: High
- **位置**:
  - `src/shared/security.ts` (认证模块)
  - `src/lib/auth.ts` (JWT Cookie 配置)
- **证据**:

```typescript
// src/lib/auth.ts
cookieStore.set(AUTH_COOKIE, token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production", // ⚠️ 仅在生产环境设置 Secure
  sameSite: "lax",
  maxAge: 7 * 24 * 60 * 60, // 7 天
});
```

```typescript
// src/shared/security.ts
cookieStore.set("csrf-token", csrfToken, {
  httpOnly: false, // ⚠️ CSRF Token 需要前端读取
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: 3 * 24 * 60 * 60,
});
```

- **影响**:
  - 如果部署时环境变量配置不当，可能导致 Cookie 在非 HTTPS 连接上传输
  - 攻击者可能通过中间人攻击窃取会话 Cookie

- **修复建议**:
  1. 确保生产环境强制使用 HTTPS
  2. 考虑添加 `SESSION_COOKIE_SECURE` 环境变量，显式控制 Secure 属性
  3. 添加安全检查中间件，验证生产环境是否使用 HTTPS

```typescript
// 建议的安全配置
cookieStore.set(AUTH_COOKIE, token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production" && process.env.SESSION_COOKIE_SECURE !== "false",
  sameSite: "lax",
  maxAge: 7 * 24 * 60 * 60,
  path: "/",
});
```

- **缓解措施**:
  - 确保服务器负载均衡器或反向代理配置正确转发 HTTPS 头
  - 使用 HSTS (HTTP Strict Transport Security) 响应头

---

### 🟡 高危 (High)

#### NEXT-INPUT-001: 搜索参数缺乏严格验证

- **规则 ID**: NEXT-INPUT-001
- **严重程度**: High
- **位置**: `src/modules/search/service.ts`
- **证据**:

```typescript
// src/modules/search/service.ts (第 37-46 行)
async search(query: string, limit = 20) {
  const trimmed = query.trim();

  if (!trimmed || trimmed.length < 2) return [];
  if (trimmed.length > 200) return [];

  const cleaned = sanitizeFts5Query(trimmed);
  if (!cleaned) return [];

  const fts5Query = segmentCJK(cleaned);
  // ...
}
```

- **影响**:
  - 虽然有长度限制，但缺少类型验证
  - 如果 `limit` 参数被外部控制，可能导致资源耗尽

- **修复建议**:

```typescript
async search(query: string, limit: number = 20) {
  // 类型和范围验证
  if (typeof query !== "string" || typeof limit !== "number") {
    throw new Error("Invalid parameters");
  }

  const trimmed = query.trim();
  if (!trimmed || trimmed.length < 2) return [];
  if (trimmed.length > 200) return [];

  // 限制参数范围
  const safeLimit = Math.min(Math.max(1, Math.floor(limit)), 100);

  // ...
}
```

---

#### NEXT-XSS-001: dangerouslySetInnerHTML 使用需要加强防护

- **规则 ID**: NEXT-XSS-001
- **严重程度**: High
- **位置**: `src/app/(public)/post/[slug]/page.tsx`
- **证据**:

```typescript
// src/app/(public)/post/[slug]/page.tsx (第 103-106 行)
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
/>

// 第 185 行
<div
  className="prose max-w-none"
  dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.content) }}
/>
```

- **影响**:
  - JSON-LD 虽然是服务器生成的，但如果 post 对象被污染可能造成问题
  - 文章内容虽然经过 sanitizeHtml 处理，但仍需确保处理逻辑严格

- **修复建议**:
  1. JSON-LD 使用类型安全的序列化方法
  2. 确保 sanitizeHtml 配置严格且经过安全审计

```typescript
// JSON-LD 安全序列化
import { serializeToString } from "json-dry";

const jsonLdScript = `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>`;
```

---

### 🟠 中等 (Medium)

#### NEXT-CSRF-001: CSRF 保护需要验证完整覆盖

- **规则 ID**: NEXT-CSRF-001
- **严重程度**: High
- **位置**: 全局 API 路由
- **证据**:

项目已实现 CSRF 保护 (`src/lib/csrf.ts`)，但需要验证所有状态改变端点都有保护：

```typescript
// src/lib/csrf.ts
export async function verifyCsrf(token: string): Promise<boolean> {
  const stored = getCsrfCookie();
  if (!stored || !token) return false;
  return crypto.timingSafeEqual(Buffer.from(stored), Buffer.from(token));
}
```

- **影响**:
  - 需要确保所有 POST/PUT/PATCH/DELETE 请求都验证 CSRF Token

- **修复建议**:
  创建统一的 API 错误处理中间件：

```typescript
// src/lib/api-middleware.ts
export async function withCsrfProtection(request: Request): Promise<NextResponse | null> {
  if (["POST", "PUT", "PATCH", "DELETE"].includes(request.method)) {
    const token = request.headers.get("X-CSRF-Token");
    const verified = await verifyCsrf(token);
    if (!verified) {
      return NextResponse.json({ error: "CSRF token invalid" }, { status: 403 });
    }
  }
  return null; // 验证通过
}
```

---

#### NEXT-SESS-002: 会话有效期过长

- **规则 ID**: NEXT-SESS-002
- **严重程度**: Medium
- **位置**: `src/lib/auth.ts`
- **证据**:

```typescript
maxAge: 7 * 24 * 60 * 60, // 7 天会话有效期
```

- **影响**:
  - 长时间有效的会话增加了被盗用的风险
  - 管理员会话不应与普通用户会话使用相同策略

- **修复建议**:

```typescript
// 根据角色设置不同的会话有效期
const getSessionMaxAge = (role: string): number => {
  switch (role) {
    case "admin":
      return 2 * 60 * 60; // 管理员: 2 小时
    case "author":
      return 4 * 60 * 60;  // 作者: 4 小时
    default:
      return 24 * 60 * 60; // 读者: 24 小时
  }
};
```

---

#### NEXT-HEADERS-001: 缺少关键安全响应头

- **规则 ID**: NEXT-HEADERS-001
- **严重程度**: Medium
- **位置**: `src/app/layout.tsx` 或中间件
- **影响**:
  - 缺少 X-Content-Type-Options: nosniff
  - 缺少 X-Frame-Options 或 CSP frame-ancestors
  - 缺少 Referrer-Policy

- **修复建议**:

```typescript
// src/middleware.ts 或 layout.tsx
export function generateHeaders() {
  return [
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  ];
}
```

---

### 🟢 低危 (Low)

#### NEXT-CSP-001: 建议添加 Content Security Policy

- **规则 ID**: NEXT-CSP-001
- **严重程度**: Medium
- **位置**: 全局
- **影响**:
  - 缺少 CSP 会降低 XSS 攻击的防护能力

- **修复建议**:

```typescript
// 基础 CSP 配置
const cspDirectives = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'", // Next.js 需要
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https:",
  "font-src 'self'",
  "connect-src 'self'",
  "frame-ancestors 'none'",
].join("; ");

export function generateHeaders() {
  return [
    { key: "Content-Security-Policy", value: cspDirectives },
    // ...
  ];
}
```

---

#### REACT-AUTH-001: localStorage 用于非敏感数据需谨慎

- **规则 ID**: REACT-AUTH-001
- **严重程度**: Low
- **位置**: `src/components/theme/ThemeProvider.tsx`, `src/components/reading/ReadingProvider.tsx`
- **证据**:

```typescript
// src/components/theme/ThemeProvider.tsx
localStorage.setItem(STORAGE_KEY, newTheme);

// src/components/reading/ReadingProvider.tsx
localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
```

- **影响**:
  - 虽然使用的是主题和阅读偏好设置，但遵循最佳实践更好
  - localStorage 可被 XSS 访问

- **修复建议**:
  这些数据可以使用 sessionStorage 替代，或添加前缀标记为非敏感数据

---

## 已实施的良好安全实践

### ✅ 认证与授权

- [x] JWT Token 生成使用 crypto.randomBytes (256 位熵)
- [x] 密码使用 bcryptjs 哈希 (cost factor 12)
- [x] requireAuth 中间件保护所有需要认证的端点
- [x] 角色权限分层 (admin/author/reader)

### ✅ CSRF 防护

- [x] Double-Submit Cookie 模式实现
- [x] CSRF Token 生成使用 crypto.randomBytes (32 字节)
- [x] 使用 timingSafeEqual 防止时序攻击

### ✅ XSS 防护

- [x] DOMPurify 净化所有用户生成的 HTML
- [x] 评论内容多层次验证 (零宽字符、控制字符、长度限制)
- [x] 禁止危险标签 (script, iframe, object 等)
- [x] 禁止危险属性 (onerror, onload 等)

### ✅ SQL 注入防护

- [x] 使用 Prisma ORM 参数化查询
- [x] FTS5 查询使用 sanitizeFts5Query 清洗输入

### ✅ 速率限制

- [x] 登录: 15 分钟内 5 次尝试
- [x] 评论: 1 分钟内 5 次
- [x] 通用: 1 分钟内 30 次

### ✅ 账号锁定

- [x] 基于用户名的失败计数
- [x] 指数退避锁定时间 (5min → 10min → ... → 6h)
- [x] IP 级别限制防止分布式攻击

### ✅ 验证码系统

- [x] SVG 图形验证码抗 OCR
- [x] 5 分钟有效期
- [x] 单次使用

---

## 建议的安全改进优先级

### 立即修复 (1-2 周内)

1. **验证 HTTPS 部署**: 确保生产环境强制使用 HTTPS
2. **添加安全响应头**: X-Content-Type-Options, X-Frame-Options, Referrer-Policy
3. **增强输入验证**: 所有 API 端点添加严格的类型和范围检查

### 短期改进 (1 个月内)

4. **实现 CSP**: 添加 Content Security Policy
5. **会话管理优化**: 根据角色设置不同会话有效期
6. **审计日志**: 添加安全相关的操作审计日志

### 长期改进 (季度规划)

7. **渗透测试**: 聘请专业安全团队进行渗透测试
8. **依赖安全扫描**: 集成 GitHub Dependabot 和 npm audit
9. **安全培训**: 对开发团队进行安全编码培训

---

## 测试建议

### 手动测试清单

- [ ] CSRF 攻击测试
- [ ] XSS 注入测试 (多种绕过技巧)
- [ ] SQL 注入测试
- [ ] 会话劫持测试
- [ ] 暴力破解测试 (登录锁定机制)
- [ ] 权限绕过测试 (尝试访问更高权限资源)

### 自动化测试

```bash
# 依赖安全扫描
npm audit

# 依赖更新检查
npm outdated

# 类型检查
npm run typecheck

# ESLint 检查
npm run lint
```

---

## 结论

Moji Blog 项目整体安全状况良好，核心安全机制 (认证、CSRF、XSS、SQL 注入) 已正确实现。发现的问题主要集中在安全响应头配置和会话管理优化方面，属于中低风险等级。

建议按照本报告的优先级顺序逐步修复发现的问题，同时建立持续的安全监控和定期审计机制。

---

## 参考资料

- [Next.js Security Best Practices](https://nextjs.org/blog/security-nextjs-server-components-actions)
- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/)
- [React Security Guidelines](https://react.dev/reference/react-dom/components/common)
- [MDN Web Security](https://developer.mozilla.org/en-US/docs/Web/Security)
