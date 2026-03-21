class RouteModel {
  final String id;
  final String code;
  final String name;
  final String startLocation;
  final String endLocation;
  final String status;

  const RouteModel({
    required this.id,
    required this.code,
    required this.name,
    required this.startLocation,
    required this.endLocation,
    required this.status,
  });

  factory RouteModel.fromJson(Map<String, dynamic> json) {
    return RouteModel(
      id: json['id']?.toString() ?? '',
      code: json['route_code']?.toString() ?? '',
      name: json['route_name']?.toString() ?? '',
      startLocation: json['start_location']?.toString() ?? '',
      endLocation: json['end_location']?.toString() ?? '',
      status: json['status']?.toString() ?? 'inactive',
    );
  }

  bool get isActive => status == 'active';
}
