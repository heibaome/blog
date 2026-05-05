/**
 * 分页工具
 * 使用 take(pageSize+1) 替代 count 查询，通过结果数量判断是否有更多数据
 */

/**
 * 构建分页查询参数
 * @returns Prisma 查询用的 skip 和 take（take 多取一条）
 */
export function buildPaginationParams(page: number, pageSize: number) {
  return {
    skip: (page - 1) * pageSize,
    take: pageSize + 1,
  };
}

/**
 * 处理分页结果：截断多余的一条，返回 hasMore 标记
 */
export function paginateResult<T>(results: T[], pageSize: number) {
  const hasMore = results.length > pageSize;
  return {
    items: hasMore ? results.slice(0, pageSize) : results,
    hasMore,
  };
}
