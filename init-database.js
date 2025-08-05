const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

// Tạo bảng Shops
const createShopsTable = `
CREATE TABLE IF NOT EXISTS shops (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`;

// Tạo bảng Employees
const createEmployeesTable = `
CREATE TABLE IF NOT EXISTS employees (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  shop_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  position TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  id_number TEXT,
  hire_date DATE,
  status TEXT DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (shop_id) REFERENCES shops (id)
)`;

// Tạo bảng Documents
const createDocumentsTable = `
CREATE TABLE IF NOT EXISTS documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  shop_id INTEGER NOT NULL,
  employee_id INTEGER,
  document_type TEXT NOT NULL,
  document_number TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  issue_date DATE,
  expiry_date DATE,
  status TEXT DEFAULT 'active',
  file_data TEXT,
  file_name TEXT,
  file_type TEXT,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (shop_id) REFERENCES shops (id),
  FOREIGN KEY (employee_id) REFERENCES employees (id)
)`;

// Tạo bảng Users
const createUsersTable = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  email TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`;

// Tạo bảng Document Types
const createDocumentTypesTable = `
CREATE TABLE IF NOT EXISTS document_types (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  required_fields TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`;

// Khởi tạo dữ liệu mẫu
const insertSampleData = () => {
  // Thêm các loại giấy tờ mẫu
  const documentTypes = [
    { name: 'Giấy phép kinh doanh', description: 'Giấy phép đăng ký kinh doanh', required_fields: 'document_number,issue_date,expiry_date' },
    { name: 'Chứng minh nhân dân', description: 'CMND/CCCD của nhân viên', required_fields: 'document_number,issue_date,expiry_date' },
    { name: 'Sổ hộ khẩu', description: 'Sổ hộ khẩu gia đình', required_fields: 'document_number,issue_date' },
    { name: 'Giấy khai sinh', description: 'Giấy khai sinh', required_fields: 'document_number,issue_date' },
    { name: 'Bằng cấp', description: 'Bằng cấp, chứng chỉ', required_fields: 'document_number,issue_date' },
    { name: 'Hợp đồng lao động', description: 'Hợp đồng lao động', required_fields: 'document_number,issue_date,expiry_date' },
    { name: 'Bảo hiểm xã hội', description: 'Sổ bảo hiểm xã hội', required_fields: 'document_number,issue_date' },
    { name: 'Giấy khám sức khỏe', description: 'Giấy khám sức khỏe định kỳ', required_fields: 'document_number,issue_date,expiry_date' },
    { name: 'Giấy phép lái xe', description: 'Giấy phép lái xe', required_fields: 'document_number,issue_date,expiry_date' },
    { name: 'Giấy tờ khác', description: 'Các loại giấy tờ khác', required_fields: 'document_number,issue_date' }
  ];

  documentTypes.forEach(type => {
    db.run(
      'INSERT OR IGNORE INTO document_types (name, description, required_fields) VALUES (?, ?, ?)',
      [type.name, type.description, type.required_fields]
    );
  });

  // Thêm tài khoản admin mẫu
  const bcrypt = require('bcryptjs');
  const hashedPassword = bcrypt.hashSync('nhocac@123', 10);
  
  db.run(
    'INSERT OR IGNORE INTO users (username, password, name, role, email) VALUES (?, ?, ?, ?, ?)',
    ['nhocac', hashedPassword, 'Quản lý hệ thống', 'admin', 'admin@example.com']
  );

  // Thêm shop mẫu
  db.run(
    'INSERT OR IGNORE INTO shops (name, address, phone, email) VALUES (?, ?, ?, ?)',
    ['Shop Mẫu', '123 Đường ABC, Quận 1, TP.HCM', '0123456789', 'shop@example.com']
  );
};

// Thực thi tạo bảng
db.serialize(() => {
  console.log('Đang tạo cơ sở dữ liệu...');
  
  db.run(createShopsTable, (err) => {
    if (err) {
      console.error('Lỗi tạo bảng shops:', err);
    } else {
      console.log('✓ Bảng shops đã được tạo');
    }
  });

  db.run(createEmployeesTable, (err) => {
    if (err) {
      console.error('Lỗi tạo bảng employees:', err);
    } else {
      console.log('✓ Bảng employees đã được tạo');
    }
  });

  db.run(createDocumentsTable, (err) => {
    if (err) {
      console.error('Lỗi tạo bảng documents:', err);
    } else {
      console.log('✓ Bảng documents đã được tạo');
    }
  });

  db.run(createDocumentTypesTable, (err) => {
    if (err) {
      console.error('Lỗi tạo bảng document_types:', err);
    } else {
      console.log('✓ Bảng document_types đã được tạo');
    }
  });

  db.run(createUsersTable, (err) => {
    if (err) {
      console.error('Lỗi tạo bảng users:', err);
    } else {
      console.log('✓ Bảng users đã được tạo');
      
      // Thêm dữ liệu mẫu sau khi tạo xong tất cả bảng
      setTimeout(() => {
        insertSampleData();
        console.log('✓ Dữ liệu mẫu đã được thêm');
        console.log('✓ Cơ sở dữ liệu đã sẵn sàng!');
        db.close();
      }, 1000);
    }
  });
}); 