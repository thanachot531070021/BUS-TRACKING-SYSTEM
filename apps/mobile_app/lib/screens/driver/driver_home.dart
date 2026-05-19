import 'dart:async';
import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:provider/provider.dart';
import '../../models/waiting_model.dart';
import '../../providers/auth_provider.dart';
import '../../providers/driver_provider.dart';
import '../../screens/auth/login_screen.dart';

// ── Design tokens (Friendly Light theme from design system) ─────────────────
const _kPrimary     = Color(0xFF3B82F6);
const _kPrimaryD    = Color(0xFF2563EB);
const _kPrimarySoft = Color(0xFFE6EFFF);
const _kBg          = Color(0xFFF6F7FB);
const _kSurfaceSoft = Color(0xFFF0F2F7);
const _kTextStrong  = Color(0xFF0F172A);
const _kText2       = Color(0xFF6B7891);
const _kText3       = Color(0xFF98A2B3);
const _kDanger      = Color(0xFFEF4444);
const _kCardShadow  = [
  BoxShadow(color: Color(0x100F172A), blurRadius: 16, offset: Offset(0, 6)),
];

// ════════════════════════════════════════════════════════════════════════════
// DRIVER HOME — 4-tab shell
// ════════════════════════════════════════════════════════════════════════════
class DriverHome extends StatefulWidget {
  const DriverHome({super.key});
  @override
  State<DriverHome> createState() => _DriverHomeState();
}

class _DriverHomeState extends State<DriverHome> {
  int _tab = 0;
  Timer? _clockTimer;
  DateTime _now = DateTime.now();

  @override
  void initState() {
    super.initState();
    _clockTimer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (mounted) setState(() => _now = DateTime.now());
    });
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) context.read<DriverProvider>().loadProfile();
    });
  }

  @override
  void dispose() {
    _clockTimer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _kBg,
      body: IndexedStack(
        index: _tab,
        children: [
          _DutyTab(now: _now, onSwitchToWaiting: () => setState(() => _tab = 1)),
          _WaitingTab(),
          _HistoryTab(),
          _DriverProfileTab(),
        ],
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _tab,
        onDestinationSelected: (i) => setState(() => _tab = i),
        backgroundColor: Colors.white,
        indicatorColor: _kPrimarySoft,
        surfaceTintColor: Colors.transparent,
        height: 64,
        labelBehavior: NavigationDestinationLabelBehavior.alwaysShow,
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.directions_bus_outlined),
            selectedIcon: Icon(Icons.directions_bus, color: _kPrimary),
            label: 'หน้าหลัก',
          ),
          NavigationDestination(
            icon: Icon(Icons.people_alt_outlined),
            selectedIcon: Icon(Icons.people_alt, color: _kPrimary),
            label: 'ผู้โดยสาร',
          ),
          NavigationDestination(
            icon: Icon(Icons.history_outlined),
            selectedIcon: Icon(Icons.history, color: _kPrimary),
            label: 'ประวัติ',
          ),
          NavigationDestination(
            icon: Icon(Icons.person_outline),
            selectedIcon: Icon(Icons.person, color: _kPrimary),
            label: 'โปรไฟล์',
          ),
        ],
      ),
    );
  }
}

// ════════════════════════════════════════════════════════════════════════════
// TAB 0 — DUTY TAB
// ════════════════════════════════════════════════════════════════════════════
class _DutyTab extends StatelessWidget {
  final DateTime now;
  final VoidCallback onSwitchToWaiting;
  const _DutyTab({required this.now, required this.onSwitchToWaiting});

  @override
  Widget build(BuildContext context) {
    final dp = context.watch<DriverProvider>();
    return SafeArea(
      child: Column(
        children: [
          _AppBar(
            title: 'หน้าหลัก',
            trailing: Stack(
              children: [
                IconButton(
                  icon: const Icon(Icons.notifications_outlined),
                  onPressed: () {},
                  color: _kTextStrong,
                ),
              ],
            ),
          ),
          Expanded(
            child: dp.loading
                ? const Center(child: CircularProgressIndicator(color: _kPrimary))
                : RefreshIndicator(
                    onRefresh: () => dp.loadProfile(),
                    color: _kPrimary,
                    child: ListView(
                      padding: const EdgeInsets.fromLTRB(20, 0, 20, 100),
                      children: [
                        if (dp.error != null) ...[
                          _ErrorBanner(msg: dp.error!),
                          const SizedBox(height: 12),
                        ],

                        // Hero duty card
                        _DutyCard(dp: dp, now: now),
                        const SizedBox(height: 16),

                        // Bus + Route info cards
                        Row(
                          children: [
                            Expanded(
                              child: _InfoCard(
                                label: 'รถที่ขับ',
                                value: dp.assignedBusPlate ?? '—',
                                sub: dp.assignedBusId != null
                                    ? 'ID ${_shortId(dp.assignedBusId!)}'
                                    : 'ยังไม่ได้รับมอบหมาย',
                                icon: Icons.directions_bus,
                                iconFg: Colors.white,
                                iconBg: _kPrimary,
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: _InfoCard(
                                label: 'เส้นทาง',
                                value: dp.assignedRouteId != null
                                    ? (dp.assignedRouteName?.split(' ').first ?? 'R-??')
                                    : '—',
                                sub: dp.assignedRouteName ?? 'ยังไม่ได้รับมอบหมาย',
                                icon: Icons.route_outlined,
                                iconFg: _kPrimaryD,
                                iconBg: _kPrimarySoft,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 20),

                        // Waiting passengers section
                        _SectionLabel(
                          title: 'ผู้โดยสารกำลังรอ',
                          linkLabel: dp.waitingPassengers.isEmpty
                              ? null
                              : 'ดู ${dp.waitingPassengers.length} คน',
                          onLink: dp.waitingPassengers.isEmpty ? null : onSwitchToWaiting,
                        ),
                        _MiniMapCard(dp: dp, onNavigate: onSwitchToWaiting),
                      ],
                    ),
                  ),
          ),
        ],
      ),
    );
  }
}

// ─── Duty hero card ──────────────────────────────────────────────────────────
class _DutyCard extends StatelessWidget {
  final DriverProvider dp;
  final DateTime now;
  const _DutyCard({required this.dp, required this.now});

  String get _elapsed {
    if (dp.dutyStartedAt == null) return '00:00:00';
    final d = now.difference(dp.dutyStartedAt!);
    final h = d.inHours.toString().padLeft(2, '0');
    final m = (d.inMinutes % 60).toString().padLeft(2, '0');
    final s = (d.inSeconds % 60).toString().padLeft(2, '0');
    return '$h:$m:$s';
  }

  Future<void> _toggle(BuildContext context) async {
    if (dp.assignedBusId == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
        content: Text('ยังไม่มีรถที่ได้รับมอบหมาย กรุณาติดต่อ Admin'),
        backgroundColor: _kDanger,
      ));
      return;
    }
    final ok = await dp.toggleDuty();
    if (!context.mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Text(ok
          ? (dp.onDuty ? '🟢 เริ่มปฏิบัติงานแล้ว' : '⚫ หยุดปฏิบัติงานแล้ว')
          : '❌ เกิดข้อผิดพลาด กรุณาลองอีกครั้ง'),
      backgroundColor: ok
          ? (dp.onDuty ? const Color(0xFF10B981) : const Color(0xFF6B7280))
          : _kDanger,
    ));
  }

  @override
  Widget build(BuildContext context) {
    final isOn = dp.onDuty;
    return GestureDetector(
      onTap: () => _toggle(context),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
        decoration: BoxDecoration(
          gradient: isOn
              ? const LinearGradient(
                  colors: [Color(0xFF3B82F6), Color(0xFF1D4ED8)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                )
              : null,
          color: isOn ? null : _kTextStrong,
          borderRadius: BorderRadius.circular(24),
        ),
        padding: const EdgeInsets.all(22),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'สถานะการทำงาน',
                        style: TextStyle(
                          fontSize: 14,
                          color: Colors.white.withValues(alpha: 0.78),
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        isOn ? '🟢 กำลังปฏิบัติงาน' : '⚫ ออฟดิวตี้',
                        style: const TextStyle(
                          fontSize: 24,
                          fontWeight: FontWeight.w800,
                          color: Colors.white,
                          letterSpacing: -0.3,
                          height: 1.15,
                        ),
                      ),
                      const SizedBox(height: 3),
                      Text(
                        isOn
                            ? 'ส่งตำแหน่ง GPS ทุก 5 วินาที'
                            : 'แตะเพื่อเริ่มต้นวันทำงาน',
                        style: TextStyle(
                          fontSize: 14,
                          color: Colors.white.withValues(alpha: 0.85),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 14),
                _DutyToggle(on: isOn),
              ],
            ),

            // Stats grid (only when on duty)
            if (isOn) ...[
              const SizedBox(height: 18),
              ClipRRect(
                borderRadius: BorderRadius.circular(14),
                child: Column(
                  children: [
                    IntrinsicHeight(
                      child: Row(
                        children: [
                          Expanded(child: _StatCell(label: 'ระยะเวลา', value: _elapsed)),
                          Container(width: 1, color: Colors.white.withValues(alpha: 0.18)),
                          Expanded(child: _StatCell(label: 'ระยะทาง', value: '— กม.')),
                        ],
                      ),
                    ),
                    Container(height: 1, color: Colors.white.withValues(alpha: 0.18)),
                    IntrinsicHeight(
                      child: Row(
                        children: [
                          Expanded(child: _StatCell(label: 'ความเร็วเฉลี่ย', value: '— km/h')),
                          Container(width: 1, color: Colors.white.withValues(alpha: 0.18)),
                          Expanded(
                            child: _StatCell(
                              label: 'ผู้โดยสาร',
                              value: '${dp.waitingPassengers.length} คน',
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _DutyToggle extends StatelessWidget {
  final bool on;
  const _DutyToggle({required this.on});
  @override
  Widget build(BuildContext context) {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 220),
      width: 72,
      height: 44,
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: on ? 0.32 : 0.22),
        border: Border.all(color: Colors.white.withValues(alpha: 0.32), width: 2),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Stack(
        children: [
          AnimatedPositioned(
            duration: const Duration(milliseconds: 220),
            curve: Curves.easeInOut,
            left: on ? 30.0 : 4.0,
            top: 4,
            child: Container(
              width: 32,
              height: 32,
              decoration: BoxDecoration(
                color: Colors.white,
                shape: BoxShape.circle,
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.25),
                    blurRadius: 6,
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _StatCell extends StatelessWidget {
  final String label;
  final String value;
  const _StatCell({required this.label, required this.value});
  @override
  Widget build(BuildContext context) {
    return Container(
      color: Colors.black.withValues(alpha: 0.18),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: TextStyle(fontSize: 12, color: Colors.white.withValues(alpha: 0.78)),
          ),
          const SizedBox(height: 2),
          Text(
            value,
            style: const TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.w800,
              color: Colors.white,
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Info card (bus / route) ─────────────────────────────────────────────────
class _InfoCard extends StatelessWidget {
  final String label, value, sub;
  final IconData icon;
  final Color iconFg, iconBg;
  const _InfoCard({
    required this.label,
    required this.value,
    required this.sub,
    required this.icon,
    required this.iconFg,
    required this.iconBg,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: _kCardShadow,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label.toUpperCase(),
            style: const TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w700,
              color: _kText3,
              letterSpacing: 0.8,
            ),
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              Container(
                width: 38,
                height: 38,
                decoration: BoxDecoration(
                  color: iconBg,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(icon, color: iconFg, size: 20),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      value,
                      style: const TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w800,
                        color: _kTextStrong,
                      ),
                      overflow: TextOverflow.ellipsis,
                    ),
                    Text(
                      sub,
                      style: const TextStyle(fontSize: 12, color: _kText2),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

// ─── Mini map preview card ───────────────────────────────────────────────────
class _MiniMapCard extends StatelessWidget {
  final DriverProvider dp;
  final VoidCallback onNavigate;
  const _MiniMapCard({required this.dp, required this.onNavigate});

  @override
  Widget build(BuildContext context) {
    final count = dp.waitingPassengers.length;
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: _kCardShadow,
      ),
      clipBehavior: Clip.hardEdge,
      child: Column(
        children: [
          SizedBox(
            height: 140,
            child: LayoutBuilder(
              builder: (_, c) => Stack(
                clipBehavior: Clip.hardEdge,
                children: [
                  const Positioned.fill(child: _MapBg()),
                  if (count >= 1) _pin(c, 0.20, 0.50, '⏳', waiting: true),
                  if (count >= 2) _pin(c, 0.58, 0.35, '⏳', waiting: true),
                  if (count >= 3) _pin(c, 0.76, 0.65, '⏳', waiting: true),
                  _pin(c, 0.38, 0.72, '🚍', bus: true),
                ],
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 14, 16, 14),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        count == 0
                            ? 'ไม่มีผู้โดยสารรอ'
                            : '$count คน ในเส้นทางของคุณ',
                        style: const TextStyle(
                          fontSize: 17,
                          fontWeight: FontWeight.w700,
                          color: _kTextStrong,
                        ),
                      ),
                      Text(
                        count == 0
                            ? 'ยังไม่มีผู้โดยสารแจ้งรอ'
                            : 'แตะเพื่อดูรายละเอียด',
                        style: const TextStyle(fontSize: 13, color: _kText2),
                      ),
                    ],
                  ),
                ),
                if (count > 0) ...[
                  const SizedBox(width: 12),
                  FilledButton.icon(
                    onPressed: onNavigate,
                    icon: const Icon(Icons.navigation_outlined, size: 18),
                    label: const Text('ไปจุดใกล้'),
                    style: FilledButton.styleFrom(
                      backgroundColor: _kPrimary,
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12)),
                      padding: const EdgeInsets.symmetric(
                          horizontal: 14, vertical: 10),
                      textStyle: const TextStyle(
                          fontSize: 14, fontWeight: FontWeight.w700),
                    ),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }

  static Widget _pin(
    BoxConstraints c,
    double fx,
    double fy,
    String emoji, {
    bool waiting = false,
    bool bus = false,
  }) {
    final x = c.maxWidth * fx;
    final y = c.maxHeight * fy;
    Color border = _kPrimary;
    Color bg = Colors.white;
    if (waiting) {
      border = const Color(0xFFF59E0B);
      bg = const Color(0xFFFFF4D6);
    }
    if (bus) {
      border = Colors.white;
      bg = _kPrimary;
    }
    return Positioned(
      left: x - 22,
      top: y - 52,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: bg,
              shape: BoxShape.circle,
              border: Border.all(color: border, width: 3),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.22),
                  blurRadius: 8,
                ),
              ],
            ),
            child: Center(
              child: Text(emoji, style: const TextStyle(fontSize: 20)),
            ),
          ),
          SizedBox(
            width: 12,
            height: 8,
            child: CustomPaint(painter: _TailPainter(border)),
          ),
        ],
      ),
    );
  }
}

class _MapBg extends StatelessWidget {
  const _MapBg();
  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: [Color(0xFFE8F0D8), Color(0xFFD4E0DC)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      child: CustomPaint(painter: _RoadPainter()),
    );
  }
}

class _RoadPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size s) {
    final p = Paint()
      ..color = Colors.white.withValues(alpha: 0.85)
      ..strokeWidth = s.height * 0.028;
    canvas.drawLine(Offset(0, s.height * 0.28), Offset(s.width, s.height * 0.28), p);
    canvas.drawLine(Offset(0, s.height * 0.66), Offset(s.width, s.height * 0.66), p);
    canvas.drawLine(Offset(s.width * 0.30, 0), Offset(s.width * 0.30, s.height), p);
    canvas.drawLine(Offset(s.width * 0.72, 0), Offset(s.width * 0.72, s.height), p);
  }

  @override
  bool shouldRepaint(_RoadPainter o) => false;
}

class _TailPainter extends CustomPainter {
  final Color color;
  const _TailPainter(this.color);
  @override
  void paint(Canvas canvas, Size s) {
    canvas.drawPath(
      Path()
        ..moveTo(0, 0)
        ..lineTo(s.width / 2, s.height)
        ..lineTo(s.width, 0)
        ..close(),
      Paint()..color = color,
    );
  }

  @override
  bool shouldRepaint(_TailPainter o) => o.color != color;
}

// ════════════════════════════════════════════════════════════════════════════
// TAB 1 — WAITING TAB (full-screen map + draggable list)
// ════════════════════════════════════════════════════════════════════════════
class _WaitingTab extends StatefulWidget {
  @override
  State<_WaitingTab> createState() => _WaitingTabState();
}

class _WaitingTabState extends State<_WaitingTab> {
  GoogleMapController? _mapCtrl;
  String? _focusedId;
  static const _defaultCenter = LatLng(13.7563, 100.5018);

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) context.read<DriverProvider>().loadWaitingPassengers();
    });
  }

  @override
  void dispose() {
    _mapCtrl?.dispose();
    super.dispose();
  }

  Set<Marker> _buildMarkers(List<WaitingModel> list) {
    final markers = <Marker>{};
    for (int i = 0; i < list.length; i++) {
      final p = list[i];
      if (p.lat == null || p.lng == null) continue;
      final focused = p.id == _focusedId;
      markers.add(Marker(
        markerId: MarkerId('w_${p.id}'),
        position: LatLng(p.lat!, p.lng!),
        icon: BitmapDescriptor.defaultMarkerWithHue(
          focused ? BitmapDescriptor.hueYellow : BitmapDescriptor.hueOrange,
        ),
        infoWindow: InfoWindow(
          title: 'ผู้โดยสาร ${i + 1}',
          snippet: p.createdAt != null ? 'รอตั้งแต่ ${_fmtTime(p.createdAt!)}' : 'กำลังรอ',
        ),
        onTap: () {
          setState(() => _focusedId = p.id);
          _mapCtrl?.animateCamera(CameraUpdate.newLatLngZoom(LatLng(p.lat!, p.lng!), 16));
        },
      ));
    }
    return markers;
  }

  void _focusOn(WaitingModel p) {
    if (p.lat == null || p.lng == null) return;
    setState(() => _focusedId = p.id);
    _mapCtrl?.animateCamera(CameraUpdate.newLatLngZoom(LatLng(p.lat!, p.lng!), 16));
  }

  LatLng _center(List<WaitingModel> list) {
    for (final p in list) {
      if (p.lat != null && p.lng != null) return LatLng(p.lat!, p.lng!);
    }
    return _defaultCenter;
  }

  Future<void> _pickup(String id) async {
    final dp = context.read<DriverProvider>();
    final ok = await dp.markPickup(id);
    if (!mounted) return;
    if (ok && _focusedId == id) setState(() => _focusedId = null);
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Text(ok ? '✅ รับผู้โดยสารเรียบร้อย' : '❌ เกิดข้อผิดพลาด'),
      backgroundColor: ok ? const Color(0xFF10B981) : _kDanger,
    ));
  }

  String _fmtTime(DateTime dt) =>
      '${dt.hour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')}';

  @override
  Widget build(BuildContext context) {
    final dp = context.watch<DriverProvider>();
    final waiting = dp.waitingPassengers;

    return SafeArea(
      child: Column(
        children: [
          _AppBar(
            title: 'ผู้โดยสารรอรับ',
            trailing: IconButton(
              icon: const Icon(Icons.refresh_outlined),
              onPressed: () => dp.loadWaitingPassengers(),
              color: _kTextStrong,
            ),
          ),
          if (!dp.onDuty)
            Expanded(
              child: Center(
                child: Padding(
                  padding: const EdgeInsets.all(32),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Container(
                        width: 80,
                        height: 80,
                        decoration: BoxDecoration(
                            color: _kSurfaceSoft,
                            borderRadius: BorderRadius.circular(24)),
                        child: const Icon(Icons.people_alt_outlined,
                            size: 40, color: _kText3),
                      ),
                      const SizedBox(height: 16),
                      const Text('ยังไม่ได้เริ่มปฏิบัติงาน',
                          style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.w700,
                              color: _kTextStrong)),
                      const SizedBox(height: 8),
                      const Text('เปิด duty ในหน้าหลักเพื่อรับผู้โดยสาร',
                          style: TextStyle(fontSize: 14, color: _kText2),
                          textAlign: TextAlign.center),
                    ],
                  ),
                ),
              ),
            )
          else
            Expanded(
              child: Stack(
                children: [
                  // Full-screen Google Map
                  GoogleMap(
                    initialCameraPosition: CameraPosition(
                      target: _center(waiting),
                      zoom: waiting.isEmpty ? 13 : 14,
                    ),
                    markers: _buildMarkers(waiting),
                    myLocationEnabled: true,
                    myLocationButtonEnabled: false,
                    zoomControlsEnabled: false,
                    mapToolbarEnabled: false,
                    onMapCreated: (ctrl) => setState(() => _mapCtrl = ctrl),
                  ),

                  // Passenger count badge (top-left)
                  Positioned(
                    top: 12,
                    left: 12,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 12, vertical: 7),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(20),
                        boxShadow: _kCardShadow,
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.people_alt_outlined,
                              size: 16, color: Color(0xFFD97706)),
                          const SizedBox(width: 6),
                          Text(
                            waiting.isEmpty
                                ? 'ไม่มีผู้โดยสาร'
                                : '${waiting.length} คน รอรับ',
                            style: const TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w700,
                                color: Color(0xFF92400E)),
                          ),
                        ],
                      ),
                    ),
                  ),

                  // Route badge (top-right)
                  if (dp.assignedRouteName != null)
                    Positioned(
                      top: 12,
                      right: 12,
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 10, vertical: 7),
                        decoration: BoxDecoration(
                          color: _kPrimary,
                          borderRadius: BorderRadius.circular(20),
                          boxShadow: _kCardShadow,
                        ),
                        child: Text(
                          dp.assignedRouteName!,
                          style: const TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w700,
                              color: Colors.white),
                        ),
                      ),
                    ),

                  // Draggable bottom sheet with passenger list
                  DraggableScrollableSheet(
                    initialChildSize: 0.28,
                    minChildSize: 0.12,
                    maxChildSize: 0.75,
                    snap: true,
                    snapSizes: const [0.28, 0.55, 0.75],
                    builder: (_, scrollCtrl) => Container(
                      decoration: const BoxDecoration(
                        color: Colors.white,
                        borderRadius:
                            BorderRadius.vertical(top: Radius.circular(24)),
                        boxShadow: [
                          BoxShadow(
                              color: Color(0x200F172A),
                              blurRadius: 24,
                              offset: Offset(0, -4))
                        ],
                      ),
                      child: Column(
                        children: [
                          // Drag handle
                          Container(
                            margin: const EdgeInsets.only(top: 10, bottom: 6),
                            width: 40,
                            height: 4,
                            decoration: BoxDecoration(
                              color: const Color(0xFFE2E8F0),
                              borderRadius: BorderRadius.circular(2),
                            ),
                          ),
                          // Sheet header
                          Padding(
                            padding: const EdgeInsets.fromLTRB(20, 2, 20, 10),
                            child: Row(
                              children: [
                                Text(
                                  waiting.isEmpty
                                      ? 'ไม่มีผู้โดยสารรอ'
                                      : '${waiting.length} คน กำลังรอ',
                                  style: const TextStyle(
                                      fontSize: 16,
                                      fontWeight: FontWeight.w700,
                                      color: _kTextStrong),
                                ),
                                const Spacer(),
                                if (waiting.isNotEmpty)
                                  const Text('แตะ pin หรือ 📍 เพื่อโฟกัส',
                                      style:
                                          TextStyle(fontSize: 11, color: _kText3)),
                              ],
                            ),
                          ),
                          // Passenger list
                          Expanded(
                            child: waiting.isEmpty
                                ? Center(
                                    child: Padding(
                                      padding: const EdgeInsets.all(24),
                                      child: Column(
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          Container(
                                            width: 56,
                                            height: 56,
                                            decoration: BoxDecoration(
                                              color: const Color(0xFFF0FDF4),
                                              borderRadius:
                                                  BorderRadius.circular(16),
                                            ),
                                            child: const Icon(
                                                Icons.check_circle_outline,
                                                size: 32,
                                                color: Color(0xFF10B981)),
                                          ),
                                          const SizedBox(height: 12),
                                          const Text('ยังไม่มีผู้โดยสารแจ้งรอ',
                                              style: TextStyle(
                                                  fontSize: 15, color: _kText2)),
                                        ],
                                      ),
                                    ),
                                  )
                                : ListView.builder(
                                    controller: scrollCtrl,
                                    padding: const EdgeInsets.fromLTRB(
                                        16, 0, 16, 24),
                                    itemCount: waiting.length,
                                    itemBuilder: (_, i) => _WaitingMapCard(
                                      w: waiting[i],
                                      index: i + 1,
                                      isFocused: waiting[i].id == _focusedId,
                                      onFocus: () => _focusOn(waiting[i]),
                                      onPickup: () => _pickup(waiting[i].id),
                                    ),
                                  ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }
}

class _WaitingMapCard extends StatelessWidget {
  final WaitingModel w;
  final int index;
  final bool isFocused;
  final VoidCallback onFocus;
  final VoidCallback onPickup;
  const _WaitingMapCard({
    required this.w,
    required this.index,
    required this.isFocused,
    required this.onFocus,
    required this.onPickup,
  });

  @override
  Widget build(BuildContext context) {
    final hasCoords = w.lat != null && w.lng != null;
    final timeText = w.createdAt != null
        ? 'รอตั้งแต่ ${w.createdAt!.hour.toString().padLeft(2, '0')}:${w.createdAt!.minute.toString().padLeft(2, '0')}'
        : 'กำลังรอ';

    return GestureDetector(
      onTap: hasCoords ? onFocus : null,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: isFocused ? const Color(0xFFFFF7ED) : Colors.white,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(
            color: isFocused ? const Color(0xFFF59E0B) : Colors.transparent,
            width: 2,
          ),
          boxShadow: _kCardShadow,
        ),
        child: Row(
          children: [
            // Number badge
            Container(
              width: 42,
              height: 42,
              decoration: BoxDecoration(
                color: isFocused ? const Color(0xFFFEF3C7) : _kPrimarySoft,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Center(
                child: Text(
                  '$index',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w800,
                    color: isFocused ? const Color(0xFFD97706) : _kPrimaryD,
                  ),
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (hasCoords)
                    Row(children: [
                      const Icon(Icons.location_on_outlined,
                          size: 13, color: Color(0xFFD97706)),
                      const SizedBox(width: 3),
                      Expanded(
                        child: Text(
                          '${w.lat!.toStringAsFixed(4)}, ${w.lng!.toStringAsFixed(4)}',
                          style: const TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w700,
                              color: _kTextStrong),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ])
                  else
                    const Text('ไม่มีพิกัด',
                        style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w700,
                            color: _kText2)),
                  const SizedBox(height: 2),
                  Text(timeText,
                      style: const TextStyle(fontSize: 12, color: _kText2)),
                ],
              ),
            ),
            const SizedBox(width: 10),
            Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                if (hasCoords) ...[
                  GestureDetector(
                    onTap: onFocus,
                    child: Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: _kPrimarySoft,
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: const Icon(Icons.my_location_outlined,
                          size: 16, color: _kPrimaryD),
                    ),
                  ),
                  const SizedBox(height: 6),
                ],
                GestureDetector(
                  onTap: onPickup,
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 12, vertical: 8),
                    decoration: BoxDecoration(
                      color: const Color(0xFF10B981),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Text('รับแล้ว',
                        style: TextStyle(
                            fontSize: 13,
                            color: Colors.white,
                            fontWeight: FontWeight.w700)),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

// ════════════════════════════════════════════════════════════════════════════
// TAB 2 — HISTORY TAB (placeholder)
// ════════════════════════════════════════════════════════════════════════════
class _HistoryTab extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Column(
        children: [
          const _AppBar(title: 'ประวัติการทำงาน'),
          Expanded(
            child: Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    width: 80,
                    height: 80,
                    decoration: BoxDecoration(
                        color: _kPrimarySoft,
                        borderRadius: BorderRadius.circular(24)),
                    child: const Icon(Icons.history, size: 40, color: _kPrimaryD),
                  ),
                  const SizedBox(height: 16),
                  const Text('ประวัติการทำงาน',
                      style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w700,
                          color: _kTextStrong)),
                  const SizedBox(height: 8),
                  const Text(
                    'จะแสดงรอบการทำงานและ\nผู้โดยสารที่รับในแต่ละวัน',
                    style: TextStyle(fontSize: 14, color: _kText2),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ════════════════════════════════════════════════════════════════════════════
// TAB 3 — DRIVER PROFILE TAB
// ════════════════════════════════════════════════════════════════════════════
class _DriverProfileTab extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final dp = context.watch<DriverProvider>();
    final name = auth.user?.displayName ?? 'คนขับ';
    final initial = name.isNotEmpty ? name[0].toUpperCase() : 'D';

    return SafeArea(
      child: Column(
        children: [
          const _AppBar(title: 'โปรไฟล์'),
          Expanded(
            child: ListView(
              padding: const EdgeInsets.fromLTRB(20, 0, 20, 100),
              children: [
                // Avatar header card
                Container(
                  padding: const EdgeInsets.all(22),
                  decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(20),
                      boxShadow: _kCardShadow),
                  child: Row(
                    children: [
                      Container(
                        width: 72,
                        height: 72,
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(
                            colors: [Color(0xFFa78bfa), Color(0xFF6366f1)],
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                          ),
                          borderRadius: BorderRadius.circular(999),
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
                                    color: _kTextStrong)),
                            if (dp.employeeCode != null) ...[
                              const SizedBox(height: 2),
                              Text('รหัส: ${dp.employeeCode}',
                                  style: const TextStyle(
                                      fontSize: 14, color: _kText2)),
                            ],
                            const SizedBox(height: 8),
                            const _StatusChip(label: 'คนขับรถ', success: true),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 20),

                // Assignment info
                const _SectionLabel(title: 'ข้อมูลการมอบหมาย'),
                _ListCard(children: [
                  _ListRow(
                    icon: Icons.directions_bus_outlined,
                    iconBg: _kPrimary,
                    iconFg: Colors.white,
                    title: 'ทะเบียนรถ',
                    sub: dp.assignedBusPlate ?? 'ยังไม่ได้รับมอบหมาย',
                  ),
                  _ListRow(
                    icon: Icons.route_outlined,
                    iconBg: _kPrimarySoft,
                    iconFg: _kPrimaryD,
                    title: 'เส้นทาง',
                    sub: dp.assignedRouteName ?? 'ยังไม่ได้รับมอบหมาย',
                  ),
                  _ListRow(
                    icon: Icons.gps_fixed,
                    iconBg: const Color(0xFFE0F2FE),
                    iconFg: const Color(0xFF0369A1),
                    title: 'GPS Interval',
                    sub: '5 วินาที เมื่อ ON duty',
                  ),
                ]),
                const SizedBox(height: 20),

                // Account
                const _SectionLabel(title: 'บัญชี'),
                _ListCard(children: [
                  _ListRow(
                    icon: Icons.person_outline,
                    title: 'ข้อมูลส่วนตัว',
                    sub: 'ชื่อ, รหัสพนักงาน',
                  ),
                  _ListRow(
                    icon: Icons.notifications_outlined,
                    iconBg: const Color(0xFFFFE4D6),
                    iconFg: const Color(0xFFa64b1e),
                    title: 'การแจ้งเตือน',
                    sub: 'เปิดทุกประเภท',
                  ),
                ]),
                const SizedBox(height: 20),

                // Other
                const _SectionLabel(title: 'อื่นๆ'),
                _ListCard(children: [
                  _ListRow(
                    icon: Icons.help_outline,
                    title: 'ช่วยเหลือ',
                  ),
                  _ListRow(
                    icon: Icons.shield_outlined,
                    title: 'ความเป็นส่วนตัว & ความปลอดภัย',
                  ),
                  _ListRow(
                    icon: Icons.logout,
                    iconBg: const Color(0xFFFEE2E2),
                    iconFg: _kDanger,
                    title: 'ออกจากระบบ',
                    titleColor: _kDanger,
                    showChevron: false,
                    onTap: () => _confirmLogout(context, auth),
                  ),
                ]),
                const SizedBox(height: 24),
                const Center(
                  child: Text('Bus Tracking · v2.1.0',
                      style: TextStyle(fontSize: 12, color: _kText3)),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _confirmLogout(BuildContext context, AuthProvider auth) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('ออกจากระบบ',
            style: TextStyle(fontWeight: FontWeight.w700)),
        content: const Text('คุณต้องการออกจากระบบใช่ไหม?'),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(context, false),
              child: const Text('ยกเลิก')),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            style: TextButton.styleFrom(foregroundColor: _kDanger),
            child: const Text('ออกจากระบบ',
                style: TextStyle(fontWeight: FontWeight.w700)),
          ),
        ],
      ),
    );
    if (ok != true || !context.mounted) return;
    final navigator = Navigator.of(context);
    await auth.logout();
    if (!context.mounted) return;
    navigator.pushAndRemoveUntil(
      MaterialPageRoute(builder: (_) => const LoginScreen()),
      (r) => false,
    );
  }
}

// ════════════════════════════════════════════════════════════════════════════
// SHARED WIDGETS
// ════════════════════════════════════════════════════════════════════════════
class _AppBar extends StatelessWidget {
  final String title;
  final Widget? trailing;
  const _AppBar({required this.title, this.trailing});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 14, 12, 6),
      child: Row(
        children: [
          Expanded(
            child: Text(
              title,
              style: const TextStyle(
                fontSize: 26,
                fontWeight: FontWeight.w800,
                color: _kTextStrong,
                letterSpacing: -0.3,
              ),
            ),
          ),
          if (trailing != null) trailing!,
        ],
      ),
    );
  }
}

class _ErrorBanner extends StatelessWidget {
  final String msg;
  const _ErrorBanner({required this.msg});
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(14, 12, 8, 12),
      decoration: BoxDecoration(
        color: const Color(0xFFFEF2F2),
        border: Border.all(color: const Color(0xFFFCA5A5)),
        borderRadius: BorderRadius.circular(14),
      ),
      child: Row(children: [
        const Icon(Icons.warning_amber_rounded, color: _kDanger, size: 18),
        const SizedBox(width: 10),
        Expanded(
            child: Text(msg,
                style: const TextStyle(color: _kDanger, fontSize: 13))),
        TextButton(
          onPressed: () => context.read<DriverProvider>().loadProfile(),
          style: TextButton.styleFrom(
            foregroundColor: _kDanger,
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            minimumSize: Size.zero,
          ),
          child: const Text('ลองใหม่', style: TextStyle(fontSize: 12)),
        ),
      ]),
    );
  }
}

class _SectionLabel extends StatelessWidget {
  final String title;
  final String? linkLabel;
  final VoidCallback? onLink;
  const _SectionLabel({required this.title, this.linkLabel, this.onLink});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10, left: 4, right: 4, top: 4),
      child: Row(
        children: [
          Text(
            title.toUpperCase(),
            style: const TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w700,
              color: _kText3,
              letterSpacing: 0.8,
            ),
          ),
          const Spacer(),
          if (linkLabel != null)
            GestureDetector(
              onTap: onLink,
              child: Text(linkLabel!,
                  style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: _kPrimary)),
            ),
        ],
      ),
    );
  }
}

class _StatusChip extends StatelessWidget {
  final String label;
  final bool success;
  final bool live;
  const _StatusChip({required this.label, this.success = false, this.live = false});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: success ? _kPrimarySoft : _kSurfaceSoft,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (live) ...[
            Container(
              width: 8,
              height: 8,
              decoration: BoxDecoration(
                color: success ? _kPrimary : _kText3,
                shape: BoxShape.circle,
              ),
            ),
            const SizedBox(width: 6),
          ],
          Text(
            label,
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w700,
              color: success ? _kPrimaryD : _kText2,
            ),
          ),
        ],
      ),
    );
  }
}

class _ListCard extends StatelessWidget {
  final List<_ListRow> children;
  const _ListCard({required this.children});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(18),
          boxShadow: _kCardShadow),
      clipBehavior: Clip.hardEdge,
      child: Column(
        children: [
          for (int i = 0; i < children.length; i++) ...[
            if (i > 0)
              const Divider(height: 1, indent: 60, endIndent: 0),
            children[i],
          ],
        ],
      ),
    );
  }
}

class _ListRow extends StatelessWidget {
  final IconData icon;
  final Color iconBg;
  final Color iconFg;
  final String title;
  final String? sub;
  final Color? titleColor;
  final bool showChevron;
  final VoidCallback? onTap;

  const _ListRow({
    required this.icon,
    this.iconBg = _kSurfaceSoft,
    this.iconFg = _kText2,
    required this.title,
    this.sub,
    this.titleColor,
    this.showChevron = true,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
        child: Row(
          children: [
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                  color: iconBg, borderRadius: BorderRadius.circular(14)),
              child: Icon(icon, color: iconFg, size: 22),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: TextStyle(
                        fontSize: 17,
                        fontWeight: FontWeight.w600,
                        color: titleColor ?? _kTextStrong),
                  ),
                  if (sub != null)
                    Text(sub!,
                        style: const TextStyle(fontSize: 14, color: _kText2),
                        overflow: TextOverflow.ellipsis),
                ],
              ),
            ),
            if (showChevron && onTap != null)
              const Icon(Icons.chevron_right, color: _kText3, size: 20),
          ],
        ),
      ),
    );
  }
}

String _shortId(String id) =>
    id.length > 8 ? id.substring(0, 8) : id;
