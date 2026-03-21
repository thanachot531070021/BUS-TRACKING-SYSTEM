import '../config/api_config.dart';
import '../models/user_model.dart';
import 'api_service.dart';

class AuthService {
  final ApiService _api;
  AuthService(this._api);

  Future<AuthResponse> login(String identifier, String password) async {
    final data = await _api.post(ApiConfig.login, body: {
      'identifier': identifier,
      'password': password,
    });
    final resp = AuthResponse.fromJson(data as Map<String, dynamic>);
    if (resp.token.isEmpty) {
      throw const ApiException('ไม่ได้รับ token กรุณาตรวจสอบสิทธิ์');
    }
    return resp;
  }

  Future<UserModel> getMe() async {
    final data = await _api.get(ApiConfig.me);
    final json = data is Map<String, dynamic>
        ? (data['data'] ?? data['user'] ?? data)
        : data;
    return UserModel.fromJson(json as Map<String, dynamic>);
  }
}
