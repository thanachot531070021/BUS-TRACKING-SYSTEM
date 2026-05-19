import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../models/route_model.dart';
import '../../providers/route_provider.dart';
import 'route_detail.dart';

class RoutesTab extends StatefulWidget {
  const RoutesTab({super.key});

  @override
  State<RoutesTab> createState() => _RoutesTabState();
}

class _RoutesTabState extends State<RoutesTab> {
  final _searchCtrl = TextEditingController();
  String _query = '';

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      final rp = context.read<RouteProvider>();
      if (rp.routes.isEmpty) rp.loadRoutes();
    });
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final rp = context.watch<RouteProvider>();
    final all = rp.routes.where((r) => r.isActive).toList();
    final filtered = _query.isEmpty
        ? all
        : all
            .where((r) =>
                r.name.toLowerCase().contains(_query.toLowerCase()) ||
                r.code.toLowerCase().contains(_query.toLowerCase()) ||
                r.startLocation.toLowerCase().contains(_query.toLowerCase()) ||
                r.endLocation.toLowerCase().contains(_query.toLowerCase()))
            .toList();

    return Scaffold(
      backgroundColor: const Color(0xFFF6F7FB),
      body: SafeArea(
        child: Column(
          children: [
            // App bar
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
              child: Row(
                children: [
                  const Expanded(
                    child: Text('ค้นหาเส้นทาง',
                        style: TextStyle(
                            fontSize: 22,
                            fontWeight: FontWeight.w800,
                            color: Color(0xFF0F172A))),
                  ),
                  IconButton(
                    onPressed: () {},
                    icon: const Icon(Icons.notifications_outlined,
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
            const SizedBox(height: 12),

            // Search bar
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Container(
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: const [
                    BoxShadow(
                        color: Color(0x0A000000),
                        blurRadius: 8,
                        offset: Offset(0, 2))
                  ],
                ),
                child: TextField(
                  controller: _searchCtrl,
                  onChanged: (v) => setState(() => _query = v),
                  style:
                      const TextStyle(fontSize: 16, color: Color(0xFF0F172A)),
                  decoration: InputDecoration(
                    hintText: 'ค้นหาเส้นทาง หรือสถานที่',
                    hintStyle: const TextStyle(
                        color: Color(0xFF98A2B3), fontSize: 16),
                    prefixIcon: const Icon(Icons.search,
                        size: 22, color: Color(0xFF6B7891)),
                    suffixIcon: _query.isNotEmpty
                        ? IconButton(
                            icon: const Icon(Icons.close,
                                size: 18, color: Color(0xFF98A2B3)),
                            onPressed: () {
                              _searchCtrl.clear();
                              setState(() => _query = '');
                            },
                          )
                        : null,
                    border: InputBorder.none,
                    contentPadding: const EdgeInsets.symmetric(
                        horizontal: 16, vertical: 16),
                  ),
                ),
              ),
            ),
            const SizedBox(height: 16),

            // List
            Expanded(
              child: rp.loading
                  ? const Center(child: CircularProgressIndicator())
                  : rp.error != null
                      ? _ErrorState(
                          onRetry: () => rp.loadRoutes(),
                        )
                      : filtered.isEmpty
                          ? _EmptyState(query: _query)
                          : _RouteList(routes: filtered),
            ),
          ],
        ),
      ),
    );
  }
}

// ─── Route List ───────────────────────────────────────────────────────────────

class _RouteList extends StatelessWidget {
  final List<RouteModel> routes;
  const _RouteList({required this.routes});

  @override
  Widget build(BuildContext context) {
    return ListView.separated(
      padding: const EdgeInsets.fromLTRB(20, 0, 20, 24),
      itemCount: routes.length,
      separatorBuilder: (_, __) => const SizedBox(height: 12),
      itemBuilder: (_, i) => _RouteCard(route: routes[i]),
    );
  }
}

// ─── Route Card ──────────────────────────────────────────────────────────────

class _RouteCard extends StatelessWidget {
  final RouteModel route;
  const _RouteCard({required this.route});

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(16),
      elevation: 0,
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: () => Navigator.of(context).push(
          MaterialPageRoute(builder: (_) => RouteDetail(route: route)),
        ),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              Container(
                width: 52,
                height: 52,
                decoration: BoxDecoration(
                    color: const Color(0xFFDBEAFE),
                    borderRadius: BorderRadius.circular(16)),
                child: Center(
                  child: Text(
                    route.code.replaceAll('R-', ''),
                    style: const TextStyle(
                        fontSize: 17,
                        fontWeight: FontWeight.w800,
                        color: Color(0xFF1E40AF)),
                  ),
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Text(route.name,
                            style: const TextStyle(
                                fontSize: 17,
                                fontWeight: FontWeight.w700,
                                color: Color(0xFF0F172A))),
                        const SizedBox(width: 8),
                        if (route.zoneName != null)
                          Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 8, vertical: 3),
                            decoration: BoxDecoration(
                                color: const Color(0xFFEFF6FF),
                                borderRadius: BorderRadius.circular(99)),
                            child: Text(route.zoneName!,
                                style: const TextStyle(
                                    fontSize: 11,
                                    fontWeight: FontWeight.w600,
                                    color: Color(0xFF2563EB))),
                          ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text('${route.startLocation} → ${route.endLocation}',
                        style: const TextStyle(
                            fontSize: 14, color: Color(0xFF6B7891)),
                        overflow: TextOverflow.ellipsis),
                  ],
                ),
              ),
              const SizedBox(width: 10),
              const Icon(Icons.chevron_right,
                  size: 20, color: Color(0xFF6B7891)),
            ],
          ),
        ),
      ),
    );
  }
}

// ─── Empty / Error states ─────────────────────────────────────────────────────

class _EmptyState extends StatelessWidget {
  final String query;
  const _EmptyState({required this.query});

  @override
  Widget build(BuildContext context) => Center(
        child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
          Icon(query.isEmpty
              ? Icons.directions_bus_outlined
              : Icons.search_off_outlined,
              size: 48, color: Colors.grey[300]),
          const SizedBox(height: 12),
          Text(
              query.isEmpty
                  ? 'ยังไม่มีสายรถที่เปิดให้บริการ'
                  : 'ไม่พบเส้นทาง "$query"',
              style: TextStyle(fontSize: 14, color: Colors.grey[500])),
        ]),
      );
}

class _ErrorState extends StatelessWidget {
  final VoidCallback onRetry;
  const _ErrorState({required this.onRetry});

  @override
  Widget build(BuildContext context) => Center(
        child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
          Icon(Icons.wifi_off, size: 48, color: Colors.grey[300]),
          const SizedBox(height: 12),
          Text('ไม่สามารถโหลดข้อมูลได้',
              style: TextStyle(fontSize: 14, color: Colors.grey[500])),
          const SizedBox(height: 8),
          TextButton(onPressed: onRetry, child: const Text('ลองอีกครั้ง')),
        ]),
      );
}
