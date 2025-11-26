# Production Deployment Guide

## Prerequisites

- PostgreSQL 13+
- Redis 6+
- Node.js 18.19+ 
- PM2 or Docker
- SSL Certificate
- Domain name
- SendGrid account (or AWS SES)
- Sentry account (optional but recommended)

## 1. Server Setup

### Install Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib

# Install Redis
sudo apt install redis-server

# Install PM2
sudo npm install -g pm2
```

## 2. Database Setup

```bash
# Create database
sudo -u postgres psql
CREATE DATABASE objecta_labs;
CREATE USER your_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE objecta_labs TO your_user;
\q

# Run migrations
psql -U your_user -d objecta_labs -f backend/src/migrations/001-create-rbac-tables.sql
psql -U your_user -d objecta_labs -f backend/src/migrations/002-seed-default-roles.sql
psql -U your_user -d objecta_labs -f backend/src/migrations/003-create-api-keys-table.sql
psql -U your_user -d objecta_labs -f backend/src/migrations/004-create-audit-logs-table.sql
psql -U your_user -d objecta_labs -f backend/src/migrations/create-jobs-table.sql
# ... run all other migrations
```

## 3. Environment Configuration

Create `.env` file:

```bash
# Copy example
cp .env.example .env

# Edit with production values
nano .env
```

**Critical variables:**

```env
NODE_ENV=production
DATABASE_HOST=your-db-host
DATABASE_PASSWORD=your-secure-password
JWT_SECRET=generate-with-openssl-rand-base64-32
ENCRYPTION_KEY=generate-32-character-key
CORS_ORIGIN=https://yourdomain.com
SENTRY_DSN=your-sentry-dsn
SENDGRID_API_KEY=your-sendgrid-key
BACKUP_ENABLED=true
```

## 4. Build Application

```bash
# Install dependencies
cd backend
npm ci --production=false

# Build
npm run build

# Test
npm run test
```

## 5. Setup PM2

```bash
# Create ecosystem file
pm2 ecosystem

# Edit pm2.config.js
module.exports = {
  apps: [{
    name: 'ai-platform-api',
    script: './dist/main.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
    },
  }],
};

# Start
pm2 start pm2.config.js

# Save configuration
pm2 save

# Setup startup script
pm2 startup
```

## 6. Setup Nginx

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";
    add_header X-XSS-Protection "1; mode=block";

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket support
    location /socket.io/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

## 7. Setup Backups

```bash
# Create backup script
sudo nano /etc/cron.daily/backup-ai-platform

#!/bin/bash
cd /var/www/ai-platform/backend
npm run backup
find /var/backups/ai-platform -mtime +30 -delete

# Make executable
sudo chmod +x /etc/cron.daily/backup-ai-platform
```

## 8. Monitoring Setup

### Sentry

1. Create project at sentry.io
2. Copy DSN to .env
3. Configure alerts for errors

### Health Checks

```bash
# Add to monitoring (e.g., UptimeRobot)
https://api.yourdomain.com/health

# Kubernetes probes
livenessProbe:
  httpGet:
    path: /health/live
    port: 3001

readinessProbe:
  httpGet:
    path: /health/ready
    port: 3001
```

## 9. Security Hardening

```bash
# Setup firewall
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable

# Fail2ban for SSH
sudo apt install fail2ban
sudo systemctl enable fail2ban

# Auto security updates
sudo apt install unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

## 10. SSL Certificate

```bash
# Using Certbot (Let's Encrypt)
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d api.yourdomain.com

# Auto-renewal
sudo certbot renew --dry-run
```

## Post-Deployment Checklist

- [ ] All migrations applied
- [ ] Environment variables set
- [ ] SSL certificate installed
- [ ] Backups running daily
- [ ] Monitoring configured
- [ ] Health checks responding
- [ ] Error tracking working
- [ ] Rate limiting active
- [ ] Audit logs writing
- [ ] Email sending working
- [ ] API keys functional
- [ ] RBAC permissions correct
- [ ] Load testing passed
- [ ] Security scan passed
- [ ] Rollback plan ready

## Rollback Procedure

```bash
# Stop current version
pm2 stop ai-platform-api

# Restore database
psql -U your_user -d objecta_labs < /path/to/backup.sql

# Deploy previous version
git checkout previous-tag
npm run build
pm2 restart ai-platform-api

# Verify
curl https://api.yourdomain.com/health
```

## Monitoring Dashboards

- Sentry: https://sentry.io/organizations/your-org/
- Server: PM2 Dashboard or custom monitoring
- Uptime: UptimeRobot or Pingdom
- Logs: Papertrail, LogDNA, or CloudWatch

## Support Contacts

- DevOps Lead: devops@yourcompany.com
- Security Team: security@yourcompany.com
- On-Call: oncall@yourcompany.com

---

**Production Ready! 🚀**
