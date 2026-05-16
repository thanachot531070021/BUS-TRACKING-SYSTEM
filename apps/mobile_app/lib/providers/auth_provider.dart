import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/user_model.dart';
import '../services/analytics_service.dart';
import '../services/api_service.dart';
import '../services/auth_service.dart';

class AuthProvider extends ChangeNotifier {
  static const _tokenKey = 'bus_tracking_token';

  final AuthService _authService;

  UserModel? _user;
  String? _token;
  bool _loading = false;
  String? _error;

  AuthProvider(this._authService);

  UserModel? get user => _user;
  String? get token => _token;
  bool get loading => _loading;
  String? get error => _error;
  bool get isLoggedIn => _token != null && _token!.isNotEmpty;

  // Restore token from storage on app start
  Future<void> restoreSession() async {
    final prefs = await SharedPreferences.getInstance();
    final saved = prefs.getString(_tokenKey);
    if (saved != null && saved.isNotEmpty) {
      _token = saved;
      apiService.setToken(saved);
      try {
        _user = await _authService.getMe();
        // Session ยังใช้ได้ — เช็คว่าวันนี้ track login แล้วหรือยัง
        // ถ้าข้ามวันมา (login ค้างไว้) จะยิง event อีกครั้ง
        analyticsService.logDailySession();
      } catch (_) {
        // Token expired or invalid — clear it
        await _clearSession(prefs);
      }
      notifyListeners();
    }
  }

  Future<String?> register({
    required String email,
    required String password,
    String? fullName,
    String? phoneNumber,
  }) async {
    _loading = true;
    _error = null;
    notifyListeners();

    try {
      final resp = await _authService.register(
        email: email,
        password: password,
        fullName: fullName,
        phoneNumber: phoneNumber,
      );
      if (resp.token.isNotEmpty) {
        _token = resp.token;
        _user = resp.user;
        apiService.setToken(_token);
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString(_tokenKey, _token!);
      }
      _loading = false;
      notifyListeners();
      return null; // success
    } on ApiException catch (e) {
      _error = e.message;
      _loading = false;
      notifyListeners();
      return e.message;
    } catch (_) {
      _error = 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้';
      _loading = false;
      notifyListeners();
      return 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้';
    }
  }

  // ─── Social Login (shared logic) ────────────────────────────────────────────

  Future<bool> _socialLogin(Future<AuthResponse> Function() fn) async {
    _loading = true;
    _error = null;
    notifyListeners();
    try {
      final resp = await fn();
      _token = resp.token;
      _user = resp.user;
      apiService.setToken(_token);
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_tokenKey, _token!);
      _loading = false;
      notifyListeners();
      return true;
    } on ApiException catch (e) {
      _error = e.message;
      _loading = false;
      notifyListeners();
      return false;
    } catch (_) {
      _error = 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้';
      _loading = false;
      notifyListeners();
      return false;
    }
  }

  Future<bool> loginWithGoogle() =>
      _socialLogin(_authService.loginWithGoogle);

  Future<bool> loginWithFacebook() =>
      _socialLogin(_authService.loginWithFacebook);

  Future<bool> login(String identifier, String password) async {
    _loading = true;
    _error = null;
    notifyListeners();

    try {
      final resp = await _authService.login(identifier, password);
      _token = resp.token;
      _user = resp.user;
      apiService.setToken(_token);

      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_tokenKey, _token!);

      analyticsService.logEvent('login', page: 'login_screen');

      _loading = false;
      notifyListeners();
      return true;
    } on ApiException catch (e) {
      _error = e.message;
      _loading = false;
      notifyListeners();
      return false;
    } catch (_) {
      _error = 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้';
      _loading = false;
      notifyListeners();
      return false;
    }
  }

  Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await _clearSession(prefs);
    notifyListeners();
  }

  Future<void> _clearSession(SharedPreferences prefs) async {
    _token = null;
    _user = null;
    apiService.setToken(null);
    await prefs.remove(_tokenKey);
  }
}
