import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create admin user
  const hashedPassword = await bcrypt.hash("Key–1122.", 12);
  const admin = await prisma.user.upsert({
    where: { username: "饕餮_adminheibao" },
    update: {},
    create: {
      username: "饕餮_adminheibao",
      email: "3117077908@qq.com",
      password: hashedPassword,
      role: "admin",
    },
  });
  console.log("✅ Admin user: 饕餮_adminheibao");

  // Create categories
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug: "tech" },
      update: {},
      create: { name: "技术", slug: "tech", sortOrder: 1 },
    }),
    prisma.category.upsert({
      where: { slug: "life" },
      update: {},
      create: { name: "生活", slug: "life", sortOrder: 2 },
    }),
    prisma.category.upsert({
      where: { slug: "thoughts" },
      update: {},
      create: { name: "随笔", slug: "thoughts", sortOrder: 3 },
    }),
  ]);
  console.log("✅ Categories created");

  // Create tags
  const tags = await Promise.all([
    prisma.tag.upsert({
      where: { slug: "javascript" },
      update: {},
      create: { name: "JavaScript", slug: "javascript" },
    }),
    prisma.tag.upsert({
      where: { slug: "typescript" },
      update: {},
      create: { name: "TypeScript", slug: "typescript" },
    }),
    prisma.tag.upsert({
      where: { slug: "react" },
      update: {},
      create: { name: "React", slug: "react" },
    }),
    prisma.tag.upsert({
      where: { slug: "nextjs" },
      update: {},
      create: { name: "Next.js", slug: "nextjs" },
    }),
  ]);
  console.log("✅ Tags created");

  // Create sample posts
  const samplePosts = [
    {
      title: "欢迎来到墨迹博客",
      slug: "welcome",
      content: `<h2>你好，世界！</h2>
<p>欢迎来到墨迹博客。这是一个使用 Next.js + Tiptap + Prisma + SQLite 构建的个人博客系统。</p>
<h3>特性</h3>
<ul>
<li>✨ 富文本编辑器 (Tiptap)</li>
<li>🎨 中国风设计美学</li>
<li>🔒 安全默认的架构</li>
<li>⚡ 极致性能优化</li>
<li>📝 完整的 Markdown 支持</li>
</ul>
<blockquote>
<p>用心书写，以墨留迹。</p>
</blockquote>
<h3>代码示例</h3>
<pre><code class="language-typescript">const blog = {
  name: "墨迹",
  stack: ["Next.js", "Tiptap", "Prisma"],
  motto: "用心书写，以墨留迹"
};</code></pre>
<p>开始你的写作之旅吧！</p>`,
      summary: "欢迎来到墨迹博客，一个用心构建的个人博客系统。",
      status: "published",
      categoryId: categories[0].id,
      tags: [tags[3].id, tags[2].id],
    },
    {
      title: "关于这个博客的技术架构",
      slug: "architecture",
      content: `<h2>架构设计</h2>
<p>这个博客采用了模块化的架构设计，每个模块独立自治，通过定义好的接口进行通信。</p>
<h3>技术栈</h3>
<table>
<thead><tr><th>层级</th><th>技术</th></tr></thead>
<tbody>
<tr><td>前端框架</td><td>Next.js 15 (App Router)</td></tr>
<tr><td>编辑器</td><td>Tiptap</td></tr>
<tr><td>样式</td><td>Tailwind CSS 4</td></tr>
<tr><td>数据库</td><td>SQLite + Prisma</td></tr>
<tr><td>认证</td><td>JWT + HttpOnly Cookie</td></tr>
</tbody>
</table>
<h3>模块化设计</h3>
<p>每个业务模块遵循三层分离：</p>
<ul>
<li><strong>Service</strong> — 业务逻辑层</li>
<li><strong>Repository</strong> — 数据访问层</li>
<li><strong>Route</strong> — HTTP 入口层</li>
</ul>
<p>模块之间只能通过 Service 接口通信，保证了松耦合和高内聚。</p>`,
      summary: "深入解析墨迹博客的技术架构设计与选型考量。",
      status: "published",
      categoryId: categories[0].id,
      tags: [tags[0].id, tags[1].id, tags[3].id],
    },
  ];

  for (const postData of samplePosts) {
    const { tags: tagIds, ...rest } = postData;
    await prisma.post.upsert({
      where: { slug: postData.slug },
      update: {},
      create: {
        ...rest,
        authorId: admin.id,
        publishedAt: postData.status === "published" ? new Date() : null,
        tags: {
          create: tagIds.map((tagId) => ({ tagId })),
        },
      },
    });
  }
  console.log("✅ Sample posts created");

  console.log("\n🎉 Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
