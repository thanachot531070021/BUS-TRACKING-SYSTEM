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
  });

  factory RouteModel.fromJson(Map<String, dynamic> json) {
    // Backend returns nested zone object: { id, zone_code, zone_name }
    final zoneMap = json['zone'];
    final zoneNameVal = zoneMap is Map
        ? zoneMap['zone_name']?.toString()
        : null;
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
    );
  }

  bool get isActive => status == 'active';
  bool get hasPolyline =>
      routePolyline != null && routePolyline!.isNotEmpty;
}
