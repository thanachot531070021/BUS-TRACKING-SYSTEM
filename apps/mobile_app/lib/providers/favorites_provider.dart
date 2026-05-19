import 'package:flutter/foundation.dart';
import '../models/route_model.dart';
import '../services/api_service.dart';

class FavoritesProvider extends ChangeNotifier {
  final Set<String> _favoriteIds = {};
  final List<RouteModel> _favoriteRoutes = [];
  bool _loading = false;
  bool _loaded = false;

  Set<String> get favoriteIds => _favoriteIds;
  List<RouteModel> get favoriteRoutes => _favoriteRoutes;
  bool get loading => _loading;

  bool isFavorite(String routeId) => _favoriteIds.contains(routeId);

  Future<void> load({bool force = false}) async {
    if (_loaded && !force) return;
    _loading = true;
    notifyListeners();
    try {
      final res = await apiService.get('/user/favorites');
      final list = res is Map ? (res['data'] as List? ?? []) : <dynamic>[];
      _favoriteIds.clear();
      _favoriteRoutes.clear();
      for (final item in list) {
        final routeId = item['route_id']?.toString();
        if (routeId != null) _favoriteIds.add(routeId);
        final routeJson = item['route'];
        if (routeJson is Map<String, dynamic>) {
          _favoriteRoutes.add(RouteModel.fromJson({
            ...routeJson,
            'id': routeJson['id'] ?? item['route_id'],
          }));
        }
      }
      _loaded = true;
    } catch (_) {
      // API not yet available — silently degrade, favorites stay empty
    } finally {
      _loading = false;
      notifyListeners();
    }
  }

  Future<void> toggle(String routeId) async {
    if (_favoriteIds.contains(routeId)) {
      await remove(routeId);
    } else {
      await add(routeId);
    }
  }

  Future<void> add(String routeId) async {
    _favoriteIds.add(routeId);
    notifyListeners();
    try {
      await apiService.post('/user/favorites', body: {'routeId': routeId});
    } catch (_) {
      _favoriteIds.remove(routeId);
      notifyListeners();
    }
  }

  Future<void> remove(String routeId) async {
    _favoriteIds.remove(routeId);
    _favoriteRoutes.removeWhere((r) => r.id == routeId);
    notifyListeners();
    try {
      await apiService.delete('/user/favorites/$routeId');
    } catch (_) {
      await load(force: true);
    }
  }
}
