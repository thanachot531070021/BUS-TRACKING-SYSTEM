import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../auth/login_screen.dart';

class ProfileTab extends StatelessWidget {
  const ProfileTab({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final user = auth.user;
    final name = user?.displayName ?? 'ผู้ใช้';
    final initial = name[0].toUpperCase();
    final phone = user?.username ?? '—';
    final email = user?.email;

    return Scaffold(
      backgroundColor: const Color(0xFFF6F7FB),
      body: SafeArea(
        child: CustomScrollView(
          slivers: [
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
                child: Row(
                  children: [
                    const Expanded(
                      child: Text('โปรไฟล์',
                          style: TextStyle(
                              fontSize: 22,
                              fontWeight: FontWeight.w800,
                              color: Color(0xFF0F172A))),
                    ),
                    IconButton(
                      onPressed: () {},
                      icon: const Icon(Icons.edit_outlined,
                          color: Color(0xFF0F172A)),
                      style: IconButton.styleFrom(
                        backgroundColor: Colors.white,
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12)),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
              sliver: SliverList(
                delegate: SliverChildListDelegate([
                  // User header card
                  Container(
                    padding: const EdgeInsets.all(22),
                    decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(20)),
                    child: Row(
                      children: [
                        Container(
                          width: 72,
                          height: 72,
                          decoration: const BoxDecoration(
                            gradient: LinearGradient(
                              begin: Alignment.topLeft,
                              end: Alignment.bottomRight,
                              colors: [Color(0xFFa78bfa), Color(0xFF6366f1)],
                            ),
                            shape: BoxShape.circle,
                          ),
                          child: Center(
                            child: Text(initial,
                                style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 26,
                                    fontWeight: FontWeight.w800)),
                          ),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(name,
                                  style: const TextStyle(
                                      fontSize: 22,
                                      fontWeight: FontWeight.w800,
                                      color: Color(0xFF0F172A))),
                              const SizedBox(height: 4),
                              Text(email ?? phone,
                                  style: const TextStyle(
                                      fontSize: 14, color: Color(0xFF6B7891))),
                              const SizedBox(height: 8),
                              Container(
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 10, vertical: 4),
                                decoration: BoxDecoration(
                                    color: const Color(0xFFDCFCE7),
                                    borderRadius: BorderRadius.circular(99)),
                                child: Text(
                                  _roleLabel(user?.role ?? 'passenger'),
                                  style: const TextStyle(
                                      fontSize: 12,
                                      fontWeight: FontWeight.w600,
                                      color: Color(0xFF16A34A)),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 20),

                  _SectionLabel('การเดินทาง'),
                  const SizedBox(height: 8),
                  _ListCard(
                    children: [
                      _ListRow(
                        iconBg: const Color(0xFFF3E8FF),
                        iconFg: const Color(0xFF6B21A8),
                        icon: Icons.history,
                        title: 'ประวัติการเดินทาง',
                        sub: 'ดูการเดินทางทั้งหมด',
                        onTap: () {},
                      ),
                      _ListRow(
                        iconBg: const Color(0xFFDBEAFE),
                        iconFg: const Color(0xFF1E40AF),
                        icon: Icons.star_outline,
                        title: 'เส้นทางโปรด',
                        sub: 'จัดการเส้นทางที่บันทึกไว้',
                        onTap: () {},
                      ),
                    ],
                  ),
                  const SizedBox(height: 20),

                  _SectionLabel('บัญชี'),
                  const SizedBox(height: 8),
                  _ListCard(
                    children: [
                      _ListRow(
                        iconBg: const Color(0xFFF1F5F9),
                        iconFg: const Color(0xFF1E2A3A),
                        icon: Icons.person_outline,
                        title: 'ข้อมูลส่วนตัว',
                        sub: 'ชื่อ, เบอร์โทร, อีเมล',
                        onTap: () {},
                      ),
                      _ListRow(
                        iconBg: const Color(0xFFFFE4D6),
                        iconFg: const Color(0xFFa64b1e),
                        icon: Icons.notifications_outlined,
                        title: 'การแจ้งเตือน',
                        sub: 'เปิดทุกประเภท',
                        onTap: () {},
                      ),
                    ],
                  ),
                  const SizedBox(height: 20),

                  _SectionLabel('การแสดงผล'),
                  const SizedBox(height: 8),
                  _ListCard(
                    children: [
                      _ListRow(
                        iconBg: const Color(0xFFDBEAFE),
                        iconFg: const Color(0xFF1E40AF),
                        icon: Icons.text_fields,
                        title: 'ขนาดตัวอักษร',
                        sub: 'ใหญ่',
                        onTap: () {},
                      ),
                      _ListRow(
                        iconBg: const Color(0xFFF1F5F9),
                        iconFg: const Color(0xFF1E2A3A),
                        icon: Icons.dark_mode_outlined,
                        title: 'ธีมมืด',
                        sub: 'ตามระบบ',
                        onTap: () {},
                      ),
                    ],
                  ),
                  const SizedBox(height: 20),

                  _SectionLabel('อื่นๆ'),
                  const SizedBox(height: 8),
                  _ListCard(
                    children: [
                      _ListRow(
                        iconBg: const Color(0xFFF1F5F9),
                        iconFg: const Color(0xFF6B7891),
                        icon: Icons.help_outline,
                        title: 'ช่วยเหลือ',
                        onTap: () {},
                      ),
                      _ListRow(
                        iconBg: const Color(0xFFF1F5F9),
                        iconFg: const Color(0xFF6B7891),
                        icon: Icons.shield_outlined,
                        title: 'ความเป็นส่วนตัว & ความปลอดภัย',
                        onTap: () {},
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),

                  // Logout row
                  Material(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    elevation: 0,
                    child: InkWell(
                      borderRadius: BorderRadius.circular(16),
                      onTap: () => _confirmLogout(context, auth),
                      child: const Padding(
                        padding: EdgeInsets.symmetric(
                            horizontal: 16, vertical: 18),
                        child: Row(
                          children: [
                            SizedBox(
                              width: 40,
                              height: 40,
                              child: DecoratedBox(
                                decoration: BoxDecoration(
                                    color: Color(0xFFFEE2E2),
                                    borderRadius:
                                        BorderRadius.all(Radius.circular(12))),
                                child: Icon(Icons.logout,
                                    size: 20, color: Color(0xFFDC2626)),
                              ),
                            ),
                            SizedBox(width: 14),
                            Text('ออกจากระบบ',
                                style: TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.w600,
                                    color: Color(0xFFDC2626))),
                          ],
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 20),
                  const Center(
                    child: Text('Bus Tracking · v2.1.0',
                        style: TextStyle(
                            fontSize: 12, color: Color(0xFF6B7891))),
                  ),
                ]),
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _roleLabel(String role) {
    return switch (role) {
      'driver' => 'คนขับรถ',
      'admin' => 'ผู้ดูแลระบบ',
      'super_admin' => 'ผู้ดูแลระบบ',
      _ => 'ผู้โดยสาร',
    };
  }

  Future<void> _confirmLogout(BuildContext context, AuthProvider auth) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('ออกจากระบบ'),
        content: const Text('ต้องการออกจากระบบใช่ไหม?'),
        actions: [
          TextButton(
              onPressed: () => Navigator.of(ctx).pop(false),
              child: const Text('ยกเลิก')),
          TextButton(
              onPressed: () => Navigator.of(ctx).pop(true),
              child: const Text('ออกจากระบบ',
                  style: TextStyle(color: Color(0xFFDC2626)))),
        ],
      ),
    );
    if (confirm != true) return;
    await auth.logout();
    if (!context.mounted) return;
    Navigator.of(context).pushAndRemoveUntil(
      MaterialPageRoute(builder: (_) => const LoginScreen()),
      (_) => false,
    );
  }
}

// ─── Section Label ────────────────────────────────────────────────────────────

class _SectionLabel extends StatelessWidget {
  final String text;
  const _SectionLabel(this.text);

  @override
  Widget build(BuildContext context) => Text(
        text.toUpperCase(),
        style: const TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w700,
            color: Color(0xFF6B7891),
            letterSpacing: 0.7),
      );
}

// ─── List Card + Row ──────────────────────────────────────────────────────────

class _ListCard extends StatelessWidget {
  final List<_ListRow> children;
  const _ListCard({required this.children});

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(16),
      child: Column(
        children: [
          for (int i = 0; i < children.length; i++) ...[
            children[i],
            if (i < children.length - 1)
              const Divider(
                  height: 1, indent: 70, color: Color(0xFFF1F5F9)),
          ],
        ],
      ),
    );
  }
}

class _ListRow extends StatelessWidget {
  final Color iconBg;
  final Color iconFg;
  final IconData icon;
  final String title;
  final String? sub;
  final VoidCallback onTap;

  const _ListRow({
    required this.iconBg,
    required this.iconFg,
    required this.icon,
    required this.title,
    this.sub,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.white,
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          child: Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                    color: iconBg, borderRadius: BorderRadius.circular(12)),
                child: Icon(icon, size: 20, color: iconFg),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(title,
                        style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                            color: Color(0xFF0F172A))),
                    if (sub != null)
                      Text(sub!,
                          style: const TextStyle(
                              fontSize: 13, color: Color(0xFF6B7891))),
                  ],
                ),
              ),
              const Icon(Icons.chevron_right,
                  size: 20, color: Color(0xFF6B7891)),
            ],
          ),
        ),
      ),
    );
  }
}
