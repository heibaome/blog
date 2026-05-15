import { prisma } from "@/shared/db";
import type { Prisma } from "@prisma/client";

const DEFAULT_CONFIG: Record<string, string> = {
  site_title: "墨迹博客",
  site_description: "一个用心书写的博客",
  site_keywords: "博客,技术,生活",
  posts_per_page: "12",
  allow_comments: "true",
  allow_registration: "false",
};

export class ConfigService {
  async getConfig(key: string): Promise<string> {
    const config = await prisma.siteConfig.findUnique({ where: { key } });
    return config?.value ?? DEFAULT_CONFIG[key] ?? "";
  }

  async getAllConfig(): Promise<Record<string, string>> {
    const configs = await prisma.siteConfig.findMany();
    const result: Record<string, string> = { ...DEFAULT_CONFIG };
    for (const c of configs) {
      result[c.key] = c.value;
    }
    return result;
  }

  async setConfig(key: string, value: string) {
    return prisma.siteConfig.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
  }

  async setManyConfig(entries: Record<string, string>) {
    const operations: Prisma.PrismaPromise<unknown>[] = Object.entries(entries).map(([key, value]) =>
      prisma.siteConfig.upsert({
        where: { key },
        update: { value },
        create: { key, value },
      })
    );
    await prisma.$transaction(operations);
  }
}

export const configService = new ConfigService();
