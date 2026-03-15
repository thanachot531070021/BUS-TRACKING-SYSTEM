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
}
