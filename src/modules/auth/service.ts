import { prisma } from "@/shared/db";
import { AppError } from "@/shared/errors";
import {
  hashPassword,
  verifyPassword,
  createToken,
} from "@/shared/security";
import { blacklistAllUserTokens } from "@/lib/token-blacklist";
import { type LoginInput, type RegisterInput } from "@/shared/types";

export class AuthService {
  async login(input: LoginInput) {
    // 支持用户名或邮箱登录
    const isEmail = input.username.includes("@");
    const user = await prisma.user.findUnique({
      where: isEmail ? { email: input.username } : { username: input.username },
    });

    if (!user) {
      throw new AppError("用户名或密码错误", 401);
    }

    const valid = await verifyPassword(input.password, user.password);
    if (!valid) {
      throw new AppError("用户名或密码错误", 401);
    }

    // 单地登录：踢掉该用户所有旧会话
    await blacklistAllUserTokens(user.id);

    const token = createToken({ userId: user.id, role: user.role });

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
    };
  }

  async register(input: RegisterInput) {
    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ username: input.username }, { email: input.email }],
      },
    });

    if (existing) {
      throw new AppError("用户名或邮箱已被注册", 409);
    }

    const hashed = await hashPassword(input.password);
    const user = await prisma.user.create({
      data: {
        username: input.username,
        email: input.email,
        password: hashed,
        role: "author",
      },
    });

    const token = createToken({ userId: user.id, role: user.role });

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    };
  }

  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        avatar: true,
        displayName: true,
        createdAt: true,
        _count: { select: { posts: true } },
      },
    });

    if (!user) throw new AppError("用户不存在", 404);
    return user;
  }

  async updateProfile(userId: string, data: { displayName?: string; avatar?: string; email?: string }) {
    const updateData: Record<string, any> = {};
    if (data.displayName !== undefined) {
      updateData.displayName = data.displayName.trim() || null;
    }
    if (data.avatar !== undefined) {
      updateData.avatar = data.avatar || null;
    }
    if (data.email !== undefined) {
      const email = data.email.trim();
      if (email) {
        // 检查邮箱唯一性
        const existing = await prisma.user.findUnique({
          where: { email },
        });
        if (existing && existing.id !== userId) {
          throw new AppError("该邮箱已被其他用户使用", 409);
        }
        updateData.email = email;
      }
    }
    if (Object.keys(updateData).length === 0) {
      throw new AppError("没有需要更新的字段", 400);
    }
    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        avatar: true,
        displayName: true,
      },
    });
    return user;
  }
}

export const authService = new AuthService();
