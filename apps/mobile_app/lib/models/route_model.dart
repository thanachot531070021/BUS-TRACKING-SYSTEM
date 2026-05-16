import 'dart:convert';
import 'package:google_maps_flutter/google_maps_flutter.dart';

class RouteModel {
  final String id;
  final String code;
  final String name;
  final String startLocation;
  final String endLocation;
  final String status;
  final String? zoneId;
  final String? zoneName;
  final String? routePolyline;
  final String? startCoords;
  final String? endCoords;
  final String? waypoints; // JSON: [{"lat":x,"lng":y},...]

  const RouteModel({
    required this.id,
    required this.code,
    required this.name,
    required this.startLocation,
    required this.endLocation,
    required this.status,
    this.zoneId,
    this.zoneName,
    this.routePolyline,
    this.startCoords,
    this.endCoords,
    this.waypoints,
  });

  factory RouteModel.fromJson(Map<String, dynamic> json) {
    final zoneMap = json['zone'];
    final zoneNameVal = zoneMap is Map ? zoneMap['zone_name']?.toString() : null;
    final zoneIdVal = zoneMap is Map
        ? zoneMap['id']?.toString()
        : json['zone_id']?.toString();

    return RouteModel(
      id: json['id']?.toString() ?? '',
      code: json['route_code']?.toString() ?? '',
      name: json['route_name']?.toString() ?? '',
      startLocation: json['start_location']?.toString() ?? '',
      endLocation: json['end_location']?.toString() ?? '',
      status: json['status']?.toString() ?? 'inactive',
      zoneId: zoneIdVal,
      zoneName: zoneNameVal,
      routePolyline: json['route_polyline']?.toString(),
      startCoords: json['start_coords']?.toString(),
      endCoords: json['end_coords']?.toString(),
      waypoints: json['waypoints']?.toString(),
    );
  }

  bool get isActive => status == 'active';
  bool get hasPolyline => routePolyline != null && routePolyline!.isNotEmpty;

  bool get hasWaypoints {
    if (waypoints == null || waypoints!.isEmpty) return false;
    try {
      final pts = jsonDecode(waypoints!) as List;
      return pts.length >= 2;
    } catch (_) {
      return false;
    }
  }

  // Parse waypoints JSON → list of LatLng (priority over encoded polyline)
  List<LatLng>? get waypointLatLngs {
    if (waypoints == null || waypoints!.isEmpty) return null;
    try {
      final list = jsonDecode(waypoints!) as List;
      final pts = list.map((e) {
        final lat = (e['lat'] as num?)?.toDouble();
        final lng = (e['lng'] as num?)?.toDouble();
        if (lat == null || lng == null) return null;
        return LatLng(lat, lng);
      }).whereType<LatLng>().toList();
      return pts.length >= 2 ? pts : null;
    } catch (_) {
      return null;
    }
  }

  // Decode Google encoded polyline → list of LatLng
  static List<LatLng> decodePolyline(String encoded) {
    final pts = <LatLng>[];
    int idx = 0, lat = 0, lng = 0;
    while (idx < encoded.length) {
      int shift = 0, r = 0, b;
      do { b = encoded.codeUnitAt(idx++) - 63; r |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
      lat += (r & 1) != 0 ? ~(r >> 1) : (r >> 1);
      shift = 0; r = 0;
      do { b = encoded.codeUnitAt(idx++) - 63; r |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
      lng += (r & 1) != 0 ? ~(r >> 1) : (r >> 1);
      pts.add(LatLng(lat / 1e5, lng / 1e5));
    }
    return pts;
  }

  // Parse "lat,lng" → LatLng
  LatLng? get startLatLng => _parseCoords(startCoords);
  LatLng? get endLatLng => _parseCoords(endCoords);

  static LatLng? _parseCoords(String? coords) {
    if (coords == null || coords.isEmpty) return null;
    final parts = coords.split(',');
    if (parts.length < 2) return null;
    final lat = double.tryParse(parts[0].trim());
    final lng = double.tryParse(parts[1].trim());
    if (lat == null || lng == null) return null;
    return LatLng(lat, lng);
  }
}
