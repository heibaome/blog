import { z } from "zod";
import { ALLOWED_EMAIL_DOMAINS } from "@/shared/constants";

// Post schemas
export const createPostSchema = z.object({
  title: z.string().min(1, "标题不能为空").max(200, "标题过长"),
  slug: z
    .string()
    .min(1, "slug 不能为空")
    .max(100)
    .regex(/^[a-z0-9-]+$/, "slug 只能包含小写字母、数字和连字符"),
  content: z.string().default(""),
  summary: z.string().max(500, "摘要过长").default(""),
  coverImage: z.string().url().optional().nullable(),
  status: z.enum(["draft", "published", "archived"]).default("draft"),
  isTop: z.boolean().default(false),
  isEssence: z.boolean().default(false),
  isOutdated: z.boolean().default(false),
  aiSummary: z.string().max(1000, "AI摘要过长").optional().nullable(),
  categoryId: z.string().optional().nullable(),
  tagIds: z.array(z.string()).default([]),
});

export const updatePostSchema = createPostSchema.partial();

// Comment schema（authorEmail 的必填逻辑在路由层处理：匿名用户必填，登录用户可选）
export const createCommentSchema = z.object({
  postId: z.string().min(1),
  content: z.string().min(1, "评论不能为空").max(2000, "评论过长"),
  parentId: z.string().optional().nullable(),
  authorName: z.string()
    .min(1, "昵称不能为空")
    .max(10, "昵称不能超过10个字符")
    .regex(/^[^<>&"'\u0000-\u001f\u007f]*$/, "昵称包含不允许的字符")
    .optional()
    .nullable(),
  authorEmail: z.string().email("邮箱格式不正确").refine((v) => { if (!v) return true; const domain = v.toLowerCase().split("@")[1]; return !!domain && ALLOWED_EMAIL_DOMAINS.some((d) => domain === d.slice(1)); }, "仅支持 QQ邮箱、Gmail、网易163邮箱").optional().nullable(),
});

// Auth schemas
export const loginSchema = z.object({
  username: z.string().min(1, "用户名不能为空"),
  password: z.string().min(6, "密码至少6位"),
});

export const registerSchema = z.object({
  username: z
    .string()
    .min(2, "用户名至少2位")
    .max(30)
    .regex(/^[a-zA-Z0-9_\u4e00-\u9fa5]+$/, "用户名包含非法字符"),
  email: z.string().email("邮箱格式不正确"),
  password: z.string().min(6, "密码至少6位").max(100),
});

// Profile update schema（路由层白名单校验，拒绝未知字段）
export const updateProfileSchema = z.object({
  displayName: z.string().max(20, "显示名称过长").optional(),
  email: z.string().email("邮箱格式不正确").optional(),
  avatar: z.string().url("头像必须是有效的 URL").optional(),
}).strict("存在不允许的字段");

// Credentials update schema（邮箱验证码 + 改用户名或密码）
export const updateUsernameSchema = z.object({
  type: z.literal("username"),
  code: z.string().length(6, "验证码必须为6位"),
  username: z
    .string()
    .min(2, "用户名至少2位")
    .max(30, "用户名过长")
    .regex(/^[a-zA-Z0-9_\u4e00-\u9fa5]+$/, "用户名包含非法字符"),
});

export const updatePasswordSchema = z.object({
  type: z.literal("password"),
  code: z.string().length(6, "验证码必须为6位"),
  oldPassword: z.string().min(6, "旧密码至少6位"),
  newPassword: z.string().min(6, "新密码至少6位").max(100, "密码过长"),
});

export const updateCredentialsSchema = z.discriminatedUnion("type", [
  updateUsernameSchema,
  updatePasswordSchema,
]);

// Tag/Category schemas
export const createTagSchema = z.object({
  name: z.string().min(1).max(30),
  slug: z
    .string()
    .min(1)
    .max(30)
    .regex(/^[a-z0-9-]+$/),
});

export const createCategorySchema = z.object({
  name: z.string().min(1).max(50),
  slug: z
    .string()
    .min(1)
    .max(50)
    .regex(/^[a-z0-9-]+$/),
  parentId: z.string().optional().nullable(),
  sortOrder: z.number().int().default(0),
});

// PostImage schemas
export const postImageUrlSchema = z.object({
  url: z.string()
    .min(1, "图片路径不能为空")
    .refine((v) => v.startsWith("/uploads/"), "仅允许本站上传的图片路径"),
});

export const reorderImagesSchema = z.object({
  ids: z.array(z.string().min(1)).min(1, "至少需要一个图片 ID"),
});

// Pagination
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(12),
  search: z.string().optional(),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;
export type UpdatePostInput = z.infer<typeof updatePostSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;

// 认证用户类型
export interface AuthUser {
  id: string;
  username: string;
  email: string;
  role: "admin" | "author" | "reader";
  avatar?: string | null;
  displayName?: string | null;
}
