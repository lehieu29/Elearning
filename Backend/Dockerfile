FROM node:18-alpine

# Cài đặt ffmpeg và các font cần thiết
RUN apk add --no-cache ffmpeg font-dejavu msttcorefonts-installer && \
    update-ms-fonts && \
    fc-cache -f

WORKDIR /app

# Copy package.json và package-lock.json
COPY package*.json ./

# Cài đặt dependencies
RUN npm install

# Copy source code
COPY . .

# Build TypeScript thành JavaScript
RUN npm run build

# Expose port
EXPOSE 8000

# Command để chạy ứng dụng
CMD ["node", "build/server.js"]