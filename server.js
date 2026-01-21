import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

// Xử lý chuỗi kết nối: Loại bỏ channel_binding nếu có để tránh lỗi driver
let connectionString = process.env.DATABASE_URL;
if (connectionString && connectionString.includes('channel_binding')) {
  console.log("⚠️ Đã phát hiện 'channel_binding' trong DATABASE_URL. Đang tự động loại bỏ để tương thích...");
  connectionString = connectionString.replace(/&channel_binding=require/g, '').replace(/\?channel_binding=require/g, '');
}

// Cấu hình kết nối Neon.tech
const pool = new Pool({
  connectionString: connectionString,
  ssl: { rejectUnauthorized: false }
});

// Middleware log request
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'dist')));

// Khởi tạo Database - Đảm bảo bảng bm_settings tồn tại
const initDb = async () => {
  let client;
  try {
    console.log("🔄 Đang kết nối tới Neon Database...");
    client = await pool.connect();
    await client.query(`
      CREATE TABLE IF NOT EXISTS bm_settings (
        id TEXT PRIMARY KEY,
        data JSONB
      );
    `);
    console.log("✅ Database Neon.tech đã kết nối và sẵn sàng.");
  } catch (err) {
    console.error("❌ LỖI KẾT NỐI DATABASE:", err.message);
    console.error("💡 Gợi ý: Kiểm tra lại DATABASE_URL trong Environment Variables trên Render.");
  } finally {
    if (client) client.release();
  }
};

// Chạy khởi tạo DB
initDb();

// API: Lấy dữ liệu theo ID
app.get('/api/data/:id', async (req, res) => {
  const { id } = req.params;
  console.log(`📥 Đang tải dữ liệu cho bảng: ${id}`);
  try {
    const { rows } = await pool.query('SELECT data FROM bm_settings WHERE id = $1', [id]);
    if (rows.length > 0) {
      console.log(`✅ Tải thành công ${id}.`);
      res.json(rows[0]?.data || null);
    } else {
      console.log(`ℹ️ Tải ${id}: Chưa có dữ liệu (trả về null).`);
      res.json(null);
    }
  } catch (err) {
    console.error(`❌ Lỗi tải dữ liệu ${id}:`, err.message);
    res.status(500).json({ error: "Lỗi kết nối cơ sở dữ liệu" });
  }
});

// API: Lưu dữ liệu (Upsert)
app.post('/api/data/:id', async (req, res) => {
  const { id } = req.params;
  console.log(`📤 Đang xử lý yêu cầu lưu bảng: ${id}`);
  
  try {
    const bodyData = req.body;
    
    // Log chi tiết để debug lỗi JSON
    if (bodyData === undefined || bodyData === null) {
      console.warn(`⚠️ Cảnh báo: Body nhận được là null/undefined cho bảng ${id}`);
    } else {
      console.log(`🔍 Loại dữ liệu: ${Array.isArray(bodyData) ? 'Array' : typeof bodyData}`);
      if (Array.isArray(bodyData)) {
         console.log(`📏 Số lượng phần tử: ${bodyData.length}`);
      }
    }
    
    // FIX: Sử dụng JSON.stringify(req.body) để đảm bảo dữ liệu (đặc biệt là Array) 
    // được gửi dưới dạng chuỗi JSON, tránh lỗi 'invalid input syntax for type json'
    const jsonData = JSON.stringify(bodyData);
    
    if (!jsonData) {
       throw new Error("Dữ liệu không hợp lệ (Không thể stringify)");
    }

    await pool.query(
      'INSERT INTO bm_settings (id, data) VALUES ($1, $2) ON CONFLICT (id) DO UPDATE SET data = $2',
      [id, jsonData]
    );
    console.log(`✅ Lưu thành công bảng ${id}. Kích thước: ${(jsonData.length / 1024).toFixed(2)} KB`);
    res.json({ success: true });
  } catch (err) {
    console.error(`❌ Lỗi LƯU dữ liệu ${id}:`, err.message);
    console.error(`   Chi tiết lỗi DB:`, err);
    res.status(500).json({ error: "Lỗi lưu dữ liệu: " + err.message });
  }
});

// Map số tiền => gói cước
const PLAN_CONFIG = {
  150000: { planType: "MONTHLY", months: 1 },
  450000: { planType: "3MONTHS", months: 3 },
  900000: { planType: "6MONTHS", months: 6 },
  1800000: { planType: "YEARLY", months: 12 },
};

const DAILY_CHARS = 50000; // 50.000 ký tự / ngày cho mọi gói
const SEPAY_WEBHOOK_API_KEY = process.env.SEPAY_WEBHOOK_API_KEY || "";

// Helper: cộng thêm monthCount vào 1 timestamp (ms)
function addMonths(from, monthCount) {
  const d = new Date(from);
  d.setMonth(d.getMonth() + monthCount);
  return d.getTime();
}

// Webhook nhận từ SePay
app.post('/api/sepay_webhook', async (req, res) => {
  try {
    console.log("📥 Webhook SePay được gọi!");
    console.log("📥 Headers:", JSON.stringify(req.headers, null, 2));
    console.log("📥 Body:", JSON.stringify(req.body, null, 2));
    
    // 1. Xác thực API key
    const auth = req.headers["authorization"] || req.headers["x-api-key"] || "";
    const token = auth.replace(/^sepay\s+/i, "").replace(/^apikey\s+/i, "").replace(/^Bearer\s+/i, "").trim();
    
    console.log(`🔑 API Key check: SEPAY_WEBHOOK_API_KEY=${SEPAY_WEBHOOK_API_KEY ? 'SET' : 'NOT SET'}, token=${token ? 'PROVIDED' : 'NOT PROVIDED'}`);
    
    // Nếu không có API key được cấu hình, cho phép test (chỉ trong dev)
    if (SEPAY_WEBHOOK_API_KEY && token !== SEPAY_WEBHOOK_API_KEY) {
      console.log("❌ Webhook: Invalid API key");
      return res.status(401).json({ error: "Invalid webhook api key" });
    }

    const payload = req.body;

    // 2. Đọc thông tin giao dịch từ payload
    const amount = parseInt(payload.amount || payload.money || 0);
    const description = (payload.description || payload.content || payload.note || "").toString();
    const status = (payload.status || "").toLowerCase();
    const transId = String(payload.transId || payload.id || payload.transaction_id || "");

    // Chỉ xử lý giao dịch thành công
    if (!["success", "thanh_cong", "completed", "thanh toán thành công"].includes(status)) {
      console.log(`ℹ️ Webhook: Ignore transaction với status "${status}"`);
      return res.status(200).json({ ok: true, message: "Ignore non-success transaction" });
    }

    // 3. Map số tiền -> gói
    const plan = PLAN_CONFIG[amount];
    if (!plan) {
      console.log(`ℹ️ Webhook: Unknown amount ${amount}, ignore`);
      return res.status(200).json({ ok: true, message: "Unknown amount, ignore" });
    }

    // 4. Tìm loginId trong nội dung: dạng VT-loginId
    const match = description.match(/VT-([a-zA-Z0-9_.-]+)/i);
    if (!match) {
      console.log(`ℹ️ Webhook: No payment code (VT-xxx) found in "${description}"`);
      return res.status(200).json({ ok: true, message: "No payment code (VT-xxx) found" });
    }
    const loginId = match[1].toLowerCase();

    // 5. Tải danh sách users từ DB
    const usersRes = await pool.query('SELECT data FROM bm_settings WHERE id = $1', ['users']);
    if (usersRes.rows.length === 0) {
      return res.status(200).json({ ok: true, message: "Users table not found" });
    }

    const allUsers = usersRes.rows[0].data || [];
    const user = allUsers.find(u => u.loginId?.toLowerCase() === loginId);

    if (!user) {
      console.log(`ℹ️ Webhook: User not found for loginId "${loginId}"`);
      return res.status(200).json({ ok: true, message: "User not found for this loginId" });
    }

    // 6. Kiểm tra tránh xử lý trùng lặp (dùng transId hoặc timestamp)
    const paymentLogKey = `payment_${transId || Date.now()}`;
    const existingLog = await pool.query('SELECT data FROM bm_settings WHERE id = $1', ['payment_logs']);
    const paymentLogs = existingLog.rows[0]?.data || [];
    
    if (paymentLogs.some(log => log.transId === transId && log.loginId === loginId)) {
      console.log(`ℹ️ Webhook: Transaction ${transId} already processed`);
      return res.status(200).json({ ok: true, message: "Transaction already processed" });
    }

    // 7. Tính hạn dùng mới
    const now = Date.now();
    const currentExpiry = user.expiryDate || now;
    const base = currentExpiry > now ? currentExpiry : now;
    const newExpiry = addMonths(base, plan.months);

    // 8. Cập nhật user
    const updatedUser = {
      ...user,
      planType: plan.planType,
      expiryDate: newExpiry,
      characterLimit: DAILY_CHARS,
      credits: DAILY_CHARS,
      isBlocked: false,
      expiryNotifyLevel: 0
    };

    const updatedUsers = allUsers.map(u => u.uid === user.uid ? updatedUser : u);

    // 9. Lưu lại users và payment log
    await pool.query(
      'INSERT INTO bm_settings (id, data) VALUES ($1, $2) ON CONFLICT (id) DO UPDATE SET data = $2',
      ['users', JSON.stringify(updatedUsers)]
    );

    paymentLogs.push({
      transId,
      loginId,
      amount,
      description,
      planType: plan.planType,
      months: plan.months,
      processedAt: new Date().toISOString()
    });

    await pool.query(
      'INSERT INTO bm_settings (id, data) VALUES ($1, $2) ON CONFLICT (id) DO UPDATE SET data = $2',
      ['payment_logs', JSON.stringify(paymentLogs)]
    );

    console.log(`✅ Webhook: Đã cập nhật gói ${plan.planType} cho user ${loginId}, hạn dùng đến ${new Date(newExpiry).toLocaleString('vi-VN')}`);
    
    return res.status(200).json({ 
      ok: true, 
      message: `Payment processed for ${loginId}`,
      user: { uid: updatedUser.uid, planType: updatedUser.planType, expiryDate: updatedUser.expiryDate }
    });
  } catch (err) {
    console.error("❌ Webhook error:", err);
    return res.status(500).json({ error: "Internal error: " + err.message });
  }
});

// API: Kiểm tra thanh toán (để frontend polling)
app.get('/api/check_payment/:loginId', async (req, res) => {
  try {
    const { loginId } = req.params;
    console.log(`🔍 Check payment request for loginId: ${loginId}`);
    
    const usersRes = await pool.query('SELECT data FROM bm_settings WHERE id = $1', ['users']);
    if (usersRes.rows.length === 0) {
      console.log(`ℹ️ Users table not found`);
      return res.json({ found: false });
    }
    const allUsers = usersRes.rows[0].data || [];
    const user = allUsers.find(u => {
      const uLoginId = (u.loginId || u.uid || "").toLowerCase();
      return uLoginId === loginId.toLowerCase();
    });
    
    if (!user) {
      console.log(`ℹ️ User not found for loginId: ${loginId}`);
      return res.json({ found: false });
    }
    
    console.log(`✅ User found: ${user.loginId || user.uid}, planType: ${user.planType}, expiryDate: ${new Date(user.expiryDate || 0).toLocaleString('vi-VN')}`);
    return res.json({ found: true, user });
  } catch (err) {
    console.error("❌ Check payment error:", err);
    return res.status(500).json({ error: err.message });
  }
});

// API: Test webhook (để debug)
app.post('/api/test_webhook', async (req, res) => {
  try {
    console.log("🧪 Test webhook called with body:", JSON.stringify(req.body, null, 2));
    console.log("🧪 Headers:", JSON.stringify(req.headers, null, 2));
    return res.json({ ok: true, message: "Test webhook received", body: req.body, headers: req.headers });
  } catch (err) {
    console.error("❌ Test webhook error:", err);
    return res.status(500).json({ error: err.message });
  }
});

// Phục vụ ứng dụng Frontend cho các route không phải API
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(port, () => {
  console.log(`🚀 Server Bảo Minh AI đang chạy tại cổng ${port}`);
});
