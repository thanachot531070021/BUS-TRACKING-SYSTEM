# Mobile Application — Development Plan

> **วันที่เริ่ม:** 21 มีนาคม 2026
> **Branch:** `dev`
> **Path:** `C:\Web Source\apps\mobile_app`
> **Framework:** Flutter (Dart)

---

## สถานะแผน

| Phase | เนื้อหา | สถานะ |
|-------|---------|--------|
| 0 | Plan Document | ✅ เสร็จ |
| 1 | Foundation (config, models, api_service) | ✅ เสร็จ |
| 2 | Auth (login, splash, auth_provider) | ✅ เสร็จ |
| 3 | Passenger Flow (routes, waiting) | ✅ เสร็จ |
| 4 | Driver Flow (duty, GPS, pickup) | ✅ เสร็จ |
| 5 | Wire up main.dart + commit | ✅ เสร็จ |

---

## โครงสร้างโฟลเดอร์ (เป้าหมาย)

```
lib/
├── main.dart                          ← App entry, MultiProvider, routing
├── config/
│   └── api_config.dart               ← API base URL + endpoints
├── models/
│   ├── user_model.dart               ← User + AuthResponse
│   ├── route_model.dart              ← RouteModel (updated)
│   ├── bus_model.dart                ← BusModel
│   └── waiting_model.dart            ← WaitingModel
├── services/
│   ├── api_service.dart              ← HTTP client (get/post/put/delete)
│   ├── auth_service.dart             ← login, logout, me
│   ├── route_service.dart            ← getRoutes, getRoute
│   ├── bus_service.dart              ← getLiveBuses
│   ├── waiting_service.dart          ← getWaiting, createWaiting, cancelWaiting
│   └── location_service.dart         ← getCurrentLocation, sendLocation
├── providers/
│   ├── auth_provider.dart            ← token, user, login(), logout()
│   ├── route_provider.dart           ← routes list, selected route, waiting
│   └── driver_provider.dart          ← duty status, GPS timer, waiting passengers
└── screens/
    ├── splash_screen.dart            ← check token → route by role
    ├── auth/
    │   └── login_screen.dart         ← Login UI
    ├── passenger/
    │   ├── passenger_home.dart       ← Route list
    │   └── route_detail.dart         ← Route detail + live buses + waiting
    └── driver/
        ├── driver_home.dart          ← Duty toggle + assigned info + GPS
        └── waiting_list.dart         ← Waiting passengers + pickup
```

---

## User Flows

### Passenger Flow
```
SplashScreen
    ↓ (no token / role = passenger)
LoginScreen
    ↓ (login success)
PassengerHome         ← GET /routes
    ↓ (tap route)
RouteDetail           ← GET /buses/live?routeId=...
    ↓ (tap "รอรถ")
POST /waiting         ← สร้าง waiting request
    ↓ (tap "ยกเลิก")
DELETE /waiting/:id   ← ยกเลิก
```

### Driver Flow
```
SplashScreen
    ↓ (role = driver)
LoginScreen
    ↓ (login success)
DriverHome            ← GET /driver/me
    ↓ (toggle duty ON)
POST /drivers/duty    ← เริ่มปฏิบัติงาน
    + GPS Timer       ← POST /locations ทุก 5 วินาที
    ↓ (ดูผู้โดยสาร)
WaitingList           ← GET /driver/waiting?routeId=...
    ↓ (tap pickup)
POST /driver/waiting/:id/pickup
```

---

## API Endpoints ที่ใช้

| Feature | Method | Endpoint |
|---------|--------|----------|
| Login | POST | `/auth/login` |
| Get profile | GET | `/auth/me` |
| List routes | GET | `/routes` |
| Live buses | GET | `/buses/live?routeId=...` |
| Create waiting | POST | `/waiting` |
| Cancel waiting | DELETE | `/waiting/:id` |
| Get waiting list | GET | `/waiting?routeId=...` |
| Driver profile | GET | `/driver/me` |
| Toggle duty | POST | `/drivers/duty` |
| Send GPS | POST | `/locations` |
| Driver waiting | GET | `/driver/waiting?routeId=...` |
| Mark pickup | POST | `/driver/waiting/:id/pickup` |

---

## Dependencies (pubspec.yaml)

```yaml
dependencies:
  flutter: sdk: flutter
  http: ^1.2.2               ← HTTP API calls
  provider: ^6.1.2           ← State management
  geolocator: ^13.0.1        ← GPS location
  google_maps_flutter: ^2.9.0 ← Map display
  supabase_flutter: ^2.8.0   ← Realtime (future)
  shared_preferences: ^2.3.2 ← Token persistence  ← เพิ่มใหม่
```

---

## State Management (Provider)

| Provider | ความรับผิดชอบ |
|----------|--------------|
| `AuthProvider` | token, user object, login(), logout(), isLoggedIn |
| `RouteProvider` | routes list, selected route, waiting status, isWaiting |
| `DriverProvider` | driver profile, duty status, GPS timer, waiting passengers |

---

## ไฟล์ที่สร้าง/แก้ไข

| ไฟล์ | สถานะ |
|------|--------|
| `pubspec.yaml` | ✅ เพิ่ม shared_preferences |
| `config/api_config.dart` | ✅ สร้างใหม่ |
| `models/user_model.dart` | ✅ สร้างใหม่ |
| `models/route_model.dart` | ✅ อัปเดต (เพิ่ม fromJson) |
| `models/bus_model.dart` | ✅ สร้างใหม่ |
| `models/waiting_model.dart` | ✅ สร้างใหม่ |
| `services/api_service.dart` | ✅ อัปเดต (HTTP methods) |
| `services/auth_service.dart` | ✅ สร้างใหม่ |
| `services/route_service.dart` | ✅ สร้างใหม่ |
| `services/bus_service.dart` | ✅ สร้างใหม่ |
| `services/waiting_service.dart` | ✅ สร้างใหม่ |
| `services/location_service.dart` | ✅ สร้างใหม่ |
| `providers/auth_provider.dart` | ✅ สร้างใหม่ |
| `providers/route_provider.dart` | ✅ สร้างใหม่ |
| `providers/driver_provider.dart` | ✅ สร้างใหม่ |
| `screens/splash_screen.dart` | ✅ สร้างใหม่ |
| `screens/auth/login_screen.dart` | ✅ สร้างใหม่ |
| `screens/passenger/passenger_home.dart` | ✅ สร้างใหม่ |
| `screens/passenger/route_detail.dart` | ✅ สร้างใหม่ |
| `screens/driver/driver_home.dart` | ✅ สร้างใหม่ |
| `screens/driver/waiting_list.dart` | ✅ สร้างใหม่ |
| `main.dart` | ✅ อัปเดต |

---

## หมายเหตุ

- Google Maps ต้องการ API Key ใน `AndroidManifest.xml` และ `AppDelegate.swift`
- ตอนนี้ map screen ใช้ placeholder ก่อน รอใส่ API Key จริง
- Supabase Realtime เตรียมไว้สำหรับ Phase ถัดไป
- GPS ทำงานเฉพาะ Driver เมื่อ duty = ON เท่านั้น
