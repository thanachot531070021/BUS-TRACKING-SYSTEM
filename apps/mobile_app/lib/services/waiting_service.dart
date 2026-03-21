import '../config/api_config.dart';
import '../models/waiting_model.dart';
import 'api_service.dart';

class WaitingService {
  final ApiService _api;
  WaitingService(this._api);

  Future<List<WaitingModel>> getWaiting({String? routeId}) async {
    final data = await _api.get(ApiConfig.waitingByRoute(routeId ?? ''));
    final list = _extractList(data);
    return list.map((e) => WaitingModel.fromJson(e)).toList();
  }

  Future<WaitingModel> createWaiting({
    required String routeId,
    double? lat,
    double? lng,
  }) async {
    final data = await _api.post(ApiConfig.waiting, body: {
      'routeId': routeId,
      if (lat != null) 'lat': lat,
      if (lng != null) 'lng': lng,
    });
    final json = data is Map ? (data['data'] ?? data) : data;
    return WaitingModel.fromJson(json as Map<String, dynamic>);
  }

  Future<void> cancelWaiting(String waitingId) async {
    await _api.delete(ApiConfig.waitingById(waitingId));
  }

  // Driver: get waiting passengers for a route
  Future<List<WaitingModel>> getDriverWaiting({String? routeId}) async {
    final data = await _api.get(ApiConfig.driverWaiting(routeId: routeId));
    final list = _extractList(data);
    return list.map((e) => WaitingModel.fromJson(e)).toList();
  }

  // Driver: mark passenger as picked up
  Future<void> markPickup(String waitingId) async {
    await _api.post(ApiConfig.driverPickup(waitingId));
  }

  List<Map<String, dynamic>> _extractList(dynamic data) {
    if (data is List) return data.cast();
    if (data is Map) {
      for (final k in ['data', 'waiting', 'items']) {
        if (data[k] is List) return (data[k] as List).cast();
      }
    }
    return [];
  }
}
