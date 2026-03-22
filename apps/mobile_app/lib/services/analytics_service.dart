import 'dart:io';
import 'package:shared_preferences/shared_preferences.dart';
import 'api_service.dart';

class AnalyticsService {
  final ApiService _api;

  static const _analyticsDay = 'analytics_day';

  AnalyticsService(this._api);

  /// Fire-and-forget: log a login event + mark today's date in SharedPrefs
  void logEvent(String eventType, {String page = ''}) {
    _logAsync(eventType, page);
  }

  /// เช็คว่าวันนี้ track ไปแล้วหรือยัง (จาก SharedPrefs)
  /// ถ้ายัง → ยิง login event แล้วบันทึกวันที่
  /// ใช้สำหรับ session ที่ค้างข้ามวัน ไม่ต้อง login ใหม่
  void logDailySession() {
    _checkAndLogDaily();
  }

  Future<void> _checkAndLogDaily() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final today = _todayString();
      final stored = prefs.getString(_analyticsDay);
      if (stored == today) return; // already tracked today — skip API call
      await _logAsync('login', 'session_resume');
    } catch (_) {
      // silent fail
    }
  }

  Future<void> _logAsync(String eventType, String page) async {
    try {
      final platform = Platform.isIOS
          ? 'iOS'
          : Platform.isAndroid
              ? 'Android'
              : Platform.isMacOS
                  ? 'macOS'
                  : Platform.isWindows
                      ? 'Windows'
                      : Platform.isLinux
                          ? 'Linux'
                          : 'Unknown';

      final deviceType =
          Platform.isIOS || Platform.isAndroid ? 'mobile' : 'desktop';

      await _api.post('/analytics/event', {
        'source': 'mobile_app',
        'eventType': eventType,
        'page': page,
        'platform': platform,
        'deviceType': deviceType,
      }, auth: false);

      // Mark today so we don't fire again this day
      if (eventType == 'login') {
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString(_analyticsDay, _todayString());
      }
    } catch (_) {
      // silent fail — analytics must never crash the app
    }
  }

  String _todayString() {
    final now = DateTime.now();
    return '${now.year}-${now.month.toString().padLeft(2, '0')}-${now.day.toString().padLeft(2, '0')}';
  }
}

/// Singleton instance
final analyticsService = AnalyticsService(apiService);
