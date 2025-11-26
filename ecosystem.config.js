/**
 * PM2 Ecosystem Configuration
 * Production process management
 */

export const apps = [{
    name: 'afroluxe-backend',
    script: './server.js',
    instances: 2,
    exec_mode: 'cluster',
    env: {
        NODE_ENV: 'production',
        PORT: 5000
    },
    env_development: {
        NODE_ENV: 'development',
        PORT: 5000
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    merge_logs: true,
    max_memory_restart: '500M',
    autorestart: true,
    watch: false,
    ignore_watch: ['node_modules', 'logs'],
    max_restarts: 10,
    min_uptime: '10s'
}];