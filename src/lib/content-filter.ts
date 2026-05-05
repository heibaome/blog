/**
 * 评论内容过滤器
 * 拦截政治敏感、色情、赌博、毒品、链接、手机号、社交媒体账号
 * 管理员不受链接/手机号/社交媒体限制
 * 作为第一道防线，配合人工审核使用
 */

// ===== 关键词库 =====

const POLITICS = [
  "台独", "藏独", "疆独", "港独",
  "法轮功", "法轮",
  "六四", "天安门事件",
  "东突",
  "颠覆国家政权", "分裂国家",
  "反党", "反政府",
  "政治避难",
];

const PORNOGRAPHY = [
  "色情", "淫秽", "淫乱",
  "卖淫", "嫖娼", "招嫖",
  "裸聊", "裸体视频",
  "色情网站", "黄色网站",
  "成人电影", "av网站",
  "一夜情", "约炮",
  "援交", "包养",
  "春药", "催情",
  "性服务", "性交易",
];

const GAMBLING = [
  "赌博", "赌场", "赌球",
  "百家乐", "德州扑克现金",
  "网上赌博", "网络赌博",
  "博彩网站", "博彩平台",
  "赌资", "赌注",
  "麻将赌博", "斗地主赌博",
  "六合彩投注", "外围投注",
  "下注平台", "投注平台",
  "菠菜", "菠菜平台",
  "彩票代购", "私彩",
  "赌徒", "赌棍",
];

const DRUGS = [
  "毒品", "吸毒", "贩毒",
  "大麻", "海洛因", "冰毒",
  "可卡因", "摇头丸", "麻古",
  "K粉", "氯胺酮",
  "鸦片", "吗啡",
  "制毒", "运毒",
  "溜冰",
  "毒贩", "毒枭",
  "新型毒品",
  "笑气滥用",
];

// ===== 正则规则 =====

// 链接：http/https/ftp URL，或裸域名
const LINK_PATTERN = /https?:\/\/[^\s<>"']+|ftp:\/\/[^\s<>"']+|www\.[a-zA-Z0-9-]+\.[a-zA-Z]{2,}/i;

// 手机号：中国大陆 11 位手机号（1开头），国际格式 +86 等
const PHONE_PATTERN = /(?:\+?86[-\s]?)?1[3-9]\d{9}|(?:\+?86[-\s]?)?\d{3,4}[-\s]?\d{7,8}/;

// 社交媒体账号关键词
const SOCIAL_MEDIA_PATTERNS = [
  // 微信号：wx/微信/wechat + 冒号或空格后跟账号
  /(?:微信|wx|wechat|weixin)\s*[:：]\s*\S+/i,
  // QQ号：qq + 冒号后跟 5-13 位数字
  /(?:qq|QQ)\s*[:：]\s*\d{5,13}/,
  // QQ群
  /(?:QQ群|qq群|q群)\s*[:：]?\s*\d{5,13}/,
  // 微博 @ 用户
  /(?:微博|weibo)\s*[:：]\s*@?\S+/i,
  // 抖音
  /(?:抖音|douyin|tiktok)\s*[:：]\s*\S+/i,
  // 小红书
  /(?:小红书)\s*[:：]\s*\S+/,
  // Telegram
  /(?:telegram|tg)\s*[:：]\s*@?\S+/i,
  // Discord
  /(?:discord)\s*[:：]\s*\S+/i,
  // 通用：引导加好友/关注等
  /(?:加我|加微信|加wx|加qq|私聊我|私信我|联系我|关注我)/i,
  // 注意：不匹配独立数字串，避免误拦截正常数字（如年份、数量等）
  // QQ 号已由上方 "qq : 123456" 等关键词模式覆盖
];

// 合并所有敏感关键词，同时构建 pattern → category 映射
const CATEGORY_MAP = new Map<RegExp, string>();

function buildPatterns(keywords: string[], category: string): RegExp[] {
  return keywords.map((kw) => {
    const pattern = new RegExp(kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    CATEGORY_MAP.set(pattern, category);
    return pattern;
  });
}

const KEYWORD_PATTERNS: RegExp[] = [
  ...buildPatterns(POLITICS, "政治敏感"),
  ...buildPatterns(PORNOGRAPHY, "色情"),
  ...buildPatterns(GAMBLING, "赌博"),
  ...buildPatterns(DRUGS, "毒品"),
];

// ===== 过滤结果 =====

export interface FilterResult {
  passed: boolean;
  category?: string;
  reason?: string;
}

/**
 * 清洗文本（去除 HTML 标签）
 */
function toPlainText(text: string): string {
  return text.replace(/<[^>]*>/g, "");
}

/**
 * 检查敏感关键词（政治、色情、赌博、毒品）
 */
function checkKeywords(plainText: string): FilterResult {
  for (const pattern of KEYWORD_PATTERNS) {
    if (pattern.test(plainText)) {
      return {
        passed: false,
        category: CATEGORY_MAP.get(pattern) || "其他",
        reason: "评论包含不当内容，请修改后重新提交",
      };
    }
  }
  return { passed: true };
}

/**
 * 检查链接
 */
function checkLinks(plainText: string): FilterResult {
  if (LINK_PATTERN.test(plainText)) {
    return {
      passed: false,
      category: "链接",
      reason: "评论中不允许发送链接",
    };
  }
  return { passed: true };
}

/**
 * 检查手机号
 */
function checkPhone(plainText: string): FilterResult {
  if (PHONE_PATTERN.test(plainText)) {
    return {
      passed: false,
      category: "手机号",
      reason: "评论中不允许发送手机号",
    };
  }
  return { passed: true };
}

/**
 * 检查社交媒体账号
 */
function checkSocialMedia(plainText: string): FilterResult {
  for (const pattern of SOCIAL_MEDIA_PATTERNS) {
    if (pattern.test(plainText)) {
      return {
        passed: false,
        category: "社交媒体",
        reason: "评论中不允许发送社交媒体账号",
      };
    }
  }
  return { passed: true };
}

/**
 * 完整内容检查 — 仅关键词（管理员也需要过）
 */
export function checkSensitiveContent(text: string): FilterResult {
  if (!text || text.trim().length === 0) return { passed: true };
  return checkKeywords(toPlainText(text));
}

/**
 * 完整内容检查 — 链接 + 手机号 + 社交媒体（管理员豁免）
 */
export function checkRestrictedContent(text: string): FilterResult {
  if (!text || text.trim().length === 0) return { passed: true };
  const plainText = toPlainText(text);

  let result: FilterResult;
  result = checkLinks(plainText);
  if (!result.passed) return result;

  result = checkPhone(plainText);
  if (!result.passed) return result;

  result = checkSocialMedia(plainText);
  if (!result.passed) return result;

  return { passed: true };
}

/**
 * 全量检查（关键词 + 链接 + 手机 + 社媒）
 */
export function checkContent(text: string): FilterResult {
  const r1 = checkSensitiveContent(text);
  if (!r1.passed) return r1;
  return checkRestrictedContent(text);
}


