import 'dart:async';
import 'package:flutter/foundation.dart';
import '../config/api_config.dart';
import '../models/bus_model.dart';
import '../models/route_model.dart';
import '../models/waiting_model.dart';
import '../models/zone_model.dart';
import '../services/api_service.dart';
import '../services/bus_service.dart';
import '../services/route_service.dart';
import '../services/waiting_service.dart';

class RouteProvider extends ChangeNotifier {
  final RouteService _routeService;
  final BusService _busService;
  final WaitingService _waitingService;

  RouteProvider(this._routeService, this._busService, this._waitingService);

  // --- Route list (PassengerHome) ---
  List<RouteModel> _routes = [];
  bool _loading = false;
  String? _error;

  // --- Live buses (RouteDetail) ---
  List<BusModel> _liveBuses = [];
  bool _busLoading = false;
  Timer? _busPollingTimer;

  // --- Waiting ---
  WaitingModel? _myWaiting;

  // --- Zones ---
  List<ZoneModel> _zones = [];
  bool _zonesLoading = false;
  String? _zonesError;

  // --- Zone map: all live buses across all routes ---
  List<BusModel> _allLiveBuses = [];
  bool _allBusLoading = false;
  Timer? _zoneBusPollingTimer;

  // Getters
  List<RouteModel> get routes => _routes;
  bool get loading => _loading;
  String? get error => _error;

  List<BusModel> get liveBuses => _liveBuses;
  bool get busLoading => _busLoading;

  WaitingModel? get myWaiting => _myWaiting;
  bool get isWaiting => _myWaiting != null && _myWaiting!.isWaiting;

  List<ZoneModel> get zones => _zones;
  bool get zonesLoading => _zonesLoading;
  String? get zonesError => _zonesError;

  List<BusModel> get allLiveBuses => _allLiveBuses;
  bool get allBusLoading => _allBusLoading;

  // ── Route list ──────────────────────────────────────────────────────────────

  Future<void> loadRoutes() async {
    _loading = true;
    _error = null;
    notifyListeners();
    try {
      _routes = await _routeService.getRoutes();
    } catch (e) {
      _error = e.toString();
    }
    _loading = false;
    notifyListeners();
  }

  // ── Live buses for a single route (RouteDetail) ─────────────────────────────

  Future<void> loadLiveBuses(String routeId) async {
    _busLoading = true;
    notifyListeners();
    try {
      _liveBuses = await _busService.getLiveBuses(routeId: routeId);
    } catch (_) {
      _liveBuses = [];
    }
    _busLoading = false;
    notifyListeners();
  }

  void startBusPolling(String routeId) {
    _busPollingTimer?.cancel();
    _busPollingTimer = Timer.periodic(const Duration(seconds: 5), (_) {
      loadLiveBuses(routeId);
    });
  }

  void stopBusPolling() {
    _busPollingTimer?.cancel();
    _busPollingTimer = null;
  }

  // ── Zones ────────────────────────────────────────────────────────────────────

  Future<void> loadZones() async {
    _zonesLoading = true;
    _zonesError = null;
    notifyListeners();
    try {
      final res = await apiService.get(ApiConfig.zones);
      final list = res['data'] as List? ?? [];
      _zones = list.map((j) => ZoneModel.fromJson(j as Map<String, dynamic>)).toList();
      _zones.sort((a, b) => a.name.compareTo(b.name));
    } catch (e) {
      _zonesError = e.toString();
    }
    _zonesLoading = false;
    notifyListeners();
  }

  // ── All live buses (Zone Map) ─────────────────────────────────────────────────

  Future<void> loadAllLiveBuses() async {
    _allBusLoading = true;
    notifyListeners();
    try {
      _allLiveBuses = await _busService.getLiveBuses();
    } catch (_) {
      _allLiveBuses = [];
    }
    _allBusLoading = false;
    notifyListeners();
  }

  void startZoneBusPolling() {
    _zoneBusPollingTimer?.cancel();
    _zoneBusPollingTimer = Timer.periodic(const Duration(seconds: 5), (_) {
      loadAllLiveBuses();
    });
  }

  void stopZoneBusPolling() {
    _zoneBusPollingTimer?.cancel();
    _zoneBusPollingTimer = null;
  }

  /// Returns buses whose routeId belongs to routes in [zoneId].
  List<BusModel> busesInZone(String zoneId) {
    final zoneRouteIds = _routes
        .where((r) => r.zoneId == zoneId)
        .map((r) => r.id)
        .toSet();
    return _allLiveBuses
        .where((b) => b.routeId != null && zoneRouteIds.contains(b.routeId))
        .toList();
  }

  /// Returns routes that belong to [zoneId].
  List<RouteModel> routesInZone(String zoneId) =>
      _routes.where((r) => r.zoneId == zoneId).toList();

  // ── Waiting ───────────────────────────────────────────────────────────────────

  Future<bool> createWaiting(String routeId, {double? lat, double? lng}) async {
    try {
      _myWaiting = await _waitingService.createWaiting(
          routeId: routeId, lat: lat, lng: lng);
      notifyListeners();
      return true;
    } catch (_) {
      return false;
    }
  }

  Future<bool> cancelWaiting() async {
    if (_myWaiting == null) return false;
    try {
      await _waitingService.cancelWaiting(_myWaiting!.id);
      _myWaiting = null;
      notifyListeners();
      return true;
    } catch (_) {
      return false;
    }
  }

  void clearWaiting() {
    _myWaiting = null;
    notifyListeners();
  }

  @override
  void dispose() {
    stopBusPolling();
    stopZoneBusPolling();
    super.dispose();
  }
}
