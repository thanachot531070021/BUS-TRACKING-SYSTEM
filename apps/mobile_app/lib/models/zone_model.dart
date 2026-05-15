class ZoneModel {
  final String id;
  final String code;
  final String name;
  final String? description;
  final String? province;
  final String status;

  const ZoneModel({
    required this.id,
    required this.code,
    required this.name,
    this.description,
    this.province,
    required this.status,
  });

  factory ZoneModel.fromJson(Map<String, dynamic> json) {
    return ZoneModel(
      id: json['id']?.toString() ?? '',
      code: json['zone_code']?.toString() ?? '',
      name: json['zone_name']?.toString() ?? '',
      description: json['description']?.toString(),
      province: json['province']?.toString(),
      status: json['status']?.toString() ?? 'inactive',
    );
  }

  bool get isActive => status == 'active';
}
