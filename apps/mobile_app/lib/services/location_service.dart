import 'package:geolocator/geolocator.dart';
import '../config/api_config.dart';
import 'api_service.dart';

class LocationService {
  final ApiService _api;
  LocationService(this._api);

  Future<Position?> getCurrentLocation() async {
    bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) return null;

    LocationPermission permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied) return null;
    }
    if (permission == LocationPermission.deniedForever) return null;

    return await Geolocator.getCurrentPosition(
      desiredAccuracy: LocationAccuracy.high,
    );
  }

  Future<void> sendLocation({
    required String busId,
    required double lat,
    required double lng,
  }) async {
    await _api.post(ApiConfig.locations, body: {
      'busId': busId,
      'lat': lat,
      'lng': lng,
    });
  }
}
