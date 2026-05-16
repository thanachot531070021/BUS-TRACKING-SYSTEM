import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../widgets/social_login_widgets.dart';
import '../passenger/passenger_main.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _fullNameCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();
  final _confirmCtrl = TextEditingController();
  bool _obscurePass = true;
  bool _obscureConfirm = true;

  @override
  void dispose() {
    _fullNameCtrl.dispose();
    _phoneCtrl.dispose();
    _emailCtrl.dispose();
    _passwordCtrl.dispose();
    _confirmCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    final auth = context.read<AuthProvider>();
    final error = await auth.register(
      email: _emailCtrl.text.trim(),
      password: _passwordCtrl.text,
      fullName: _fullNameCtrl.text.trim(),
      phoneNumber: _phoneCtrl.text.trim(),
    );

    if (!mounted) return;
    if (error != null) return; // error shown via auth.error

    if (auth.isLoggedIn) {
      Navigator.of(context).pushAndRemoveUntil(
        MaterialPageRoute(builder: (_) => const PassengerMainScreen()),
        (_) => false,
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('สมัครสมาชิกสำเร็จ! กรุณาเข้าสู่ระบบ'),
          backgroundColor: Color(0xFF16A34A),
        ),
      );
      Navigator.of(context).pop();
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();

    return Scaffold(
      backgroundColor: const Color(0xFFF1F5F9),
      body: SafeArea(
        child: SingleChildScrollView(
          child: Column(
            children: [
              // Header gradient
              Container(
                width: double.infinity,
                padding: const EdgeInsets.fromLTRB(24, 40, 24, 36),
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [Color(0xFF1E40AF), Color(0xFF3B82F6)],
                  ),
                  borderRadius: BorderRadius.only(
                    bottomLeft: Radius.circular(32),
                    bottomRight: Radius.circular(32),
                  ),
                ),
                child: Column(
                  children: [
                    Row(
                      children: [
                        GestureDetector(
                          onTap: () => Navigator.of(context).pop(),
                          child: Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: Colors.white.withValues(alpha: 0.2),
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: const Icon(Icons.arrow_back,
                                color: Colors.white, size: 20),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    Container(
                      width: 72,
                      height: 72,
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.2),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(
                            color: Colors.white.withValues(alpha: 0.35),
                            width: 2),
                      ),
                      child: const Icon(Icons.person_add,
                          size: 38, color: Colors.white),
                    ),
                    const SizedBox(height: 14),
                    const Text(
                      'สมัครสมาชิก',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 22,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'สร้างบัญชีผู้โดยสารใหม่',
                      style: TextStyle(
                          color: Colors.white.withValues(alpha: 0.78),
                          fontSize: 13),
                    ),
                  ],
                ),
              ),

              // Form
              Padding(
                padding: const EdgeInsets.fromLTRB(24, 28, 24, 32),
                child: Form(
                  key: _formKey,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      if (auth.error != null)
                        _ErrorBanner(message: auth.error!),

                      _label('ชื่อ-นามสกุล'),
                      const SizedBox(height: 6),
                      TextFormField(
                        controller: _fullNameCtrl,
                        decoration: _inputDeco(
                            hint: 'ชื่อ นามสกุล', icon: Icons.person_outline),
                        validator: (v) => (v == null || v.trim().isEmpty)
                            ? 'กรุณากรอกชื่อ-นามสกุล'
                            : null,
                        textInputAction: TextInputAction.next,
                      ),
                      const SizedBox(height: 16),

                      _label('เบอร์โทรศัพท์'),
                      const SizedBox(height: 6),
                      TextFormField(
                        controller: _phoneCtrl,
                        decoration: _inputDeco(
                            hint: '0812345678', icon: Icons.phone_outlined),
                        keyboardType: TextInputType.phone,
                        textInputAction: TextInputAction.next,
                      ),
                      const SizedBox(height: 16),

                      _label('อีเมล'),
                      const SizedBox(height: 6),
                      TextFormField(
                        controller: _emailCtrl,
                        decoration: _inputDeco(
                            hint: 'email@example.com',
                            icon: Icons.email_outlined),
                        keyboardType: TextInputType.emailAddress,
                        validator: (v) {
                          if (v == null || v.trim().isEmpty) {
                            return 'กรุณากรอกอีเมล';
                          }
                          if (!v.contains('@')) return 'รูปแบบอีเมลไม่ถูกต้อง';
                          return null;
                        },
                        textInputAction: TextInputAction.next,
                      ),
                      const SizedBox(height: 16),

                      _label('รหัสผ่าน'),
                      const SizedBox(height: 6),
                      TextFormField(
                        controller: _passwordCtrl,
                        obscureText: _obscurePass,
                        decoration: _inputDeco(
                          hint: 'อย่างน้อย 6 ตัวอักษร',
                          icon: Icons.lock_outline,
                          suffix: _toggleBtn(
                              _obscurePass,
                              () => setState(
                                  () => _obscurePass = !_obscurePass)),
                        ),
                        validator: (v) => (v == null || v.length < 6)
                            ? 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'
                            : null,
                        textInputAction: TextInputAction.next,
                      ),
                      const SizedBox(height: 16),

                      _label('ยืนยันรหัสผ่าน'),
                      const SizedBox(height: 6),
                      TextFormField(
                        controller: _confirmCtrl,
                        obscureText: _obscureConfirm,
                        decoration: _inputDeco(
                          hint: 'กรอกรหัสผ่านอีกครั้ง',
                          icon: Icons.lock_outline,
                          suffix: _toggleBtn(
                              _obscureConfirm,
                              () => setState(
                                  () => _obscureConfirm = !_obscureConfirm)),
                        ),
                        validator: (v) => v != _passwordCtrl.text
                            ? 'รหัสผ่านไม่ตรงกัน'
                            : null,
                        onFieldSubmitted: (_) => _submit(),
                      ),
                      const SizedBox(height: 28),

                      SizedBox(
                        height: 52,
                        child: ElevatedButton(
                          onPressed: auth.loading ? null : _submit,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF2563EB),
                            foregroundColor: Colors.white,
                            shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(12)),
                            elevation: 0,
                          ),
                          child: auth.loading
                              ? const SizedBox(
                                  width: 22,
                                  height: 22,
                                  child: CircularProgressIndicator(
                                      strokeWidth: 2.5,
                                      valueColor: AlwaysStoppedAnimation(
                                          Colors.white)),
                                )
                              : const Text('สมัครสมาชิก',
                                  style: TextStyle(
                                      fontSize: 16,
                                      fontWeight: FontWeight.w700)),
                        ),
                      ),

                      const SizedBox(height: 20),

                      Row(children: [
                        const Expanded(child: Divider()),
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 12),
                          child: Text('หรือสมัครด้วย',
                              style: TextStyle(
                                  fontSize: 12, color: Colors.grey[500])),
                        ),
                        const Expanded(child: Divider()),
                      ]),
                      const SizedBox(height: 16),

                      SocialLoginButton(
                        label: 'สมัครด้วย Google',
                        iconWidget: const GoogleIcon(),
                        onTap: auth.loading
                            ? null
                            : () async {
                                final ap = context.read<AuthProvider>();
                                final nav = Navigator.of(context);
                                final ok = await ap.loginWithGoogle();
                                if (!mounted || !ok) return;
                                nav.pushAndRemoveUntil(
                                  MaterialPageRoute(
                                      builder: (_) =>
                                          const PassengerMainScreen()),
                                  (_) => false,
                                );
                              },
                      ),
                      const SizedBox(height: 10),
                      SocialLoginButton(
                        label: 'สมัครด้วย Facebook',
                        iconWidget: const FacebookIcon(),
                        onTap: auth.loading
                            ? null
                            : () async {
                                final ap = context.read<AuthProvider>();
                                final nav = Navigator.of(context);
                                final ok = await ap.loginWithFacebook();
                                if (!mounted || !ok) return;
                                nav.pushAndRemoveUntil(
                                  MaterialPageRoute(
                                      builder: (_) =>
                                          const PassengerMainScreen()),
                                  (_) => false,
                                );
                              },
                      ),

                      const SizedBox(height: 20),
                      Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                        Text('มีบัญชีแล้ว? ',
                            style: TextStyle(
                                fontSize: 13, color: Colors.grey[600])),
                        GestureDetector(
                          onTap: () => Navigator.of(context).pop(),
                          child: const Text('เข้าสู่ระบบ',
                              style: TextStyle(
                                  fontSize: 13,
                                  color: Color(0xFF2563EB),
                                  fontWeight: FontWeight.w700)),
                        ),
                      ]),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _label(String text) => Text(text,
      style: const TextStyle(
          fontSize: 13,
          fontWeight: FontWeight.w600,
          color: Color(0xFF374151)));

  Widget _toggleBtn(bool obscure, VoidCallback onTap) => IconButton(
        icon: Icon(obscure ? Icons.visibility_off : Icons.visibility,
            size: 20, color: Colors.grey),
        onPressed: onTap,
      );

  InputDecoration _inputDeco(
          {required String hint,
          required IconData icon,
          Widget? suffix}) =>
      InputDecoration(
        hintText: hint,
        prefixIcon: Icon(icon, size: 20, color: Colors.grey),
        suffixIcon: suffix,
        filled: true,
        fillColor: Colors.white,
        border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(11),
            borderSide: const BorderSide(color: Color(0xFFE5E7EB))),
        enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(11),
            borderSide: const BorderSide(color: Color(0xFFE5E7EB))),
        focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(11),
            borderSide:
                const BorderSide(color: Color(0xFF3B82F6), width: 1.5)),
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
      );
}

class _ErrorBanner extends StatelessWidget {
  final String message;
  const _ErrorBanner({required this.message});

  @override
  Widget build(BuildContext context) => Container(
        margin: const EdgeInsets.only(bottom: 16),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: const Color(0xFFFEF2F2),
          border: Border.all(color: const Color(0xFFFCA5A5)),
          borderRadius: BorderRadius.circular(10),
        ),
        child: Row(children: [
          const Icon(Icons.warning_amber_rounded,
              color: Color(0xFFDC2626), size: 18),
          const SizedBox(width: 8),
          Expanded(
              child: Text(message,
                  style: const TextStyle(
                      color: Color(0xFFDC2626), fontSize: 13))),
        ]),
      );
}
