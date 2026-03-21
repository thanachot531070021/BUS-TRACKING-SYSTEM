import 'dart:async';
import 'package:flutter/foundation.dart';
import '../models/user_model.dart';
import '../models/waiting_model.dart';
import '../services/api_service.dart';
import '../services/location_service.dart';
import '../services/waiting_service.dart';
import '../config/api_config.dart';

class DriverProvider extends ChangeNotifier {
  final ApiService _api;
  final LocationService _locationService;
  final WaitingService _waitingService;

  DriverProvider(this._api, this._locationService, this._waitingService);

  UserModel? _driverUser;
  Map<String, dynamic>? _driverProfile;
  bool _onDuty = false;
  bool _loading = false;
  String? _error;
  List<WaitingModel> _waitingPassengers = [];
  Timer? _gpsTimer;

  UserModel? get driverUser => _driverUser;
  Map<String, dynamic>? get driverProfile => _driverProfile;
  bool get onDuty => _onDuty;
  bool get loading => _loading;
  String? get error => _error;
  List<WaitingModel> get waitingPassengers => _waitingPassengers;
  String? get assignedRouteId => _driverProfile?['assigned_route_id']?.toString();
  String? get assignedBusId => _driverProfile?['assigned_bus_id']?.toString();
  String? get employeeCode => _driverProfile?['employee_code']?.toString();

  Future<void> loadProfile() async {
    _loading = true;
    _error = null;
    notifyListeners();
    try {
      final data = await _api.get(ApiConfig.driverMe);
      final json = data is Map ? (data['data'] ?? data) : data;
      _driverProfile = json as Map<String, dynamic>;
      _onDuty = _driverProfile?['status'] == 'on_duty';
    } catch (e) {
      _error = e.toString();
    }
    _loading = false;
    notifyListeners();
  }

  Future<bool> toggleDuty() async {
    try {
      final data = await _api.post(ApiConfig.driverDuty);
      final json = data is Map ? (data['data'] ?? data) : data;
      if (json is Map) {
        _onDuty = json['status'] == 'on_duty' || json['onDuty'] == true;
      } else {
        _onDuty = !_onDuty;
      }
      if (_onDuty) {
        _startGps();
      } else {
        _stopGps();
      }
      notifyListeners();
      return true;
    } catch (_) {
      return false;
    }
  }

  void _startGps() {
    _gpsTimer?.cancel();
    _gpsTimer = Timer.periodic(const Duration(seconds: 5), (_) async {
      final busId = assignedBusId;
      if (busId == null) return;
      final pos = await _locationService.getCurrentLocation();
      if (pos != null) {
        await _locationService.sendLocation(
            busId: busId, lat: pos.latitude, lng: pos.longitude);
      }
    });
  }

  void _stopGps() {
    _gpsTimer?.cancel();
    _gpsTimer = null;
  }

  Future<void> loadWaitingPassengers() async {
    try {
      _waitingPassengers =
          await _waitingService.getDriverWaiting(routeId: assignedRouteId);
      notifyListeners();
    } catch (_) {}
  }

  Future<bool> markPickup(String waitingId) async {
    try {
      await _waitingService.markPickup(waitingId);
      _waitingPassengers.removeWhere((w) => w.id == waitingId);
      notifyListeners();
      return true;
    } catch (_) {
      return false;
    }
  }

  @override
  void dispose() {
    _stopGps();
    super.dispose();
  }
}
