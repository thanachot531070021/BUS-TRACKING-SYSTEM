import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../providers/driver_provider.dart';
import '../../screens/auth/login_screen.dart';
import 'waiting_list.dart';

class DriverHome extends StatefulWidget {
  const DriverHome({super.key});

  @override
  State<DriverHome> createState() => _DriverHomeState();
}

class _DriverHomeState extends State<DriverHome> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      context.read<DriverProvider>().loadProfile();
    });
  }

  Future<void> _toggleDuty() async {
    final dp = context.read<DriverProvider>();

    // Must have an assigned bus to go on duty
    if (dp.assignedBusId == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
        content: Text('ยังไม่มีรถที่ได้รับมอบหมาย กรุณาติดต่อ Admin'),
        backgroundColor: Color(0xFFEF4444),
      ));
      return;
    }

    final ok = await dp.toggleDuty();
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Text(ok
          ? (dp.onDuty ? '🟢 เริ่มปฏิบัติงานแล้ว' : '⚫ หยุดปฏิบัติงานแล้ว')
          : '❌ เกิดข้อผิดพลาด กรุณาลองอีกครั้ง'),
      backgroundColor: ok
          ? (dp.onDuty
              ? const Color(0xFF10B981)
              : const Color(0xFF6B7280))
          : const Color(0xFFEF4444),
    ));
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final dp = context.watch<DriverProvider>();

    return Scaffold(
      backgroundColor: const Color(0xFFF1F5F9),
      appBar: AppBar(
        title: const Text('คนขับรถ',
            style: TextStyle(fontWeight: FontWeight.w700)),
        backgroundColor: const Color(0xFF0F172A),
        foregroundColor: Colors.white,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => dp.loadProfile(),
          ),
          Padding(
            padding: const EdgeInsets.only(right: 8),
            child: PopupMenuButton<String>(
              icon: CircleAvatar(
                backgroundColor: Colors.white.withValues(alpha:0.2),
                child: Text(
                  (auth.user?.displayName ?? 'D')[0].toUpperCase(),
                  style: const TextStyle(
                      color: Colors.white, fontWeight: FontWeight.w700),
                ),
              ),
              onSelected: (v) async {
                if (v == 'logout') {
                  final navigator = Navigator.of(context);
                  await auth.logout();
                  if (!mounted) return;
                  navigator.pushReplacement(
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
      body: dp.loading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: () => dp.loadProfile(),
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  if (dp.error != null) _errorBanner(dp.error!),
                  if (dp.error != null) const SizedBox(height: 14),

                  _dutyCard(dp),
                  const SizedBox(height: 14),

                  _profileCard(dp, auth),
                  const SizedBox(height: 14),

                  if (dp.onDuty) _gpsCard(),
                  if (dp.onDuty) const SizedBox(height: 14),

                  _waitingButton(dp),
                ],
              ),
            ),
    );
  }

  Widget _errorBanner(String msg) => Container(
        padding: const EdgeInsets.all(12),
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
            child: Text(msg,
                style: const TextStyle(
                    color: Color(0xFFDC2626), fontSize: 13)),
          ),
        ]),
      );

  Widget _dutyCard(DriverProvider dp) => Card(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        elevation: 0,
        color: dp.onDuty ? const Color(0xFF0F172A) : Colors.white,
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(children: [
            Row(children: [
              Container(
                width: 14,
                height: 14,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: dp.onDuty
                      ? const Color(0xFF10B981)
                      : const Color(0xFF94A3B8),
                  boxShadow: dp.onDuty
                      ? [
                          BoxShadow(
                              color: const Color(0xFF10B981).withValues(alpha:0.5),
                              blurRadius: 8)
                        ]
                      : null,
                ),
              ),
              const SizedBox(width: 10),
              Text(
                dp.onDuty ? 'ปฏิบัติงานอยู่' : 'ยังไม่เริ่มปฏิบัติงาน',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                  color: dp.onDuty
                      ? Colors.white
                      : const Color(0xFF1E293B),
                ),
              ),
            ]),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              height: 46,
              child: ElevatedButton.icon(
                onPressed: dp.assignedBusId == null ? null : _toggleDuty,
                icon: Icon(dp.onDuty
                    ? Icons.stop_circle
                    : Icons.play_circle),
                label: Text(dp.onDuty ? 'หยุดปฏิบัติงาน' : 'เริ่มปฏิบัติงาน'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: dp.onDuty
                      ? const Color(0xFFEF4444)
                      : const Color(0xFF10B981),
                  foregroundColor: Colors.white,
                  disabledBackgroundColor: Colors.grey.shade300,
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10)),
                  elevation: 0,
                ),
              ),
            ),
            if (dp.assignedBusId == null) ...[
              const SizedBox(height: 8),
              Text(
                'ยังไม่มีรถที่ได้รับมอบหมาย',
                style: TextStyle(
                    fontSize: 12,
                    color: dp.onDuty
                        ? Colors.white54
                        : Colors.grey.shade500),
              ),
            ],
          ]),
        ),
      );

  Widget _profileCard(DriverProvider dp, AuthProvider auth) => Card(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        elevation: 0,
        child: Padding(
          padding: const EdgeInsets.all(16),
          child:
              Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            const Row(children: [
              Icon(Icons.badge_outlined, color: Color(0xFF3B82F6), size: 20),
              SizedBox(width: 8),
              Text('ข้อมูลพนักงาน',
                  style: TextStyle(
                      fontWeight: FontWeight.w700, fontSize: 15)),
            ]),
            const Divider(height: 20),
            _row(Icons.person_outline, 'ชื่อ',
                auth.user?.displayName ?? '-'),
            const SizedBox(height: 8),
            _row(Icons.numbers, 'รหัสพนักงาน',
                dp.employeeCode ?? '-'),
            const SizedBox(height: 8),
            _row(
              Icons.directions_bus_outlined,
              'รถที่รับผิดชอบ',
              dp.assignedBusPlate ??
                  (dp.assignedBusId != null
                      ? _shortId(dp.assignedBusId!)
                      : 'ยังไม่ได้รับมอบหมาย'),
            ),
            const SizedBox(height: 8),
            _row(
              Icons.route_outlined,
              'เส้นทาง',
              dp.assignedRouteName ??
                  (dp.assignedRouteId != null
                      ? _shortId(dp.assignedRouteId!)
                      : 'ยังไม่ได้รับมอบหมาย'),
            ),
          ]),
        ),
      );

  Widget _gpsCard() => Card(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        elevation: 0,
        color: const Color(0xFFEFF6FF),
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Row(children: [
            Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                color: const Color(0xFF3B82F6).withValues(alpha:0.15),
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Icon(Icons.gps_fixed,
                  color: Color(0xFF2563EB), size: 20),
            ),
            const SizedBox(width: 12),
            const Expanded(
              child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('GPS กำลังส่งตำแหน่ง',
                        style: TextStyle(
                            fontWeight: FontWeight.w700,
                            color: Color(0xFF1E40AF))),
                    Text('ส่งพิกัดทุก 5 วินาที',
                        style: TextStyle(
                            fontSize: 12, color: Color(0xFF3B82F6))),
                  ]),
            ),
            const _PulsingDot(),
          ]),
        ),
      );

  Widget _waitingButton(DriverProvider dp) => Card(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        elevation: 0,
        child: InkWell(
          borderRadius: BorderRadius.circular(14),
          onTap: () => Navigator.of(context).push(
            MaterialPageRoute(builder: (_) => const WaitingList()),
          ),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Row(children: [
              Container(
                width: 46,
                height: 46,
                decoration: BoxDecoration(
                  color: dp.waitingPassengers.isNotEmpty
                      ? const Color(0xFFFEF3C7)
                      : const Color(0xFFFEF9C3),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(Icons.people_alt_outlined,
                    color: Color(0xFFD97706), size: 24),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('ผู้โดยสารรอรับ',
                          style: TextStyle(
                              fontWeight: FontWeight.w700, fontSize: 15)),
                      Text(
                        dp.waitingPassengers.isEmpty
                            ? 'ดูรายการและรับผู้โดยสาร'
                            : '${dp.waitingPassengers.length} คนรอรับ',
                        style: TextStyle(
                            fontSize: 12,
                            color: dp.waitingPassengers.isNotEmpty
                                ? const Color(0xFFD97706)
                                : Colors.grey),
                      ),
                    ]),
              ),
              if (dp.waitingPassengers.isNotEmpty)
                Container(
                  padding: const EdgeInsets.symmetric(
                      horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF59E0B),
                    borderRadius: BorderRadius.circular(999),
                  ),
                  child: Text(
                    '${dp.waitingPassengers.length}',
                    style: const TextStyle(
                        color: Colors.white,
                        fontSize: 13,
                        fontWeight: FontWeight.w800),
                  ),
                )
              else
                const Icon(Icons.chevron_right, color: Colors.grey),
            ]),
          ),
        ),
      );

  Widget _row(IconData icon, String label, String value) => Row(
        children: [
          Icon(icon, size: 16, color: Colors.grey),
          const SizedBox(width: 8),
          Text('$label: ',
              style: const TextStyle(color: Colors.grey, fontSize: 13)),
          Expanded(
              child: Text(value,
                  style: const TextStyle(
                      fontSize: 13, fontWeight: FontWeight.w600),
                  overflow: TextOverflow.ellipsis)),
        ],
      );

  String _shortId(String id) =>
      id.length > 8 ? '${id.substring(0, 8)}…' : id;
}

class _PulsingDot extends StatefulWidget {
  const _PulsingDot();

  @override
  State<_PulsingDot> createState() => _PulsingDotState();
}

class _PulsingDotState extends State<_PulsingDot>
    with SingleTickerProviderStateMixin {
  late AnimationController _ctrl;
  late Animation<double> _anim;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(
        vsync: this, duration: const Duration(seconds: 1))
      ..repeat(reverse: true);
    _anim = Tween(begin: 0.4, end: 1.0).animate(_ctrl);
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return FadeTransition(
      opacity: _anim,
      child: Container(
        width: 10,
        height: 10,
        decoration: const BoxDecoration(
            shape: BoxShape.circle, color: Color(0xFF10B981)),
      ),
    );
  }
}
