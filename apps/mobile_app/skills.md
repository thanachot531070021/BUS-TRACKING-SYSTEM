# Flutter Mobile App — Skills & Development Guide

> Project: **Bus Tracking System** (`bus_tracking_mobile_app`)  
> Backend: Cloudflare Workers — `https://bus-tracking-worker.thanachot-jo888.workers.dev`  
> State Management: Provider  
> Targets: **iOS** + **Android**

---

## Project Architecture

```
lib/
├── config/          # API endpoints, constants
├── models/          # Data classes (fromJson / toJson)
├── services/        # API calls, business logic (pure Dart)
├── providers/       # ChangeNotifier — UI state
└── screens/         # Widgets per role
    ├── auth/
    ├── passenger/
    └── driver/
```

**Data flow:** Widget → Provider → Service → ApiService → Cloudflare Worker  
**Auth flow:** Login → JWT token → `ApiService.setToken()` → stored in `SharedPreferences`

---

## Stack & Dependencies

| Package | Version | Purpose |
|---|---|---|
| `provider` | ^6.1.2 | State management |
| `http` | ^1.2.2 | REST API calls |
| `geolocator` | ^13.0.1 | GPS location |
| `google_maps_flutter` | ^2.9.0 | Map display |
| `supabase_flutter` | ^2.8.0 | Realtime / DB direct |
| `shared_preferences` | ^2.3.2 | Local token storage |

---

## Flutter Skills

### 1. Widget Patterns

**StatelessWidget** — ใช้เมื่อ UI ไม่มี state ของตัวเอง
```dart
class RouteCard extends StatelessWidget {
  const RouteCard({super.key, required this.route});
  final RouteModel route;

  @override
  Widget build(BuildContext context) { ... }
}
```

**StatefulWidget** — ใช้เมื่อต้องการ local state (form, animation)
```dart
class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});
  @override
  State<LoginScreen> createState() => _LoginScreenState();
}
```

**Consumer / context.watch** — อ่านค่าจาก Provider และ rebuild เมื่อค่าเปลี่ยน
```dart
// อ่านและ rebuild
final auth = context.watch<AuthProvider>();

// อ่านอย่างเดียว (ไม่ rebuild)
final auth = context.read<AuthProvider>();
```

---

### 2. Provider Pattern

```dart
// Provider class
class RouteProvider extends ChangeNotifier {
  final RouteService _routeService;
  List<RouteModel> _routes = [];
  bool _isLoading = false;

  List<RouteModel> get routes => _routes;
  bool get isLoading => _isLoading;

  RouteProvider(this._routeService);

  Future<void> loadRoutes() async {
    _isLoading = true;
    notifyListeners();
    try {
      _routes = await _routeService.getRoutes();
    } catch (e) {
      // handle error
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
}
```

**Register ใน main.dart:**
```dart
ChangeNotifierProvider<RouteProvider>(
  create: (ctx) => RouteProvider(ctx.read<RouteService>()),
),
```

---

### 3. API Service Pattern

ใช้ `ApiService` singleton (`apiService`) สำหรับ HTTP calls ทุก endpoint:

```dart
// GET
final data = await apiService.get(ApiConfig.routes);

// POST with body
final data = await apiService.post(
  ApiConfig.login,
  body: {'username': username, 'password': password},
);

// Error handling
try {
  final data = await apiService.get(ApiConfig.me);
} on ApiException catch (e) {
  // e.message, e.statusCode
} catch (e) {
  // network error
}
```

**เพิ่ม endpoint ใหม่** — ใส่ใน `lib/config/api_config.dart`:
```dart
static const String newEndpoint = '/new-path';
static String dynamicEndpoint(String id) => '/items/$id';
```

---

### 4. Model Pattern

```dart
class BusModel {
  final String id;
  final String plateNumber;
  final double? lat;
  final double? lng;

  const BusModel({
    required this.id,
    required this.plateNumber,
    this.lat,
    this.lng,
  });

  factory BusModel.fromJson(Map<String, dynamic> json) => BusModel(
    id: json['id'] as String,
    plateNumber: json['plate_number'] as String,
    lat: (json['lat'] as num?)?.toDouble(),
    lng: (json['lng'] as num?)?.toDouble(),
  );

  Map<String, dynamic> toJson() => {
    'id': id,
    'plate_number': plateNumber,
    'lat': lat,
    'lng': lng,
  };
}
```

---

### 5. Google Maps

```dart
GoogleMap(
  initialCameraPosition: CameraPosition(
    target: LatLng(lat, lng),
    zoom: 15,
  ),
  markers: _markers,
  polylines: _polylines,
  myLocationEnabled: true,
  myLocationButtonEnabled: true,
  onMapCreated: (controller) => _mapController = controller,
)
```

**เพิ่ม marker:**
```dart
_markers.add(Marker(
  markerId: MarkerId(bus.id),
  position: LatLng(bus.lat!, bus.lng!),
  infoWindow: InfoWindow(title: bus.plateNumber),
));
```

---

### 6. Geolocator — GPS

```dart
// ขอ permission
LocationPermission permission = await Geolocator.requestPermission();

// ดึง position ปัจจุบัน
final position = await Geolocator.getCurrentPosition(
  desiredAccuracy: LocationAccuracy.high,
);

// Stream location (driver tracking)
Geolocator.getPositionStream(
  locationSettings: const LocationSettings(
    accuracy: LocationAccuracy.high,
    distanceFilter: 10, // เมตร
  ),
).listen((position) {
  // ส่ง position ไปยัง backend
});
```

---

### 7. AsyncSnapshot / FutureBuilder

```dart
FutureBuilder<List<RouteModel>>(
  future: routeService.getRoutes(),
  builder: (context, snapshot) {
    if (snapshot.connectionState == ConnectionState.waiting) {
      return const CircularProgressIndicator();
    }
    if (snapshot.hasError) return Text('Error: ${snapshot.error}');
    final routes = snapshot.data!;
    return ListView.builder(
      itemCount: routes.length,
      itemBuilder: (_, i) => RouteCard(route: routes[i]),
    );
  },
)
```

---

### 8. Navigation

```dart
// Push
Navigator.push(context, MaterialPageRoute(builder: (_) => NextScreen()));

// Push Named
Navigator.pushNamed(context, '/route-detail', arguments: route);

// Replace (ไม่ให้กลับ)
Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => HomeScreen()));

// Pop all and go home
Navigator.pushAndRemoveUntil(
  context,
  MaterialPageRoute(builder: (_) => LoginScreen()),
  (route) => false,
);
```

---

### 9. Theme & Styling

Project ใช้ Material 3 พร้อม seed color `#2563EB` (สีน้ำเงิน):

```dart
// ดึง color scheme
final colors = Theme.of(context).colorScheme;

// ใช้งาน
Container(
  color: colors.primary,           // สีหลัก
  child: Text('Hello', style: TextStyle(color: colors.onPrimary)),
)
```

**Typography:**
```dart
Text('Title', style: Theme.of(context).textTheme.headlineSmall)
Text('Body', style: Theme.of(context).textTheme.bodyMedium)
```

---

## iOS Setup

### ข้อกำหนด
- macOS + Xcode 15+
- Apple Developer Account (สำหรับ deploy จริง)
- Flutter SDK

### Permissions ที่ต้องเพิ่มใน `ios/Runner/Info.plist`

```xml
<!-- GPS -->
<key>NSLocationWhenInUseUsageDescription</key>
<string>ใช้สำหรับติดตามตำแหน่งรถบัสและผู้โดยสาร</string>

<key>NSLocationAlwaysAndWhenInUseUsageDescription</key>
<string>ใช้สำหรับอัปเดตตำแหน่งคนขับขณะปฏิบัติงาน</string>

<!-- Google Maps API Key -->
<key>GMSApiKey</key>
<string>YOUR_IOS_API_KEY</string>
```

### `ios/Runner/AppDelegate.swift`
```swift
import GoogleMaps

@UIApplicationMain
@objc class AppDelegate: FlutterAppDelegate {
  override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
  ) -> Bool {
    GMSServices.provideAPIKey("YOUR_IOS_API_KEY")
    GeneratedPluginRegistrant.register(with: self)
    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }
}
```

### Build & Archive (iOS)
```bash
flutter build ios --release          # build
# จากนั้น Archive ใน Xcode → Product → Archive → Distribute App
```

---

## Android Setup

### ข้อกำหนด
- Android Studio / SDK API 21+
- Google Play Developer Account (สำหรับ deploy)

### Permissions ใน `android/app/src/main/AndroidManifest.xml`

```xml
<uses-permission android:name="android.permission.INTERNET"/>
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION"/>
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION"/>
<!-- สำหรับ driver tracking background -->
<uses-permission android:name="android.permission.ACCESS_BACKGROUND_LOCATION"/>
```

### Google Maps API Key ใน `android/app/src/main/AndroidManifest.xml`

```xml
<application ...>
  <meta-data
    android:name="com.google.android.geo.API_KEY"
    android:value="YOUR_ANDROID_API_KEY"/>
</application>
```

### `android/app/build.gradle`
```gradle
android {
    defaultConfig {
        minSdkVersion 21       // ต้องไม่ต่ำกว่า 21
        targetSdkVersion 34
    }
}
```

### Build APK / AAB

```bash
flutter build apk --release          # APK สำหรับ test / sideload
flutter build appbundle --release    # AAB สำหรับอัปโหลด Play Store
```

---

## Useful Commands

```bash
# ติดตั้ง dependencies
flutter pub get

# รันบน simulator/emulator
flutter run

# รันบน device จริง (iOS/Android)
flutter run -d <device-id>

# ดู devices ที่เชื่อมต่อ
flutter devices

# วิเคราะห์ code
flutter analyze

# รัน tests
flutter test

# ตรวจสอบ environment
flutter doctor

# Clean build cache (แก้ปัญหา build)
flutter clean && flutter pub get
```

---

## Common Patterns ในโปรเจกต์นี้

### Loading State
```dart
if (provider.isLoading) return const Center(child: CircularProgressIndicator());
```

### Error Snackbar
```dart
ScaffoldMessenger.of(context).showSnackBar(
  SnackBar(content: Text(e.toString()), backgroundColor: Colors.red),
);
```

### Role-based Routing (ใน SplashScreen / AuthProvider)
```dart
switch (user.role) {
  case 'passenger': Navigator.pushReplacement(...PassengerHome());
  case 'driver':    Navigator.pushReplacement(...DriverHome());
  case 'admin':     Navigator.pushReplacement(...AdminInfoScreen());
}
```

### Polling (รีเฟรชข้อมูลทุก N วินาที)
```dart
Timer.periodic(const Duration(seconds: 5), (_) async {
  await provider.refresh();
});
// อย่าลืม cancel timer ใน dispose()
```

---

## การเพิ่มฟีเจอร์ใหม่ — Checklist

- [ ] เพิ่ม endpoint ใน `lib/config/api_config.dart`
- [ ] สร้าง/อัปเดต model ใน `lib/models/`
- [ ] เพิ่ม method ใน Service (`lib/services/`)
- [ ] อัปเดต Provider (`lib/providers/`) ถ้ามี UI state
- [ ] สร้าง/อัปเดต Screen (`lib/screens/`)
- [ ] ตรวจสอบ Permission (GPS, Camera ฯลฯ) บน iOS และ Android
- [ ] รัน `flutter analyze` ให้ผ่านก่อน commit
