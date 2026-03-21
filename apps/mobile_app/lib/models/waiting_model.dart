class WaitingModel {
  final String id;
  final String? userId;
  final String? routeId;
  final String status;
  final double? lat;
  final double? lng;
  final DateTime? createdAt;

  const WaitingModel({
    required this.id,
    this.userId,
    this.routeId,
    required this.status,
    this.lat,
    this.lng,
    this.createdAt,
  });

  factory WaitingModel.fromJson(Map<String, dynamic> json) {
    return WaitingModel(
      id: json['id']?.toString() ?? '',
      userId: json['user_id']?.toString(),
      routeId: json['route_id']?.toString(),
      status: json['status']?.toString() ?? 'waiting',
      lat: _toDouble(json['lat']),
      lng: _toDouble(json['lng']),
      createdAt: json['created_at'] != null
          ? DateTime.tryParse(json['created_at'].toString())
          : null,
    );
  }

  static double? _toDouble(dynamic v) {
    if (v == null) return null;
    return double.tryParse(v.toString());
  }

  bool get isWaiting => status == 'waiting';
  bool get isPickedUp => status == 'picked_up';
}
