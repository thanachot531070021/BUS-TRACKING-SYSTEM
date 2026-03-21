import '../config/api_config.dart';
import '../models/route_model.dart';
import 'api_service.dart';

class RouteService {
  final ApiService _api;
  RouteService(this._api);

  Future<List<RouteModel>> getRoutes() async {
    final data = await _api.get(ApiConfig.routes);
    final list = _extractList(data);
    return list.map((e) => RouteModel.fromJson(e)).toList();
  }

  Future<RouteModel> getRoute(String id) async {
    final data = await _api.get(ApiConfig.routeById(id));
    final json = data is Map ? (data['data'] ?? data) : data;
    return RouteModel.fromJson(json as Map<String, dynamic>);
  }

  List<Map<String, dynamic>> _extractList(dynamic data) {
    if (data is List) return data.cast();
    if (data is Map) {
      for (final k in ['data', 'routes', 'items']) {
        if (data[k] is List) return (data[k] as List).cast();
      }
    }
    return [];
  }
}
