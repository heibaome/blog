export type Locale = "zh-CN" | "en-US";

export interface Translations {
  // Header
  nav_home: string;
  nav_archive: string;
  nav_search: string;
  nav_admin: string;
  site_name: string;
  site_name_accent: string;

  // Footer
  footer_tagline: string;
  footer_archive: string;
  footer_search: string;
  footer_rss: string;

  // Home page
  home_title: string;
  home_title_accent: string;
  home_subtitle: string;
  home_latest: string;
  home_view_all: string;
  home_empty: string;

  // Post card
  post_views: string;
  post_comments: string;

  // Post page
  post_not_found: string;

  // Archive
  archive_title: string;
  archive_empty: string;
  archive_posts_count: string;

  // Search
  search_title: string;
  search_placeholder: string;
  search_no_results_prefix: string;
  search_no_results_suffix: string;
  search_results_count_prefix: string;
  search_results_count_suffix: string;
  search_input_hint: string;

  // Category & Tag
  category_title: string;
  category_empty: string;
  tag_title: string;
  tag_empty: string;

  // Comments
  comment_title: string;
  comment_empty: string;
  comment_placeholder: string;
  comment_name_placeholder: string;
  comment_submit: string;
  comment_reply: string;
  comment_cancel: string;
  comment_anonymous: string;
  comment_reply_to: string;
  comment_captcha_placeholder: string;
  comment_captcha_refresh: string;
  comment_email_placeholder: string;
  comment_email_send_code: string;
  comment_email_resend: string;
  comment_email_code_placeholder: string;
  comment_email_verify: string;
  comment_email_verified: string;
  comment_email_sending: string;
  comment_email_verifying: string;
  comment_success: string;
  comment_expand_prefix: string;
  comment_expand_suffix: string;
  comment_collapse: string;
  comment_reply_need_verify: string;

  // Login
  login_title: string;
  login_subtitle: string;
  login_username: string;
  login_password: string;
  login_submit: string;
  login_error: string;
  login_network_error: string;

  // Dashboard
  dashboard_title: string;
  dashboard_welcome: string;
  dashboard_write_post: string;
  dashboard_total_posts: string;
  dashboard_total_comments: string;
  dashboard_total_views: string;
  dashboard_pending_comments: string;
  dashboard_quick_actions: string;
  dashboard_new_post: string;
  dashboard_new_post_desc: string;
  dashboard_manage_posts: string;
  dashboard_manage_posts_desc: string;
  dashboard_manage_comments: string;
  dashboard_manage_comments_desc: string;

  // Admin sidebar
  admin_dashboard: string;
  admin_posts: string;
  admin_write: string;
  admin_comments: string;
  admin_categories: string;
  admin_tags: string;
  admin_back_to_site: string;
  admin_logout: string;
  admin_backend: string;

  // Time
  time_now: string;
  time_minutes_ago: string;
  time_hours_ago: string;
  time_days_ago: string;

  // About
  nav_about: string;
  about_title: string;
  about_subtitle: string;
  about_greeting: string;
  about_bio: string;
  about_blog_intro: string;
  about_contact: string;
  about_email: string;

  // Disclaimer
  disclaimer_title: string;
  disclaimer_subtitle: string;
  disclaimer_welcome: string;
  disclaimer_section1_title: string;
  disclaimer_section1_content: string;
  disclaimer_section2_title: string;
  disclaimer_section2_content: string;
  disclaimer_section3_title: string;
  disclaimer_section3_content: string;
  disclaimer_section4_title: string;
  disclaimer_section4_content: string;
  disclaimer_section5_title: string;
  disclaimer_section5_content: string;
  disclaimer_section6_title: string;
  disclaimer_section6_content: string;
  disclaimer_footer: string;
  disclaimer_agree: string;
}

const zhCN: Translations = {
  nav_home: "首页",
  nav_archive: "归档",
  nav_search: "搜索",
  nav_admin: "管理",
  site_name: "墨",
  site_name_accent: "迹",

  footer_tagline: "用心书写，以墨留迹",
  footer_archive: "归档",
  footer_search: "搜索",
  footer_rss: "RSS",

  home_title: "墨",
  home_title_accent: "迹博客",
  home_subtitle: "用心书写，以墨留迹。记录技术、生活与思考。",
  home_latest: "最新文章",
  home_view_all: "查看全部",
  home_empty: "还没有文章，去后台写一篇吧",

  post_views: "",
  post_comments: "",

  post_not_found: "文章不存在",

  archive_title: "文章归档",
  archive_empty: "暂无已发布文章",
  archive_posts_count: "篇",

  search_title: "搜索文章",
  search_placeholder: "输入关键词搜索...",
  search_no_results_prefix: "没有找到包含「",
  search_no_results_suffix: "」的文章",
  search_results_count_prefix: "找到 ",
  search_results_count_suffix: " 篇相关文章",
  search_input_hint: "输入关键词开始搜索",

  category_title: "分类：",
  category_empty: "该分类下暂无文章",
  tag_title: "标签：",
  tag_empty: "该标签下暂无文章",

  comment_title: "评论",
  comment_empty: "还没有评论，来说点什么吧 ✨",
  comment_placeholder: "写下你的想法...",
  comment_name_placeholder: "昵称（最多10个字符）",
  comment_submit: "发表评论",
  comment_reply: "回复",
  comment_cancel: "取消",
  comment_anonymous: "匿名用户",
  comment_reply_to: "回复",
  comment_captcha_placeholder: "输入验证码",
  comment_captcha_refresh: "看不清？点击换一张",
  comment_email_placeholder: "邮箱（QQ/163/Gmail，仅用于回复通知）",
  comment_email_send_code: "发送验证码",
  comment_email_resend: "重新发送",
  comment_email_code_placeholder: "输入6位验证码",
  comment_email_verify: "验证",
  comment_email_verified: "✓ 邮箱已验证",
  comment_email_sending: "发送中...",
  comment_email_verifying: "验证中...",
  comment_success: "评论已提交，审核通过后将展示 ✨",
  comment_expand_prefix: "展开 ",
  comment_expand_suffix: " 条回复",
  comment_collapse: "收起回复",
  comment_reply_need_verify: "请先验证邮箱后再回复",

  login_title: "墨",
  login_subtitle: "登录以管理你的博客",
  login_username: "用户名",
  login_password: "密码",
  login_submit: "登录",
  login_error: "登录失败",
  login_network_error: "网络错误",

  dashboard_title: "仪表盘",
  dashboard_welcome: "欢迎回来，查看你的博客概况",
  dashboard_write_post: "写文章",
  dashboard_total_posts: "文章总数",
  dashboard_total_comments: "评论总数",
  dashboard_total_views: "总浏览量",
  dashboard_pending_comments: "待审核评论",
  dashboard_quick_actions: "快速操作",
  dashboard_new_post: "撰写新文章",
  dashboard_new_post_desc: "创建并发布新内容",
  dashboard_manage_posts: "管理文章",
  dashboard_manage_posts_desc: "编辑或删除已有文章",
  dashboard_manage_comments: "管理评论",
  dashboard_manage_comments_desc: "审核和回复评论",

  admin_dashboard: "仪表盘",
  admin_posts: "文章管理",
  admin_write: "写文章",
  admin_comments: "评论管理",
  admin_categories: "分类管理",
  admin_tags: "标签管理",
  admin_back_to_site: "回到前台",
  admin_logout: "退出",
  admin_backend: "管理后台",

  time_now: "刚刚",
  time_minutes_ago: "分钟前",
  time_hours_ago: "小时前",
  time_days_ago: "天前",

  nav_about: "关于",
  about_title: "关于我",
  about_subtitle: "我是谁，我在做什么",
  about_greeting: "你好，我是黑豹。",
  about_bio: "一名热爱用AI智能体的开发者，喜欢折腾代码、探索新事物。技术的路很长，我愿意用文字记录走过的每一步。",
  about_blog_intro: "「墨迹博客」诞生于一个简单的想法——把学习和思考的过程写下来。在这里，我会分享技术心得、踩坑记录和偶尔的生活感悟。不追求流量，只希望每一篇文章都能对某个人有用，哪怕只有一个人。",
  about_contact: "联系我",
  about_email: "邮箱",
  disclaimer_title: "免责声明",
  disclaimer_subtitle: "请仔细阅读以下内容，点击下方按钮继续浏览",
  disclaimer_welcome: "欢迎访问本站。在使用本站前，请您仔细阅读以下声明。继续浏览本站即视为您已阅读、理解并同意本声明的全部内容。",
  disclaimer_section1_title: "一、内容合规",
  disclaimer_section1_content: "本站内容均为本站管理员及作者个人创作或转载，不代表任何组织或机构的立场。本站严格遵守中华人民共和国相关法律法规，不发布、不传播任何违反国家法律、法规的信息，包括但不限于危害国家安全、破坏国家统一、扰乱社会秩序、侵犯他人合法权益等内容。",
  disclaimer_section2_title: "二、信息准确性",
  disclaimer_section2_content: "本站所提供的信息仅供参考，不构成任何建议或保证。本站不对信息的准确性、完整性、及时性做出任何承诺。使用者应自行判断和承担使用本站信息的一切风险与后果。",
  disclaimer_section3_title: "三、评论责任",
  disclaimer_section3_content: "用户在本站发表的评论仅代表其个人观点，与本站无关。用户需对自身发表的言论承担全部法律责任。本站有权在不事先通知的情况下删除违反法律法规或本站规定的评论内容。",
  disclaimer_section4_title: "四、版权说明",
  disclaimer_section4_content: "本站原创内容版权归本站所有。转载内容已注明出处，版权归原作者或原出处所有。如有侵权，请联系我们，我们将在核实后及时处理。",
  disclaimer_section5_title: "五、隐私保护",
  disclaimer_section5_content: "本站尊重并保护用户隐私。本站不会向第三方提供、出售或共享用户的个人信息，法律法规另有规定或用户本人授权的除外。",
  disclaimer_section6_title: "六、免责条款",
  disclaimer_section6_content: "因不可抗力、网络故障、黑客攻击等不可控因素导致的服务中断或数据丢失，本站不承担任何责任。本站有权在不事先通知的情况下修改、暂停或终止服务。",
  disclaimer_footer: "本声明最终解释权归本站所有。如有更新，恕不另行通知。",
  disclaimer_agree: "我已阅读并同意",
};

const enUS: Translations = {
  nav_home: "Home",
  nav_archive: "Archive",
  nav_search: "Search",
  nav_admin: "Admin",
  site_name: "M",
  site_name_accent: "oji",

  footer_tagline: "Writing with heart, leaving traces in ink",
  footer_archive: "Archive",
  footer_search: "Search",
  footer_rss: "RSS",

  home_title: "Mo",
  home_title_accent: "ji Blog",
  home_subtitle: "Writing with heart, leaving traces in ink. Notes on tech, life, and thoughts.",
  home_latest: "Latest Posts",
  home_view_all: "View all",
  home_empty: "No posts yet — head to the dashboard to write one",

  post_views: "",
  post_comments: "",

  post_not_found: "Post not found",

  archive_title: "Archive",
  archive_empty: "No published posts yet",
  archive_posts_count: "posts",

  search_title: "Search",
  search_placeholder: "Search posts...",
  search_no_results_prefix: 'No results for "',
  search_no_results_suffix: '"',
  search_results_count_prefix: "Found ",
  search_results_count_suffix: " posts",
  search_input_hint: "Type to search",

  category_title: "Category: ",
  category_empty: "No posts in this category",
  tag_title: "Tag: ",
  tag_empty: "No posts with this tag",

  comment_title: "Comments",
  comment_empty: "No comments yet — be the first ✨",
  comment_placeholder: "Write your thoughts...",
  comment_name_placeholder: "Nickname (max 10 chars)",
  comment_submit: "Post Comment",
  comment_reply: "Reply",
  comment_cancel: "Cancel",
  comment_anonymous: "Anonymous",
  comment_reply_to: "Replying to",
  comment_captcha_placeholder: "Enter captcha",
  comment_captcha_refresh: "Refresh",
  comment_email_placeholder: "Email (QQ/163/Gmail, for reply notifications only)",
  comment_email_send_code: "Send Code",
  comment_email_resend: "Resend",
  comment_email_code_placeholder: "Enter 6-digit code",
  comment_email_verify: "Verify",
  comment_email_verified: "✓ Email verified",
  comment_email_sending: "Sending...",
  comment_email_verifying: "Verifying...",
  comment_success: "Comment submitted — it will appear after review ✨",
  comment_expand_prefix: "Show ",
  comment_expand_suffix: " more replies",
  comment_collapse: "Hide replies",
  comment_reply_need_verify: "Please verify your email before replying",

  login_title: "Mo",
  login_subtitle: "Sign in to manage your blog",
  login_username: "Username",
  login_password: "Password",
  login_submit: "Sign In",
  login_error: "Login failed",
  login_network_error: "Network error",

  dashboard_title: "Dashboard",
  dashboard_welcome: "Welcome back — here's your blog overview",
  dashboard_write_post: "New Post",
  dashboard_total_posts: "Total Posts",
  dashboard_total_comments: "Total Comments",
  dashboard_total_views: "Total Views",
  dashboard_pending_comments: "Pending",
  dashboard_quick_actions: "Quick Actions",
  dashboard_new_post: "Write a Post",
  dashboard_new_post_desc: "Create and publish new content",
  dashboard_manage_posts: "Manage Posts",
  dashboard_manage_posts_desc: "Edit or delete posts",
  dashboard_manage_comments: "Manage Comments",
  dashboard_manage_comments_desc: "Review and reply to comments",

  admin_dashboard: "Dashboard",
  admin_posts: "Posts",
  admin_write: "New Post",
  admin_comments: "Comments",
  admin_categories: "Categories",
  admin_tags: "Tags",
  admin_back_to_site: "Back to Site",
  admin_logout: "Logout",
  admin_backend: "Admin",

  time_now: "just now",
  time_minutes_ago: "min ago",
  time_hours_ago: "hours ago",
  time_days_ago: "days ago",

  nav_about: "About",
  about_title: "About Me",
  about_subtitle: "Who I am and what I do",
  about_greeting: "Hi, I'm Black Panther.",
  about_bio: "A developer with a passion for technology, always tinkering with code and exploring new things. The road of technology is long, and I'm willing to document every step along the way.",
  about_blog_intro: "Moji Blog was born from a simple idea — writing down the process of learning and thinking. Here I share technical insights, debugging stories, and the occasional life reflection. I'm not chasing traffic; I just hope each post can be useful to someone, even if it's just one person.",
  about_contact: "Get in Touch",
  about_email: "Email",
  disclaimer_title: "Disclaimer",
  disclaimer_subtitle: "Please read the following carefully before continuing",
  disclaimer_welcome: "Welcome to this site. Before using this site, please read the following statement carefully. By continuing to browse this site, you acknowledge that you have read, understood, and agreed to all terms of this statement.",
  disclaimer_section1_title: "1. Content Compliance",
  disclaimer_section1_content: "All content on this site is created or reposted by the site administrator and authors in a personal capacity and does not represent the views of any organization. This site strictly complies with applicable laws and regulations and does not publish or disseminate any illegal content, including but not limited to content that endangers national security, disrupts social order, or infringes on the legitimate rights and interests of others.",
  disclaimer_section2_title: "2. Information Accuracy",
  disclaimer_section2_content: "The information provided on this site is for reference only and does not constitute any advice or guarantee. This site makes no promises regarding the accuracy, completeness, or timeliness of the information. Users should independently judge and bear all risks and consequences of using the information on this site.",
  disclaimer_section3_title: "3. Comment Responsibility",
  disclaimer_section3_content: "Comments posted by users on this site represent only their personal views and are not related to this site. Users are solely responsible for the content of their comments. This site reserves the right to remove comments that violate laws, regulations, or site policies without prior notice.",
  disclaimer_section4_title: "4. Copyright Notice",
  disclaimer_section4_content: "The copyright of original content on this site belongs to this site. Reposted content is attributed to the original source and the copyright belongs to the original author. If there is any infringement, please contact us and we will handle it promptly after verification.",
  disclaimer_section5_title: "5. Privacy Protection",
  disclaimer_section5_content: "This site respects and protects user privacy. This site will not provide, sell, or share user personal information with third parties, except as required by law or with the user's explicit authorization.",
  disclaimer_section6_title: "6. Liability Limitations",
  disclaimer_section6_content: "This site shall not be liable for service interruptions or data loss caused by force majeure, network failures, hacking attacks, or other factors beyond its control. This site reserves the right to modify, suspend, or terminate services without prior notice.",
  disclaimer_footer: "The right of final interpretation of this statement belongs to this site. Updates may be made without prior notice.",
  disclaimer_agree: "I have read and agree",
};

const translations: Record<Locale, Translations> = {
  "zh-CN": zhCN,
  "en-US": enUS,
};

export function detectLocale(): Locale {
  if (typeof window === "undefined") return "zh-CN";
  const lang = navigator.language || navigator.languages?.[0] || "zh-CN";
  return lang.startsWith("zh") ? "zh-CN" : "en-US";
}

export function getTranslations(locale: Locale): Translations {
  return translations[locale] || zhCN;
}

export function t(key: keyof Translations, locale: Locale): string {
  return getTranslations(locale)[key];
}
