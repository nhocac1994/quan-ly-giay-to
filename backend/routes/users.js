const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');
const router = express.Router();

const dbPath = path.join(__dirname, '..', 'database.sqlite');
const db = new sqlite3.Database(dbPath);

// Middleware kiểm tra quyền admin
const requireAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ error: 'Không có quyền truy cập' });
  }
};

// Lấy danh sách tất cả users (chỉ admin)
router.get('/', requireAdmin, (req, res) => {
  const query = `
    SELECT id, username, name, role, email, created_at, updated_at 
    FROM users 
    ORDER BY created_at DESC
  `;
  
  db.all(query, [], (err, rows) => {
    if (err) {
      console.error('Lỗi lấy danh sách users:', err);
      return res.status(500).json({ error: 'Lỗi server' });
    }
    res.json(rows);
  });
});

// Lấy thông tin user theo ID (chỉ admin)
router.get('/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  
  db.get(
    'SELECT id, username, name, role, email, created_at, updated_at FROM users WHERE id = ?',
    [id],
    (err, row) => {
      if (err) {
        console.error('Lỗi lấy thông tin user:', err);
        return res.status(500).json({ error: 'Lỗi server' });
      }
      
      if (!row) {
        return res.status(404).json({ error: 'Không tìm thấy user' });
      }
      
      res.json(row);
    }
  );
});

// Tạo user mới (chỉ admin)
router.post('/', requireAdmin, (req, res) => {
  const { username, password, name, role, email } = req.body;
  
  // Validation
  if (!username || !password || !name) {
    return res.status(400).json({ error: 'Username, password và name là bắt buộc' });
  }
  
  if (password.length < 6) {
    return res.status(400).json({ error: 'Mật khẩu phải có ít nhất 6 ký tự' });
  }
  
  // Hash password
  const hashedPassword = bcrypt.hashSync(password, 10);
  
  db.run(
    'INSERT INTO users (username, password, name, role, email) VALUES (?, ?, ?, ?, ?)',
    [username, hashedPassword, name, role || 'user', email],
    function(err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          return res.status(400).json({ error: 'Username đã tồn tại' });
        }
        console.error('Lỗi tạo user:', err);
        return res.status(500).json({ error: 'Lỗi server' });
      }
      
      // Lấy thông tin user vừa tạo
      db.get(
        'SELECT id, username, name, role, email, created_at FROM users WHERE id = ?',
        [this.lastID],
        (err, row) => {
          if (err) {
            console.error('Lỗi lấy thông tin user mới:', err);
            return res.status(500).json({ error: 'Lỗi server' });
          }
          
          res.status(201).json({
            message: 'Tạo user thành công',
            user: row
          });
        }
      );
    }
  );
});

// Cập nhật user (chỉ admin)
router.put('/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const { username, password, name, role, email } = req.body;
  
  // Validation
  if (!name) {
    return res.status(400).json({ error: 'Name là bắt buộc' });
  }
  
  let query = 'UPDATE users SET name = ?, role = ?, email = ?, updated_at = CURRENT_TIMESTAMP';
  let params = [name, role || 'user', email];
  
  // Nếu có password mới
  if (password) {
    if (password.length < 6) {
      return res.status(400).json({ error: 'Mật khẩu phải có ít nhất 6 ký tự' });
    }
    const hashedPassword = bcrypt.hashSync(password, 10);
    query += ', password = ?';
    params.push(hashedPassword);
  }
  
  // Nếu có username mới
  if (username) {
    query += ', username = ?';
    params.push(username);
  }
  
  query += ' WHERE id = ?';
  params.push(id);
  
  db.run(query, params, function(err) {
    if (err) {
      if (err.message.includes('UNIQUE constraint failed')) {
        return res.status(400).json({ error: 'Username đã tồn tại' });
      }
      console.error('Lỗi cập nhật user:', err);
      return res.status(500).json({ error: 'Lỗi server' });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Không tìm thấy user' });
    }
    
    // Lấy thông tin user đã cập nhật
    db.get(
      'SELECT id, username, name, role, email, created_at, updated_at FROM users WHERE id = ?',
      [id],
      (err, row) => {
        if (err) {
          console.error('Lỗi lấy thông tin user sau cập nhật:', err);
          return res.status(500).json({ error: 'Lỗi server' });
        }
        
        res.json({
          message: 'Cập nhật user thành công',
          user: row
        });
      }
    );
  });
});

// Xóa user (chỉ admin)
router.delete('/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  
  // Không cho phép xóa tài khoản admin chính
  db.get('SELECT username FROM users WHERE id = ?', [id], (err, row) => {
    if (err) {
      console.error('Lỗi kiểm tra user:', err);
      return res.status(500).json({ error: 'Lỗi server' });
    }
    
    if (!row) {
      return res.status(404).json({ error: 'Không tìm thấy user' });
    }
    
    if (row.username === 'nhocac') {
      return res.status(400).json({ error: 'Không thể xóa tài khoản admin chính' });
    }
    
    db.run('DELETE FROM users WHERE id = ?', [id], function(err) {
      if (err) {
        console.error('Lỗi xóa user:', err);
        return res.status(500).json({ error: 'Lỗi server' });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Không tìm thấy user' });
      }
      
      res.json({ message: 'Xóa user thành công' });
    });
  });
});

module.exports = router; 