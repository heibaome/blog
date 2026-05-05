/**
 * 定时清理任务注册表
 * 集中管理所有模块的过期数据清理，避免各模块分散 setInterval
 * Next.js dev 模式下热重载时只初始化一次
 */

type CleanupTask = () => Promise<void> | void;

interface RegisteredTask {
  name: string;
  fn: CleanupTask;
  intervalMs: number;
  timerId?: ReturnType<typeof setInterval>;
}

const tasks: RegisteredTask[] = [];

/**
 * 注册一个定时清理任务
 * @param name 任务名称（用于日志）
 * @param fn 清理函数
 * @param intervalMs 执行间隔（毫秒）
 */
export function registerCleanup(name: string, fn: CleanupTask, intervalMs: number): void {
  // 防止重复注册（dev 模式热重载）
  if (tasks.some((t) => t.name === name)) return;

  const task: RegisteredTask = { name, fn, intervalMs };
  tasks.push(task);

  // 立即执行一次
  Promise.resolve(fn()).catch(() => {});

  // 定时执行
  task.timerId = setInterval(() => {
    Promise.resolve(fn()).catch(() => {});
  }, intervalMs);
}

/**
 * 注销一个定时清理任务
 * @param name 任务名称
 */
export function unregisterCleanup(name: string): void {
  const index = tasks.findIndex(t => t.name === name);
  if (index === -1) return;
  
  const task = tasks[index];
  if (task.timerId) {
    clearInterval(task.timerId);
  }
  tasks.splice(index, 1);
}

/**
 * 清理所有定时任务
 */
export function cleanupAll(): void {
  tasks.forEach(task => {
    if (task.timerId) {
      clearInterval(task.timerId);
    }
  });
  tasks.length = 0;
}

/**
 * 获取所有已注册任务的名称（调试用）
 */
export function getRegisteredTasks(): string[] {
  return tasks.map((t) => t.name);
}

// 在 Next.js 开发模式下处理热重载
if (typeof window !== 'undefined') {
  // 清理之前的定时器
  window.addEventListener('beforeunload', cleanupAll);
  
  // 开发模式下，热重载时也清理
  if (process.env.NODE_ENV === 'development') {
    // 保存原始模块热重载函数
    const originalHotAccept = (module as any).hot?.accept;
    if (originalHotAccept) {
      (module as any).hot.accept = function(...args: any[]) {
        cleanupAll();
        return originalHotAccept.apply(this, args);
      };
    }
  }
}
