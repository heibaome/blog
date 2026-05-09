import { NextResponse } from "next/server";
import { ZodError, Prisma } from "@prisma/client";

export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 400,
    public code?: string
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, identifier?: string) {
    const msg = identifier
      ? `${resource} '${identifier}' 不存在`
      : `${resource} 不存在`;
    super(msg, 404, "NOT_FOUND");
    this.name = "NotFoundError";
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, "VALIDATION_ERROR");
    this.name = "ValidationError";
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "请先登录") {
    super(message, 401, "UNAUTHORIZED");
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "权限不足") {
    super(message, 403, "FORBIDDEN");
    this.name = "ForbiddenError";
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, "CONFLICT");
    this.name = "ConflictError";
  }
}

export function handlePrismaUniqueError(error: unknown, resourceName: string): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    throw new ConflictError(`${resourceName}已存在`);
  }
  throw error;
}

export function errorResponse(error: unknown) {
  if (error && typeof error === "object" && "name" in error) {
    const errorName = (error as { name: string }).name;

    if (errorName === "AppError" || errorName === "NotFoundError" || errorName === "ValidationError" ||
        errorName === "UnauthorizedError" || errorName === "ForbiddenError" || errorName === "ConflictError") {
      const e = error as AppError;
      return NextResponse.json(
        { error: e.message, code: e.code },
        { status: e.statusCode }
      );
    }
  }

  if (error && typeof error === "object" && "name" in error && (error as { name: string }).name === "ZodError") {
    const zodError = error as ZodError;
    const msg = zodError.issues?.[0]?.message || "参数验证失败";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2003") {
      return NextResponse.json(
        { error: "该记录存在关联数据，无法删除" },
        { status: 409 }
      );
    }
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "记录不存在" },
        { status: 404 }
      );
    }
    console.error("Prisma error:", error);
    return NextResponse.json(
      { error: "数据库操作失败" },
      { status: 500 }
    );
  }

  if (error instanceof Error) {
    console.error("Unhandled error:", error);
    return NextResponse.json(
      { error: "服务器内部错误" },
      { status: 500 }
    );
  }

  console.error("Unknown error:", error);
  return NextResponse.json(
    { error: "服务器内部错误" },
    { status: 500 }
  );
}

export function successResponse(data: unknown, status = 200) {
  return NextResponse.json({ data }, { status });
}

export async function withErrorHandler<T>(
  fn: () => Promise<T>
): Promise<NextResponse> {
  try {
    const result = await fn();
    return successResponse(result);
  } catch (error) {
    return errorResponse(error);
  }
}
