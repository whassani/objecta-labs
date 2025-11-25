# 🚀 Deployment Guide

## Overview

This guide covers deploying the Objecta Labs RAG system to production environments.

---

## Prerequisites

### Required Services
- **Node.js**: 18.x or higher
- **PostgreSQL**: 14.x or higher
- **Ollama**: Latest version
- **Qdrant**: Latest version
- **Redis** (optional): For caching

### System Requirements

**Minimum:**
- 4 CPU cores
- 8GB RAM
- 50GB storage

**Recommended:**
- 8 CPU cores
- 16GB RAM
- 100GB+ storage SSD

---

## Production Setup

### 1. Database Setup

#### PostgreSQL

```bash
# Install PostgreSQL
sudo apt-get install postgresql-14

# Create database
sudo -u postgres psql
CREATE DATABASE objecta_labs_prod;
CREATE USER objecta_user WITH ENCRYPTED PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE objecta_labs_prod TO objecta_user;
\q

# Test connection
psql -h localhost -U objecta_user -d objecta_labs_prod
```

#### Database Configuration

```bash
# /etc/postgresql/14/main/postgresql.conf

max_connections = 200
shared_buffers = 2GB
effective_cache_size = 6GB
maintenance_work_mem = 512MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200
work_mem = 10MB
min_wal_size = 1GB
max_wal_size = 4GB
```

### 2. Ollama Setup

```bash
# Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Pull embedding model
ollama pull nomic-embed-text

# Configure as systemd service
sudo tee /etc/systemd/system/ollama.service <<EOF
[Unit]
Description=Ollama Service
After=network.target

[Service]
Type=simple
User=ollama
Environment="OLLAMA_HOST=0.0.0.0:11434"
ExecStart=/usr/local/bin/ollama serve
Restart=always

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl enable ollama
sudo systemctl start ollama
```

### 3. Qdrant Setup

```bash
# Using Docker (recommended)
docker run -d \
  --name qdrant \
  -p 6333:6333 \
  -p 6334:6334 \
  -v $(pwd)/qdrant_storage:/qdrant/storage \
  qdrant/qdrant

# Or install natively
# See: https://qdrant.tech/documentation/guides/installation/
```

### 4. Backend Deployment

#### Build Backend

```bash
cd backend

# Install dependencies
npm ci --production

# Build
npm run build

# Test build
npm run start:prod
```

#### Environment Configuration

```bash
# backend/.env.production

NODE_ENV=production
PORT=3001

# Database
DATABASE_HOST=your-db-host.com
DATABASE_PORT=5432
DATABASE_USER=objecta_user
DATABASE_PASSWORD=secure_password
DATABASE_NAME=objecta_labs_prod
DATABASE_SSL=true

# JWT
JWT_SECRET=generate-strong-secret-min-32-chars
JWT_EXPIRATION=24h

# Ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_EMBEDDING_MODEL=nomic-embed-text

# Qdrant
QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=optional-api-key
QDRANT_COLLECTION=objecta_labs_prod

# CORS
CORS_ORIGIN=https://yourdomain.com

# Monitoring
LOG_LEVEL=info
```

#### Process Manager (PM2)

```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start dist/main.js --name objecta-backend

# Save configuration
pm2 save

# Setup startup script
pm2 startup

# Monitor
pm2 monit
pm2 logs objecta-backend
```

### 5. Frontend Deployment

#### Build Frontend

```bash
cd frontend

# Install dependencies
npm ci

# Build for production
npm run build

# Output in .next folder
```

#### Environment Configuration

```bash
# frontend/.env.production

NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NODE_ENV=production
```

#### Deployment Options

**Option 1: Vercel (Recommended)**
```bash
npm install -g vercel
vercel --prod
```

**Option 2: PM2**
```bash
pm2 start npm --name objecta-frontend -- start
```

**Option 3: Nginx + Static**
```bash
# Export static site
npm run build
npm run export

# Serve with nginx
```

---

## Nginx Configuration

### Reverse Proxy Setup

```nginx
# /etc/nginx/sites-available/objecta-labs

# Backend API
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        return 301 https://$server_name$request_uri;
    }
}

server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.yourdomain.com/privkey.pem;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=100r/m;
    limit_req zone=api burst=20 nodelay;

    # Proxy settings
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
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # File upload size
    client_max_body_size 10M;
}

# Frontend
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## SSL Certificates

### Using Let's Encrypt

```bash
# Install certbot
sudo apt-get install certbot python3-certbot-nginx

# Get certificates
sudo certbot --nginx -d api.yourdomain.com -d yourdomain.com

# Auto-renewal
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer

# Test renewal
sudo certbot renew --dry-run
```

---

## Monitoring & Logging

### Application Monitoring

#### PM2 Monitoring

```bash
# View logs
pm2 logs

# Monitor resources
pm2 monit

# View process list
pm2 list

# Restart on issues
pm2 restart all
```

#### Health Checks

```bash
# Add to backend
GET /health

Response:
{
  "status": "ok",
  "database": "connected",
  "qdrant": "connected",
  "ollama": "connected"
}
```

### Log Management

```bash
# Configure log rotation
# /etc/logrotate.d/objecta-labs

/var/log/objecta-labs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data www-data
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}
```

### Metrics Collection

```bash
# Install Prometheus Node Exporter
wget https://github.com/prometheus/node_exporter/releases/download/v1.6.1/node_exporter-1.6.1.linux-amd64.tar.gz
tar xvfz node_exporter-*
sudo mv node_exporter /usr/local/bin/
```

---

## Backup Strategy

### Database Backups

```bash
# Daily backup script
#!/bin/bash
# /usr/local/bin/backup-postgres.sh

BACKUP_DIR="/backups/postgres"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="objecta_labs_prod"

# Create backup
pg_dump -U objecta_user -h localhost $DB_NAME | gzip > $BACKUP_DIR/${DB_NAME}_${DATE}.sql.gz

# Keep only last 30 days
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete

# Upload to S3 (optional)
aws s3 cp $BACKUP_DIR/${DB_NAME}_${DATE}.sql.gz s3://your-bucket/backups/
```

### Qdrant Backups

```bash
# Backup Qdrant data
tar -czf qdrant_backup_$(date +%Y%m%d).tar.gz qdrant_storage/
```

### Knowledge Base Export

```bash
# Export via API
curl -X POST https://api.yourdomain.com/api/knowledge-base/export \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -o kb_export_$(date +%Y%m%d).json
```

---

## Security Checklist

- [ ] Use strong JWT secret (min 32 characters)
- [ ] Enable HTTPS/SSL
- [ ] Configure CORS properly
- [ ] Set up rate limiting
- [ ] Use environment variables for secrets
- [ ] Enable database SSL
- [ ] Regular security updates
- [ ] Implement API rate limiting
- [ ] Set up firewall rules
- [ ] Enable audit logging
- [ ] Regular backups
- [ ] Disaster recovery plan

---

## Performance Optimization

### Database Indexing

```sql
-- Essential indexes
CREATE INDEX idx_documents_organization_id ON documents(organization_id);
CREATE INDEX idx_documents_status ON documents(processing_status);
CREATE INDEX idx_chunks_document_id ON document_chunks(document_id);
CREATE INDEX idx_chunks_index ON document_chunks(document_id, chunk_index);
```

### Caching Strategy

```bash
# Redis for caching
docker run -d \
  --name redis \
  -p 6379:6379 \
  redis:alpine

# Cache frequently accessed data:
- User sessions
- Popular queries
- Document metadata
```

### CDN Configuration

```bash
# Use CDN for static assets
- CloudFlare
- AWS CloudFront
- Vercel Edge Network
```

---

## Scaling

### Horizontal Scaling

**Backend:**
```bash
# Run multiple instances behind load balancer
pm2 start dist/main.js -i 4  # 4 instances
```

**Database:**
- Read replicas for queries
- Master for writes
- Connection pooling

**Qdrant:**
- Cluster mode for >1M vectors
- Sharding for large collections

### Load Balancing

```nginx
upstream backend {
    least_conn;
    server 127.0.0.1:3001;
    server 127.0.0.1:3002;
    server 127.0.0.1:3003;
    server 127.0.0.1:3004;
}
```

---

## Troubleshooting

### Common Issues

**Database Connection Fails:**
```bash
# Check PostgreSQL
sudo systemctl status postgresql
# Check network
telnet db-host 5432
```

**Ollama Not Responding:**
```bash
# Restart service
sudo systemctl restart ollama
# Check logs
journalctl -u ollama -n 100
```

**High Memory Usage:**
```bash
# Monitor with PM2
pm2 monit
# Restart if needed
pm2 restart all
```

---

## Maintenance

### Regular Tasks

**Daily:**
- Monitor logs for errors
- Check disk space
- Review API metrics

**Weekly:**
- Review search analytics
- Check duplicate documents
- Update popular queries

**Monthly:**
- Security updates
- Database maintenance
- Performance review
- Backup verification

---

## Deployment Checklist

- [ ] All services installed and configured
- [ ] Environment variables set
- [ ] SSL certificates installed
- [ ] Nginx configured
- [ ] PM2 process manager setup
- [ ] Backups configured
- [ ] Monitoring enabled
- [ ] Health checks working
- [ ] Load testing completed
- [ ] Security audit passed
- [ ] Documentation updated
- [ ] Team trained

---

**🎉 You're ready for production!**
