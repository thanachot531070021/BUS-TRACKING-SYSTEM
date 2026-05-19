import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../widgets/social_login_widgets.dart';
import '../passenger/passenger_main.dart';
import '../driver/driver_home.dart';
import '../admin_info_screen.dart';
import 'register_screen.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _identifierCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();
  bool _obscure = true;

  @override
  void dispose() {
    _identifierCtrl.dispose();
    _passwordCtrl.dispose();
    super.dispose();
  }

  Future<void> _socialLogin(Future<bool> Function() fn) async {
    final ok = await fn();
    if (!mounted || !ok) return;
    final auth = context.read<AuthProvider>();
    _navigateByRole(auth.user?.role ?? 'passenger');
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    final auth = context.read<AuthProvider>();
    final ok = await auth.login(
      _identifierCtrl.text.trim(),
      _passwordCtrl.text,
    );
    if (!mounted || !ok) return;
    _navigateByRole(auth.user?.role ?? 'passenger');
  }

  void _navigateByRole(String role) {
    final Widget dest;
    if (role == 'driver') {
      dest = const DriverHome();
    } else if (role == 'admin' || role == 'super_admin') {
      dest = const AdminInfoScreen();
    } else {
      dest = const PassengerMainScreen();
    }
    Navigator.of(context)
        .pushReplacement(MaterialPageRoute(builder: (_) => dest));
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();

    return Scaffold(
      backgroundColor: const Color(0xFFF6F7FB),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(24, 32, 24, 24),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Logo
                Container(
                  width: 72,
                  height: 72,
                  decoration: BoxDecoration(
                    color: const Color(0xFFE6EFFF),
                    borderRadius: BorderRadius.circular(22),
                  ),
                  child: const Icon(
                    Icons.directions_bus,
                    size: 40,
                    color: Color(0xFF2563EB),
                  ),
                ),
                const SizedBox(height: 22),

                // Title
                const Text(
                  'ยินดีต้อนรับ',
                  style: TextStyle(
                    fontSize: 32,
                    fontWeight: FontWeight.w800,
                    color: Color(0xFF0F172A),
                    letterSpacing: -0.5,
                    height: 1.1,
                  ),
                ),
                const SizedBox(height: 8),
                const Text(
                  'เข้าสู่ระบบเพื่อใช้งาน Bus Tracking',
                  style: TextStyle(
                    fontSize: 17,
                    color: Color(0xFF6B7891),
                  ),
                ),
                const SizedBox(height: 28),

                // Error banner
                if (auth.error != null)
                  Container(
                    margin: const EdgeInsets.only(bottom: 18),
                    padding: const EdgeInsets.symmetric(
                        horizontal: 16, vertical: 12),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFEF2F2),
                      border: Border.all(color: const Color(0xFFFCA5A5)),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.warning_amber_rounded,
                            color: Color(0xFFDC2626), size: 18),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            auth.error!,
                            style: const TextStyle(
                                color: Color(0xFFDC2626), fontSize: 13),
                          ),
                        ),
                      ],
                    ),
                  ),

                // Username field
                _Label('เบอร์โทร หรือ Username'),
                const SizedBox(height: 8),
                TextFormField(
                  controller: _identifierCtrl,
                  decoration: _inputDeco(
                    hint: '0812345678',
                    icon: Icons.person_outline,
                  ),
                  style: const TextStyle(fontSize: 18, color: Color(0xFF1E2A3A)),
                  validator: (v) =>
                      (v == null || v.trim().isEmpty) ? 'กรุณากรอกชื่อผู้ใช้' : null,
                  textInputAction: TextInputAction.next,
                ),
                const SizedBox(height: 18),

                // Password field
                _Label('รหัสผ่าน'),
                const SizedBox(height: 8),
                TextFormField(
                  controller: _passwordCtrl,
                  obscureText: _obscure,
                  decoration: _inputDeco(
                    hint: '••••••••',
                    icon: Icons.lock_outline,
                    suffix: IconButton(
                      icon: Icon(
                        _obscure ? Icons.visibility_off : Icons.visibility,
                        size: 20,
                        color: const Color(0xFF98A2B3),
                      ),
                      onPressed: () => setState(() => _obscure = !_obscure),
                    ),
                  ),
                  style: const TextStyle(fontSize: 18, color: Color(0xFF1E2A3A)),
                  validator: (v) =>
                      (v == null || v.isEmpty) ? 'กรุณากรอกรหัสผ่าน' : null,
                  onFieldSubmitted: (_) => _submit(),
                ),
                const SizedBox(height: 8),

                // Forgot password
                Align(
                  alignment: Alignment.centerRight,
                  child: TextButton(
                    onPressed: () {},
                    style: TextButton.styleFrom(
                      foregroundColor: const Color(0xFF2563EB),
                      padding: EdgeInsets.zero,
                      minimumSize: const Size(0, 36),
                    ),
                    child: const Text(
                      'ลืมรหัสผ่าน?',
                      style:
                          TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
                    ),
                  ),
                ),
                const SizedBox(height: 8),

                // Login button
                SizedBox(
                  height: 56,
                  child: ElevatedButton.icon(
                    onPressed: auth.loading ? null : _submit,
                    icon: auth.loading
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(
                              strokeWidth: 2.5,
                              valueColor:
                                  AlwaysStoppedAnimation<Color>(Colors.white),
                            ),
                          )
                        : const SizedBox.shrink(),
                    label: Text(
                      auth.loading ? '' : 'เข้าสู่ระบบ',
                      style: const TextStyle(
                          fontSize: 17, fontWeight: FontWeight.w700),
                    ),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF3B82F6),
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16),
                      ),
                      elevation: 0,
                    ),
                  ),
                ),
                const SizedBox(height: 24),

                // Divider
                Row(children: [
                  const Expanded(child: Divider(color: Color(0xFFE7EBF3))),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 12),
                    child: Text(
                      'หรือเข้าสู่ระบบด้วย',
                      style: TextStyle(
                        fontSize: 13,
                        color: Colors.grey[500],
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                  const Expanded(child: Divider(color: Color(0xFFE7EBF3))),
                ]),
                const SizedBox(height: 16),

                // Google login
                SocialLoginButton(
                  label: 'เข้าสู่ระบบด้วย Google',
                  iconWidget: const GoogleIcon(),
                  onTap: auth.loading
                      ? null
                      : () => _socialLogin(
                            () => context.read<AuthProvider>().loginWithGoogle(),
                          ),
                ),
                const SizedBox(height: 20),

                // Driver note
                Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF0F2F7),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Icon(Icons.info_outline,
                          size: 18, color: Color(0xFF6B7891)),
                      SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          'คนขับรถ: บัญชีถูกสร้างโดยผู้ดูแลระบบ — ใช้ข้อมูลที่ได้รับเพื่อเข้าสู่ระบบ',
                          style: TextStyle(
                              fontSize: 13, color: Color(0xFF6B7891), height: 1.4),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 20),

                // Sign up link
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Text(
                      'ยังไม่มีบัญชี? ',
                      style: TextStyle(fontSize: 15, color: Color(0xFF6B7891)),
                    ),
                    GestureDetector(
                      onTap: () => Navigator.of(context).push(
                        MaterialPageRoute(
                            builder: (_) => const RegisterScreen()),
                      ),
                      child: const Text(
                        'สมัครเป็นผู้โดยสาร',
                        style: TextStyle(
                          fontSize: 15,
                          color: Color(0xFF2563EB),
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _Label(String text) => Padding(
        padding: const EdgeInsets.only(bottom: 0),
        child: Text(
          text,
          style: const TextStyle(
            fontSize: 15,
            fontWeight: FontWeight.w600,
            color: Color(0xFF1E2A3A),
          ),
        ),
      );

  InputDecoration _inputDeco({
    required String hint,
    required IconData icon,
    Widget? suffix,
  }) =>
      InputDecoration(
        hintText: hint,
        hintStyle: const TextStyle(color: Color(0xFF98A2B3), fontSize: 18),
        prefixIcon: Icon(icon, size: 22, color: const Color(0xFF98A2B3)),
        suffixIcon: suffix,
        filled: true,
        fillColor: Colors.white,
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 18, vertical: 18),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: Color(0xFFE7EBF3)),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: Color(0xFFE7EBF3), width: 1.5),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide:
              const BorderSide(color: Color(0xFF3B82F6), width: 1.5),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: Color(0xFFEF4444)),
        ),
        focusedErrorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: const BorderSide(color: Color(0xFFEF4444), width: 1.5),
        ),
      );
}
