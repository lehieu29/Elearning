# Hướng Dẫn Triển Khai (Deployment Guide)

Tài liệu này cung cấp hướng dẫn chi tiết về cách triển khai dự án E-Learning lên môi trường production. Hướng dẫn bao gồm các bước cài đặt, cấu hình, và các phương pháp triển khai khác nhau.

## 1. Yêu Cầu Hệ Thống

### 1.1. Yêu Cầu Server

- **Backend**:
  - Node.js 18.x hoặc mới hơn
  - RAM: Tối thiểu 2GB (khuyến nghị 4GB)
  - CPU: 2 cores hoặc nhiều hơn
  - Hệ điều hành: Ubuntu 20.04 LTS hoặc mới hơn

- **Frontend**:
  - Next.js 14.x
  - RAM: Tối thiểu 1GB (khuyến nghị 2GB)

- **Database**:
  - MongoDB 5.0 hoặc mới hơn

- **Cache**:
  - Redis 6.x hoặc mới hơn

### 1.2. Yêu Cầu Dịch Vụ Bên Thứ Ba

- **Cloudinary**: Lưu trữ media files
- **Stripe**: Xử lý thanh toán
- **SMTP Server**: Gửi email
- **Google AI API**: Tính năng AI

## 2. Triển Khai Truyền Thống (Traditional Deployment)

### 2.1. Chuẩn Bị Môi Trường

#### Cài đặt Node.js

```bash
# Sử dụng nvm để quản lý phiên bản Node.js
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash
source ~/.bashrc
nvm install 18
nvm use 18
```

#### Cài đặt MongoDB

```bash
# Thêm khóa GPG và repository
wget -qO - https://www.mongodb.org/static/pgp/server-5.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/5.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-5.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org

# Khởi động MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod
```

#### Cài đặt Redis

```bash
sudo apt-get install redis-server
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

#### Cài đặt PM2

```bash
npm install -g pm2
```

### 2.2. Cài Đặt Ứng Dụng

#### Clone Repository

```bash
git clone https://github.com/yourusername/elearning.git
cd elearning
```

#### Cài Đặt Backend

```bash
cd Backend
npm install
cp .env.example .env
# Chỉnh sửa file .env với các giá trị thực tế
```

#### Cài Đặt Frontend

```bash
cd ../Frontend
npm install
cp .env.example .env
# Chỉnh sửa file .env với các giá trị thực tế
```

### 2.3. Build Ứng Dụng

#### Build Backend

```bash
cd Backend
npm run build
```

#### Build Frontend

```bash
cd ../Frontend
npm run build
```

### 2.4. Cấu Hình PM2

Tạo file `ecosystem.config.js` ở thư mục gốc:

```javascript
module.exports = {
  apps: [
    {
      name: "elearning-backend",
      cwd: "./Backend",
      script: "build/server.js",
      instances: "max",
      exec_mode: "cluster",
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
      },
    },
    {
      name: "elearning-frontend",
      cwd: "./Frontend",
      script: "npm",
      args: "start",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
```

### 2.5. Khởi Động Ứng Dụng

```bash
pm2 start ecosystem.config.js
```

### 2.6. Cấu Hình Nginx

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api/ {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /socket.io/ {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 2.7. Cấu Hình SSL với Let's Encrypt

```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

## 3. Triển Khai với Docker

### 3.1. Cài Đặt Docker và Docker Compose

```bash
# Cài đặt Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Cài đặt Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.15.1/docker-compose-linux-x86_64" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 3.2. Tạo Dockerfile cho Backend

```dockerfile
# Backend/Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

EXPOSE 8000

CMD ["node", "build/server.js"]
```

### 3.3. Tạo Dockerfile cho Frontend

```dockerfile
# Frontend/Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

### 3.4. Tạo Docker Compose File

```yaml
# docker-compose.yml
version: '3'

services:
  mongodb:
    image: mongo:5.0
    container_name: elearning-mongodb
    volumes:
      - mongo-data:/data/db
    ports:
      - "27017:27017"
    restart: always
    networks:
      - app-network

  redis:
    image: redis:6-alpine
    container_name: elearning-redis
    volumes:
      - redis-data:/data
    ports:
      - "6379:6379"
    restart: always
    networks:
      - app-network

  backend:
    build:
      context: ./Backend
      dockerfile: Dockerfile
    container_name: elearning-backend
    volumes:
      - ./Backend/uploads:/app/uploads
    ports:
      - "8000:8000"
    depends_on:
      - mongodb
      - redis
    env_file:
      - ./Backend/.env
    restart: always
    networks:
      - app-network

  frontend:
    build:
      context: ./Frontend
      dockerfile: Dockerfile
    container_name: elearning-frontend
    ports:
      - "3000:3000"
    depends_on:
      - backend
    env_file:
      - ./Frontend/.env
    restart: always
    networks:
      - app-network

  nginx:
    image: nginx:stable-alpine
    container_name: elearning-nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/conf:/etc/nginx/conf.d
      - ./nginx/certbot/conf:/etc/nginx/ssl
      - ./nginx/certbot/data:/var/www/certbot
    depends_on:
      - backend
      - frontend
    restart: always
    networks:
      - app-network

  certbot:
    image: certbot/certbot:latest
    container_name: elearning-certbot
    volumes:
      - ./nginx/certbot/conf:/etc/letsencrypt
      - ./nginx/certbot/data:/var/www/certbot
    networks:
      - app-network

networks:
  app-network:
    driver: bridge

volumes:
  mongo-data:
  redis-data:
```

### 3.5. Tạo Nginx Configuration

```bash
mkdir -p nginx/conf
```

```nginx
# nginx/conf/app.conf
server {
    listen 80;
    server_name yourdomain.com;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl;
    server_name yourdomain.com;

    ssl_certificate /etc/nginx/ssl/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/live/yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://frontend:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api/ {
        proxy_pass http://backend:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /socket.io/ {
        proxy_pass http://backend:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 3.6. Khởi Động Docker Compose

```bash
# Khởi động tất cả các services
docker-compose up -d

# Lấy SSL certificate từ Let's Encrypt
docker-compose run --rm certbot certonly --webroot -w /var/www/certbot -d yourdomain.com --email your@email.com --agree-tos --no-eff-email
```

### 3.7. Tự Động Gia Hạn SSL

```bash
# Tạo script renew-ssl.sh
cat > renew-ssl.sh <<EOL
#!/bin/bash
docker-compose run --rm certbot renew
docker-compose exec nginx nginx -s reload
EOL

chmod +x renew-ssl.sh

# Thêm cron job
(crontab -l 2>/dev/null; echo "0 12 * * * /path/to/your/renew-ssl.sh") | crontab -
```

## 4. Triển Khai với Cloud Providers

### 4.1. AWS

#### 4.1.1. Elastic Beanstalk (Backend)

1. **Cài đặt EB CLI**:
```bash
pip install awsebcli
```

2. **Khởi tạo EB application**:
```bash
cd Backend
eb init

# Trong quá trình khởi tạo:
# - Chọn region
# - Tạo application mới
# - Chọn Node.js platform
# - Cấu hình SSH (optional)
```

3. **Tạo file `.ebextensions/nodecommand.config`**:
```yaml
option_settings:
  aws:elasticbeanstalk:container:nodejs:
    NodeCommand: "npm start"
  aws:elasticbeanstalk:application:environment:
    NODE_ENV: production
    DB_URL: mongodb://your-mongo-url
    REDIS_URL: redis://your-redis-url
    JWT_SECRET: your-jwt-secret
```

4. **Tạo file `Procfile`**:
```
web: node build/server.js
```

5. **Deploy application**:
```bash
eb create elearning-backend-prod
```

#### 4.1.2. S3 + CloudFront (Frontend)

1. **Tạo S3 bucket**:
   - Mở AWS Console
   - Tạo S3 bucket mới (ví dụ: elearning-frontend)
   - Cấu hình để host static website

2. **Build frontend**:
```bash
cd Frontend
NEXT_PUBLIC_SERVER_URI=https://your-eb-domain.elasticbeanstalk.com/api/v1 npm run build
```

3. **Deploy frontend**:
```bash
aws s3 sync out/ s3://elearning-frontend
```

4. **Tạo CloudFront distribution**:
   - Origin domain: S3 bucket URL
   - Custom domain: yourdomain.com
   - SSL Certificate: Tạo mới trong ACM
   - Cache settings: Recommended defaults

### 4.2. Digital Ocean

#### 4.2.1. App Platform

1. **Tạo file `app.yaml`**:
```yaml
name: elearning
services:
  - name: backend
    github:
      repo: yourusername/elearning
      branch: main
      deploy_on_push: true
    source_dir: Backend
    build_command: npm install && npm run build
    run_command: node build/server.js
    envs:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 8000
      # Thêm các biến môi trường khác

  - name: frontend
    github:
      repo: yourusername/elearning
      branch: main
      deploy_on_push: true
    source_dir: Frontend
    build_command: npm install && npm run build
    run_command: npm start
    envs:
      - key: NODE_ENV
        value: production
      - key: NEXT_PUBLIC_SERVER_URI
        value: ${app.backend.INTERNAL_URL}/api/v1
      # Thêm các biến môi trường khác

databases:
  - name: mongodb
    engine: MONGODB
    production: true
    version: 5.0
```

2. **Deploy từ DigitalOcean App Platform Dashboard**

### 4.3. Vercel + Heroku

#### 4.3.1. Vercel (Frontend)

1. **Setup Vercel CLI**:
```bash
npm install -g vercel
```

2. **Login và deploy**:
```bash
cd Frontend
vercel login
vercel
```

3. **Cấu hình environment variables trên Vercel dashboard**

#### 4.3.2. Heroku (Backend)

1. **Setup Heroku CLI**:
```bash
npm install -g heroku
```

2. **Login và deploy**:
```bash
cd Backend
heroku login
heroku create elearning-backend

# Thêm buildpack
heroku buildpacks:set heroku/nodejs

# Setup MongoDB và Redis add-ons
heroku addons:create mongolab:sandbox
heroku addons:create heroku-redis:hobby-dev

# Cấu hình environment variables
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your-jwt-secret
# Thêm các biến môi trường khác

# Deploy
git init
heroku git:remote -a elearning-backend
git add .
git commit -m "Initial deployment"
git push heroku main
```

## 5. CI/CD Pipeline

### 5.1. GitHub Actions

#### 5.1.1. Backend CI/CD

Tạo file `.github/workflows/backend-deploy.yml`:

```yaml
name: Backend CI/CD

on:
  push:
    branches: [ main ]
    paths:
      - 'Backend/**'

jobs:
  test_and_build:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: |
          cd Backend
          npm install
          
      - name: Run tests
        run: |
          cd Backend
          npm test
          
      - name: Build
        run: |
          cd Backend
          npm run build
          
      - name: Deploy to production
        if: success()
        uses: akhileshns/heroku-deploy@v3.12.12
        with:
          heroku_api_key: ${{ secrets.HEROKU_API_KEY }}
          heroku_app_name: elearning-backend
          heroku_email: ${{ secrets.HEROKU_EMAIL }}
          appdir: "Backend"
```

#### 5.1.2. Frontend CI/CD

Tạo file `.github/workflows/frontend-deploy.yml`:

```yaml
name: Frontend CI/CD

on:
  push:
    branches: [ main ]
    paths:
      - 'Frontend/**'

jobs:
  test_and_deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: |
          cd Frontend
          npm install
          
      - name: Run tests
        run: |
          cd Frontend
          npm test
          
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID}}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID}}
          working-directory: Frontend
          vercel-args: '--prod'
```

## 6. Monitoring và Logging

### 6.1. PM2 Monitoring

```bash
# Cài đặt pm2-logrotate để quản lý logs
pm2 install pm2-logrotate

# Cấu hình
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:compress true
pm2 set pm2-logrotate:retain 7

# Xem logs
pm2 logs

# Xem metrics
pm2 monit
```

### 6.2. Tích Hợp Prometheus & Grafana

1. **Tạo file `docker-compose.monitoring.yml`**:

```yaml
version: '3'

services:
  prometheus:
    image: prom/prometheus:latest
    container_name: prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus:/etc/prometheus
      - prometheus-data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
    restart: always
    networks:
      - monitoring-network

  grafana:
    image: grafana/grafana:latest
    container_name: grafana
    ports:
      - "3001:3000"
    volumes:
      - grafana-data:/var/lib/grafana
    restart: always
    depends_on:
      - prometheus
    networks:
      - monitoring-network

  node-exporter:
    image: prom/node-exporter:latest
    container_name: node-exporter
    ports:
      - "9100:9100"
    restart: always
    networks:
      - monitoring-network

networks:
  monitoring-network:
    driver: bridge

volumes:
  prometheus-data:
  grafana-data:
```

2. **Tạo file `monitoring/prometheus/prometheus.yml`**:

```yaml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'prometheus'
    scrape_interval: 5s
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'node-exporter'
    scrape_interval: 5s
    static_configs:
      - targets: ['node-exporter:9100']

  - job_name: 'elearning-backend'
    scrape_interval: 5s
    static_configs:
      - targets: ['elearning-backend:8000']
```

3. **Khởi động monitoring stack**:

```bash
docker-compose -f docker-compose.monitoring.yml up -d
```

4. **Truy cập Grafana**:
   - URL: http://your-server-ip:3001
   - Default login: admin/admin
   - Add Prometheus data source
   - Import Node.js dashboard (ID: 1860)

### 6.3. Tích Hợp ELK Stack

1. **Tạo file `docker-compose.elk.yml`**:

```yaml
version: '3'

services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:7.14.0
    container_name: elasticsearch
    environment:
      - discovery.type=single-node
      - ES_JAVA_OPTS=-Xms512m -Xmx512m
    ports:
      - "9200:9200"
    volumes:
      - elasticsearch-data:/usr/share/elasticsearch/data
    networks:
      - elk-network

  logstash:
    image: docker.elastic.co/logstash/logstash:7.14.0
    container_name: logstash
    volumes:
      - ./elk/logstash/pipeline:/usr/share/logstash/pipeline
    ports:
      - "5044:5044"
    depends_on:
      - elasticsearch
    networks:
      - elk-network

  kibana:
    image: docker.elastic.co/kibana/kibana:7.14.0
    container_name: kibana
    ports:
      - "5601:5601"
    depends_on:
      - elasticsearch
    networks:
      - elk-network

  filebeat:
    image: docker.elastic.co/beats/filebeat:7.14.0
    container_name: filebeat
    volumes:
      - ./elk/filebeat/filebeat.yml:/usr/share/filebeat/filebeat.yml:ro
      - /var/lib/docker/containers:/var/lib/docker/containers:ro
      - /var/log:/var/log:ro
    depends_on:
      - elasticsearch
      - logstash
    networks:
      - elk-network
    command: filebeat -e -strict.perms=false

networks:
  elk-network:
    driver: bridge

volumes:
  elasticsearch-data:
```

2. **Tạo file `elk/filebeat/filebeat.yml`**:

```yaml
filebeat.inputs:
- type: log
  enabled: true
  paths:
    - /var/log/*.log
    - /var/log/nginx/*.log
    - /var/lib/docker/containers/*/*.log

filebeat.autodiscover:
  providers:
    - type: docker
      hints.enabled: true

output.logstash:
  hosts: ["logstash:5044"]
```

3. **Tạo file `elk/logstash/pipeline/logstash.conf`**:

```
input {
  beats {
    port => 5044
  }
}

filter {
  if [container][name] =~ /elearning/ {
    json {
      source => "message"
    }
  }
}

output {
  elasticsearch {
    hosts => ["elasticsearch:9200"]
    index => "elearning-%{+YYYY.MM.dd}"
  }
}
```

4. **Khởi động ELK stack**:

```bash
docker-compose -f docker-compose.elk.yml up -d
```

## 7. Backup và Recovery

### 7.1. MongoDB Backup

#### Định kỳ backup với cron

```bash
# Tạo script backup.sh
cat > mongodb-backup.sh <<EOL
#!/bin/bash
TIMESTAMP=\$(date +%Y%m%d_%H%M%S)
BACKUP_DIR=/path/to/backups
MONGO_HOST=localhost
MONGO_PORT=27017
MONGO_DATABASE=elearning

# Tạo backup directory nếu chưa tồn tại
mkdir -p \$BACKUP_DIR

# Backup using mongodump
mongodump --host \$MONGO_HOST --port \$MONGO_PORT --db \$MONGO_DATABASE --out \$BACKUP_DIR/\$TIMESTAMP

# Tạo archive từ backup directory
cd \$BACKUP_DIR
tar -czf mongodb_backup_\$TIMESTAMP.tar.gz \$TIMESTAMP
rm -rf \$TIMESTAMP

# Giữ chỉ 7 bản backup gần nhất
ls -tp \$BACKUP_DIR/mongodb_backup_*.tar.gz | grep -v '/$' | tail -n +8 | xargs -I {} rm -- {}

# Sync to cloud storage (optional)
# aws s3 cp \$BACKUP_DIR/mongodb_backup_\$TIMESTAMP.tar.gz s3://your-backup-bucket/mongodb/
EOL

chmod +x mongodb-backup.sh

# Thêm cron job để chạy backup hàng ngày lúc 2 giờ sáng
(crontab -l 2>/dev/null; echo "0 2 * * * /path/to/mongodb-backup.sh") | crontab -
```

### 7.2. Redis Backup

```bash
# Tạo script backup.sh
cat > redis-backup.sh <<EOL
#!/bin/bash
TIMESTAMP=\$(date +%Y%m%d_%H%M%S)
BACKUP_DIR=/path/to/backups
REDIS_HOST=localhost
REDIS_PORT=6379

# Tạo backup directory nếu chưa tồn tại
mkdir -p \$BACKUP_DIR

# Trigger Redis save
redis-cli -h \$REDIS_HOST -p \$REDIS_PORT SAVE

# Copy dump.rdb
cp /var/lib/redis/dump.rdb \$BACKUP_DIR/redis_dump_\$TIMESTAMP.rdb

# Giữ chỉ 7 bản backup gần nhất
ls -tp \$BACKUP_DIR/redis_dump_*.rdb | grep -v '/$' | tail -n +8 | xargs -I {} rm -- {}

# Sync to cloud storage (optional)
# aws s3 cp \$BACKUP_DIR/redis_dump_\$TIMESTAMP.rdb s3://your-backup-bucket/redis/
EOL

chmod +x redis-backup.sh

# Thêm cron job để chạy backup hàng ngày lúc 3 giờ sáng
(crontab -l 2>/dev/null; echo "0 3 * * * /path/to/redis-backup.sh") | crontab -
```

### 7.3. Khôi Phục Dữ Liệu

#### MongoDB Restore

```bash
# Giải nén backup archive
tar -xzf mongodb_backup_YYYYMMDD_HHMMSS.tar.gz

# Restore database
mongorestore --host localhost --port 27017 --db elearning YYYYMMDD_HHMMSS/elearning
```

#### Redis Restore

```bash
# Dừng Redis server
sudo systemctl stop redis-server

# Copy dump file
sudo cp redis_dump_YYYYMMDD_HHMMSS.rdb /var/lib/redis/dump.rdb

# Thay đổi quyền
sudo chown redis:redis /var/lib/redis/dump.rdb

# Khởi động lại Redis
sudo systemctl start redis-server
```

## 8. Scaling

### 8.1. Horizontal Scaling

#### Với Docker Swarm

1. **Khởi tạo Docker Swarm**:

```bash
docker swarm init
```

2. **Tạo file `docker-stack.yml`**:

```yaml
version: '3.8'

services:
  backend:
    image: your-registry/elearning-backend:latest
    deploy:
      replicas: 3
      update_config:
        parallelism: 1
        delay: 10s
      restart_policy:
        condition: on-failure
    ports:
      - "8000:8000"
    networks:
      - app-network
    environment:
      - NODE_ENV=production
      - DB_URL=mongodb://mongodb:27017/elearning
      - REDIS_URL=redis://redis:6379

  frontend:
    image: your-registry/elearning-frontend:latest
    deploy:
      replicas: 2
    ports:
      - "3000:3000"
    networks:
      - app-network
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_SERVER_URI=http://backend:8000/api/v1

  mongodb:
    image: mongo:5.0
    deploy:
      replicas: 1
      placement:
        constraints: [node.role == manager]
    volumes:
      - mongo-data:/data/db
    networks:
      - app-network

  redis:
    image: redis:6
    deploy:
      replicas: 1
      placement:
        constraints: [node.role == manager]
    volumes:
      - redis-data:/data
    networks:
      - app-network

networks:
  app-network:
    driver: overlay

volumes:
  mongo-data:
  redis-data:
```

3. **Deploy stack**:

```bash
docker stack deploy -c docker-stack.yml elearning
```

### 8.2. Vertical Scaling

#### Với Docker

```bash
# Update container resources
docker update --cpu-shares 1024 --memory 2G elearning-backend
```

### 8.3. Database Scaling

#### MongoDB Replica Set

1. **Tạo file `docker-compose.mongo-replicaset.yml`**:

```yaml
version: '3.8'

services:
  mongo-1:
    image: mongo:5.0
    container_name: mongo-1
    command: mongod --replSet rs0 --bind_ip_all
    ports:
      - "27017:27017"
    volumes:
      - mongo-1-data:/data/db
    networks:
      - mongo-network

  mongo-2:
    image: mongo:5.0
    container_name: mongo-2
    command: mongod --replSet rs0 --bind_ip_all
    ports:
      - "27018:27017"
    volumes:
      - mongo-2-data:/data/db
    networks:
      - mongo-network

  mongo-3:
    image: mongo:5.0
    container_name: mongo-3
    command: mongod --replSet rs0 --bind_ip_all
    ports:
      - "27019:27017"
    volumes:
      - mongo-3-data:/data/db
    networks:
      - mongo-network

networks:
  mongo-network:
    driver: bridge

volumes:
  mongo-1-data:
  mongo-2-data:
  mongo-3-data:
```

2. **Khởi động MongoDB replica set**:

```bash
docker-compose -f docker-compose.mongo-replicaset.yml up -d

# Khởi tạo replica set
docker exec -it mongo-1 mongosh --eval "
  rs.initiate({
    _id: 'rs0',
    members: [
      { _id: 0, host: 'mongo-1:27017' },
      { _id: 1, host: 'mongo-2:27017' },
      { _id: 2, host: 'mongo-3:27017' }
    ]
  })
"
```

3. **Cập nhật connection string trong backend**:

```
DB_URL=mongodb://mongo-1:27017,mongo-2:27017,mongo-3:27017/elearning?replicaSet=rs0
```

#### Redis Cluster

1. **Tạo file `docker-compose.redis-cluster.yml`**:

```yaml
version: '3.8'

services:
  redis-1:
    image: redis:6
    container_name: redis-1
    command: redis-server --cluster-enabled yes --cluster-config-file nodes.conf --cluster-node-timeout 5000
    ports:
      - "6371:6379"
    volumes:
      - redis-1-data:/data
    networks:
      - redis-network

  redis-2:
    image: redis:6
    container_name: redis-2
    command: redis-server --cluster-enabled yes --cluster-config-file nodes.conf --cluster-node-timeout 5000
    ports:
      - "6372:6379"
    volumes:
      - redis-2-data:/data
    networks:
      - redis-network

  redis-3:
    image: redis:6
    container_name: redis-3
    command: redis-server --cluster-enabled yes --cluster-config-file nodes.conf --cluster-node-timeout 5000
    ports:
      - "6373:6379"
    volumes:
      - redis-3-data:/data
    networks:
      - redis-network

networks:
  redis-network:
    driver: bridge

volumes:
  redis-1-data:
  redis-2-data:
  redis-3-data:
```

2. **Khởi động Redis cluster**:

```bash
docker-compose -f docker-compose.redis-cluster.yml up -d

# Khởi tạo cluster
docker run --rm -it --network redis-network redis:6 redis-cli --cluster create redis-1:6379 redis-2:6379 redis-3:6379 --cluster-replicas 0
```

## 9. Security Best Practices

### 9.1. SSL/TLS

- Luôn sử dụng HTTPS cho tất cả các giao tiếp
- Định kỳ gia hạn SSL certificates
- Cấu hình HSTS (HTTP Strict Transport Security)

### 9.2. Firewall

```bash
# Mở các cổng cần thiết
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Đóng tất cả các cổng còn lại
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Bật firewall
sudo ufw enable
```

### 9.3. Regular Updates

```bash
# Cập nhật hệ thống thường xuyên
sudo apt update && sudo apt upgrade -y

# Cập nhật Node.js
nvm install 18 --latest-npm
nvm alias default 18

# Cập nhật npm dependencies
npm audit fix
```

### 9.4. Secure Headers với Nginx

```nginx
add_header X-Content-Type-Options "nosniff" always;
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com; img-src 'self' data: https://res.cloudinary.com; style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com; font-src 'self' https://cdnjs.cloudflare.com;" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
```

## 10. Checklist Triển Khai

### 10.1. Trước Khi Triển Khai

- [ ] Đảm bảo tất cả tests đều pass
- [ ] Xóa hoặc ẩn console.log và debug data
- [ ] Kiểm tra tất cả các biến môi trường
- [ ] Kiểm tra cấu hình CORS
- [ ] Kiểm tra các dependencies quá cũ hoặc dễ bị tấn công
- [ ] Đảm bảo các keyID, secrets không được hardcode
- [ ] Kiểm tra hiệu năng với các công cụ như Lighthouse

### 10.2. Sau Khi Triển Khai

- [ ] Kiểm tra các routes chính
- [ ] Kiểm tra flow thanh toán
- [ ] Kiểm tra upload và download files
- [ ] Kiểm tra đăng ký/đăng nhập
- [ ] Kiểm tra realtime features
- [ ] Kiểm tra tính năng AI
- [ ] Kiểm tra trên các thiết bị và trình duyệt khác nhau
- [ ] Kiểm tra SSL certificates
- [ ] Kiểm tra logs để phát hiện lỗi

### 10.3. Quy Trình Rollback

```bash
# Rollback với PM2
pm2 list
pm2 logs
pm2 restart <app_name>

# Nếu cần rollback version
cd /path/to/elearning
git checkout <previous_commit>
cd Backend
npm install
npm run build
pm2 restart elearning-backend

cd ../Frontend
npm install
npm run build
pm2 restart elearning-frontend
```

## 11. Tài Liệu Tham Khảo

- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [Next.js Deployment Documentation](https://nextjs.org/docs/deployment)
- [MongoDB Production Notes](https://docs.mongodb.com/manual/administration/production-notes/)
- [Docker Compose Production Best Practices](https://docs.docker.com/compose/production/)
- [NGINX SSL Configuration Generator](https://ssl-config.mozilla.org/)
- [Redis Security](https://redis.io/topics/security)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)
- [PM2 Documentation](https://pm2.keymetrics.io/docs/usage/quick-start/)