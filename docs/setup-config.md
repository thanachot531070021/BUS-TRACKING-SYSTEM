# Setup & Configuration Guide

ค่าที่ต้องกรอกก่อน deploy จริง — ปัจจุบันใช้ค่า placeholder ทั้งหมด

---

## 1. Facebook Login

### 1.1 สร้าง Facebook App
1. ไปที่ https://developers.facebook.com → My Apps → Create App
2. เลือก **Consumer** → ตั้งชื่อ → Create App
3. เพิ่ม **Facebook Login for Android** product
4. จด **App ID** และ **Client Token** (Settings → Advanced → Client Token)

### 1.2 ลงทะเบียน Android Package
ใน Facebook Developer Console → Facebook Login → Settings:
- Package Name: `com.example.bus_tracking_mobile_app`  
  *(ตรวจสอบจาก `android/app/build.gradle` → `applicationId`)*
- Key Hashes: ใส่ SHA-1 จากข้อ 2.2 (แปลงเป็น Base64 ก่อน)

### 1.3 แก้ไขไฟล์ strings.xml
**ไฟล์:** `apps/mobile_app/android/app/src/main/res/values/strings.xml`

```xml
<string name="facebook_app_id">YOUR_FACEBOOK_APP_ID</string>
<string name="fb_login_protocol_scheme">fbYOUR_FACEBOOK_APP_ID</string>
<string name="facebook_client_token">YOUR_FACEBOOK_CLIENT_TOKEN</string>
```

แทนที่:
| Placeholder | ค่าจริง |
|---|---|
| `YOUR_FACEBOOK_APP_ID` | App ID จาก developers.facebook.com |
| `YOUR_FACEBOOK_CLIENT_TOKEN` | Client Token จาก App Settings → Advanced |

ตัวอย่าง: ถ้า App ID = `1234567890`
```xml
<string name="facebook_app_id">1234567890</string>
<string name="fb_login_protocol_scheme">fb1234567890</string>
```

---

## 2. Google Sign-In

### 2.1 สร้าง OAuth Client ID
1. ไปที่ https://console.cloud.google.com
2. เลือก Project → APIs & Services → Credentials → Create Credentials → OAuth Client ID
3. เลือก **Android**
4. Package name: `com.example.bus_tracking_mobile_app`
5. SHA-1 fingerprint: ดูวิธีได้ข้อ 2.2

### 2.2 ดึงค่า SHA-1 Fingerprint

**Debug (สำหรับ dev/test):**
```bash
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
```

**Release (สำหรับ production):**
```bash
keytool -list -v -keystore path/to/your-release.keystore -alias your-alias
```

### 2.3 ดาวน์โหลด google-services.json
หลังสร้าง OAuth Client ID แล้ว:
1. ไปที่ Project Settings → General → Your Apps → Download `google-services.json`
2. วางไฟล์ที่ `apps/mobile_app/android/app/google-services.json`

> ⚠️ ถ้าไม่มีไฟล์นี้ Google Sign-In จะไม่ทำงาน

### 2.4 เพิ่ม dependency ใน build.gradle (ถ้ายังไม่มี)
**`android/build.gradle`:**
```groovy
dependencies {
    classpath 'com.google.gms:google-services:4.4.0'
}
```
**`android/app/build.gradle`:**
```groovy
apply plugin: 'com.google.gms.google-services'
```

---

## 3. Google Maps API Key

**ไฟล์:** `apps/mobile_app/android/app/src/main/AndroidManifest.xml`

```xml
<meta-data
    android:name="com.google.android.geo.API_KEY"
    android:value="AIzaSyBG7rWo1ajJ1fMzjIi_ZrCW2SPaI5H5ze8"/>
```

ค่าปัจจุบันใส่ไว้แล้ว หากต้องการเปลี่ยน:
1. ไปที่ https://console.cloud.google.com → APIs & Services → Credentials
2. สร้าง API Key ใหม่ → เพิ่ม restriction → Android apps → ใส่ SHA-1 + Package name
3. Enable **Maps SDK for Android**

---

## 4. Supabase

### 4.1 Migration ที่ยังไม่ได้รัน
รันใน Supabase SQL Editor: https://supabase.com/dashboard/project/vvdczpstdkncajsnxmcq/sql

```sql
-- zones: เพิ่มจังหวัด
ALTER TABLE zones ADD COLUMN IF NOT EXISTS province TEXT;

-- routes: เปลี่ยนจาก 4 คอลัมน์ float → 2 คอลัมน์ text
ALTER TABLE routes DROP COLUMN IF EXISTS start_lat;
ALTER TABLE routes DROP COLUMN IF EXISTS start_lng;
ALTER TABLE routes DROP COLUMN IF EXISTS end_lat;
ALTER TABLE routes DROP COLUMN IF EXISTS end_lng;
ALTER TABLE routes ADD COLUMN IF NOT EXISTS start_coords TEXT;
ALTER TABLE routes ADD COLUMN IF NOT EXISTS end_coords   TEXT;
```

### 4.2 Service Role Key (Backend)
ต้องใส่แยกต่างหาก (ไม่เก็บใน wrangler.toml):
```bash
cd backend/worker
wrangler secret put SUPABASE_SERVICE_ROLE_KEY
# วางค่าจาก Supabase → Project Settings → API → service_role key
```

---

## 5. Cloudflare Worker

**ค่าที่ใช้อยู่ใน `backend/worker/wrangler.toml`:**

| Variable | ค่า | หมายเหตุ |
|---|---|---|
| `SUPABASE_URL` | `https://vvdczpstdkncajsnxmcq.supabase.co` | ใช้ได้แล้ว |
| `SUPABASE_ANON_KEY` | (ใส่แล้ว) | ใช้ได้แล้ว |
| `SUPABASE_SERVICE_ROLE_KEY` | *(secret — ยังไม่ได้ set)* | รัน `wrangler secret put` |

**Deploy:**
```bash
cd backend/worker
npm run deploy
```

---

## 6. สรุปสิ่งที่ต้องทำก่อน Production

| # | สิ่งที่ต้องทำ | ไฟล์ที่แก้ |
|---|---|---|
| 1 | สร้าง Facebook App → ใส่ App ID + Client Token | `strings.xml` |
| 2 | สร้าง Google OAuth Client ID + ดาวน์โหลด `google-services.json` | `android/app/` |
| 3 | รัน Supabase migration (zones + routes) | Supabase SQL Editor |
| 4 | ตั้งค่า `SUPABASE_SERVICE_ROLE_KEY` ใน Cloudflare | `wrangler secret put` |
| 5 | (ถ้าเปลี่ยน Maps key) อัปเดต API Key | `AndroidManifest.xml` |
