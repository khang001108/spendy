# Hướng dẫn cài đặt PWA Push Notifications

## Bước 1: Tạo VAPID Keys

```bash
# Cài web-push nếu chưa có
npm install

# Tạo VAPID keys
npx web-push generate-vapid-keys
```

Kết quả trông như thế này:
```
Public Key: BEl62iUYgUivxIkv69y...
Private Key: UUxI4O8-FbRouAev...
```

## Bước 2: Thêm vào Environment Variables

### Trên Render.com:
1. Vào Dashboard → spendy → Environment
2. Thêm 3 biến:
   - `NEXT_PUBLIC_VAPID_PUBLIC_KEY` = Public Key từ bước 1
   - `VAPID_PRIVATE_KEY` = Private Key từ bước 1  
   - `VAPID_EMAIL` = `mailto:your-email@gmail.com`

### Local (.env.local):
```
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BEl62iUYg...
VAPID_PRIVATE_KEY=UUxI4O8-Fb...
VAPID_EMAIL=mailto:your@email.com
```

## Bước 3: Deploy

```bash
git add .
git commit -m "feat: PWA push notifications"
git push
```

## Bước 4: Bật trên điện thoại

1. Mở Spendy trên Chrome Android/iOS
2. Vào **Cài đặt → Thông báo**
3. Bật toggle **"Thông báo đẩy (PWA)"**
4. Cho phép khi trình duyệt hỏi
5. Nhấn **"Gửi thông báo test"** để kiểm tra

## Hoạt động như thế nào?

- Service Worker (`/sw.js`) chạy nền trên thiết bị
- Khi đến giờ nhắc (VD: 20:00), scheduler gọi `/api/notifications`
- API tự động gửi push qua VAPID đến tất cả thiết bị đã đăng ký
- Notification hiện ra kể cả khi đóng tab, chỉ cần Chrome đang chạy
