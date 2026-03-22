import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../providers/route_provider.dart';
import '../../models/route_model.dart';
import '../../screens/auth/login_screen.dart';
import 'route_detail.dart';

class PassengerHome extends StatefulWidget {
  const PassengerHome({super.key});

  @override
  State<PassengerHome> createState() => _PassengerHomeState();
}

class _PassengerHomeState extends State<PassengerHome> {
  @override
  void initState() {
    super.initState();
    Future.microtask(() {
      context.read<RouteProvider>().loadRoutes();
    });
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final rp = context.watch<RouteProvider>();

    return Scaffold(
      backgroundColor: const Color(0xFFF1F5F9),
      appBar: AppBar(
        title: const Text('เส้นทางรถ',
            style: TextStyle(fontWeight: FontWeight.w700)),
        backgroundColor: const Color(0xFF1D4ED8),
        foregroundColor: Colors.white,
        elevation: 0,
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 8),
            child: IconButton(
              icon: const Icon(Icons.refresh),
              onPressed: () => rp.loadRoutes(),
            ),
          ),
          Padding(
            padding: const EdgeInsets.only(right: 8),
            child: PopupMenuButton<String>(
              icon: CircleAvatar(
                backgroundColor: Colors.white.withOpacity(0.25),
                child: Text(
                  (auth.user?.displayName ?? 'U')[0].toUpperCase(),
                  style: const TextStyle(
                      color: Colors.white, fontWeight: FontWeight.w700),
                ),
              ),
              onSelected: (v) async {
                if (v == 'logout') {
                  await auth.logout();
                  if (!mounted) return;
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
      body: rp.loading
          ? const Center(child: CircularProgressIndicator())
          : rp.error != null
              ? _errorView(rp)
              : rp.routes.isEmpty
                  ? _emptyView()
                  : RefreshIndicator(
                      onRefresh: () => rp.loadRoutes(),
                      child: ListView.builder(
                        padding: const EdgeInsets.all(16),
                        itemCount: rp.routes.length,
                        itemBuilder: (_, i) => _RouteCard(route: rp.routes[i]),
                      ),
                    ),
    );
  }

  Widget _errorView(RouteProvider rp) => Center(
        child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
          const Icon(Icons.wifi_off, size: 52, color: Colors.grey),
          const SizedBox(height: 12),
          Text(rp.error ?? 'เกิดข้อผิดพลาด',
              style: const TextStyle(color: Colors.grey)),
          const SizedBox(height: 16),
          ElevatedButton(
              onPressed: () => rp.loadRoutes(),
              child: const Text('ลองอีกครั้ง')),
        ]),
      );

  Widget _emptyView() => const Center(
        child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
          Icon(Icons.route, size: 52, color: Colors.grey),
          SizedBox(height: 12),
          Text('ยังไม่มีเส้นทาง', style: TextStyle(color: Colors.grey)),
        ]),
      );
}

class _RouteCard extends StatelessWidget {
  final RouteModel route;
  const _RouteCard({required this.route});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      elevation: 0,
      child: InkWell(
        borderRadius: BorderRadius.circular(14),
        onTap: () => Navigator.of(context).push(
          MaterialPageRoute(builder: (_) => RouteDetail(route: route)),
        ),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(children: [
            Container(
              width: 46,
              height: 46,
              decoration: BoxDecoration(
                color: route.isActive
                    ? const Color(0xFFDCFCE7)
                    : const Color(0xFFF1F5F9),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(Icons.directions_bus,
                  color: route.isActive
                      ? const Color(0xFF16A34A)
                      : Colors.grey,
                  size: 24),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(children: [
                      Text(route.code,
                          style: const TextStyle(
                              fontSize: 12,
                              color: Color(0xFF6B7280),
                              fontWeight: FontWeight.w600)),
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 8, vertical: 2),
                        decoration: BoxDecoration(
                          color: route.isActive
                              ? const Color(0xFFDCFCE7)
                              : const Color(0xFFF1F5F9),
                          borderRadius: BorderRadius.circular(999),
                        ),
                        child: Text(
                          route.isActive ? 'เปิดให้บริการ' : 'ปิดให้บริการ',
                          style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w600,
                              color: route.isActive
                                  ? const Color(0xFF166534)
                                  : Colors.grey),
                        ),
                      ),
                    ]),
                    const SizedBox(height: 4),
                    Text(route.name,
                        style: const TextStyle(
                            fontSize: 15, fontWeight: FontWeight.w700)),
                    const SizedBox(height: 4),
                    Row(children: [
                      const Icon(Icons.circle,
                          size: 8, color: Color(0xFF3B82F6)),
                      const SizedBox(width: 6),
                      Expanded(
                          child: Text(route.startLocation,
                              style: const TextStyle(
                                  fontSize: 12, color: Color(0xFF6B7280)),
                              overflow: TextOverflow.ellipsis)),
                    ]),
                    const SizedBox(height: 2),
                    Row(children: [
                      const Icon(Icons.location_on,
                          size: 8, color: Color(0xFFEF4444)),
                      const SizedBox(width: 6),
                      Expanded(
                          child: Text(route.endLocation,
                              style: const TextStyle(
                                  fontSize: 12, color: Color(0xFF6B7280)),
                              overflow: TextOverflow.ellipsis)),
                    ]),
                  ]),
            ),
            const Icon(Icons.chevron_right, color: Colors.grey),
          ]),
        ),
      ),
    );
  }
}
