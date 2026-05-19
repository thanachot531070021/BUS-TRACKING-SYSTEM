import 'package:flutter/foundation.dart';
import '../models/announcement_model.dart';
import '../services/api_service.dart';

class AnnouncementProvider extends ChangeNotifier {
  List<AnnouncementModel> _promos = [];
  List<AnnouncementModel> _news = [];
  bool _loading = false;
  bool _loaded = false;

  List<AnnouncementModel> get promos => _promos;
  List<AnnouncementModel> get news => _news;
  bool get loading => _loading;

  Future<void> load({bool force = false}) async {
    if (_loaded && !force) return;
    _loading = true;
    notifyListeners();
    try {
      final res = await apiService.get('/announcements');
      final items = AnnouncementModel.fromJsonList(
        res is Map ? (res['data'] ?? []) : res,
      );
      _promos = items.where((a) => a.isPromo).toList();
      _news   = items.where((a) => a.isNews).toList();
      _loaded = true;
    } catch (_) {
      // Fallback to static content when API isn't available
      if (!_loaded) {
        _promos = AnnouncementModel.fallbackPromos();
        _news   = AnnouncementModel.fallbackNews();
      }
    } finally {
      _loading = false;
      notifyListeners();
    }
  }
}
