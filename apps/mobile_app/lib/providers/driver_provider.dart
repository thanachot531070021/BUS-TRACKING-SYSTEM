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
  String? _assignedRouteName;
  List<WaitingModel> _waitingPassengers = [];
  Timer? _gpsTimer;
  Timer? _waitingPollingTimer;
  DateTime? _dutyStartedAt;
  DateTime? _dutyEndedAt;

  UserModel? get driverUser => _driverUser;
  Map<String, dynamic>? get driverProfile => _driverProfile;
  bool get onDuty => _onDuty;
  bool get loading => _loading;
  String? get error => _error;
  List<WaitingModel> get waitingPassengers => _waitingPassengers;
  DateTime? get dutyStartedAt => _dutyStartedAt;
  DateTime? get dutyEndedAt => _dutyEndedAt;

  // Bus UUID — try drivers.assigned_bus_id first, fall back to assigned_bus.id
  // (admin may have set buses.driver_id without setting drivers.assigned_bus_id)
  String? get assignedBusId {
    final direct = _driverProfile?['assigned_bus_id']?.toString();
    if (direct != null && direct.isNotEmpty) return direct;
    final bus = _driverProfile?['assigned_bus'];
    if (bus is Map) return bus['id']?.toString();
    return null;
  }

  // Plate number from the nested assigned_bus object
  String? get assignedBusPlate {
    final bus = _driverProfile?['assigned_bus'];
    if (bus is Map) return bus['plate_number']?.toString();
    return null;
  }

  String? get assignedRouteId => _driverProfile?['assigned_route_id']?.toString();
  String? get assignedRouteName => _assignedRouteName;
  String? get employeeCode => _driverProfile?['employee_code']?.toString();

  Future<void> loadProfile() async {
    _loading = true;
    _error = null;
    notifyListeners();
    try {
      final data = await _api.get(ApiConfig.driverMe);
      final json = data is Map ? (data['data'] ?? data) : data;
      _driverProfile = json as Map<String, dynamic>;

      // Duty status = assigned bus status ('on' means on duty)
      final assignedBus = _driverProfile?['assigned_bus'];
      _onDuty = assignedBus is Map && assignedBus['status'] == 'on';

      // Fetch route name separately (profile only returns route UUID)
      await _loadRouteName();
    } catch (e) {
      _error = e.toString();
    }
    _loading = false;
    notifyListeners();
  }

  Future<void> _loadRouteName() async {
    final routeId = assignedRouteId;
    if (routeId == null) return;
    try {
      final data = await _api.get(ApiConfig.routeById(routeId));
      final json = data is Map ? (data['data'] ?? data) : data;
      if (json is Map) {
        _assignedRouteName = json['route_name']?.toString();
      }
    } catch (_) {}
  }

  Future<bool> toggleDuty() async {
    final busId = assignedBusId;
    if (busId == null) return false;

    try {
      final newStatus = _onDuty ? 'off' : 'on';
      final data = await _api.post(ApiConfig.driverDuty, body: {
        'busId': busId,
        'status': newStatus,
      });
      final json = data is Map ? (data['data'] ?? data) : data;
      if (json is Map) {
        _onDuty = json['status'] == 'on';
      } else {
        _onDuty = !_onDuty;
      }
      if (_onDuty) {
        _dutyStartedAt = DateTime.now();
        _dutyEndedAt = null;
        _startGps();
        _startWaitingPolling();
      } else {
        _dutyEndedAt = DateTime.now();
        _stopGps();
        _stopWaitingPolling();
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

  // Poll waiting passengers every 30 seconds while on duty
  void _startWaitingPolling() {
    _waitingPollingTimer?.cancel();
    _waitingPollingTimer = Timer.periodic(const Duration(seconds: 30), (_) {
      loadWaitingPassengers();
    });
  }

  void _stopWaitingPolling() {
    _waitingPollingTimer?.cancel();
    _waitingPollingTimer = null;
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
    _stopWaitingPolling();
    super.dispose();
  }
}
