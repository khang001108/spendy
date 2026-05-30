# Hướng dẫn Push Notification kể cả khi tắt web

## Tổng quan luồng

```
Render Cron Job (mỗi phút)
    → GET /api/cron
    → Đọc NotifSetting từ DB của từng user
    → Đúng giờ → web-push + VAPID keys
    → Google Push Server
    → Service Worker trên điện thoại
    → Notification popup ✅ (kể cả khi tắt Chrome)
```

---

## Bước 1: Tạo VAPID Keys

Chạy lệnh này trên terminal máy tính (1 lần duy nhất):

```bash
npx web-push generate-vapid-keys --non-interactive
```

Ra 2 key, copy lại.

---

## Bước 2: Thêm vào Render → Environment Variables

| Key | Value |
|-----|-------|
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Public Key |
| `VAPID_PRIVATE_KEY` | Private Key |
| `VAPID_EMAIL` | `mailto:your@gmail.com` |
| `CRON_SECRET` | Đặt bất kỳ, VD: `myapp-cron-secret-2024` |

---

## Bước 3: Tạo Cron Job trên Render

1. Render Dashboard → **New → Cron Job**
2. Điền:
   - **Name**: `spendy-push-cron`
   - **Command**:
     ```
     curl -s "https://YOUR-APP.onrender.com/api/cron" -H "Authorization: Bearer YOUR-CRON-SECRET"
     ```
   - **Schedule**: `* * * * *`
3. Save

---

## Bước 4: Deploy & Test

```bash
git add . && git commit -m "feat: push cron" && git push
```

Test thủ công:
```
https://your-app.onrender.com/api/cron?secret=YOUR-CRON-SECRET
```

---

## Thay thế miễn phí: GitHub Actions

Tạo `.github/workflows/push-cron.yml`:

```yaml
name: Push Cron
on:
  schedule:
    - cron: '*/5 * * * *'  # Mỗi 5 phút (GitHub min)
  workflow_dispatch:
jobs:
  run:
    runs-on: ubuntu-latest
    steps:
      - run: curl -s "${{ secrets.SPENDY_URL }}/api/cron" -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

Thêm `SPENDY_URL` và `CRON_SECRET` vào GitHub Secrets.
