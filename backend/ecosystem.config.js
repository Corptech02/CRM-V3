module.exports = {
  apps: [{
    name: 'vanguard-notifications',
    script: './notification-service.js',
    cwd: '/var/www/vanguard/backend',
    watch: false,
    restart_delay: 5000,
    max_restarts: 10,
    min_uptime: '10s',
    error_file: '/var/www/vanguard/logs/notification-error.log',
    out_file: '/var/www/vanguard/logs/notification-out.log',
    log_file: '/var/www/vanguard/logs/notification-combined.log',
    time: true,
    env: {
      NODE_ENV: 'production'
    }
  }]
};