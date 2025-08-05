const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = process.env.DATABASE_URL || path.join(__dirname, '..', 'database.sqlite');
const db = new sqlite3.Database(dbPath);

// Lấy tất cả shops
router.get('/', (req, res) => {
  const query = 'SELECT * FROM shops ORDER BY created_at DESC';
  
  db.all(query, [], (err, rows) => {
    if (err) {
      console.error('Lỗi khi lấy danh sách shops:', err);
      return res.status(500).json({ error: 'Lỗi server' });
    }
    res.json(rows);
  });
});

// Lấy shop theo ID
router.get('/:id', (req, res) => {
  const { id } = req.params;
  
  db.get('SELECT * FROM shops WHERE id = ?', [id], (err, row) => {
    if (err) {
      console.error('Lỗi khi lấy shop:', err);
      return res.status(500).json({ error: 'Lỗi server' });
    }
    
    if (!row) {
      return res.status(404).json({ error: 'Không tìm thấy shop' });
    }
    
    res.json(row);
  });
});

// Tạo shop mới
router.post('/', (req, res) => {
  const { name, address, phone, email } = req.body;
  
  if (!name || !address || !phone) {
    return res.status(400).json({ error: 'Tên, địa chỉ và số điện thoại là bắt buộc' });
  }
  
  const query = 'INSERT INTO shops (name, address, phone, email) VALUES (?, ?, ?, ?)';
  
  db.run(query, [name, address, phone, email], function(err) {
    if (err) {
      console.error('Lỗi khi tạo shop:', err);
      return res.status(500).json({ error: 'Lỗi server' });
    }
    
    res.status(201).json({
      id: this.lastID,
      name,
      address,
      phone,
      email,
      message: 'Shop đã được tạo thành công'
    });
  });
});

// Cập nhật shop
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { name, address, phone, email } = req.body;
  
  if (!name || !address || !phone) {
    return res.status(400).json({ error: 'Tên, địa chỉ và số điện thoại là bắt buộc' });
  }
  
  const query = 'UPDATE shops SET name = ?, address = ?, phone = ?, email = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
  
  db.run(query, [name, address, phone, email, id], function(err) {
    if (err) {
      console.error('Lỗi khi cập nhật shop:', err);
      return res.status(500).json({ error: 'Lỗi server' });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Không tìm thấy shop' });
    }
    
    res.json({
      id,
      name,
      address,
      phone,
      email,
      message: 'Shop đã được cập nhật thành công'
    });
  });
});

// Xóa shop
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  
  // Kiểm tra xem có nhân viên nào thuộc shop này không
  db.get('SELECT COUNT(*) as count FROM employees WHERE shop_id = ?', [id], (err, row) => {
    if (err) {
      console.error('Lỗi khi kiểm tra employees:', err);
      return res.status(500).json({ error: 'Lỗi server' });
    }
    
    if (row.count > 0) {
      return res.status(400).json({ 
        error: 'Không thể xóa shop vì còn nhân viên thuộc shop này' 
      });
    }
    
    // Kiểm tra xem có giấy tờ nào thuộc shop này không
    db.get('SELECT COUNT(*) as count FROM documents WHERE shop_id = ?', [id], (err, row) => {
      if (err) {
        console.error('Lỗi khi kiểm tra documents:', err);
        return res.status(500).json({ error: 'Lỗi server' });
      }
      
      if (row.count > 0) {
        return res.status(400).json({ 
          error: 'Không thể xóa shop vì còn giấy tờ thuộc shop này' 
        });
      }
      
      // Xóa shop
      db.run('DELETE FROM shops WHERE id = ?', [id], function(err) {
        if (err) {
          console.error('Lỗi khi xóa shop:', err);
          return res.status(500).json({ error: 'Lỗi server' });
        }
        
        if (this.changes === 0) {
          return res.status(404).json({ error: 'Không tìm thấy shop' });
        }
        
        res.json({ message: 'Shop đã được xóa thành công' });
      });
    });
  });
});

module.exports = router; 