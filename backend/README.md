# 🗂️ Backend - Ứng dụng Quản lý Giấy tờ

Backend API cho ứng dụng quản lý giấy tờ với Node.js, Express và SQLite.

## ✨ Tính năng chính

### 🔐 Hệ thống xác thực
- Đăng nhập với JWT token
- Quản lý vai trò người dùng (Admin/User)
- Bảo mật API endpoints

### 🏪 Quản lý Shop
- Thêm, sửa, xóa thông tin shop
- Tìm kiếm shop theo tên, địa chỉ, SĐT, email
- View chi tiết shop với nhân viên và giấy tờ

### 👥 Quản lý Nhân viên
- Quản lý thông tin nhân viên
- Liên kết nhân viên với shop
- Thêm/sửa/xóa nhân viên

### 📄 Quản lý Giấy tờ
- Upload và lưu trữ file (PDF, hình ảnh, Word, Excel)
- Phân loại giấy tờ theo loại
- Xem preview hình ảnh trực tiếp
- Download file

### 👤 Quản lý Tài khoản (Admin only)
- Tạo tài khoản mới
- Phân quyền người dùng
- Quản lý thông tin tài khoản

## 🛠️ Công nghệ sử dụng

### Backend
- **Node.js** + **Express.js**
- **SQLite** database
- **JWT** authentication
- **Multer** file upload
- **bcryptjs** password hashing

### Frontend (Separate Repository)
- **React.js** + **React Router**
- **React Bootstrap** UI components
- **Framer Motion** animations
- **Axios** HTTP client
- **React Icons**
- **Repository**: https://github.com/nhocac1994/frontend-quan-ly-giay-to

### Deployment
- **Render.com** platform
- **GitHub** integration

## 🚀 Cài đặt và chạy

### Yêu cầu hệ thống
- Node.js 16+ 
- npm hoặc yarn

### Cài đặt local

1. **Clone repository**
```bash
git clone https://github.com/YOUR_USERNAME/backend-quan-ly-giay-to.git
cd backend-quan-ly-giay-to
```

2. **Cài đặt dependencies**
```bash
npm install
```

3. **Khởi tạo database**
```bash
npm run init-db
```

4. **Chạy ứng dụng**
```bash
npm run dev
```

5. **Truy cập API**
- Backend API: http://localhost:3001
- Health Check: http://localhost:3001/api/health

### Tài khoản mặc định
- **Username**: `nhocac`
- **Password**: `nhocac@123`
- **Role**: Admin

## 🔗 Frontend Integration

Frontend React app được deploy riêng biệt và kết nối với backend API:

- **Frontend Repository**: https://github.com/nhocac1994/frontend-quan-ly-giay-to
- **API Base URL**: https://quan-ly-giay-to.onrender.com
- **CORS**: Configured for cross-origin requests

## 🔧 Cấu hình Render.com

### Environment Variables
```env
NODE_ENV=production
JWT_SECRET=your-super-secret-jwt-key-here
PORT=10000
```

### Build Process
1. Render tự động detect Node.js project
2. Chạy `npm run build` để build backend
3. Start server với `npm start`

## 📊 Database Schema

### Tables
- **users**: Quản lý tài khoản người dùng
- **shops**: Thông tin shop/cửa hàng
- **employees**: Thông tin nhân viên
- **documents**: Quản lý giấy tờ
- **document_types**: Phân loại giấy tờ

### Relationships
- Shop → Employees (1:N)
- Shop → Documents (1:N)
- Document → Document Type (N:1)

## 🔒 Bảo mật

- **JWT Authentication**: Tất cả API endpoints được bảo vệ
- **Password Hashing**: Mật khẩu được mã hóa với bcrypt
- **File Upload Security**: Kiểm tra loại file và kích thước
- **Role-based Access**: Phân quyền theo vai trò người dùng

## 🎨 UI/UX Features

- **Smooth Animations**: Chuyển trang mượt mà với Framer Motion
- **Slide Panels**: Form trượt từ phải sang trái
- **Real-time Search**: Tìm kiếm với suggestions
- **Image Preview**: Xem hình ảnh trực tiếp
- **Mobile Optimized**: Giao diện tối ưu cho mobile

## 📈 Performance

- **Lazy Loading**: Components được load khi cần
- **Optimized Images**: Hình ảnh được tối ưu
- **Efficient Queries**: Database queries được tối ưu
- **CDN Ready**: Sẵn sàng cho CDN deployment

## 🤝 Contributing

1. Fork repository
2. Tạo feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Tạo Pull Request

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

## 📞 Support

Nếu có vấn đề hoặc câu hỏi, vui lòng tạo issue trên GitHub.

---

**Made with ❤️ for efficient document management** 