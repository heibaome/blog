import { AppError } from "@/shared/errors";

/**
 * 捕获 Prisma 唯一约束冲突错误 (P2002)，抛出业务异常
 * 用于 create/update 操作中有唯一字段约束的场景
 */
export function handlePrismaUniqueError(error: unknown, message: string): never {
  if (error && typeof error === "object" && "code" in error && (error as any).code === "P2002") {
    throw new AppError(message, 409);
  }
  throw error;
}
