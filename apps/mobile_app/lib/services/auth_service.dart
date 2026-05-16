import 'package:google_sign_in/google_sign_in.dart';
import 'package:flutter_facebook_auth/flutter_facebook_auth.dart';
import '../config/api_config.dart';
import '../models/user_model.dart';
import 'api_service.dart';

class AuthService {
  final ApiService _api;
  AuthService(this._api);

  // ─── Email / Password ───────────────────────────────────────────────────────

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

  Future<AuthResponse> register({
    required String email,
    required String password,
    String? fullName,
    String? phoneNumber,
  }) async {
    final body = <String, dynamic>{
      'email': email,
      'password': password,
      'role': 'passenger',
    };
    if (fullName != null && fullName.isNotEmpty) body['fullName'] = fullName;
    if (phoneNumber != null && phoneNumber.isNotEmpty) {
      body['phoneNumber'] = phoneNumber;
    }

    final data = await _api.post(ApiConfig.register, body: body);
    final map = data as Map<String, dynamic>;
    final inner =
        map['data'] is Map ? map['data'] as Map<String, dynamic> : map;
    final session = inner['session'] is Map
        ? (inner['session'] as Map).cast<String, dynamic>()
        : <String, dynamic>{};
    final userJson = inner['user'] is Map
        ? (inner['user'] as Map).cast<String, dynamic>()
        : <String, dynamic>{};
    final token = session['access_token']?.toString() ??
        inner['token']?.toString() ??
        inner['access_token']?.toString() ??
        '';
    return AuthResponse(token: token, user: UserModel.fromJson(userJson));
  }

  // ─── Google Sign In ─────────────────────────────────────────────────────────

  Future<AuthResponse> loginWithGoogle() async {
    final googleSignIn = GoogleSignIn(scopes: ['email', 'profile']);

    // Sign out first to force account picker every time
    await googleSignIn.signOut();
    final account = await googleSignIn.signIn();
    if (account == null) throw const ApiException('ยกเลิกการเข้าสู่ระบบ');

    final auth = await account.authentication;
    final idToken = auth.idToken;
    if (idToken == null) {
      throw const ApiException('ไม่สามารถรับ Google token ได้');
    }

    final data = await _api.post(ApiConfig.googleLogin, body: {
      'googleIdToken': idToken,
      'email': account.email,
      'fullName': account.displayName,
      'avatarUrl': account.photoUrl,
    });

    return _parseSocialResponse(data);
  }

  // ─── Facebook Login ─────────────────────────────────────────────────────────

  Future<AuthResponse> loginWithFacebook() async {
    // Log out first to force account picker
    await FacebookAuth.instance.logOut();
    final result = await FacebookAuth.instance.login(
      permissions: ['email', 'public_profile'],
    );

    if (result.status != LoginStatus.success) {
      final msg = result.status == LoginStatus.cancelled
          ? 'ยกเลิกการเข้าสู่ระบบ'
          : result.message ?? 'Facebook login ล้มเหลว';
      throw ApiException(msg);
    }

    final accessToken = result.accessToken?.tokenString;
    if (accessToken == null) {
      throw const ApiException('ไม่สามารถรับ Facebook token ได้');
    }

    final data = await _api.post(ApiConfig.facebookLogin, body: {
      'accessToken': accessToken,
    });

    return _parseSocialResponse(data);
  }

  // ─── Helpers ────────────────────────────────────────────────────────────────

  AuthResponse _parseSocialResponse(dynamic data) {
    final map = data as Map<String, dynamic>;
    final inner =
        map['data'] is Map ? map['data'] as Map<String, dynamic> : map;
    final token = inner['token']?.toString() ??
        inner['access_token']?.toString() ??
        (inner['session'] is Map
            ? (inner['session'] as Map)['access_token']?.toString()
            : null) ??
        '';
    final userJson = inner['user'] is Map
        ? (inner['user'] as Map).cast<String, dynamic>()
        : (inner['profile'] is Map
            ? (inner['profile'] as Map).cast<String, dynamic>()
            : <String, dynamic>{});
    if (token.isEmpty) throw const ApiException('ไม่ได้รับ token จาก server');
    return AuthResponse(token: token, user: UserModel.fromJson(userJson));
  }

  Future<UserModel> getMe() async {
    final data = await _api.get(ApiConfig.me);
    final json = data is Map<String, dynamic>
        ? (data['data'] ?? data['user'] ?? data)
        : data;
    return UserModel.fromJson(json as Map<String, dynamic>);
  }
}
