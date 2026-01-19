# Hướng Dẫn Deploy Lên Render

## 📋 Chuẩn Bị

### 1. Tạo Repository trên GitHub/GitLab

1. Tạo repository mới trên GitHub (ví dụ: `baominh-ai-tts`)
2. **KHÔNG** commit file `.env` (đã có trong `.gitignore`)
3. Commit và push code lên repository

```bash
# Khởi tạo git (nếu chưa có)
git init

# Thêm remote
git remote add origin https://github.com/your-username/baominh-ai-tts.git

# Commit code
git add .
git commit -m "Initial commit"

# Push lên GitHub
git push -u origin main
```

### 2. Chuẩn Bị Database (Neon.tech)

1. Đăng ký tài khoản tại [Neon.tech](https://neon.tech)
2. Tạo database mới
3. Copy **Connection String** (sẽ dùng ở bước sau)

---

## 🚀 Deploy Lên Render

### Bước 1: Tạo Web Service

1. Đăng nhập [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → **"Web Service"**
3. Connect với GitHub/GitLab repository của bạn
4. Chọn repository `baominh-ai-tts`

### Bước 2: Cấu Hình Build & Start

Render sẽ tự động detect, nhưng bạn có thể set manual:

- **Name**: `baominh-ai-tts` (hoặc tên bạn muốn)
- **Environment**: `Node`
- **Build Command**: 
  ```bash
  npm install && npm run build
  ```
- **Start Command**: 
  ```bash
  npm start
  ```
- **Plan**: Chọn `Starter` (free) hoặc `Standard` (paid)

### Bước 3: Set Environment Variables

Trong phần **Environment**, thêm các biến sau:

| Key | Value | Mô tả |
|-----|-------|-------|
| `NODE_ENV` | `production` | Môi trường production |
| `API_KEY` | `AIza...` | Gemini API Key của bạn |
| `DATABASE_URL` | `postgresql://...` | Connection string từ Neon.tech |
| `PORT` | (Để trống) | Render tự động set |

**Lưu ý quan trọng:**
- ✅ **KHÔNG** commit file `.env` lên Git
- ✅ Set environment variables trong Render Dashboard
- ✅ `DATABASE_URL` từ Neon.tech có thể có `channel_binding=require` - code đã tự động xử lý

### Bước 4: Deploy

1. Click **"Create Web Service"**
2. Render sẽ tự động:
   - Install dependencies (`npm install`)
   - Build frontend (`npm run build`)
   - Start server (`npm start`)
3. Đợi build xong (khoảng 5-10 phút lần đầu)
4. Kiểm tra logs để đảm bảo không có lỗi

---

## ✅ Kiểm Tra Sau Khi Deploy

### 1. Kiểm Tra Logs

Trong Render Dashboard → **Logs**, kiểm tra:
- ✅ `✅ Database Neon.tech đã kết nối và sẵn sàng.`
- ✅ `🚀 Server Bảo Minh AI đang chạy tại cổng XXXX`
- ❌ Không có lỗi `DATABASE_URL` hoặc `API_KEY`

### 2. Test Website

1. Mở URL được Render cung cấp (ví dụ: `https://baominh-ai-tts.onrender.com`)
2. Kiểm tra:
   - ✅ Website load được
   - ✅ Có thể đăng nhập
   - ✅ Có thể tạo audio
   - ✅ Database lưu được dữ liệu

### 3. Test API

```bash
# Test API endpoint
curl https://your-app.onrender.com/api/data/test

# Nếu trả về null hoặc {} là OK
```

---

## 🔧 Troubleshooting

### Lỗi: "Cannot find module"

**Nguyên nhân**: Dependencies chưa được install đúng

**Giải pháp**:
- Kiểm tra `package.json` có đầy đủ dependencies
- Xem logs trong Render để biết package nào bị lỗi
- Thử rebuild service

### Lỗi: "Database connection failed"

**Nguyên nhân**: `DATABASE_URL` sai hoặc database chưa sẵn sàng

**Giải pháp**:
1. Kiểm tra `DATABASE_URL` trong Environment Variables
2. Đảm bảo database trên Neon.tech đang hoạt động
3. Kiểm tra logs để xem lỗi chi tiết

### Lỗi: "API Key invalid"

**Nguyên nhân**: `API_KEY` chưa được set hoặc sai

**Giải pháp**:
1. Kiểm tra `API_KEY` trong Environment Variables
2. Đảm bảo key có format đúng: `AIza...`
3. Test key bằng cách gọi API Gemini

### Website không load được

**Nguyên nhân**: Build failed hoặc start command sai

**Giải pháp**:
1. Kiểm tra Build Logs
2. Đảm bảo `npm run build` chạy thành công
3. Kiểm tra folder `dist/` có được tạo không
4. Đảm bảo `startCommand` là `npm start`

---

## 📝 Cấu Trúc File Quan Trọng

```
baominh-ai-tts/
├── .gitignore          # Bỏ qua node_modules, .env, dist
├── .env.example        # Template cho environment variables
├── package.json        # Dependencies và scripts
├── server.js           # Express server (backend)
├── vite.config.ts      # Vite config (build frontend)
├── render.yaml         # Render config (optional)
├── App.tsx             # React app
├── services/
│   └── gemini.ts       # Gemini API service
└── dist/               # Build output (tự động tạo)
```

---

## 🔄 Update Code Mới

Sau khi update code:

1. Commit và push lên GitHub:
   ```bash
   git add .
   git commit -m "Update code"
   git push
   ```

2. Render sẽ tự động detect và rebuild
3. Hoặc manual trigger: Render Dashboard → **Manual Deploy**

---

## 💡 Tips

1. **Free Plan Limitations**:
   - Service sẽ sleep sau 15 phút không dùng
   - Lần đầu wake up mất ~30 giây
   - Có thể upgrade lên Standard để tránh sleep

2. **Environment Variables**:
   - Có thể set nhiều environment (staging, production)
   - Sử dụng `render.yaml` để quản lý config

3. **Custom Domain**:
   - Render free plan cho phép custom domain
   - Settings → Custom Domain → Add domain

4. **Monitoring**:
   - Xem logs real-time trong Render Dashboard
   - Set up alerts cho errors

---

## 📞 Hỗ Trợ

Nếu gặp vấn đề:
1. Kiểm tra logs trong Render Dashboard
2. Kiểm tra Environment Variables
3. Test database connection
4. Test API key

---

## ✅ Checklist Trước Khi Deploy

- [ ] Code đã push lên GitHub/GitLab
- [ ] `.env` đã được thêm vào `.gitignore`
- [ ] Database Neon.tech đã tạo và có connection string
- [ ] Gemini API Key đã có
- [ ] `package.json` có đầy đủ dependencies
- [ ] `npm run build` chạy thành công local
- [ ] `npm start` chạy thành công local

---

**Chúc bạn deploy thành công! 🚀**
