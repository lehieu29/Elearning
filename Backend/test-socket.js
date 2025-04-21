// Đơn giản hóa kiểm tra Socket.IO
const http = require('http');
const { Server } = require('socket.io');

// Tạo HTTP server đơn giản
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Socket.IO Test Server');
});

// Khởi tạo Socket.IO server
const io = new Server(server, {
  cors: {
    origin: "*", // Cho phép tất cả các nguồn
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling'] // Hỗ trợ cả hai phương thức transport
});

// Xử lý connection
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);
  
  // Gửi test message khi kết nối thành công
  socket.emit('testConnection', { status: 'connected', message: 'Socket connection successful' });
  
  // Xử lý test event
  socket.on('testEvent', (data) => {
    console.log('Received test event:', data);
    socket.emit('testResponse', { 
      received: data,
      status: 'success',
      timestamp: Date.now()
    });
  });
  
  // Xử lý disconnect
  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

// Bắt đầu server trên port khác
const PORT = 8002;
server.listen(PORT, () => {
  console.log(`Socket.IO test server running on http://localhost:${PORT}`);
  console.log(`Sử dụng server này để kiểm tra kết nối Socket.IO độc lập`);
});
