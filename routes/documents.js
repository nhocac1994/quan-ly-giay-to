const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = process.env.DATABASE_URL || path.join(__dirname, '..', 'database.sqlite');
const db = new sqlite3.Database(dbPath);

// Lấy tất cả documents
router.get('/', (req, res) => {
  const { shop_id, employee_id, document_type, status } = req.query;
  
  let query = `
    SELECT d.*, s.name as shop_name, e.name as employee_name, dt.name as document_type_name
    FROM documents d 
    LEFT JOIN shops s ON d.shop_id = s.id
    LEFT JOIN employees e ON d.employee_id = e.id
    LEFT JOIN document_types dt ON d.document_type = dt.name
  `;
  
  const params = [];
  const conditions = [];
  
  if (shop_id) {
    conditions.push('d.shop_id = ?');
    params.push(shop_id);
  }
  
  if (employee_id) {
    conditions.push('d.employee_id = ?');
    params.push(employee_id);
  }
  
  if (document_type) {
    conditions.push('d.document_type = ?');
    params.push(document_type);
  }
  
  if (status) {
    conditions.push('d.status = ?');
    params.push(status);
  }
  
  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }
  
  query += ' ORDER BY d.created_at DESC';
  
  db.all(query, params, (err, rows) => {
    if (err) {
      console.error('Lỗi khi lấy danh sách documents:', err);
      return res.status(500).json({ error: 'Lỗi server' });
    }
    res.json(rows);
  });
});

// Lấy document theo ID
router.get('/:id', (req, res) => {
  const { id } = req.params;
  
  const query = `
    SELECT d.*, s.name as shop_name, e.name as employee_name, dt.name as document_type_name
    FROM documents d 
    LEFT JOIN shops s ON d.shop_id = s.id
    LEFT JOIN employees e ON d.employee_id = e.id
    LEFT JOIN document_types dt ON d.document_type = dt.name
    WHERE d.id = ?
  `;
  
  db.get(query, [id], (err, row) => {
    if (err) {
      console.error('Lỗi khi lấy document:', err);
      return res.status(500).json({ error: 'Lỗi server' });
    }
    
    if (!row) {
      return res.status(404).json({ error: 'Không tìm thấy giấy tờ' });
    }
    
    res.json(row);
  });
});

// Lấy danh sách loại giấy tờ
router.get('/types/list', (req, res) => {
  const query = 'SELECT * FROM document_types ORDER BY name';
  
  db.all(query, [], (err, rows) => {
    if (err) {
      console.error('Lỗi khi lấy danh sách loại giấy tờ:', err);
      return res.status(500).json({ error: 'Lỗi server' });
    }
    res.json(rows);
  });
});

// Tạo document mới
router.post('/', (req, res) => {
  console.log('Received document data:', req.body);
  
  const { 
    shop_id, 
    employee_id, 
    document_type, 
    document_number, 
    title, 
    description, 
    issue_date, 
    expiry_date, 
    file_data, 
    file_name,
    file_type,
    notes 
  } = req.body;
  
  if (!shop_id || !document_type || !document_number || !title) {
    return res.status(400).json({ error: 'Shop ID, loại giấy tờ, số giấy tờ và tiêu đề là bắt buộc' });
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
    
    // Kiểm tra employee có tồn tại không (nếu có)
    if (employee_id) {
      db.get('SELECT id FROM employees WHERE id = ? AND shop_id = ?', [employee_id, shop_id], (err, employee) => {
        if (err) {
          console.error('Lỗi khi kiểm tra employee:', err);
          return res.status(500).json({ error: 'Lỗi server' });
        }
        
        if (!employee) {
          return res.status(400).json({ error: 'Nhân viên không tồn tại hoặc không thuộc shop này' });
        }
        
        createDocument();
      });
    } else {
      createDocument();
    }
    
    function createDocument() {
      const query = `
        INSERT INTO documents (shop_id, employee_id, document_type, document_number, title, description, issue_date, expiry_date, file_data, file_name, file_type, notes) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      const params = [shop_id, employee_id, document_type, document_number, title, description, issue_date, expiry_date, file_data, file_name, file_type, notes];
      console.log('Inserting with params:', params);
      
      db.run(query, params, function(err) {
        if (err) {
          console.error('Lỗi khi tạo document:', err);
          return res.status(500).json({ error: 'Lỗi server' });
        }
        
        res.status(201).json({
          id: this.lastID,
          shop_id,
          employee_id,
          document_type,
          document_number,
          title,
          description,
          issue_date,
          expiry_date,
          file_data,
          file_name,
          file_type,
          notes,
          message: 'Giấy tờ đã được tạo thành công'
        });
      });
    }
  });
});

// Cập nhật document
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { 
    shop_id, 
    employee_id, 
    document_type, 
    document_number, 
    title, 
    description, 
    issue_date, 
    expiry_date, 
    status, 
    file_path, 
    notes 
  } = req.body;
  
  if (!shop_id || !document_type || !document_number || !title) {
    return res.status(400).json({ error: 'Shop ID, loại giấy tờ, số giấy tờ và tiêu đề là bắt buộc' });
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
    
    // Kiểm tra employee có tồn tại không (nếu có)
    if (employee_id) {
      db.get('SELECT id FROM employees WHERE id = ? AND shop_id = ?', [employee_id, shop_id], (err, employee) => {
        if (err) {
          console.error('Lỗi khi kiểm tra employee:', err);
          return res.status(500).json({ error: 'Lỗi server' });
        }
        
        if (!employee) {
          return res.status(400).json({ error: 'Nhân viên không tồn tại hoặc không thuộc shop này' });
        }
        
        updateDocument();
      });
    } else {
      updateDocument();
    }
    
    function updateDocument() {
      const query = `
        UPDATE documents 
        SET shop_id = ?, employee_id = ?, document_type = ?, document_number = ?, title = ?, 
            description = ?, issue_date = ?, expiry_date = ?, status = ?, file_path = ?, 
            notes = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `;
      
      db.run(query, [shop_id, employee_id, document_type, document_number, title, description, issue_date, expiry_date, status, file_path, notes, id], function(err) {
        if (err) {
          console.error('Lỗi khi cập nhật document:', err);
          return res.status(500).json({ error: 'Lỗi server' });
        }
        
        if (this.changes === 0) {
          return res.status(404).json({ error: 'Không tìm thấy giấy tờ' });
        }
        
        res.json({
          id,
          shop_id,
          employee_id,
          document_type,
          document_number,
          title,
          description,
          issue_date,
          expiry_date,
          status,
          file_path,
          notes,
          message: 'Giấy tờ đã được cập nhật thành công'
        });
      });
    }
  });
});

// Xóa document
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  
  db.run('DELETE FROM documents WHERE id = ?', [id], function(err) {
    if (err) {
      console.error('Lỗi khi xóa document:', err);
      return res.status(500).json({ error: 'Lỗi server' });
    }
    
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Không tìm thấy giấy tờ' });
    }
    
    res.json({ message: 'Giấy tờ đã được xóa thành công' });
  });
});

// Thống kê documents
router.get('/stats/summary', (req, res) => {
  const { shop_id } = req.query;
  
  let whereClause = '';
  const params = [];
  
  if (shop_id) {
    whereClause = 'WHERE shop_id = ?';
    params.push(shop_id);
  }
  
  const query = `
    SELECT 
      COUNT(*) as total_documents,
      COUNT(CASE WHEN status = 'active' THEN 1 END) as active_documents,
      COUNT(CASE WHEN status = 'expired' THEN 1 END) as expired_documents,
      COUNT(CASE WHEN status = 'inactive' THEN 1 END) as inactive_documents,
      COUNT(CASE WHEN expiry_date < date('now') THEN 1 END) as overdue_documents
    FROM documents 
    ${whereClause}
  `;
  
  db.get(query, params, (err, stats) => {
    if (err) {
      console.error('Lỗi khi lấy thống kê:', err);
      return res.status(500).json({ error: 'Lỗi server' });
    }
    res.json(stats);
  });
});

module.exports = router; 