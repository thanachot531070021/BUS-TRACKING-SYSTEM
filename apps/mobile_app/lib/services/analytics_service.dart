import 'dart:io';
import 'api_service.dart';

class AnalyticsService {
  final ApiService _api;

  AnalyticsService(this._api);

  /// Fire-and-forget: log an event — never throws, never blocks UI
  void logEvent(String eventType, {String page = ''}) {
    _logAsync(eventType, page);
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
    } catch (_) {
      // silent fail — analytics must never crash the app
    }
  }
}

/// Singleton instance
final analyticsService = AnalyticsService(apiService);
