import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import 'auth/login_screen.dart';
import 'passenger/passenger_main.dart';
import 'driver/driver_home.dart';
import 'admin_info_screen.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen>
    with SingleTickerProviderStateMixin {
  late final AnimationController _ctrl;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    )..repeat();
    _init();
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  Future<void> _init() async {
    final auth = context.read<AuthProvider>();
    await auth.restoreSession();
    if (!mounted) return;

    if (!auth.isLoggedIn) {
      _go(const LoginScreen());
      return;
    }

    final role = auth.user?.role ?? 'passenger';
    if (role == 'driver') {
      _go(const DriverHome());
    } else if (role == 'admin' || role == 'super_admin') {
      _go(const AdminInfoScreen());
    } else {
      _go(const PassengerMainScreen());
    }
  }

  void _go(Widget w) => Navigator.of(context)
      .pushReplacement(MaterialPageRoute(builder: (_) => w));

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF3B82F6),
      body: Stack(
        children: [
          Positioned(
            top: -100,
            right: -120,
            child: Container(
              width: 360,
              height: 360,
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.08),
                shape: BoxShape.circle,
              ),
            ),
          ),
          Positioned(
            bottom: -80,
            left: -100,
            child: Container(
              width: 280,
              height: 280,
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.07),
                shape: BoxShape.circle,
              ),
            ),
          ),
          Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Container(
                  width: 100,
                  height: 100,
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.18),
                    borderRadius: BorderRadius.circular(28),
                    border: Border.all(
                      color: Colors.white.withValues(alpha: 0.45),
                      width: 2.5,
                    ),
                  ),
                  child: const Icon(
                    Icons.directions_bus,
                    size: 56,
                    color: Colors.white,
                  ),
                ),
                const SizedBox(height: 26),
                const Text(
                  'Bus Tracking',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 36,
                    fontWeight: FontWeight.w800,
                    letterSpacing: -0.5,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'ติดตามตำแหน่งรถ Real-time',
                  style: TextStyle(
                    color: Colors.white.withValues(alpha: 0.85),
                    fontSize: 17,
                  ),
                ),
                const SizedBox(height: 60),
                _LoadingDots(controller: _ctrl),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _LoadingDots extends StatelessWidget {
  final AnimationController controller;
  const _LoadingDots({required this.controller});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: List.generate(3, (i) {
        final anim = Tween<double>(begin: 0.3, end: 1.0).animate(
          CurvedAnimation(
            parent: controller,
            curve: Interval(
              i * 0.2,
              i * 0.2 + 0.5,
              curve: Curves.easeInOut,
            ),
          ),
        );
        return AnimatedBuilder(
          animation: anim,
          builder: (_, __) => Container(
            margin: const EdgeInsets.symmetric(horizontal: 4),
            width: 8,
            height: 8,
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: anim.value),
              shape: BoxShape.circle,
            ),
          ),
        );
      }),
    );
  }
}
