import '../config/api_config.dart';
import '../models/bus_model.dart';
import 'api_service.dart';

class BusService {
  final ApiService _api;
  BusService(this._api);

  Future<List<BusModel>> getLiveBuses({String? routeId}) async {
    final data = await _api.get(ApiConfig.liveBuses(routeId: routeId));
    final list = _extractList(data);
    return list.map((e) => BusModel.fromJson(e)).toList();
  }

  List<Map<String, dynamic>> _extractList(dynamic data) {
    if (data is List) return data.cast();
    if (data is Map) {
      for (final k in ['data', 'buses', 'items']) {
        if (data[k] is List) return (data[k] as List).cast();
      }
    }
    return [];
  }
}
