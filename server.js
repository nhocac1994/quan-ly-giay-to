const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 10000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Tạo thư mục uploads nếu chưa có
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Cấu hình multer cho file upload (memory storage cho Render.com)
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // Giới hạn 5MB cho memory storage
  },
  fileFilter: function (req, file, cb) {
    // Chấp nhận các loại file phổ biến
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Loại file không được hỗ trợ'), false);
    }
  }
});

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Middleware để kiểm tra JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token không được cung cấp' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token không hợp lệ' });
    }
    req.user = user;
    next();
  });
};

// Kết nối database
const dbPath = process.env.DATABASE_URL || path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

// Auth routes
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Tìm user trong database
    db.get(
      'SELECT id, username, password, name, role, email FROM users WHERE username = ?',
      [username],
      (err, user) => {
        if (err) {
          console.error('Lỗi tìm user:', err);
          return res.status(500).json({ error: 'Lỗi server' });
        }
        
        if (!user) {
          return res.status(401).json({ error: 'Tên đăng nhập hoặc mật khẩu không đúng' });
        }
        
        // Kiểm tra password
        const isValidPassword = bcrypt.compareSync(password, user.password);
        if (!isValidPassword) {
          return res.status(401).json({ error: 'Tên đăng nhập hoặc mật khẩu không đúng' });
        }
        
        // Tạo token
        const token = jwt.sign(
          { 
            id: user.id,
            username: user.username, 
            role: user.role 
          },
          JWT_SECRET,
          { expiresIn: '24h' }
        );
        
        res.json({
          success: true,
          token,
          user: {
            id: user.id,
            username: user.username,
            role: user.role,
            name: user.name,
            email: user.email
          }
        });
      }
    );
  } catch (error) {
    console.error('Lỗi đăng nhập:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// Verify token endpoint
app.get('/api/auth/verify', authenticateToken, (req, res) => {
  res.json({ 
    success: true, 
    user: req.user 
  });
});

// Protected Routes
app.use('/api/shops', authenticateToken, require('./routes/shops'));
app.use('/api/employees', authenticateToken, require('./routes/employees'));
app.use('/api/documents', authenticateToken, require('./routes/documents'));
app.use('/api/users', authenticateToken, require('./routes/users'));

// File upload route (protected) - Lưu Base64 vào database
app.post('/api/upload', authenticateToken, upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Không có file nào được tải lên' });
    }

    // Chuyển file thành Base64
    const fileBuffer = req.file.buffer;
    const base64Data = fileBuffer.toString('base64');
    const dataUrl = `data:${req.file.mimetype};base64,${base64Data}`;

    res.json({
      success: true,
      file: {
        filename: req.file.originalname,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        data: dataUrl // Base64 data để lưu vào database
      }
    });
  } catch (error) {
    console.error('Lỗi upload file:', error);
    res.status(500).json({ error: 'Lỗi khi tải file lên' });
  }
});

// Error handling cho multer
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File quá lớn. Kích thước tối đa là 10MB' });
    }
  }
  if (error.message === 'Loại file không được hỗ trợ') {
    return res.status(400).json({ error: 'Loại file không được hỗ trợ' });
  }
  next(error);
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server đang hoạt động' });
});

// Root endpoint for Railway health check
app.get('/', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Ứng dụng Quản lý Giấy tờ đang hoạt động',
    version: '1.0.0'
  });
});

// Serve static files from React build (only in production)
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'client/build')));

  // Catch all handler for React app
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Có lỗi xảy ra!' });
});

app.listen(PORT, () => {
  console.log(`Server đang chạy trên port ${PORT}`);
});

module.exports = { app, db }; 