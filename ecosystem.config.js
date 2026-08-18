// Cấu hình PM2 cho VPS — xem DEPLOY.md để biết cách dùng.
// Chạy từ thư mục root repo: `pm2 start ecosystem.config.js`
module.exports = {
  apps: [
    {
      name: "comic-backend",
      cwd: "./backend",
      script: "dist/main.js",
      env: {
        NODE_ENV: "production",
      },
    },
    {
      name: "comic-frontend",
      cwd: "./frontend",
      script: "npm",
      args: "start",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
