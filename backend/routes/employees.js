const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = process.env.DATABASE_URL || path.join(__dirname, '..', 'database.sqlite');
const db = new sqlite3.Database(dbPath);

// Lấy tất cả employees
router.get('/', (req, res) => {
  const { shop_id } = req.query;
  
  let query = `
    SELECT e.*, s.name as shop_name 
    FROM employees e 
    LEFT JOIN shops s ON e.shop_id = s.id
  `;
  
  const params = [];
  
  if (shop_id) {
    query += ' WHERE e.shop_id = ?';
    params.push(shop_id);
  }
  
  query += ' ORDER BY e.created_at DESC';
  
  db.all(query, params, (err, rows) => {
    if (err) {
      console.error('Lỗi khi lấy danh sách employees:', err);
      return res.status(500).json({ error: 'Lỗi server' });
    }
    res.json(rows);
  });
});

// Lấy employee theo ID
router.get('/:id', (req, res) => {
  const { id } = req.params;
  
  const query = `
    SELECT e.*, s.name as shop_name 
    FROM employees e 
    LEFT JOIN shops s ON e.shop_id = s.id 
    WHERE e.id = ?
  `;
  
  db.get(query, [id], (err, row) => {
    if (err) {
      console.error('Lỗi khi lấy employee:', err);
      return res.status(500).json({ error: 'Lỗi server' });
    }
    
    if (!row) {
      return res.status(404).json({ error: 'Không tìm thấy nhân viên' });
    }
    
    res.json(row);
  });
});

// Tạo employee mới
router.post('/', (req, res) => {
  const { shop_id, name, position, phone, email, id_number, hire_date } = req.body;
  
  if (!shop_id || !name || !position || !phone) {
    return res.status(400).json({ error: 'Shop ID, tên, chức vụ và số điện thoại là bắt buộc' });
  }
  
  // Kiểm tra shop có tồn tại không
  db.get('SELECT id FROM shops WHERE id = ?', [shop_id], (err, shop) => {
    if (err) {
      console.error('Lỗi khi kiểm tra shop:', err);
      return res.status(500).json({ error: 'Lỗi server' });
    }
    
    if (!shop) {
      return res.status(400).json({ error: 'Shop không tồn tại' });
    }
    
    const query = `
      INSERT INTO employees (shop_id, name, position, phone, email, id_number, hire_date) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    
    db.run(query, [shop_id, name, position, phone, email, id_number, hire_date], function(err) {
      if (err) {
        console.error('Lỗi khi tạo employee:', err);
        return res.status(500).json({ error: 'Lỗi server' });
      }
      
      res.status(201).json({
        id: this.lastID,
        shop_id,
        name,
        position,
        phone,
        email,
        id_number,
        hire_date,
        message: 'Nhân viên đã được tạo thành công'
      });
    });
  });
});

// Cập nhật employee
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { shop_id, name, position, phone, email, id_number, hire_date, status } = req.body;
  
  if (!shop_id || !name || !position || !phone) {
    return res.status(400).json({ error: 'Shop ID, tên, chức vụ và số điện thoại là bắt buộc' });
  }
  
  // Kiểm tra shop có tồn tại không
  db.get('SELECT id FROM shops WHERE id = ?', [shop_id], (err, shop) => {
    if (err) {
      console.error('Lỗi khi kiểm tra shop:', err);
      return res.status(500).json({ error: 'Lỗi server' });
    }
    
    if (!shop) {
      return res.status(400).json({ error: 'Shop không tồn tại' });
    }
    
    const query = `
      UPDATE employees 
      SET shop_id = ?, name = ?, position = ?, phone = ?, email = ?, 
          id_number = ?, hire_date = ?, status = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `;
    
    db.run(query, [shop_id, name, position, phone, email, id_number, hire_date, status, id], function(err) {
      if (err) {
        console.error('Lỗi khi cập nhật employee:', err);
        return res.status(500).json({ error: 'Lỗi server' });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Không tìm thấy nhân viên' });
      }
      
      res.json({
        id,
        shop_id,
        name,
        position,
        phone,
        email,
        id_number,
        hire_date,
        status,
        message: 'Nhân viên đã được cập nhật thành công'
      });
    });
  });
});

// Xóa employee
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  
  // Kiểm tra xem có giấy tờ nào thuộc nhân viên này không
  db.get('SELECT COUNT(*) as count FROM documents WHERE employee_id = ?', [id], (err, row) => {
    if (err) {
      console.error('Lỗi khi kiểm tra documents:', err);
      return res.status(500).json({ error: 'Lỗi server' });
    }
    
    if (row.count > 0) {
      return res.status(400).json({ 
        error: 'Không thể xóa nhân viên vì còn giấy tờ thuộc nhân viên này' 
      });
    }
    
    // Xóa employee
    db.run('DELETE FROM employees WHERE id = ?', [id], function(err) {
      if (err) {
        console.error('Lỗi khi xóa employee:', err);
        return res.status(500).json({ error: 'Lỗi server' });
      }
      
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Không tìm thấy nhân viên' });
      }
      
      res.json({ message: 'Nhân viên đã được xóa thành công' });
    });
  });
});

module.exports = router; 