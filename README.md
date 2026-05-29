# 💰 Spendy - Quản lý chi tiêu

Web app quản lý thu chi cá nhân với đăng nhập, mục tiêu tiết kiệm và thống kê.

## Tính năng
- 🔐 Đăng ký / Đăng nhập (mỗi người 1 tài khoản riêng)
- 💸 Thêm/sửa/xóa giao dịch thu chi
- 📂 Danh mục tự động (Ăn uống, Di chuyển, Lương...)
- 🎯 Mục tiêu tiết kiệm với thanh tiến trình
- 📊 Thống kê: biểu đồ tròn, biểu đồ cột, biểu đồ đường
- 📅 Xem theo tháng

## Cài đặt và chạy

```bash
# 1. Cài packages
npm install

# 2. Tạo database
npx prisma db push

# 3. Chạy dev
npm run dev
```

Mở http://localhost:3000

## Deploy lên Render

1. Push lên GitHub
2. Render → New Web Service → chọn repo
3. Build: `npm install && npm run build`
4. Start: `npm start`
5. Thêm Environment Variables:
   - `DATABASE_URL=file:./prod.db`
   - `NEXTAUTH_SECRET=random-secret-32-chars`
   - `NEXTAUTH_URL=https://your-app.onrender.com`

## Cấu trúc
```
src/
├── app/
│   ├── api/          # API routes
│   ├── auth/         # Login, Register
│   └── dashboard/    # Tổng quan, Giao dịch, Mục tiêu, Thống kê
├── components/
│   └── forms/        # TransactionModal
└── lib/              # db, auth, utils
prisma/
└── schema.prisma     # Database schema
```
