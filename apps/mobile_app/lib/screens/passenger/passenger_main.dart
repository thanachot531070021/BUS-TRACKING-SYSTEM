import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../auth/login_screen.dart';
import 'home_tab.dart';
import 'explore_tab.dart';
import 'activity_tab.dart';
import 'inbox_tab.dart';

const double kTopBarContentHeight = 64.0;

class PassengerMainScreen extends StatefulWidget {
  const PassengerMainScreen({super.key});

  @override
  State<PassengerMainScreen> createState() => _PassengerMainScreenState();
}

class _PassengerMainScreenState extends State<PassengerMainScreen>
    with TickerProviderStateMixin {
  int _index = 0;

  @override
  void initState() {
    super.initState();
    SystemChrome.setSystemUIOverlayStyle(const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.dark,
    ));
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final user = auth.user;
    final statusH = MediaQuery.of(context).padding.top;
    final topBarH = statusH + kTopBarContentHeight;

    return Scaffold(
      backgroundColor: Colors.white,
      body: Stack(
        children: [
          // ── Tab content ──────────────────────────────────────────
          IndexedStack(
            index: _index,
            children: [
              HomeTab(topBarHeight: topBarH),
              ExploreTab(topBarHeight: topBarH),
              ActivityTab(topBarHeight: topBarH),
              InboxTab(topBarHeight: topBarH),
            ],
          ),

          // ── Floating top bar ─────────────────────────────────────
          _TopBar(
            statusHeight: statusH,
            userInitial: (user?.displayName ?? 'U')[0].toUpperCase(),
            onProfileTap: () => _showProfileSheet(context, auth),
            onQrTap: () => ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('สแกน QR Code — เร็วๆ นี้')),
            ),
          ),
        ],
      ),

      // ── Bottom navigation ─────────────────────────────────────────
      bottomNavigationBar: NavigationBar(
        selectedIndex: _index,
        onDestinationSelected: (i) => setState(() => _index = i),
        backgroundColor: Colors.white,
        elevation: 0,
        shadowColor: Colors.transparent,
        indicatorColor: const Color(0xFFEFF6FF),
        labelBehavior: NavigationDestinationLabelBehavior.alwaysShow,
        animationDuration: const Duration(milliseconds: 300),
        destinations: _buildDestinations(),
      ),
    );
  }

  List<NavigationDestination> _buildDestinations() => const [
        NavigationDestination(
          icon: Icon(Icons.map_outlined),
          selectedIcon: Icon(Icons.map, color: Color(0xFF2563EB)),
          label: 'หน้าหลัก',
        ),
        NavigationDestination(
          icon: Icon(Icons.explore_outlined),
          selectedIcon: Icon(Icons.explore, color: Color(0xFF2563EB)),
          label: 'สำรวจ',
        ),
        NavigationDestination(
          icon: Icon(Icons.receipt_long_outlined),
          selectedIcon: Icon(Icons.receipt_long, color: Color(0xFF2563EB)),
          label: 'รายการ',
        ),
        NavigationDestination(
          icon: Icon(Icons.inbox_outlined),
          selectedIcon: Icon(Icons.inbox, color: Color(0xFF2563EB)),
          label: 'กล่องข้อความ',
        ),
      ];

  void _showProfileSheet(BuildContext context, AuthProvider auth) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (_) => _ProfileSheet(
        auth: auth,
        onLogout: () async {
          final navigator = Navigator.of(context);
          await auth.logout();
          if (!mounted) return;
          navigator.pushAndRemoveUntil(
            MaterialPageRoute(builder: (_) => const LoginScreen()),
            (_) => false,
          );
        },
      ),
    );
  }
}

// ─── Floating Top Bar ────────────────────────────────────────────────────────

class _TopBar extends StatelessWidget {
  final double statusHeight;
  final String userInitial;
  final VoidCallback onProfileTap;
  final VoidCallback onQrTap;

  const _TopBar({
    required this.statusHeight,
    required this.userInitial,
    required this.onProfileTap,
    required this.onQrTap,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.only(
          top: statusHeight + 10, left: 16, right: 16, bottom: 10),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.06),
            blurRadius: 12,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        children: [
          // Profile avatar
          GestureDetector(
            onTap: onProfileTap,
            child: Container(
              width: 42,
              height: 42,
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF2563EB), Color(0xFF3B82F6)],
                ),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Center(
                child: Text(userInitial,
                    style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w700,
                        fontSize: 16)),
              ),
            ),
          ),
          const SizedBox(width: 12),

          // Search bar
          Expanded(
            child: GestureDetector(
              onTap: () {}, // TODO: open search
              child: Container(
                height: 42,
                decoration: BoxDecoration(
                  color: const Color(0xFFF1F5F9),
                  borderRadius: BorderRadius.circular(12),
                ),
                padding: const EdgeInsets.symmetric(horizontal: 12),
                child: Row(
                  children: [
                    Icon(Icons.search, size: 18, color: Colors.grey[500]),
                    const SizedBox(width: 8),
                    Text(
                      'ค้นหาสายรถ หรือจุดหมาย...',
                      style: TextStyle(
                          fontSize: 13,
                          color: Colors.grey[500]),
                    ),
                  ],
                ),
              ),
            ),
          ),
          const SizedBox(width: 10),

          // QR scan
          GestureDetector(
            onTap: onQrTap,
            child: Container(
              width: 42,
              height: 42,
              decoration: BoxDecoration(
                color: const Color(0xFFF1F5F9),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(Icons.qr_code_scanner,
                  size: 22, color: Colors.grey[700]),
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Profile Bottom Sheet ─────────────────────────────────────────────────────

class _ProfileSheet extends StatelessWidget {
  final AuthProvider auth;
  final VoidCallback onLogout;

  const _ProfileSheet({required this.auth, required this.onLogout});

  @override
  Widget build(BuildContext context) {
    final user = auth.user;
    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      padding: const EdgeInsets.fromLTRB(24, 12, 24, 32),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // drag handle
          Container(
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: Colors.grey[300],
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          const SizedBox(height: 24),

          // Avatar large
          Container(
            width: 72,
            height: 72,
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                  colors: [Color(0xFF2563EB), Color(0xFF60A5FA)]),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Center(
              child: Text(
                (user?.displayName ?? 'U')[0].toUpperCase(),
                style: const TextStyle(
                    color: Colors.white,
                    fontSize: 28,
                    fontWeight: FontWeight.w800),
              ),
            ),
          ),
          const SizedBox(height: 12),

          Text(
            user?.displayName ?? 'ผู้โดยสาร',
            style: const TextStyle(
                fontSize: 18, fontWeight: FontWeight.w700),
          ),
          if (user?.email != null) ...[
            const SizedBox(height: 4),
            Text(user!.email!,
                style:
                    TextStyle(fontSize: 13, color: Colors.grey[500])),
          ],
          const SizedBox(height: 6),
          Container(
            padding:
                const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
            decoration: BoxDecoration(
              color: const Color(0xFFEFF6FF),
              borderRadius: BorderRadius.circular(20),
            ),
            child: const Text('ผู้โดยสาร',
                style: TextStyle(
                    fontSize: 12,
                    color: Color(0xFF2563EB),
                    fontWeight: FontWeight.w600)),
          ),

          const SizedBox(height: 28),
          const Divider(height: 1),
          const SizedBox(height: 16),

          SizedBox(
            width: double.infinity,
            height: 50,
            child: OutlinedButton.icon(
              onPressed: () {
                Navigator.of(context).pop();
                onLogout();
              },
              icon: const Icon(Icons.logout,
                  color: Color(0xFFDC2626), size: 18),
              label: const Text('ออกจากระบบ',
                  style: TextStyle(
                      color: Color(0xFFDC2626),
                      fontWeight: FontWeight.w600)),
              style: OutlinedButton.styleFrom(
                side: const BorderSide(color: Color(0xFFFCA5A5)),
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12)),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
