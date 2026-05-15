import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../models/zone_model.dart';
import '../../providers/auth_provider.dart';
import '../../providers/route_provider.dart';
import '../../screens/auth/login_screen.dart';
import 'zone_map.dart';

class ZonePickerScreen extends StatefulWidget {
  const ZonePickerScreen({super.key});

  @override
  State<ZonePickerScreen> createState() => _ZonePickerScreenState();
}

class _ZonePickerScreenState extends State<ZonePickerScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      final rp = context.read<RouteProvider>();
      rp.loadZones();
      rp.loadRoutes();
    });
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final rp = context.watch<RouteProvider>();

    return Scaffold(
      backgroundColor: const Color(0xFFF1F5F9),
      appBar: AppBar(
        title: const Text('เลือกโซน',
            style: TextStyle(fontWeight: FontWeight.w700)),
        backgroundColor: const Color(0xFF1D4ED8),
        foregroundColor: Colors.white,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () {
              rp.loadZones();
              rp.loadRoutes();
            },
          ),
          Padding(
            padding: const EdgeInsets.only(right: 8),
            child: PopupMenuButton<String>(
              icon: CircleAvatar(
                backgroundColor: Colors.white.withValues(alpha: 0.25),
                child: Text(
                  (auth.user?.displayName ?? 'U')[0].toUpperCase(),
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
                const PopupMenuItem(
                    value: 'logout', child: Text('ออกจากระบบ')),
              ],
            ),
          ),
        ],
      ),
      body: rp.zonesLoading
          ? const Center(child: CircularProgressIndicator())
          : rp.zonesError != null
              ? _errorView(rp)
              : rp.zones.isEmpty
                  ? _emptyView()
                  : RefreshIndicator(
                      onRefresh: () async {
                        await rp.loadZones();
                        await rp.loadRoutes();
                      },
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Padding(
                            padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
                            child: Text(
                              'เลือกโซนที่ต้องการดูรถ',
                              style: TextStyle(
                                  fontSize: 13,
                                  color: Colors.grey.shade600,
                                  fontWeight: FontWeight.w500),
                            ),
                          ),
                          Expanded(
                            child: ListView.builder(
                              padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
                              itemCount: rp.zones.length,
                              itemBuilder: (_, i) =>
                                  _ZoneCard(zone: rp.zones[i], rp: rp),
                            ),
                          ),
                        ],
                      ),
                    ),
    );
  }

  Widget _errorView(RouteProvider rp) => Center(
        child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
          const Icon(Icons.wifi_off, size: 52, color: Colors.grey),
          const SizedBox(height: 12),
          Text(rp.zonesError ?? 'เกิดข้อผิดพลาด',
              style: const TextStyle(color: Colors.grey)),
          const SizedBox(height: 16),
          ElevatedButton(
            onPressed: () {
              rp.loadZones();
              rp.loadRoutes();
            },
            child: const Text('ลองอีกครั้ง'),
          ),
        ]),
      );

  Widget _emptyView() => const Center(
        child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
          Icon(Icons.location_city, size: 52, color: Colors.grey),
          SizedBox(height: 12),
          Text('ยังไม่มีโซน', style: TextStyle(color: Colors.grey)),
        ]),
      );
}

class _ZoneCard extends StatelessWidget {
  final ZoneModel zone;
  final RouteProvider rp;
  const _ZoneCard({required this.zone, required this.rp});

  @override
  Widget build(BuildContext context) {
    final routeCount = rp.routesInZone(zone.id).length;

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      elevation: 0,
      child: InkWell(
        borderRadius: BorderRadius.circular(14),
        onTap: () => Navigator.of(context).push(
          MaterialPageRoute(builder: (_) => ZoneMapScreen(zone: zone)),
        ),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(children: [
            Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                color: zone.isActive
                    ? const Color(0xFFEFF6FF)
                    : const Color(0xFFF1F5F9),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(Icons.location_city,
                  color: zone.isActive
                      ? const Color(0xFF2563EB)
                      : Colors.grey,
                  size: 26),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(children: [
                    Text(zone.code,
                        style: const TextStyle(
                            fontSize: 11,
                            color: Color(0xFF6B7280),
                            fontWeight: FontWeight.w600)),
                    const Spacer(),
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 8, vertical: 2),
                      decoration: BoxDecoration(
                        color: zone.isActive
                            ? const Color(0xFFDCFCE7)
                            : const Color(0xFFF1F5F9),
                        borderRadius: BorderRadius.circular(999),
                      ),
                      child: Text(
                        zone.isActive ? 'เปิดใช้งาน' : 'ปิด',
                        style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                            color: zone.isActive
                                ? const Color(0xFF166534)
                                : Colors.grey),
                      ),
                    ),
                  ]),
                  const SizedBox(height: 4),
                  Text(zone.name,
                      style: const TextStyle(
                          fontSize: 15, fontWeight: FontWeight.w700)),
                  if (zone.province != null && zone.province!.isNotEmpty)
                    Padding(
                      padding: const EdgeInsets.only(top: 2),
                      child: Row(children: [
                        const Icon(Icons.location_on,
                            size: 11, color: Color(0xFF94A3B8)),
                        const SizedBox(width: 3),
                        Text(zone.province!,
                            style: const TextStyle(
                                fontSize: 12, color: Color(0xFF6B7280))),
                      ]),
                    )
                  else if (zone.description != null &&
                      zone.description!.isNotEmpty)
                    Padding(
                      padding: const EdgeInsets.only(top: 2),
                      child: Text(zone.description!,
                          style: const TextStyle(
                              fontSize: 12, color: Color(0xFF6B7280)),
                          overflow: TextOverflow.ellipsis),
                    ),
                  const SizedBox(height: 4),
                  Row(children: [
                    const Icon(Icons.route,
                        size: 12, color: Color(0xFF94A3B8)),
                    const SizedBox(width: 4),
                    Text('$routeCount เส้นทาง',
                        style: const TextStyle(
                            fontSize: 12, color: Color(0xFF6B7280))),
                  ]),
                ],
              ),
            ),
            const Icon(Icons.chevron_right, color: Colors.grey),
          ]),
        ),
      ),
    );
  }
}
