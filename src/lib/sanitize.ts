import { JSDOM } from "jsdom";
import createDOMPurify from "dompurify";

const window = new JSDOM("").window;
const purify = createDOMPurify(window as any);

// ===== 评论校验常量 =====
const MAX_INPUT_LENGTH = 2000;       // 原始输入最大长度
const MAX_SANITIZED_LENGTH = 5000;   // 净化后最大长度（防止标签膨胀）
const MAX_NESTING_DEPTH = 10;        // HTML 最大嵌套深度
const MAX_TAG_COUNT = 100;           // 最大标签数量
const MAX_BASE64_SIZE = 5 * 1024;    // 单个 base64 图片最大 5KB

// 零宽字符、BOM、方向覆盖字符等 Unicode 混淆手段
const OBFUSCATED_UNICODE = /[\u200b\u200c\u200d\u200e\u200f\u202a\u202b\u202c\u202d\u202e\u2060\u2061\u2062\u2063\u2064\ufeff\u00ad]/g;

// 控制字符（保留 \n \r \t）
const DANGEROUS_CONTROL = /[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g;

// 过大的 base64 图片
const OVERSIZED_BASE64 = /src\s*=\s*["']data:image\/[^;]+;base64,[A-Za-z0-9+/=]{8000,}["']/gi;

/**
 * 服务端 HTML 内容过滤，防止 XSS
 * 允许安全的富文本标签，阻止 script/event handler 等危险内容
 */
export function sanitizeHtml(html: string): string {
  return purify.sanitize(html, {
    ALLOWED_TAGS: [
      "h1", "h2", "h3", "h4", "h5", "h6",
      "p", "br", "hr",
      "ul", "ol", "li",
      "blockquote", "pre", "code",
      "strong", "em", "del", "s", "u", "mark",
      "a", "img",
      "table", "thead", "tbody", "tr", "th", "td",
      "div", "span", "figure", "figcaption",
      "details", "summary",
    ],
    ALLOWED_ATTR: [
      "href", "target", "rel", "title",
      "src", "alt", "width", "height", "loading",
      "class", "id",
      "align", "start", "type", "open",
    ],
    FORBID_TAGS: ["script", "style", "iframe", "object", "embed", "form"],
    FORBID_ATTR: ["onerror", "onload", "onclick", "onmouseover", "onfocus", "onblur"],
  });
}

/**
 * 评论内容完整校验 + 净化
 *
 * 流程：
 * 1. 预处理：检测空字节、危险控制字符、Unicode 混淆
 * 2. 长度校验
 * 3. DOMPurify 净化
 * 4. 后处理：检测 HTML 结构复杂度、base64 图片大小
 *
 * @returns 净化后的安全 HTML
 * @throws Error 校验不通过时抛出
 */
export function validateAndSanitizeComment(raw: string): string {
  // ── 预处理 ──

  // 1. 空字节注入
  if (raw.includes("\x00")) {
    throw new Error("评论内容包含非法字符");
  }

  // 2. 危险控制字符（保留 \n \r \t）
  if (DANGEROUS_CONTROL.test(raw)) {
    throw new Error("评论内容包含非法控制字符");
  }

  // 3. Unicode 混淆（零宽字符、BOM、方向覆盖等）
  const cleaned = raw.replace(OBFUSCATED_UNICODE, "");

  // 4. 输入长度
  if (cleaned.length === 0) {
    throw new Error("评论不能为空");
  }
  if (cleaned.length > MAX_INPUT_LENGTH) {
    throw new Error(`评论内容不能超过 ${MAX_INPUT_LENGTH} 字符`);
  }

  // ── 净化 ──
  const sanitized = sanitizeHtml(cleaned);

  // ── 后处理 ──

  // 5. 净化后长度（防止标签膨胀攻击）
  if (sanitized.length > MAX_SANITIZED_LENGTH) {
    throw new Error("评论内容过长");
  }

  // 6. HTML 标签数量
  const tagCount = (sanitized.match(/<\/?[a-zA-Z][^>]*>/g) || []).length;
  if (tagCount > MAX_TAG_COUNT) {
    throw new Error("评论 HTML 结构过于复杂");
  }

  // 7. 嵌套深度
  const depth = measureNestingDepth(sanitized);
  if (depth > MAX_NESTING_DEPTH) {
    throw new Error("评论 HTML 嵌套层级过深");
  }

  // 8. 过大的 base64 图片
  if (OVERSIZED_BASE64.test(sanitized)) {
    throw new Error("评论中的图片数据过大");
  }

  return sanitized;
}

/**
 * 测量 HTML 字符串的最大嵌套深度
 */
function measureNestingDepth(html: string): number {
  const stack: string[] = [];
  let maxDepth = 0;
  const tagPattern = /<\/?([a-zA-Z][a-zA-Z0-9]*)[^>]*\/?>/g;
  let match;

  while ((match = tagPattern.exec(html)) !== null) {
    const fullTag = match[0];
    const tagName = match[1].toLowerCase();

    // 自闭合标签不入栈（<br/>, <hr/>, <img/>）
    if (fullTag.endsWith("/>") || ["br", "hr", "img"].includes(tagName)) {
      maxDepth = Math.max(maxDepth, stack.length + 1);
      continue;
    }

    if (fullTag.startsWith("</")) {
      const idx = stack.lastIndexOf(tagName);
      if (idx !== -1) {
        stack.splice(idx, 1);
      }
    } else {
      stack.push(tagName);
      maxDepth = Math.max(maxDepth, stack.length);
    }
  }

  return maxDepth;
}

/**
 * 纯文本字段净化（用于昵称等非 HTML 字段）
 * - 去除所有 HTML 标签
 * - 去除控制字符（\x00-\x1f, \x7f）
 * - 去除 Unicode 混淆字符
 * - trim 首尾空白
 */
export function sanitizeText(text: string): string {
  return text
    .replace(/<[^>]*>/g, "")
    .replace(/[\x00-\x1f\x7f]/g, "")
    .replace(/&[#\w]+;/g, "")
    .replace(/\\/g, "")
    .replace(OBFUSCATED_UNICODE, "")
    .trim();
}
