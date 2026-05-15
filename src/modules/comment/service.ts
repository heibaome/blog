import { prisma } from "@/shared/db";
import { hashIP } from "@/shared/security";
import { AppError } from "@/shared/errors";
import { type CreateCommentInput } from "@/shared/types";
import { validateAndSanitizeComment, sanitizeText } from "@/lib/sanitize";
import { createHash } from "crypto";

/** 标准化评论内容用于去重比较 */
function normalizeContent(raw: string): string {
  return raw.trim().toLowerCase();
}

/** 计算内容哈希 */
function contentHash(normalized: string): string {
  return createHash("sha256").update(normalized).digest("hex");
}

/** 获取或创建 CommentContent（去重） */
async function getOrCreateContent(raw: string) {
  const normalized = normalizeContent(raw);
  const hash = contentHash(normalized);

  const existing = await prisma.commentContent.findUnique({
    where: { contentHash: hash },
  });

  if (existing) {
    return prisma.commentContent.update({
      where: { id: existing.id },
      data: { refCount: { increment: 1 } },
    });
  }

  return prisma.commentContent.create({
    data: { content: raw, contentHash: hash, refCount: 1 },
  });
}

/** 释放 CommentContent 引用 */
async function releaseContent(contentId: string) {
  try {
    const cc = await prisma.commentContent.findUnique({
      where: { id: contentId },
    });
    if (!cc) return;

    if (cc.refCount <= 1) {
      await prisma.commentContent.delete({ where: { id: contentId } });
    } else {
      await prisma.commentContent.update({
        where: { id: contentId },
        data: { refCount: { decrement: 1 } },
      });
    }
  } catch {
    // 忽略
  }
}

// 评论节点类型
interface CommentNode {
  id: string;
  content: string;
  replies: CommentNode[];
  [key: string]: unknown;
}

/** 从评论对象中移除敏感字段，注入 content 文本 */
function formatComment(
  c: Record<string, unknown> & { content?: { content: string } | null }
): CommentNode {
  const { authorEmail, ipHash, content: contentRel, ...rest } = c;
  void authorEmail; void ipHash;
  return {
    ...rest,
    id: c.id as string,
    content: contentRel?.content ?? "",
    replies: [],
  };
}

/**
 * O(n) 复杂度构建评论树
 * 使用 Map 建立索引，避免嵌套循环查找
 */
function buildCommentTree(
  allComments: Array<Record<string, unknown> & { id: string; parentId?: string | null; content?: { content: string } | null }>
): CommentNode[] {
  const nodeMap = new Map<string, CommentNode>();
  const roots: CommentNode[] = [];

  // 第一遍：创建所有节点并建立映射
  for (const c of allComments) {
    nodeMap.set(c.id, formatComment(c));
  }

  // 第二遍：建立父子关系
  for (const c of allComments) {
    const node = nodeMap.get(c.id)!;
    if (c.parentId && nodeMap.has(c.parentId)) {
      // 有父节点，添加到父节点的 replies
      nodeMap.get(c.parentId)!.replies.push(node);
    } else {
      // 没有父节点或父节点不存在，作为顶级评论
      roots.push(node);
    }
  }

  return roots;
}

export class CommentService {
  async getPostComments(postId: string) {
    const allComments = await prisma.comment.findMany({
      where: { postId, status: "approved" },
      orderBy: { createdAt: "asc" },
      include: {
        user: { select: { id: true, displayName: true, username: true, avatar: true, role: true } },
        content: { select: { content: true } },
      },
    });

    // 使用 O(n) 算法构建评论树
    return buildCommentTree(
      allComments as Array<Record<string, unknown> & { id: string; parentId?: string | null; content?: { content: string } | null }>
    );
  }

  async createComment(input: CreateCommentInput, userId?: string, ip?: string, userRole?: string) {
    const post = await prisma.post.findUnique({ where: { id: input.postId } });
    if (!post) throw new AppError("文章不存在", 404);

    if (input.parentId) {
      const parent = await prisma.comment.findUnique({
        where: { id: input.parentId },
      });
      if (!parent || parent.postId !== input.postId) {
        throw new AppError("父评论不存在", 400);
      }
    }

    let autoApprove = userRole === "admin";
    if (!autoApprove && input.authorEmail) {
      const adminUser = await prisma.user.findFirst({
        where: { role: "admin", email: input.authorEmail.toLowerCase().trim() },
        select: { id: true },
      });
      if (adminUser) {
        autoApprove = true;
        userId = adminUser.id;
      }
    }

    const safeContent = validateAndSanitizeComment(input.content);
    const commentContent = await getOrCreateContent(safeContent);

    const comment = await prisma.comment.create({
      data: {
        contentId: commentContent.id,
        postId: input.postId,
        userId,
        parentId: input.parentId,
        authorName: userId ? undefined : sanitizeText(input.authorName || "匿名用户"),
        authorEmail: userId ? undefined : input.authorEmail,
        ipHash: ip ? hashIP(ip) : undefined,
        status: autoApprove ? "approved" : "pending",
      },
      include: {
        user: { select: { id: true, displayName: true, username: true, avatar: true, role: true } },
        content: { select: { content: true } },
      },
    });

    return {
      ...comment,
      content: comment.content.content,
    };
  }

  async getAllComments(params: {
    page: number;
    pageSize: number;
    status?: string;
    search?: string;
    postId?: string;
  }) {
    const { page, pageSize, status, search, postId } = params;
    const skip = (page - 1) * pageSize;

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (postId) where.postId = postId;

    if (search) {
      where.OR = [
        { content: { content: { contains: search } } },
        { authorName: { contains: search } },
        { user: { username: { contains: search } } },
      ];
    }

    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: "desc" },
        include: {
          post: { select: { id: true, title: true, slug: true } },
          user: { select: { id: true, username: true } },
          content: { select: { content: true } },
        },
      }),
      prisma.comment.count({ where }),
    ]);

    return {
      comments: comments.map((c) => ({
        ...c,
        content: c.content.content,
      })),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async getPostOptions() {
    return prisma.post.findMany({
      select: { id: true, title: true },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
  }

  async updateCommentStatus(id: string, status: string) {
    const comment = await prisma.comment.findUnique({ where: { id } });
    if (!comment) throw new AppError("评论不存在", 404);
    return prisma.comment.update({ where: { id }, data: { status } });
  }

  async batchUpdateStatus(ids: string[], status: string) {
    if (ids.length === 0) throw new AppError("请选择评论");
    if (ids.length > 100) throw new AppError("单次最多操作 100 条");
    const result = await prisma.comment.updateMany({
      where: { id: { in: ids } },
      data: { status },
    });
    return { updated: result.count };
  }

  async batchDelete(ids: string[]) {
    if (ids.length === 0) throw new AppError("请选择评论");
    if (ids.length > 100) throw new AppError("单次最多操作 100 条");
    let deleted = 0;
    for (const id of ids) {
      try {
        await this.deleteComment(id);
        deleted++;
      } catch {
        // 跳过
      }
    }
    return { deleted };
  }

  async deleteComment(id: string) {
    const comment = await prisma.comment.findUnique({
      where: { id },
      select: { id: true, contentId: true, parentId: true },
    });
    if (!comment) throw new AppError("评论不存在", 404);

    const children = await prisma.comment.findMany({
      where: { parentId: id },
      orderBy: { createdAt: "asc" },
      select: { id: true },
    });

    if (children.length > 0) {
      const heir = children[0];
      const siblings = children.slice(1);

      await prisma.comment.update({
        where: { id: heir.id },
        data: { parentId: comment.parentId },
      });

      if (siblings.length > 0) {
        await prisma.comment.updateMany({
          where: { id: { in: siblings.map((c) => c.id) } },
          data: { parentId: heir.id },
        });
      }
    }

    await prisma.comment.delete({ where: { id } });
    await releaseContent(comment.contentId);
  }
}

export const commentService = new CommentService();
