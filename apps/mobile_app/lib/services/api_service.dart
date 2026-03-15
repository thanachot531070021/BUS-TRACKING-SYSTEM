class ApiService {
  final String baseUrl;

  const ApiService({required this.baseUrl});

  String endpoint(String path) => '$baseUrl$path';
}
