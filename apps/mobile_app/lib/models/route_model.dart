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
    );
  }

  bool get isActive => status == 'active';
  bool get hasPolyline => routePolyline != null && routePolyline!.isNotEmpty;

  // Parse "lat,lng" → LatLng, returns null if invalid
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
