# Bus Tracking System — Mobile App Documentation

> Flutter app สำหรับ Passenger และ Driver  
> Backend: Cloudflare Workers `https://bus-tracking-worker.thanachot-jo888.workers.dev`  
> Version: 0.1.0+1 | Flutter 3.41.9 (Dart 3.11.5)

---

## สารบัญ

1. [ภาพรวมของแอป](#1-ภาพรวมของแอป)
2. [สถาปัตยกรรมและโครงสร้างไฟล์](#2-สถาปัตยกรรมและโครงสร้างไฟล์)
3. [Features ที่ implement แล้ว](#3-features-ที่-implement-แล้ว)
4. [การตั้งค่าก่อน Build](#4-การตั้งค่าก่อน-build)
5. [Build Scripts (PS1)](#5-build-scripts-ps1)
6. [ขั้นตอน Build Android (manual)](#6-ขั้นตอน-build-android-manual)
7. [ขั้นตอน Build iOS (manual)](#7-ขั้นตอน-build-ios-manual)
8. [การ Deploy ขึ้น Store](#8-การ-deploy-ขึ้น-store)
9. [Checklist ก่อน Release](#9-checklist-ก่อน-release)
10. [Troubleshooting](#10-troubleshooting)

---

## 1. ภาพรวมของแอป

### หน้าที่ของแต่ละ Role

| Role | สิ่งที่ทำได้ในแอป |
|------|-------------------|
| **Passenger** | Login จำเป็น, ดูรายการสายรถ, ดูรถ ON duty บน Map, แจ้งรอรถ, ยกเลิกการรอรถ |
| **Driver** | Login, เปิด/ปิด ON duty, ส่ง GPS ทุก 5 วิ, ดูรายการ+แผนที่ผู้โดยสารที่รอ |
| **Admin / Super Admin** | Login เพื่อดู role → แนะนำใช้ Web Dashboard แทน |

### Tech Stack

| ส่วน | เทคโนโลยี |
|------|-----------|
| Framework | Flutter 3.41.9 (Dart ≥ 3.3) |
| State Management | Provider 6.x |
| HTTP | package:http |
| Maps | google_maps_flutter 2.9+ |
| GPS | geolocator 13.x |
| Realtime (พร้อม) | supabase_flutter 2.8+ |
| Local Storage | shared_preferences |

---

## 2. สถาปัตยกรรมและโครงสร้างไฟล์

```
apps/mobile_app/
├── android/                             # ← สร้างโดย flutter create
│   └── app/src/main/
│       ├── AndroidManifest.xml          # Permissions + Maps API Key ✅
│       └── kotlin/.../MainActivity.kt
├── ios/                                 # ← สร้างโดย flutter create
│   └── Runner/
│       ├── AppDelegate.swift            # GMSServices.provideAPIKey() ✅
│       └── Info.plist                   # NSLocation permissions ✅
├── lib/
│   ├── main.dart                        # Entry point, MultiProvider, Supabase init
│   ├── config/
│   │   ├── api_config.dart              # Cloudflare Worker endpoint constants
│   │   └── supabase_config.dart         # Supabase URL / anon key
│   ├── models/
│   │   ├── user_model.dart
│   │   ├── route_model.dart             # รวม zoneName, routePolyline
│   │   ├── bus_model.dart               # current_lat/lng, status
│   │   └── waiting_model.dart
│   ├── services/
│   │   ├── api_service.dart             # HTTP singleton (GET/POST/PUT/DELETE + JWT)
│   │   ├── auth_service.dart
│   │   ├── route_service.dart
│   │   ├── bus_service.dart
│   │   ├── waiting_service.dart
│   │   ├── location_service.dart
│   │   └── analytics_service.dart       # fire-and-forget
│   ├── providers/
│   │   ├── auth_provider.dart           # login, logout, restoreSession
│   │   ├── route_provider.dart          # routes, liveBuses, waiting, bus polling (5s)
│   │   └── driver_provider.dart         # duty toggle, GPS timer, waiting polling (30s)
│   └── screens/
│       ├── splash_screen.dart           # โหลด session → route ไป role ที่ถูกต้อง
│       ├── admin_info_screen.dart        # Admin: แสดง role + แนะนำ Web Dashboard
│       ├── auth/
│       │   └── login_screen.dart         # Login form (ทุก role ต้อง login)
│       ├── passenger/
│       │   ├── passenger_home.dart       # รายการสายรถ + user avatar/logout
│       │   └── route_detail.dart         # Map + รถ ON duty + แจ้งรอรถ
│       └── driver/
│           ├── driver_home.dart          # สถานะ duty, ข้อมูลพนักงาน, GPS
│           └── waiting_list.dart         # Map + รายการผู้โดยสารรอ
└── pubspec.yaml
```

### Data Flow

```
Widget → Provider.method() → Service.call() → ApiService.get/post() → Cloudflare Worker
                ↑ notifyListeners()
```

---

## 3. Features ที่ implement แล้ว

### ✅ Auth
- ทุก role ต้อง Login (ไม่มี guest mode)
- JWT stored ใน SharedPreferences, restore session อัตโนมัติเมื่อเปิดแอป
- Splash screen route ไปยัง screen ตาม role: passenger → driver → admin

### ✅ Passenger
- รายการสายรถ พร้อม zone badge และ status (เปิด/ปิด)
- Route Detail: Google Map แสดง bus markers (🔵)
- Bus polling อัตโนมัติทุก 5 วินาที
- กด bus ในลิสต์ → กล้องแผนที่เลื่อนไปหา bus
- แจ้งรอรถ (ต้อง GPS เปิด) → marker ตำแหน่งตัวเอง (🟠)
- ยกเลิกการรอรถ

### ✅ Driver
- ดูข้อมูลพนักงาน: ชื่อ, รหัส, ทะเบียนรถ, ชื่อเส้นทาง
- Toggle ON/OFF duty → ส่ง `{ busId, status }` ให้ backend
- GPS timer ส่งพิกัดทุก 5 วิ เมื่อ ON duty
- Waiting list พร้อม Google Map (🟠 markers)
- Waiting polling ทุก 30 วิ เมื่อ ON duty
- กด locate → กล้องแผนที่เลื่อนหาผู้โดยสาร
- ปุ่ม "รับแล้ว" → ลบออกจากลิสต์ทันที

---

## 4. การตั้งค่าก่อน Build

### 4.1 Flutter SDK

Flutter 3.41.9 ติดตั้งผ่าน **Puro** แล้วที่:
```
%USERPROFILE%\.puro\envs\stable\flutter\bin
```

ตรวจสอบ:
```powershell
$env:PATH = "$env:USERPROFILE\.puro\envs\stable\flutter\bin;$env:PATH"
flutter --version
flutter doctor
```

---

### 4.2 Google Maps API Key ✅ ตั้งค่าแล้ว

สร้าง key ที่ [console.cloud.google.com](https://console.cloud.google.com) → APIs & Services → Credentials → Create API Key

**APIs ที่ต้อง Enable (2 ตัวเท่านั้น):**

| API | เหตุผล |
|-----|--------|
| **Maps SDK for Android** | `google_maps_flutter` บน Android |
| **Maps SDK for iOS** | `google_maps_flutter` บน iOS |

> APIs อื่นทั้งหมด (Directions, Geocoding, Places, Routes ฯลฯ) **ปิดไว้ได้** — แอปนี้ไม่ได้ใช้  
> GPS ของ Passenger/Driver ใช้ `geolocator` package (device GPS) ไม่ใช่ Google Geolocation API

**ไฟล์ที่ใส่ key แล้ว:**

| ไฟล์ | บรรทัด |
|------|--------|
| `android/app/src/main/AndroidManifest.xml` | `<meta-data android:name="com.google.android.geo.API_KEY" .../>` |
| `ios/Runner/AppDelegate.swift` | `GMSServices.provideAPIKey("...")` |

ถ้าต้องการเปลี่ยน key → แก้ทั้ง 2 ไฟล์ด้านบน

---

### 4.3 Supabase Credentials (ถ้าใช้ Realtime)

แก้ไขไฟล์ `lib/config/supabase_config.dart`:

```dart
class SupabaseConfig {
  static const String url = 'https://xxxxxxxxxxxx.supabase.co';
  static const String anonKey = 'eyJhbGci...';
}
```

> ถ้าไม่กรอก แอปยังรันได้ปกติ — ใช้ polling 5s/30s แทน Realtime

---

### 4.4 Android Application ID

แก้ไขใน `android/app/build.gradle.kts`:

```kotlin
defaultConfig {
    applicationId = "com.yourcompany.bustracking"  // ← เปลี่ยนจาก com.example.*
    minSdk = flutter.minSdkVersion                  // Flutter กำหนดเป็น 21+
    targetSdk = flutter.targetSdkVersion
    versionCode = flutter.versionCode
    versionName = flutter.versionName
}
```

---

### 4.5 iOS Bundle Identifier (macOS เท่านั้น)

เปิด `ios/Runner.xcworkspace` ใน Xcode:
- Runner target → **Signing & Capabilities**
- **Bundle Identifier**: `com.yourcompany.bustracking`
- **Team**: เลือก Apple Developer Account

---

### 4.6 Permissions ✅ ตั้งค่าแล้ว

**Android** (`AndroidManifest.xml`) — มีแล้ว:
```xml
<uses-permission android:name="android.permission.INTERNET"/>
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION"/>
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION"/>
```

**iOS** (`Info.plist`) — มีแล้ว:
```xml
<key>NSLocationWhenInUseUsageDescription</key>
<key>NSLocationAlwaysAndWhenInUseUsageDescription</key>
```

---

## 5. Build Scripts (PS1)

มี 2 สคริปต์อยู่ที่ root `C:\Web Source\`:

```
C:\Web Source\
├── build_android.ps1   ← Build APK / AAB บน Windows
└── build_ios.ps1       ← Build iOS (ทำงานจริงบน macOS / บน Windows แสดงขั้นตอน)
```

---

### ขั้นตอนแรก — ตรวจสอบ Execution Policy (ทำครั้งเดียว)

เปิด PowerShell แล้วรัน:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

ตรวจสอบ:
```powershell
Get-ExecutionPolicy -Scope CurrentUser
# ควรแสดง: RemoteSigned
```

---

### build_android.ps1

**Parameters:**

| Parameter | ค่า | คำอธิบาย |
|-----------|-----|----------|
| `-Mode` | `debug` (default) | APK สำหรับทดสอบ ไม่ต้องมี keystore |
| `-Mode` | `release` | APK signed สำหรับแจกจ่าย |
| `-Mode` | `appbundle` | AAB สำหรับ Google Play Store |
| `-SkipGet` | switch | ข้าม `flutter pub get` (เร็วขึ้น ถ้า packages ไม่เปลี่ยน) |
| `-SkipAnalyze` | switch | ข้าม `flutter analyze` |

**ตัวอย่างคำสั่ง:**

```powershell
cd "C:\Web Source"

# debug APK — ทดสอบบนมือถือ/emulator
.\build_android.ps1

# release APK — แจกจ่าย / ส่ง tester
.\build_android.ps1 -Mode release

# AAB — อัปโหลด Google Play Store
.\build_android.ps1 -Mode appbundle

# build เร็วขึ้น ถ้า packages ไม่เปลี่ยน
.\build_android.ps1 -Mode debug -SkipGet

# ข้ามทั้ง pub get และ analyze
.\build_android.ps1 -Mode debug -SkipGet -SkipAnalyze
```

**Output files:**

| Mode | ที่อยู่ไฟล์ |
|------|-----------|
| debug | `apps\mobile_app\build\app\outputs\flutter-apk\app-debug.apk` |
| release | `apps\mobile_app\build\app\outputs\flutter-apk\app-release.apk` |
| appbundle | `apps\mobile_app\build\app\outputs\bundle\release\app-release.aab` |

**สคริปต์จะทำตามลำดับนี้:**
1. Reload PATH จาก registry (flutter พร้อมใช้ทันทีโดยไม่ต้องเปิด PowerShell ใหม่)
2. ตรวจสอบ flutter version
3. `flutter pub get`
4. `flutter analyze` (ถ้าพบ error จะถามก่อนว่า build ต่อไหม)
5. `flutter build apk/appbundle`
6. แสดงที่อยู่ไฟล์ + ขนาด และถามว่าจะเปิดโฟลเดอร์ไหม

---

### build_ios.ps1

> **บน Windows:** แสดงขั้นตอนและ checklist ที่ต้องทำบน Mac  
> **บน macOS:** รัน build จริง

**Parameters:**

| Parameter | ค่า | คำอธิบาย |
|-----------|-----|----------|
| `-Mode` | `simulator` (default) | รันบน iOS Simulator |
| `-Mode` | `device` | รันบน iPhone จริง |
| `-Mode` | `release` | Build สำหรับ App Store / TestFlight |
| `-SkipPodInstall` | switch | ข้าม `pod install` |

**ตัวอย่างคำสั่ง:**

```powershell
cd "C:\Web Source"

# แสดงขั้นตอนทำบน Mac (บน Windows)
.\build_ios.ps1

# แสดงขั้นตอน release + archive บน Mac
.\build_ios.ps1 -Mode release

# รันบน Simulator (macOS เท่านั้น)
.\build_ios.ps1 -Mode simulator

# Build release + ข้าม pod install
.\build_ios.ps1 -Mode release -SkipPodInstall
```

---

### สรุปกระบวนการ Build

```
เปิด PowerShell
    │
    ├── cd "C:\Web Source"
    │
    ├── Android debug (ทดสอบ)
    │       .\build_android.ps1
    │       → app-debug.apk
    │       → ติดตั้งบนมือถือด้วย ADB หรือส่งไฟล์
    │
    ├── Android release (แจกจ่าย)
    │       .\build_android.ps1 -Mode release
    │       → app-release.apk
    │
    ├── Android Play Store
    │       .\build_android.ps1 -Mode appbundle
    │       → app-release.aab → อัปโหลด Google Play Console
    │
    └── iOS (ต้องทำบน Mac)
            .\build_ios.ps1 -Mode release
            → แสดงขั้นตอน → ทำต่อบน macOS + Xcode
```

---

## 6. ขั้นตอน Build Android (manual)

### ทดสอบบน Emulator

```powershell
# 1. เปิด PATH ให้มี flutter
$env:PATH = "$env:USERPROFILE\.puro\envs\stable\flutter\bin;$env:PATH"

# 2. เข้าโฟลเดอร์
cd "C:\Web Source\apps\mobile_app"

# 3. ดู devices
flutter devices

# 4. รัน
flutter run -d emulator-5554
```

**สร้าง Emulator ใน Android Studio:**
Android Studio → Device Manager → Create Virtual Device → Pixel 8, API 34

---

### ทดสอบบนมือถือ Android จริง

```powershell
# เปิด USB Debugging บนมือถือ
# Settings → About Phone → Build Number (กด 7 ครั้ง) → Developer Options → USB Debugging ON

flutter devices        # ตรวจสอบว่าเห็น device
flutter run -d <device-id>
```

---

### Build APK Debug

```powershell
flutter build apk --debug
# Output: build\app\outputs\flutter-apk\app-debug.apk
```

---

### Build APK / AAB Release

```powershell
# 1. สร้าง keystore (ทำครั้งเดียว)
keytool -genkey -v -keystore bus-tracking-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias bus-tracking

# 2. สร้าง android/key.properties (อย่า commit เข้า git!)
storePassword=YOUR_STORE_PASSWORD
keyPassword=YOUR_KEY_PASSWORD
keyAlias=bus-tracking
storeFile=C:/path/to/bus-tracking-key.jks

# 3. เพิ่ม signingConfigs ใน android/app/build.gradle.kts
# (ดูตัวอย่างใน Flutter docs: https://docs.flutter.dev/deployment/android)

# 4. Build
flutter build apk --release
# Output: build\app\outputs\flutter-apk\app-release.apk

flutter build appbundle --release
# Output: build\app\outputs\bundle\release\app-release.aab
```

---

### Checklist ทดสอบ Android

| หัวข้อ | วิธีทดสอบ |
|--------|-----------|
| GPS Permission | เปิดแอปครั้งแรก → ควรขอ permission |
| Login | ใส่ username/password → เข้าหน้า home ตาม role |
| Passenger ดูสายรถ | เห็นรายการสายรถ + zone badge |
| Toggle ON duty (Driver) | กดปุ่ม → สถานะเปลี่ยน + GPS card ปรากฏ |
| GPS Tracking | เปิด network log → `/locations` ถูกเรียกทุก 5 วิ |
| Map แสดงรถ | Route Detail → เห็น map + bus markers |
| แจ้งรอรถ | Login Passenger → Route Detail → กดแจ้งรอรถ → marker ปรากฏ |

---

## 7. ขั้นตอน Build iOS (manual)

> **ต้องใช้ macOS + Xcode 15+ เท่านั้น**

### Prerequisites

```bash
# ติดตั้ง Xcode จาก App Store
# ติดตั้ง CocoaPods
sudo gem install cocoapods

# ตรวจสอบ
flutter doctor
```

---

### Setup และ Run

```bash
cd apps/mobile_app
flutter pub get

# ติดตั้ง iOS native dependencies
cd ios && pod install && cd ..

# ดู Simulator ที่มี
flutter devices

# รันบน Simulator
flutter run -d "iPhone 16 Pro"
```

---

### Build iOS Release → App Store

```bash
flutter build ios --release

# หลัง build เสร็จ:
# 1. เปิด ios/Runner.xcworkspace ใน Xcode
# 2. Target: Any iOS Device (arm64)
# 3. Product → Archive
# 4. Window → Organizer → Distribute App → App Store Connect
```

---

### Checklist ทดสอบ iOS

| หัวข้อ | วิธีทดสอบ |
|--------|-----------|
| Location Permission | เปิดแอปครั้งแรก → popup ขอ permission |
| Map แสดง | Route Detail → Google Map โหลดได้ |
| GPS Passenger | กด "แจ้งรอรถ" → เห็น orange marker |
| Login persist | Force-close → เปิดใหม่ → ยังอยู่ใน session เดิม |
| Driver ON duty | Toggle → GPS ส่งทุก 5 วิ |
| Simulator GPS | Simulator → Features → Location → Custom Location |

---

## 8. การ Deploy ขึ้น Store

### Google Play Store

1. สร้าง App บน [Google Play Console](https://play.google.com/console)
2. กรอกข้อมูล App, screenshot, icon
3. สร้าง Release → อัปโหลด `app-release.aab`
4. ตั้ง Content Rating → Submit

### Apple App Store

1. สร้าง App บน [App Store Connect](https://appstoreconnect.apple.com)
2. กรอกข้อมูล App, screenshot, icon
3. Archive จาก Xcode → Distribute → App Store Connect
4. เลือก Build ใน App Store Connect → Submit

---

## 9. Checklist ก่อน Release

### การตั้งค่า

- [x] Google Maps API Key ใส่ใน AndroidManifest.xml แล้ว
- [x] Google Maps API Key ใส่ใน AppDelegate.swift แล้ว
- [x] Permissions (INTERNET, LOCATION) ใน AndroidManifest.xml แล้ว
- [x] NSLocationUsageDescription ใน Info.plist แล้ว
- [ ] Supabase URL + anon key ใน `supabase_config.dart` (ถ้าใช้ Realtime)
- [ ] เปลี่ยน `applicationId` จาก `com.example.*` เป็น domain ของทีม
- [ ] ตั้งค่า keystore สำหรับ Android signing
- [ ] ตั้งค่า Bundle ID + Team ใน Xcode

### Code

- [ ] `flutter analyze` ผ่านโดยไม่มี error
- [ ] ไม่มี `print()` statements ค้างอยู่
- [ ] `debugShowCheckedModeBanner: false` ✅ (ทำแล้ว)

### ฟังก์ชัน

- [ ] Login / Logout ทำงานถูกต้อง
- [ ] Passenger: ดูสายรถ, แจ้งรอรถ, ยกเลิก ทำงานได้
- [ ] Driver: ON/OFF duty อัปเดตสถานะรถในระบบจริง
- [ ] Map แสดงรถ real-time (polling 5 วิ)
- [ ] Driver ดูผู้โดยสารรอบน Map

---

## 10. Troubleshooting

### Android

| ปัญหา | วิธีแก้ |
|-------|---------|
| Google Map ไม่แสดง (blank) | ตรวจสอบ API Key ใน AndroidManifest.xml |
| GPS ไม่ทำงาน | ตรวจสอบ permission + `minSdk >= 21` |
| Build failed: Gradle error | `flutter clean && flutter pub get` |
| `MissingPluginException` | `flutter clean && flutter pub get && flutter run` |
| `flutter` ไม่ใช่ command | เพิ่ม `%USERPROFILE%\.puro\envs\stable\flutter\bin` ใน PATH |

### iOS

| ปัญหา | วิธีแก้ |
|-------|---------|
| `pod install` ล้มเหลว | `sudo gem install cocoapods --pre` |
| Google Map blank | ตรวจสอบ `GMSServices.provideAPIKey()` ใน AppDelegate.swift |
| Signing error | Xcode → Runner → Signing & Capabilities → เลือก Team |
| GPS ไม่ขอ permission | ตรวจสอบ `NSLocationWhenInUseUsageDescription` ใน Info.plist |
| Simulator ไม่มี GPS | Simulator → Features → Location → Custom Location |

### Flutter ทั่วไป

| ปัญหา | วิธีแก้ |
|-------|---------|
| 401 หลัง login | ตรวจสอบ backend URL ใน `api_config.dart` |
| Toggle duty ได้รับ 400 | Driver ต้องมีรถผูกในระบบ (Admin สร้าง Bus + ผูก Driver) |
| แจ้งรอรถ ได้รับ 400 | GPS ต้องเปิดและรับตำแหน่งได้ |
| Map crash ทันที | ยังไม่ได้ใส่ Google Maps API Key |

---

## คำสั่งที่ใช้บ่อย

```powershell
# เปิด PATH ให้มี flutter (ทำทุกครั้งที่เปิด PowerShell ใหม่)
$env:PATH = "$env:USERPROFILE\.puro\envs\stable\flutter\bin;$env:PATH"

cd "C:\Web Source\apps\mobile_app"

flutter pub get          # ติดตั้ง/อัพเดต dependencies
flutter devices          # ดู devices ทั้งหมด
flutter run              # รันบน device ที่เชื่อมต่ออยู่
flutter run -d <id>      # รันบน device เฉพาะ
flutter analyze          # ตรวจสอบ code
flutter clean            # ล้าง build cache

flutter build apk --debug     # APK debug
flutter build apk --release   # APK release
flutter build appbundle        # AAB (Google Play)
flutter build ios --release    # iOS (macOS เท่านั้น)

flutter doctor -v        # ตรวจสอบ environment
```
