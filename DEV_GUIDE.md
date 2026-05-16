# Dev Guide — Bus Tracking System

> อัพเดต: 2026-05-15

ระบบแบ่งเป็น 3 ส่วน แต่ละส่วนรันแยกกันอิสระ

---

## สารบัญ
1. [Backend (Cloudflare Worker)](#1-backend-cloudflare-worker)
2. [Admin Dashboard (Vite)](#2-admin-dashboard-vite)
3. [Mobile App (Flutter)](#3-mobile-app-flutter)
4. [Deploy ขึ้น Production](#4-deploy-ขึ้น-production)
5. [สถานะ Flutter Doctor](#5-สถานะ-flutter-doctor)

---

## 1. Backend (Cloudflare Worker)

**โฟลเดอร์:** `backend/worker/`

### รัน Local Dev Server

```powershell
cd "c:\Web Source\backend\worker"
npm run dev
```

- URL: `http://127.0.0.1:8787`
- Hot reload อัตโนมัติ เมื่อแก้ไขไฟล์ใน `src/`
- ใช้ environment variables จาก `wrangler.toml` (ยกเว้น `SUPABASE_SERVICE_ROLE_KEY` ที่ต้องตั้งแยก)

### ทดสอบ API

```powershell
# Health check
curl http://127.0.0.1:8787/health

# ดูโซน (ต้อง login ก่อนได้ token)
curl http://127.0.0.1:8787/zones

# ดูจังหวัด
curl http://127.0.0.1:8787/provinces
```

### ตั้งค่า Secret สำหรับ local dev

```powershell
# สร้างไฟล์ .dev.vars ใน backend/worker/ (git ignore อยู่แล้ว)
# เพิ่มบรรทัด:
SUPABASE_SERVICE_ROLE_KEY=your_key_here
```

---

## 2. Admin Dashboard (Vite)

**โฟลเดอร์:** `apps/admin_dashboard/`

### ติดตั้ง Dependencies (ครั้งแรก)

```powershell
cd "c:\Web Source\apps\admin_dashboard"
npm install
```

### รัน Local Dev Server

```powershell
cd "c:\Web Source\apps\admin_dashboard"
npm run dev
```

| หน้า | URL |
|------|-----|
| Dashboard หลัก | http://localhost:5173/index.html |
| Login | http://localhost:5173/login.html |
| โครงสร้างโซน (public) | http://localhost:5173/zones.html |
| จัดการผู้ใช้ | http://localhost:5173/users.html |

> **หมายเหตุ:** ค่าเริ่มต้น API Base URL ชี้ไปที่ `http://127.0.0.1:8787`
> ถ้าจะใช้กับ production backend ให้เปลี่ยนใน หน้า Settings ของ dashboard

### Build เพื่อตรวจสอบก่อน Deploy

```powershell
cd "c:\Web Source\apps\admin_dashboard"
npm run build
# ผลลัพธ์อยู่ใน dist/
```

---

## 3. Mobile App (Flutter)

**โฟลเดอร์:** `apps/mobile_app/`
**Flutter:** 3.41.9 ผ่าน [puro](https://puro.dev) — ใช้คำสั่ง `puro flutter ...` แทน `flutter ...`

### ดู Devices ที่เชื่อมต่ออยู่

```powershell
cd "c:\Web Source\apps\mobile_app"
puro flutter devices
```

### รันบน Chrome (พร้อมใช้งานได้เลย)

```powershell
puro flutter run -d chrome
```

### รันบนโทรศัพท์ Android จริง (USB)

```powershell
# 1. เปิด Developer Options + USB Debugging ในโทรศัพท์
# 2. เสียบสาย USB
# 3. ตรวจสอบ device
puro flutter devices

# 4. รันด้วย device ID ที่ได้
puro flutter run -d <device-id>
```

### รัน Hot Reload ระหว่าง Dev

เมื่อ app กำลังรันอยู่ในเทอร์มินัล:

| ปุ่ม | ผล |
|------|----|
| `r` | Hot reload — รีโหลดเร็ว state ยังอยู่ |
| `R` | Hot restart — รีสตาร์ท state รีเซ็ต |
| `q` | หยุดการรัน |

### Analyze โค้ด (ไม่ต้องรัน app)

```powershell
puro flutter analyze
```

### ติดตั้ง Dependencies (ถ้า pubspec.yaml เปลี่ยน)

```powershell
puro flutter pub get
```

---

## 4. Deploy ขึ้น Production

### Backend Worker

```powershell
cd "c:\Web Source\backend\worker"
npm run deploy
# หรือ
npx wrangler deploy
```

- URL: `https://bus-tracking-worker.thanachot-jo888.workers.dev`

### Admin Dashboard

```powershell
cd "c:\Web Source\apps\admin_dashboard"
npm run build
npx wrangler deploy
```

- URL: `https://bus-tracking-admin-dashboard.thanachot-jo888.workers.dev`

### Mobile App — Build APK (Android)

```powershell
cd "c:\Web Source\apps\mobile_app"

# Debug APK (ทดสอบ)
puro flutter build apk --debug

# Release APK (แจกจ่าย)
puro flutter build apk --release
```

> ไฟล์ APK อยู่ที่: `build/app/outputs/flutter-apk/app-release.apk`

---

## 5. สถานะ Flutter Doctor

```
[!] Flutter       — ✅ ใช้งานได้ (ผ่าน puro) แต่ binary ไม่อยู่ใน PATH
[!] Android SDK   — ⚠️  ติดตั้งแล้ว (v36.1.0) แต่ขาด cmdline-tools
[✓] Chrome        — ✅ พร้อมใช้
[✗] Visual Studio — ❌ ยังไม่ติดตั้ง (ต้องการ Windows desktop build)
[✓] Network       — ✅
```

### แก้ Android cmdline-tools (ทำครั้งเดียว)

1. ติดตั้ง Android Studio:
   ```powershell
   winget install Google.AndroidStudio
   ```
2. เปิด Android Studio → **SDK Manager** → **SDK Tools** tab
3. ติ๊ก **Android SDK Command-line Tools** → Apply
4. ยอมรับ license:
   ```powershell
   puro flutter doctor --android-licenses
   ```

### เพิ่ม Flutter ใน PATH (optional — เพื่อพิมพ์ `flutter` ได้เลย)

เพิ่มบรรทัดนี้ใน Environment Variables → Path:
```
C:\Users\Thanachat_J\.puro\envs\stable\flutter\bin
```

---

## Supabase Migration ที่ยังต้องรัน

รันใน [Supabase SQL Editor](https://supabase.com/dashboard/project/vvdczpstdkncajsnxmcq/sql):

```sql
-- เพิ่มฟิลด์จังหวัดในโซน
ALTER TABLE zones ADD COLUMN IF NOT EXISTS province TEXT;

-- เพิ่มพิกัด GPS ในเส้นทาง
ALTER TABLE routes ADD COLUMN IF NOT EXISTS start_lat FLOAT8;
ALTER TABLE routes ADD COLUMN IF NOT EXISTS start_lng FLOAT8;
ALTER TABLE routes ADD COLUMN IF NOT EXISTS end_lat   FLOAT8;
ALTER TABLE routes ADD COLUMN IF NOT EXISTS end_lng   FLOAT8;
```
