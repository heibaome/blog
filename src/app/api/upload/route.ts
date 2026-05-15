import { NextRequest } from "next/server";
import { errorResponse, successResponse } from "@/shared/errors";
import { requireAdmin } from "@/shared/security";
import { prisma } from "@/shared/db";
import { sanitizeSvg } from "@/lib/sanitize-svg";
import { writeFile, mkdir, unlink } from "fs/promises";
import path from "path";
import { nanoid } from "nanoid";
import sharp from "sharp";

// MIME 类型到允许扩展名的映射
const ALLOWED_TYPES: Record<string, string[]> = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/gif": [".gif"],
  "image/webp": [".webp"],
  "image/svg+xml": [".svg"],
};

const MAX_SIZE = 5 * 1024 * 1024; // 5MB

// 文件头魔数校验（前几个字节）
const MAGIC_BYTES: Record<string, Buffer[]> = {
  "image/jpeg": [Buffer.from([0xFF, 0xD8, 0xFF])],
  "image/png": [Buffer.from([0x89, 0x50, 0x4E, 0x47])],
  "image/gif": [Buffer.from("GIF87a"), Buffer.from("GIF89a")],
  "image/webp": [Buffer.from("RIFF")],
};

/**
 * 校验文件头是否匹配声明的 MIME 类型
 */
function verifyMagicBytes(buffer: Buffer, mimeType: string): boolean {
  // SVG 是文本格式，跳过魔数校验
  if (mimeType === "image/svg+xml") return true;

  const signatures = MAGIC_BYTES[mimeType];
  if (!signatures) return false;

  return signatures.some((sig) => buffer.subarray(0, sig.length).equals(sig));
}

/**
 * 根据 MIME 类型获取安全的扩展名
 */
function getSafeExtension(originalName: string, mimeType: string): string {
  const allowed = ALLOWED_TYPES[mimeType];
  if (!allowed) return ".bin";

  // 从原始文件名提取扩展名，检查是否在白名单内
  const origExt = path.extname(originalName).toLowerCase();
  if (allowed.includes(origExt)) return origExt;

  // 默认使用白名单中第一个扩展名
  return allowed[0];
}

/**
 * 压缩图片，返回 Uint8Array（JPEG/PNG/WebP），SVG 和 GIF 跳过
 */
async function compressImage(input: Uint8Array, mimeType: string): Promise<Uint8Array> {
  // SVG 和 GIF 不压缩
  if (mimeType === "image/svg+xml" || mimeType === "image/gif") {
    return input;
  }

  // 宽度超过 1920px 则缩放
  const metadata = await sharp(input).metadata();
  let pipeline = sharp(input);
  if (metadata.width && metadata.width > 1920) {
    pipeline = pipeline.resize({ width: 1920, withoutEnlargement: true });
  }

  switch (mimeType) {
    case "image/jpeg":
      return pipeline.jpeg({ quality: 80, mozjpeg: true }).toBuffer();
    case "image/png":
      return pipeline.png({ compressionLevel: 9 }).toBuffer();
    case "image/webp":
      return pipeline.webp({ quality: 80 }).toBuffer();
    default:
      return input;
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) return errorResponse(new Error("请选择文件"));

    // 1. MIME 类型白名单校验
    if (!ALLOWED_TYPES[file.type]) {
      return errorResponse(new Error("不支持的文件类型，仅允许图片文件 (jpg/png/gif/webp/svg)"));
    }

    // 2. 文件大小校验
    if (file.size > MAX_SIZE) {
      return errorResponse(new Error("文件大小不能超过 5MB"));
    }

    const bytes = await file.arrayBuffer();
    const rawBuffer = Buffer.from(bytes);

    // 3. 文件头魔数校验（防伪造 MIME）
    if (!verifyMagicBytes(rawBuffer, file.type)) {
      return errorResponse(new Error("文件内容与声明类型不符，疑似伪造文件"));
    }

    // 4. SVG 内容净化（去除脚本和事件处理器）
    let finalBuffer: Buffer;
    if (file.type === "image/svg+xml") {
      const svgContent = rawBuffer.toString("utf-8");
      const sanitized = sanitizeSvg(svgContent);
      if (!sanitized) {
        return errorResponse(new Error("SVG 文件无效或包含不允许的内容"));
      }
      finalBuffer = Buffer.from(sanitized, "utf-8");
    } else {
      // 5. 图片压缩（JPEG/PNG/WebP），GIF 跳过
      const originalSize = rawBuffer.length;
      const compressed = await compressImage(rawBuffer, file.type);
      finalBuffer = Buffer.from(compressed);
      if (process.env.NODE_ENV !== "production") console.log(`[UPLOAD] 压缩: ${originalSize} → ${finalBuffer.length} bytes (${((1 - finalBuffer.length / originalSize) * 100).toFixed(1)}% 减少)`);
    }

    // 6. 安全扩展名（基于 MIME，而非用户输入）
    const ext = getSafeExtension(file.name, file.type);
    const filename = `${nanoid(12)}${ext}`;

    const uploadDir = path.join(process.cwd(), "uploads");
    if (process.env.NODE_ENV !== "production") console.log("[UPLOAD] cwd:", process.cwd(), "uploadDir:", uploadDir, "filename:", filename, "size:", finalBuffer.length);
    await mkdir(uploadDir, { recursive: true });

    const fullPath = path.join(uploadDir, filename);
    await writeFile(fullPath, finalBuffer);
    if (process.env.NODE_ENV !== "production") console.log("[UPLOAD] 文件写入成功:", fullPath);

    return successResponse({
      url: `/uploads/${filename}`,
      filename,
    });
  } catch (error) {
    console.error("[UPLOAD] 上传失败:", error);
    return errorResponse(error);
  }
}

// DELETE /api/upload - 删除指定图片文件（仅管理员）
export async function DELETE(req: NextRequest) {
  try {
    await requireAdmin();

    const body = await req.json();
    const { url } = body;

    if (!url || typeof url !== "string") {
      return errorResponse(new Error("缺少图片路径"));
    }

    // 安全校验：只允许删除 /uploads/ 下的文件
    if (!url.startsWith("/uploads/")) {
      return errorResponse(new Error("无效的图片路径"));
    }

    const filename = path.basename(url);
    const filePath = path.join(process.cwd(), "uploads", filename);

    // 确保路径在 uploads 目录内
    const resolvedPath = path.resolve(filePath);
    const uploadsDir = path.resolve(process.cwd(), "uploads");
    if (!resolvedPath.startsWith(uploadsDir)) {
      return errorResponse(new Error("无效的文件路径"));
    }

    try {
      await unlink(resolvedPath);
    } catch {
      // 文件不存在也算成功（幂等）
    }

    // 同步清理 post_images 中引用该文件的记录，避免编辑器显示幽灵预览
    await prisma.postImage.deleteMany({
      where: { url },
    });

    return successResponse({ message: "已删除" });
  } catch (error) {
    return errorResponse(error);
  }
}
