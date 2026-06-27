/**
 * PM2 ecosystem config for KHUMMELA on EC2
 *
 * Usage on server:
 *   cd /var/www/khummela
 *   pm2 start deploy/ecosystem.config.cjs
 *   pm2 save && pm2 startup
 */
module.exports = {
  apps: [
    {
      name: "khummela",
      cwd: "/var/www/khummela",
      script: "node_modules/next/dist/bin/next",
      args: "start",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      merge_logs: true,
      time: true,
    },
  ],
};
