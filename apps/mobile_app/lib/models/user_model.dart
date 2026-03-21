class UserModel {
  final String id;
  final String? username;
  final String? fullName;
  final String? email;
  final String role;
  final String? status;

  const UserModel({
    required this.id,
    this.username,
    this.fullName,
    this.email,
    required this.role,
    this.status,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id']?.toString() ?? '',
      username: json['username']?.toString(),
      fullName: json['full_name']?.toString(),
      email: json['email']?.toString(),
      role: json['role']?.toString() ?? 'passenger',
      status: json['status']?.toString(),
    );
  }

  bool get isDriver => role == 'driver';
  bool get isAdmin => role == 'admin' || role == 'super_admin';
  bool get isPassenger => role == 'passenger';

  String get displayName =>
      fullName ?? username ?? email ?? 'User';
}

class AuthResponse {
  final String token;
  final UserModel user;

  const AuthResponse({required this.token, required this.user});

  factory AuthResponse.fromJson(Map<String, dynamic> json) {
    // Handle various response shapes from API
    final data = json['data'] ?? json;
    final token = data['token']?.toString() ??
        data['accessToken']?.toString() ??
        data['access_token']?.toString() ??
        '';

    final userJson = data['user'] ?? data['profile'] ?? data;
    return AuthResponse(
      token: token,
      user: UserModel.fromJson(userJson is Map<String, dynamic>
          ? userJson
          : <String, dynamic>{}),
    );
  }
}
