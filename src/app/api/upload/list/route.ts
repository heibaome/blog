import { requireAdmin } from "@/shared/security";
import { errorResponse, successResponse } from "@/shared/errors";
import { readdir, stat } from "fs/promises";
import path from "path";

// GET /api/upload/list - 列出所有上传的文件（仅管理员）
export async function GET() {
  try {
    await requireAdmin();

    const uploadDir = path.join(process.cwd(), "uploads");
    const entries = await readdir(uploadDir).catch(() => []);

    const files = await Promise.all(
      entries
        .filter((name) => !name.startsWith("."))
        .map(async (name) => {
          const filePath = path.join(uploadDir, name);
          const stats = await stat(filePath).catch(() => null);
          return {
            name,
            size: stats?.size || 0,
            modified: stats?.mtime.toISOString() || "",
            url: `/uploads/${name}`,
          };
        })
    );

    // 按修改时间倒序
    files.sort((a, b) => b.modified.localeCompare(a.modified));

    return successResponse(files);
  } catch (error) {
    return errorResponse(error);
  }
}
