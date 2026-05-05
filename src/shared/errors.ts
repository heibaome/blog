import { NextResponse } from "next/server";

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

export function errorResponse(error: unknown) {
  // 用 duck-typing 替代 instanceof，避免 Next.js 生产模式下跨 chunk 类标识不一致的问题
  if (error && typeof error === "object" && "name" in error && (error as any).name === "AppError") {
    const e = error as AppError;
    return NextResponse.json(
      { error: e.message, code: e.code },
      { status: e.statusCode }
    );
  }

  // ZodError：参数校验失败
  if (error && typeof error === "object" && "name" in error && (error as any).name === "ZodError") {
    const zodError = error as any;
    const msg = zodError.issues?.[0]?.message || "参数验证失败";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  // Prisma 外键约束冲突
  if (error && typeof error === "object" && "code" in error && (error as any).code === "P2003") {
    return NextResponse.json(
      { error: "该记录存在关联数据，无法删除" },
      { status: 409 }
    );
  }

  // 其他 Prisma 错误
  if (error && typeof error === "object" && "code" in error && typeof (error as any).code === "string" && (error as any).code.startsWith("P")) {
    console.error("Prisma error:", error);
    return NextResponse.json(
      { error: "数据库操作失败" },
      { status: 500 }
    );
  }

  // 未知 Error（非 AppError/ZodError/PrismaError）→ 记录日志并返回通用消息，防止内部信息泄露
  if (error instanceof Error) {
    console.error("Unhandled error:", error);
    return NextResponse.json(
      { error: "服务器内部错误" },
      { status: 500 }
    );
  }

  // 未知类型
  console.error("Unknown error:", error);
  return NextResponse.json(
    { error: "服务器内部错误" },
    { status: 500 }
  );
}

export function successResponse(data: unknown, status = 200) {
  return NextResponse.json({ data }, { status });
}
