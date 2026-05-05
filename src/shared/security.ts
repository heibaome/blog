import crypto from "crypto";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { prisma } from "./db";
import { AppError } from "./errors";
import { isTokenBlacklisted, blacklistToken } from "@/lib/token-blacklist";
import { TOKEN_NAME } from "./constants";

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") throw new Error("JWT_SECRET environment variable is required in production");
    return "fallback-dev-secret";
  }
  return secret;
}
function getIpHashSalt(): string {
  const salt = process.env.IP_HASH_SALT;
  if (!salt) {
    if (process.env.NODE_ENV === "production") throw new Error("IP_HASH_SALT environment variable is required in production");
    return "fallback-ip-salt";
  }
  return salt;
}

// Password hashing
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(
  password: string,
  hashed: string
): Promise<boolean> {
  return bcrypt.compare(password, hashed);
}

// JWT
export function createToken(payload: { userId: string; role: string }): string {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: "3d" });
}

export function verifyToken(token: string): { userId: string; role: string } {
  try {
    return jwt.verify(token, getJwtSecret()) as { userId: string; role: string };
  } catch {
    throw new AppError("无效的认证令牌", 401);
  }
}

// Cookie helpers
export async function setAuthCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(TOKEN_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 3, // 3 days
    path: "/",
  });
}

export async function clearAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(TOKEN_NAME);
}

export async function getTokenFromCookie(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(TOKEN_NAME)?.value;
}

// Get current user from request
export async function getCurrentUser() {
  const token = await getTokenFromCookie();
  if (!token) return null;

  // 检查 token 是否在黑名单中（已登出）
  if (await isTokenBlacklisted(token)) return null;

  try {
    const payload = verifyToken(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, username: true, email: true, role: true, avatar: true },
    });
    return user;
  } catch {
    return null;
  }
}

// Require authenticated user
export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) throw new AppError("请先登录", 401);
  return user;
}

// Require admin
export async function requireAdmin() {
  const user = await requireAuth();
  if (user.role !== "admin") throw new AppError("权限不足", 403);
  return user;
}

// IP hash for comments
export function hashIP(ip: string): string {
  return crypto
    .createHash("sha256")
    .update(ip + getIpHashSalt())
    .digest("hex")
    .slice(0, 16);
}

// Token blacklist (re-export for convenience)
export { blacklistToken };
