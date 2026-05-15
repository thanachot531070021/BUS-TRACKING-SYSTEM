import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import 'auth/login_screen.dart';

class AdminInfoScreen extends StatelessWidget {
  const AdminInfoScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();

    return Scaffold(
      backgroundColor: const Color(0xFFF1F5F9),
      appBar: AppBar(
        title: const Text('Admin', style: TextStyle(fontWeight: FontWeight.w700)),
        backgroundColor: const Color(0xFF0F172A),
        foregroundColor: Colors.white,
        elevation: 0,
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 8),
            child: PopupMenuButton<String>(
              icon: CircleAvatar(
                backgroundColor: Colors.white.withValues(alpha:0.2),
                child: Text(
                  (auth.user?.displayName ?? 'A')[0].toUpperCase(),
                  style: const TextStyle(
                      color: Colors.white, fontWeight: FontWeight.w700),
                ),
              ),
              onSelected: (v) async {
                if (v == 'logout') {
                  await auth.logout();
                  if (!context.mounted) return;
                  Navigator.of(context).pushReplacement(
                    MaterialPageRoute(builder: (_) => const LoginScreen()),
                  );
                }
              },
              itemBuilder: (_) => [
                PopupMenuItem(
                  enabled: false,
                  child: Text(auth.user?.displayName ?? '',
                      style: const TextStyle(fontWeight: FontWeight.w600)),
                ),
                const PopupMenuDivider(),
                const PopupMenuItem(value: 'logout', child: Text('ออกจากระบบ')),
              ],
            ),
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Info banner
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFF0F172A), Color(0xFF1E293B)],
              ),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(children: [
                  Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha:0.15),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(Icons.admin_panel_settings,
                        color: Colors.white, size: 24),
                  ),
                  const SizedBox(width: 12),
                  const Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Admin Panel',
                          style: TextStyle(
                              color: Colors.white,
                              fontSize: 17,
                              fontWeight: FontWeight.w700)),
                      Text('Bus Tracking System',
                          style: TextStyle(
                              color: Colors.white70, fontSize: 13)),
                    ],
                  ),
                ]),
                const SizedBox(height: 16),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha:0.1),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: Colors.white.withValues(alpha:0.2)),
                  ),
                  child: const Row(children: [
                    Icon(Icons.info_outline, color: Colors.white70, size: 18),
                    SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        'การจัดการระบบทำผ่าน Web Dashboard\nกรุณาเปิดผ่านเบราว์เซอร์บนคอมพิวเตอร์',
                        style: TextStyle(color: Colors.white70, fontSize: 13, height: 1.5),
                      ),
                    ),
                  ]),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Capabilities
          _sectionTitle('สิ่งที่จัดการได้บน Web Dashboard'),
          const SizedBox(height: 10),
          _featureCard(
            icon: Icons.map_outlined,
            color: const Color(0xFF3B82F6),
            title: 'จัดการโซนและเส้นทาง',
            subtitle: 'เพิ่ม แก้ไข ปิด/เปิดสายรถ',
          ),
          _featureCard(
            icon: Icons.directions_bus_outlined,
            color: const Color(0xFF10B981),
            title: 'จัดการรถโดยสาร',
            subtitle: 'ทะเบียนรถ, สถานะ, คนขับที่ผูกไว้',
          ),
          _featureCard(
            icon: Icons.badge_outlined,
            color: const Color(0xFFF59E0B),
            title: 'จัดการคนขับ',
            subtitle: 'ข้อมูลพนักงาน, ใบขับขี่, เส้นทาง',
          ),
          _featureCard(
            icon: Icons.people_outline,
            color: const Color(0xFF8B5CF6),
            title: 'จัดการ Admin',
            subtitle: 'Super Admin / Zone Admin',
          ),
          _featureCard(
            icon: Icons.bar_chart_outlined,
            color: const Color(0xFFEF4444),
            title: 'Analytics',
            subtitle: 'สถิติการใช้งานทั้งระบบ',
          ),
          const SizedBox(height: 16),

          // Role info
          _sectionTitle('ระดับสิทธิ์ของคุณ'),
          const SizedBox(height: 10),
          Card(
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
            elevation: 0,
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Row(children: [
                Container(
                  width: 46,
                  height: 46,
                  decoration: BoxDecoration(
                    color: const Color(0xFFEFF6FF),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(Icons.verified_user_outlined,
                      color: Color(0xFF2563EB), size: 24),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(auth.user?.displayName ?? '-',
                            style: const TextStyle(
                                fontWeight: FontWeight.w700, fontSize: 15)),
                        Text(
                          _roleLabel(auth.user?.role ?? '-'),
                          style: const TextStyle(
                              fontSize: 13, color: Color(0xFF3B82F6)),
                        ),
                      ]),
                ),
              ]),
            ),
          ),
        ],
      ),
    );
  }

  String _roleLabel(String role) {
    switch (role) {
      case 'super_admin':
        return 'Super Admin — เข้าถึงข้อมูลทั้งระบบ';
      case 'admin':
        return 'Admin — จัดการโซนที่รับผิดชอบ';
      default:
        return role;
    }
  }

  Widget _sectionTitle(String text) => Text(
        text,
        style: const TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w700,
            color: Color(0xFF6B7280),
            letterSpacing: 0.5),
      );

  Widget _featureCard({
    required IconData icon,
    required Color color,
    required String title,
    required String subtitle,
  }) =>
      Card(
        margin: const EdgeInsets.only(bottom: 8),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        elevation: 0,
        child: ListTile(
          leading: Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: color.withValues(alpha:0.12),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, color: color, size: 20),
          ),
          title: Text(title,
              style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
          subtitle: Text(subtitle,
              style: const TextStyle(fontSize: 12, color: Color(0xFF6B7280))),
        ),
      );
}
