// Kiểm tra quá trình upload và xử lý video
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

// Khởi tạo ứng dụng Express
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Cấu hình Multer để xử lý upload file
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, 'temp-uploads');
    if (!fs.existsSync(uploadDir)){
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Socket.IO
io.on('connection', (socket) => {
  console.log(`Socket client connected: ${socket.id}`);
  
  // Xử lý videoProgress event (gửi từ test client HTML)
  socket.on('videoProgress', (data) => {
    console.log('Received progress update:', data);
    // Phát sóng cập nhật tiến độ đến tất cả clients
    io.emit('videoProgress', data);
  });
  
  socket.on('disconnect', () => {
    console.log(`Socket client disconnected: ${socket.id}`);
  });
});

// API Routes

// Route upload video
app.post('/api/upload-video', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    
    // Tạo processId
    const processId = `vid_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const fileName = req.file.originalname;
    
    console.log(`[${processId}] Received file: ${fileName}, Size: ${req.file.size}, Type: ${req.file.mimetype}`);
    
    // Trả về processId ngay lập tức
    res.status(202).json({
      success: true,
      message: 'Video upload started, processing in background',
      processId: processId,
      fileName: fileName
    });
    
    // Mô phỏng quá trình xử lý video bất đồng bộ
    processVideoAsync(processId, req.file.path, fileName);
    
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Mô phỏng quá trình xử lý video bất đồng bộ
async function processVideoAsync(processId, filePath, fileName) {
  try {
    // Phát sóng bắt đầu xử lý
    io.emit('videoProgress', {
      processId,
      progress: 0,
      message: 'Starting processing...',
      result: { fileName },
      timestamp: Date.now()
    });
    
    // Mô phỏng xử lý video - 5%
    await sleep(2000);
    io.emit('videoProgress', {
      processId,
      progress: 5,
      message: 'Creating subtitles...',
      result: { fileName },
      timestamp: Date.now()
    });
    
    // Mô phỏng xử lý video - 30%
    await sleep(3000);
    io.emit('videoProgress', {
      processId,
      progress: 30,
      message: 'Processing video...',
      result: { fileName },
      timestamp: Date.now()
    });
    
    // Mô phỏng xử lý video - 60%
    await sleep(2000);
    io.emit('videoProgress', {
      processId,
      progress: 60,
      message: 'Optimizing video...',
      result: { fileName },
      timestamp: Date.now()
    });
    
    // Mô phỏng xử lý video - 85%
    await sleep(2000);
    io.emit('videoProgress', {
      processId,
      progress: 85,
      message: 'Uploading to cloudinary...',
      result: { fileName },
      timestamp: Date.now()
    });
    
    // Hoàn thành
    await sleep(3000);
    io.emit('videoProgress', {
      processId,
      progress: 100,
      message: 'Upload complete!',
      result: {
        fileName,
        publicId: `video/courses/${processId}`,
        url: `https://example.com/videos/${processId}`,
        duration: 120, // 2 minutes
        format: 'mp4'
      },
      timestamp: Date.now()
    });
    
    console.log(`[${processId}] Processing completed for ${fileName}`);
    
    // Dọn dẹp file
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`[${processId}] Cleaned up temp file: ${filePath}`);
    }
    
  } catch (error) {
    console.error(`[${processId}] Processing error:`, error);
    
    // Phát sóng lỗi
    io.emit('videoProgress', {
      processId,
      progress: 100,
      message: `Processing failed: ${error.message}`,
      result: {
        fileName,
        error: error.message
      },
      timestamp: Date.now()
    });
    
    // Dọn dẹp file
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
}

// Helper function to simulate delay
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// HTML page đơn giản để test
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Video Upload Test</title>
      <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 20px auto; padding: 0 20px; }
        .card { border: 1px solid #ddd; border-radius: 8px; padding: 16px; margin-bottom: 20px; }
        h1 { color: #333; }
        pre { background: #f4f4f4; padding: 10px; border-radius: 4px; overflow: auto; }
        .upload-form { margin-top: 20px; }
        input[type="file"] { margin-bottom: 10px; }
        button { background: #4CAF50; color: white; padding: 10px 15px; border: none; border-radius: 4px; cursor: pointer; }
        button:hover { background: #45a049; }
      </style>
    </head>
    <body>
      <h1>Video Upload Test Server</h1>
      
      <div class="card">
        <h2>Upload Test</h2>
        <div class="upload-form">
          <input type="file" id="file-input" accept="video/*">
          <button onclick="uploadFile()">Upload</button>
        </div>
        <div id="upload-status"></div>
      </div>
      
      <div class="card">
        <h2>Server Information</h2>
        <pre>
Server Running at: http://localhost:8002
Socket.IO Endpoint: http://localhost:8002
API Endpoint: POST http://localhost:8002/api/upload-video
        </pre>
      </div>
      
      <script src="/socket.io/socket.io.js"></script>
      <script>
        // Khởi tạo socket
        const socket = io();
        const uploadStatus = document.getElementById('upload-status');
        
        // Xử lý upload file
        function uploadFile() {
          const fileInput = document.getElementById('file-input');
          const file = fileInput.files[0];
          
          if (!file) {
            alert('Vui lòng chọn file');
            return;
          }
          
          uploadStatus.innerHTML = '<p>Đang tải lên...</p>';
          
          const formData = new FormData();
          formData.append('file', file);
          
          fetch('/api/upload-video', {
            method: 'POST',
            body: formData
          })
          .then(response => response.json())
          .then(data => {
            console.log('Upload response:', data);
            if (data.success) {
              uploadStatus.innerHTML = \`
                <p>Upload started!</p>
                <p>Process ID: <strong>\${data.processId}</strong></p>
                <p>File Name: \${data.fileName}</p>
                <p>Status: Waiting for processing updates...</p>
              \`;
            } else {
              uploadStatus.innerHTML = \`<p style="color: red">Upload failed: \${data.message}</p>\`;
            }
          })
          .catch(error => {
            console.error('Error:', error);
            uploadStatus.innerHTML = \`<p style="color: red">Error: \${error.message}</p>\`;
          });
        }
        
        // Lắng nghe cập nhật tiến độ
        socket.on('videoProgress', function(data) {
          console.log('Received progress update:', data);
          
          // Kiểm tra xem đây có phải là file hiện tại không
          const statusDiv = document.getElementById('upload-status');
          if (statusDiv.innerHTML.includes(data.processId)) {
            // Cập nhật trạng thái
            let statusHTML = \`
              <p>Process ID: <strong>\${data.processId}</strong></p>
              <p>File Name: \${data.result?.fileName || 'Unknown'}</p>
              <p>Progress: \${data.progress}%</p>
              <p>Status: \${data.message}</p>
              <div style="background-color: #eee; width: 100%; height: 20px; border-radius: 10px; overflow: hidden;">
                <div style="background-color: #4CAF50; width: \${data.progress}%; height: 100%;"></div>
              </div>
            \`;
            
            // Nếu hoàn thành, hiển thị thêm thông tin
            if (data.progress === 100 && !data.result?.error) {
              statusHTML += \`
                <p style="margin-top: 15px"><strong>Upload Complete!</strong></p>
                <p>Public ID: \${data.result?.publicId || 'N/A'}</p>
                <p>URL: \${data.result?.url || 'N/A'}</p>
                <p>Duration: \${data.result?.duration || 0} seconds</p>
                <p>Format: \${data.result?.format || 'N/A'}</p>
              \`;
            }
            
            // Nếu có lỗi
            if (data.result?.error) {
              statusHTML += \`<p style="color: red; margin-top: 15px"><strong>Error: \${data.result.error}</strong></p>\`;
            }
            
            statusDiv.innerHTML = statusHTML;
          }
        });
        
        // Xử lý kết nối socket
        socket.on('connect', function() {
          console.log('Connected to socket server');
        });
        
        socket.on('disconnect', function() {
          console.log('Disconnected from socket server');
        });
      </script>
    </body>
    </html>
  `);
});

// Bắt đầu server
const PORT = 8002;
server.listen(PORT, () => {
  console.log(`Test upload server running on http://localhost:${PORT}`);
  console.log(`Sử dụng server này để kiểm tra quá trình upload và tiến độ xử lý`);
});
