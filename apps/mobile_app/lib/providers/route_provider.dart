import 'package:flutter/foundation.dart';
import '../models/route_model.dart';
import '../models/bus_model.dart';
import '../models/waiting_model.dart';
import '../services/bus_service.dart';
import '../services/route_service.dart';
import '../services/waiting_service.dart';

class RouteProvider extends ChangeNotifier {
  final RouteService _routeService;
  final BusService _busService;
  final WaitingService _waitingService;

  RouteProvider(this._routeService, this._busService, this._waitingService);

  List<RouteModel> _routes = [];
  List<BusModel> _liveBuses = [];
  WaitingModel? _myWaiting;
  bool _loading = false;
  bool _busLoading = false;
  String? _error;

  List<RouteModel> get routes => _routes;
  List<BusModel> get liveBuses => _liveBuses;
  WaitingModel? get myWaiting => _myWaiting;
  bool get loading => _loading;
  bool get busLoading => _busLoading;
  String? get error => _error;
  bool get isWaiting => _myWaiting != null && _myWaiting!.isWaiting;

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
}
