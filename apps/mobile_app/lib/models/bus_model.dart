class BusModel {
  final String id;
  final String plateNumber;
  final String? routeId;
  final String? driverId;
  final String status;
  final double? currentLat;
  final double? currentLng;

  const BusModel({
    required this.id,
    required this.plateNumber,
    this.routeId,
    this.driverId,
    required this.status,
    this.currentLat,
    this.currentLng,
  });

  factory BusModel.fromJson(Map<String, dynamic> json) {
    return BusModel(
      id: json['id']?.toString() ?? '',
      plateNumber: json['plate_number']?.toString() ?? '',
      routeId: json['route_id']?.toString(),
      driverId: json['driver_id']?.toString(),
      status: json['status']?.toString() ?? 'off',
      currentLat: _toDouble(json['current_lat']),
      currentLng: _toDouble(json['current_lng']),
    );
  }

  static double? _toDouble(dynamic v) {
    if (v == null) return null;
    return double.tryParse(v.toString());
  }

  bool get isOnDuty => status == 'on';
  bool get hasLocation => currentLat != null && currentLng != null;
}
