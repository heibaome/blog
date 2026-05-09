import crypto from "crypto";
import { prisma } from "@/shared/db";

// 排除易混淆字符: 0/O, 1/l/I
function randomChars(len = 5): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let result = "";
  for (let i = 0; i < len; i++) {
    // 使用密码学安全的随机数生成器
    result += chars[crypto.randomInt(0, chars.length)];
  }
  return result;
}

function generateSVG(text: string): string {
  const width = 180;
  const height = 56;
  const fonts = ["Courier New", "Consolas", "Lucida Console", "monospace"];

  // 使用安全的随机数生成器替代 Math.random()
  const r = (min: number, max: number): number => min + secureRandom() * (max - min);
  const pick = <T,>(arr: T[]): T => {
    return arr[crypto.randomInt(0, arr.length)];
  };

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">`;

  // 背景
  svg += `<rect width="${width}" height="${height}" fill="#1a1a2e" rx="6"/>`;

  // 背景微噪点网格 (低对比度，干扰 OCR 二值化)
  for (let i = 0; i < 60; i++) {
    const cx = r(0, width);
    const cy = r(0, height);
    const sz = r(0.3, 0.8);
    svg += `<circle cx="${cx}" cy="${cy}" r="${sz}" fill="#2a2a4a" opacity="${r(0.3, 0.6)}"/>`;
  }

  // 干扰层1: 贝塞尔曲线 (比直线更难分割)
  const curveColors = ["#444", "#555", "#666", "#3a3a5a", "#4a3a3a"];
  for (let i = 0; i < 5; i++) {
    const x1 = r(-10, width * 0.3);
    const y1 = r(5, height - 5);
    const cx1 = r(width * 0.2, width * 0.5);
    const cy1 = r(5, height - 5);
    const cx2 = r(width * 0.5, width * 0.8);
    const cy2 = r(5, height - 5);
    const x2 = r(width * 0.7, width + 10);
    const y2 = r(5, height - 5);
    svg += `<path d="M${x1},${y1} C${cx1},${cy1} ${cx2},${cy2} ${x2},${y2}" fill="none" stroke="${pick(curveColors)}" stroke-width="${r(0.8, 2)}" opacity="${r(0.2, 0.5)}"/>`;
  }

  // 干扰层2: 横穿字符区域的粗干扰带
  for (let i = 0; i < 2; i++) {
    const y = r(10, height - 10);
    const h = r(2, 5);
    svg += `<rect x="0" y="${y}" width="${width}" height="${h}" fill="#333" opacity="${r(0.08, 0.15)}" rx="1"/>`;
  }

  // 干扰层3: 大量噪点 (不同大小和颜色)
  const dotColors = ["#555", "#666", "#777", "#888", "#4a4a6a", "#6a4a4a", "#4a6a4a"];
  for (let i = 0; i < 50; i++) {
    const cx = r(0, width);
    const cy = r(0, height);
    const rad = r(0.4, 2.0);
    svg += `<circle cx="${cx}" cy="${cy}" r="${rad}" fill="${pick(dotColors)}" opacity="${r(0.15, 0.5)}"/>`;
  }

  // 字符渲染: 随机间距、扭曲、缩放、旋转
  const charColors = ["#60a5fa", "#a78bfa", "#34d399", "#fbbf24", "#f472b6", "#fb923c", "#38bdf8"];
  const spacing = width / (text.length + 1);

  for (let i = 0; i < text.length; i++) {
    const baseX = spacing * (i + 1) + r(-8, 8);
    const baseY = height / 2 + r(-10, 10);
    const rotation = r(-35, 35);
    const scaleX = r(0.8, 1.2);
    const scaleY = r(0.85, 1.15);
    const fontSize = r(20, 28);
    const font = pick(fonts);
    const color = pick(charColors);

    const transform = `translate(${baseX},${baseY}) rotate(${rotation}) scale(${scaleX},${scaleY})`;

    svg += `<text x="0" y="0" font-family="${font}" font-size="${fontSize}" font-weight="bold"`;
    svg += ` fill="${color}" transform="${transform}" text-anchor="middle" dominant-baseline="central"`;
    svg += ` stroke="${color}" stroke-width="0.3" opacity="${r(0.85, 1)}">${text[i]}</text>`;
  }

  // 干扰层4: 字符前面再覆盖几条细线，切割字符轮廓
  for (let i = 0; i < 3; i++) {
    const x1 = r(0, width);
    const y1 = r(0, height);
    const x2 = r(0, width);
    const y2 = r(0, height);
    svg += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${pick(curveColors)}" stroke-width="${r(0.3, 1)}" opacity="${r(0.25, 0.45)}"/>`;
  }

  // 干扰层5: 字符区域的小干扰圆 (叠在文字上层)
  for (let i = 0; i < 8; i++) {
    const cx = r(width * 0.1, width * 0.9);
    const cy = r(height * 0.2, height * 0.8);
    svg += `<circle cx="${cx}" cy="${cy}" r="${r(1, 3)}" fill="none" stroke="${pick(dotColors)}" stroke-width="${r(0.3, 0.8)}" opacity="${r(0.15, 0.35)}"/>`;
  }

  svg += `</svg>`;
  return svg;
}

// 安全的随机数生成器，返回 [0, 1) 之间的浮点数
function secureRandom(): number {
  const buf = crypto.randomBytes(4);
  return buf.readUInt32BE(0) / 0xFFFFFFFF;
}

// 清理过期验证码
async function cleanup(): Promise<void> {
  await prisma.captcha.deleteMany({
    where: { expires: { lt: new Date() } },
  });
}

export async function createCaptcha(): Promise<{ token: string; svg: string }> {
  await cleanup();

  const answer = randomChars(5);
  const token = crypto.randomBytes(16).toString("hex");
  const expires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

  await prisma.captcha.create({
    data: { token, answer: answer.toLowerCase(), expires },
  });

  return { token, svg: generateSVG(answer) };
}

export async function verifyCaptcha(token: string, answer: string): Promise<boolean> {
  const record = await prisma.captcha.findUnique({ where: { token } });
  if (!record) return false;

  if (record.expires < new Date()) {
    await prisma.captcha.delete({ where: { token } });
    return false;
  }

  const valid = record.answer === answer.toLowerCase().trim();
  if (valid) {
    await prisma.captcha.delete({ where: { token } });
  }
  return valid;
}
