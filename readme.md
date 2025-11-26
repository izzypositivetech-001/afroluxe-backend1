# AfroLuxe E-commerce Backend - Production Deployment Guide

## Overview

Complete production deployment guide for AfroLuxe e-commerce backend application.

---

## System Requirements

### Minimum Requirements
- **Node.js**: 18.x or higher
- **MongoDB**: 6.0 or higher
- **Memory**: 512MB RAM minimum, 1GB recommended
- **Storage**: 10GB minimum
- **Network**: HTTPS enabled

### Recommended Production Stack
- **Hosting**: AWS, DigitalOcean, Heroku, or Railway
- **Database**: MongoDB Atlas
- **CDN**: Cloudflare
- **Email**: SendGrid, Mailgun, or AWS SES
- **Images**: Cloudinary
- **Payments**: Stripe
- **Monitoring**: DataDog, New Relic, or Sentry

---

## Pre-Deployment Checklist

### 1. Environment Variables

Create `.env.production` with all required variables:

```env
# Environment
NODE_ENV=production
PORT=5000

# Database
MONGO_URI=mongodb+srv://user:password@cluster.mongodb.net/afroluxe?retryWrites=true&w=majority

# JWT
JWT_SECRET=your-super-secure-random-string-minimum-32-characters
JWT_EXPIRE=7d

# Frontend
FRONTEND_URL=https://yourdomain.com

# Email
EMAIL_SERVICE=sendgrid
EMAIL_USER=apikey
EMAIL_PASSWORD=your-sendgrid-api-key
ADMIN_EMAIL=admin@yourdomain.com

# Stripe
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Logging
LOG_LEVEL=info

# CORS
CORS_ORIGIN=https://yourdomain.com

# Rate Limiting
RATE_LIMITING=true
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=100
```

### 2. Security Checklist

- [ ] All environment variables use production values
- [ ] JWT_SECRET is strong and random (minimum 32 characters)
- [ ] Database uses authentication
- [ ] Database connection uses SSL/TLS
- [ ] API uses HTTPS only
- [ ] CORS restricted to frontend domain
- [ ] Rate limiting enabled
- [ ] Helmet security headers enabled
- [ ] Input sanitization enabled
- [ ] Admin credentials changed from defaults

### 3. Database Setup

- [ ] MongoDB Atlas cluster created
- [ ] Database user created with read/write permissions
- [ ] IP whitelist configured (or 0.0.0.0/0 for cloud platforms)
- [ ] Connection string tested
- [ ] Database seeded with initial data
- [ ] Indexes created for performance
- [ ] Backup strategy configured

### 4. Third-Party Services

**Stripe:**
- [ ] Live mode enabled
- [ ] Webhook endpoint configured
- [ ] Test payments successful
- [ ] Webhook secret obtained

**Cloudinary:**
- [ ] Account upgraded if needed
- [ ] Upload presets configured
- [ ] Transformations tested
- [ ] Storage limits checked

**Email Service:**
- [ ] Production API keys obtained
- [ ] Domain verified (if using custom domain)
- [ ] Email templates tested
- [ ] Sender reputation good

### 5. Application Configuration

- [ ] Dependencies installed: `npm ci`
- [ ] Production build tested locally
- [ ] Logs directory created
- [ ] File permissions set correctly
- [ ] Health check endpoints accessible

---

## Deployment Methods

### Method 1: DigitalOcean Droplet

#### 1. Create Droplet
```bash
# Ubuntu 22.04 LTS
# 1GB RAM minimum
# SSH key configured
```

#### 2. Install Dependencies
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2
sudo npm install -g pm2

# Install Nginx
sudo apt install -y nginx

# Install Certbot for SSL
sudo apt install -y certbot python3-certbot-nginx
```

#### 3. Setup Application
```bash
# Create app directory
sudo mkdir -p /var/www/afroluxe-backend
sudo chown $USER:$USER /var/www/afroluxe-backend

# Clone repository
cd /var/www/afroluxe-backend
git clone <your-repo-url> .

# Install dependencies
npm ci --production

# Create .env file
nano .env
# Paste production environment variables

# Create logs directory
mkdir logs
```

#### 4. Configure PM2
```bash
# Create ecosystem config
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'afroluxe-backend',
    script: './server.js',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production'
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    merge_logs: true
  }]
}
EOF

# Start application
pm2 start ecosystem.config.js

# Configure PM2 to start on boot
pm2 startup systemd
pm2 save
```

#### 5. Configure Nginx
```bash
# Create Nginx config
sudo nano /etc/nginx/sites-available/afroluxe-backend

# Paste configuration:
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Enable site
sudo ln -s /etc/nginx/sites-available/afroluxe-backend /etc/nginx/sites-enabled/

# Test Nginx config
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

#### 6. Setup SSL with Let's Encrypt
```bash
# Obtain SSL certificate
sudo certbot --nginx -d api.yourdomain.com

# Auto-renewal is configured automatically
# Test renewal
sudo certbot renew --dry-run
```

#### 7. Configure Firewall
```bash
# Enable UFW
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

---

### Method 2: Heroku

#### 1. Prepare Application
```bash
# Create Procfile
echo "web: node server.js" > Procfile

# Ensure port is from environment
# server.js should use process.env.PORT
```

#### 2. Deploy
```bash
# Login to Heroku
heroku login

# Create app
heroku create afroluxe-backend

# Add MongoDB addon (or use MongoDB Atlas)
heroku addons:create mongolab:sandbox

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your-secret
heroku config:set FRONTEND_URL=https://yourdomain.com
# ... set all other variables

# Deploy
git push heroku master

# Scale dynos
heroku ps:scale web=1

# View logs
heroku logs --tail
```

---

### Method 3: Railway

#### 1. Connect Repository
- Go to railway.app
- Click "New Project"
- Select "Deploy from GitHub repo"
- Choose your repository

#### 2. Configure Environment
- Click on your service
- Go to "Variables"
- Add all environment variables from `.env.production`

#### 3. Deploy
- Railway automatically deploys on push to main branch
- Custom domain can be configured in settings

---

### Method 4: Docker

#### 1. Create Dockerfile
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --production

COPY . .

EXPOSE 5000

CMD ["node", "server.js"]
```

#### 2. Create .dockerignore
```
node_modules
npm-debug.log
.env
.git
.gitignore
logs
*.md
```

#### 3. Build and Run
```bash
# Build image
docker build -t afroluxe-backend .

# Run container
docker run -d \
  -p 5000:5000 \
  --env-file .env.production \
  --name afroluxe-backend \
  afroluxe-backend

# View logs
docker logs -f afroluxe-backend
```

#### 4. Docker Compose
```yaml
version: '3.8'

services:
  backend:
    build: .
    ports:
      - "5000:5000"
    env_file:
      - .env.production
    restart: always
    volumes:
      - ./logs:/app/logs
    depends_on:
      - mongodb

  mongodb:
    image: mongo:6
    ports:
      - "27017:27017"
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: password
    volumes:
      - mongodb_data:/data/db

volumes:
  mongodb_data:
```

---

## Database Optimization

### 1. Create Indexes
```javascript
// Run these in MongoDB shell or Compass

// Products
db.products.createIndex({ "name.en": "text", "name.no": "text", "description.en": "text", "description.no": "text" })
db.products.createIndex({ category: 1 })
db.products.createIndex({ price: 1 })
db.products.createIndex({ stock: 1 })
db.products.createIndex({ salesCount: -1 })
db.products.createIndex({ createdAt: -1 })

// Orders
db.orders.createIndex({ orderId: 1 }, { unique: true })
db.orders.createIndex({ "customer.email": 1 })
db.orders.createIndex({ orderStatus: 1 })
db.orders.createIndex({ paymentStatus: 1 })
db.orders.createIndex({ createdAt: -1 })

// Admins
db.admins.createIndex({ email: 1 }, { unique: true })

// Carts
db.carts.createIndex({ sessionId: 1 }, { unique: true })
db.carts.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 })
```

### 2. Connection Pooling
MongoDB connection already configured with:
- `maxPoolSize: 10`
- `minPoolSize: 2`
- `maxIdleTimeMS: 30000`

### 3. Monitoring
- Enable MongoDB Atlas monitoring
- Set up alerts for:
  - High connection count
  - Slow queries
  - Storage usage
  - CPU usage

---

## Performance Optimization

### 1. Enable Compression
```javascript
// Already configured in server.js
import compression from 'compression';
app.use(compression());
```

### 2. Response Caching
Consider adding Redis for:
- Session storage
- API response caching
- Rate limit storage

### 3. Image Optimization
Cloudinary already configured with:
- Automatic format selection
- Quality optimization
- Responsive images

### 4. Database Queries
- Use pagination on all list endpoints
- Use projection to limit returned fields
- Use aggregation for complex queries
- Avoid N+1 queries

---

## Monitoring & Logging

### 1. Application Logs
Winston configured with:
- Daily rotation
- 14-day retention
- Separate error logs
- Exception handling
- Rejection handling

Logs location: `./logs/`

### 2. Health Checks
Available endpoints:
- `GET /api/health` - Basic health check
- `GET /api/health/detailed` - Detailed system status
- `GET /api/health/ready` - Readiness probe
- `GET /api/health/live` - Liveness probe

### 3. PM2 Monitoring
```bash
# View status
pm2 status

# View logs
pm2 logs

# Monitor resources
pm2 monit

# View metrics
pm2 describe afroluxe-backend
```

### 4. External Monitoring
Recommended services:
- **Uptime**: UptimeRobot, Pingdom
- **Performance**: New Relic, DataDog
- **Errors**: Sentry
- **Logs**: Loggly, Papertrail

---

## Backup Strategy

### 1. Database Backups

**MongoDB Atlas (Recommended):**
- Automatic continuous backups
- Point-in-time recovery
- Download backups

**Manual Backups:**
```bash
# Daily backup script
mongodump --uri="mongodb+srv://user:pass@cluster.mongodb.net/afroluxe" --out=/backups/$(date +%Y%m%d)

# Setup cron job
0 2 * * * /path/to/backup-script.sh
```

### 2. Application Backups
```bash
# Backup code and configuration
tar -czf afroluxe-backup-$(date +%Y%m%d).tar.gz \
  /var/www/afroluxe-backend \
  --exclude=node_modules \
  --exclude=logs
```

### 3. Restore Procedure
```bash
# Restore database
mongorestore --uri="mongodb+srv://user:pass@cluster.mongodb.net/afroluxe" /backups/20241120/afroluxe

# Restore application
tar -xzf afroluxe-backup-20241120.tar.gz -C /var/www/
```

---

## Security Hardening

### 1. System Security
```bash
# Keep system updated
sudo apt update && sudo apt upgrade -y

# Configure automatic security updates
sudo dpkg-reconfigure --priority=low unattended-upgrades

# Disable root login
sudo nano /etc/ssh/sshd_config
# Set: PermitRootLogin no

# Change SSH port
# Set: Port 2222

# Restart SSH
sudo systemctl restart sshd
```

### 2. Application Security
- [x] Rate limiting enabled
- [x] Helmet security headers
- [x] CORS restricted
- [x] Input sanitization
- [x] XSS protection
- [x] MongoDB injection prevention
- [x] JWT authentication
- [x] Role-based authorization

### 3. SSL/TLS
- Use Let's Encrypt for free SSL
- Enforce HTTPS only
- HSTS enabled
- Minimum TLS 1.2

---

## Troubleshooting

### Application Won't Start
```bash
# Check logs
pm2 logs afroluxe-backend

# Check environment variables
pm2 env 0

# Check port availability
sudo netstat -tulpn | grep :5000

# Check MongoDB connection
mongo "mongodb+srv://cluster.mongodb.net/test" --username user
```

### High Memory Usage
```bash
# Check memory
pm2 list
free -h

# Restart application
pm2 restart afroluxe-backend

# Clear logs
pm2 flush
```

### Database Connection Issues
- Check MongoDB Atlas network access
- Verify connection string
- Check database user permissions
- Monitor connection pool

### SSL Certificate Issues
```bash
# Renew certificate
sudo certbot renew

# Test SSL configuration
sudo nginx -t
```

---

## Maintenance

### Regular Tasks

**Daily:**
- Check application logs
- Monitor error rates
- Check disk space

**Weekly:**
- Review security alerts
- Check backup integrity
- Review performance metrics

**Monthly:**
- Update dependencies
- Review access logs
- Optimize database
- Security audit

### Update Procedure
```bash
# Pull latest code
cd /var/www/afroluxe-backend
git pull origin main

# Install dependencies
npm ci --production

# Run database migrations (if any)
npm run migrate

# Restart application
pm2 restart afroluxe-backend

# Verify health
curl https://api.yourdomain.com/api/health
```

---

## Support & Documentation

### API Documentation
- Base URL: `https://api.yourdomain.com/api`
- Authentication: JWT Bearer token
- Rate Limits: Varies by endpoint
- All endpoints documented in `/BATCH_*_COMPLETE.md` files

### Contact
- Technical issues: tech@afroluxe.no
- Security issues: security@afroluxe.no

---

## Success Criteria

Application is production-ready when:

- [ ] All environment variables configured
- [ ] Database backups automated
- [ ] SSL certificate installed and auto-renewing
- [ ] Health checks responding
- [ ] Monitoring configured
- [ ] Logs rotating properly
- [ ] PM2 process running stable
- [ ] All tests passing
- [ ] Security audit completed
- [ ] Performance benchmarks met
- [ ] Documentation updated
- [ ] Team trained on deployment

---

**Last Updated:** November 20, 2024  
**Version:** 1.0.0  
**Status:** Production Ready 