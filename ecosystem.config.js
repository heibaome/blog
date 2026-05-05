module.exports = {
  apps: [{
    name: "moji-blog",
    script: "npm",
    args: "start",
    cwd: "/home/blog/moji-blog",

    // 零停机相关
    listen_timeout: 10000,       // 等待进程就绪的时间（ms）
    kill_timeout: 5000,          // 优雅关闭超时（ms）
    exp_backoff_restart_delay: 200,  // 重启退避延迟（ms）

    // 内存保护
    max_memory_restart: "300M",

    // 日志
    merge_logs: true,
    log_date_format: "YYYY-MM-DD HH:mm:ss Z",
  }]
};
