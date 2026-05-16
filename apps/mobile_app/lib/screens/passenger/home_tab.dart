import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:provider/provider.dart';
import '../../models/route_model.dart';
import '../../providers/route_provider.dart';
import 'route_detail.dart';

class HomeTab extends StatefulWidget {
  final double topBarHeight;
  const HomeTab({super.key, required this.topBarHeight});

  @override
  State<HomeTab> createState() => _HomeTabState();
}

class _HomeTabState extends State<HomeTab> {
  static const _defaultCenter = LatLng(13.7563, 100.5018); // Bangkok

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      final rp = context.read<RouteProvider>();
      if (rp.routes.isEmpty) rp.loadRoutes();
      rp.startZoneBusPolling();
    });
  }

  @override
  void dispose() {
    context.read<RouteProvider>().stopZoneBusPolling();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final rp = context.watch<RouteProvider>();
    final buses = rp.allLiveBuses;

    final markers = <Marker>{
      for (final bus in buses)
        if (bus.currentLat != null && bus.currentLng != null)
          Marker(
            markerId: MarkerId(bus.id),
            position: LatLng(bus.currentLat!, bus.currentLng!),
            infoWindow: InfoWindow(
              title: bus.plateNumber,
              snippet: bus.routeId,
            ),
            icon: BitmapDescriptor.defaultMarkerWithHue(
                BitmapDescriptor.hueBlue),
          ),
    };

    return Stack(
      children: [
        // ── Full-screen map ──────────────────────────────────────────
        GoogleMap(
          initialCameraPosition: const CameraPosition(
            target: _defaultCenter,
            zoom: 12,
          ),
          markers: markers,
          myLocationEnabled: true,
          myLocationButtonEnabled: false,
          zoomControlsEnabled: false,
          mapToolbarEnabled: false,
        ),

        // ── DraggableScrollableSheet — route list ────────────────────
        DraggableScrollableSheet(
          initialChildSize: 0.28,
          minChildSize: 0.12,
          maxChildSize: 0.85,
          snap: true,
          snapSizes: const [0.12, 0.28, 0.6, 0.85],
          builder: (context, scrollCtrl) => _BottomSheet(
            scrollCtrl: scrollCtrl,
            routes: rp.routes,
            loading: rp.loading,
            error: rp.error,
            onRefresh: () => rp.loadRoutes(),
          ),
        ),
      ],
    );
  }
}

// ─── Bottom Sheet Content ─────────────────────────────────────────────────────

class _BottomSheet extends StatelessWidget {
  final ScrollController scrollCtrl;
  final List<RouteModel> routes;
  final bool loading;
  final String? error;
  final VoidCallback onRefresh;

  const _BottomSheet({
    required this.scrollCtrl,
    required this.routes,
    required this.loading,
    required this.error,
    required this.onRefresh,
  });

  @override
  Widget build(BuildContext context) {
    final active = routes.where((r) => r.isActive).toList();

    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        boxShadow: [
          BoxShadow(
              color: Color(0x1A000000), blurRadius: 20, offset: Offset(0, -4))
        ],
      ),
      child: CustomScrollView(
        controller: scrollCtrl,
        slivers: [
          // Drag handle + header
          SliverToBoxAdapter(
            child: Column(
              children: [
                const SizedBox(height: 10),
                Center(
                  child: Container(
                    width: 40,
                    height: 4,
                    decoration: BoxDecoration(
                      color: Colors.grey[300],
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  child: Row(
                    children: [
                      const Text('เส้นทางที่เปิดให้บริการ',
                          style: TextStyle(
                              fontSize: 16, fontWeight: FontWeight.w700)),
                      const Spacer(),
                      if (active.isNotEmpty)
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 10, vertical: 3),
                          decoration: BoxDecoration(
                            color: const Color(0xFFDCFCE7),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Text('${active.length} สาย',
                              style: const TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w600,
                                  color: Color(0xFF16A34A))),
                        ),
                      const SizedBox(width: 8),
                      GestureDetector(
                        onTap: onRefresh,
                        child: Icon(Icons.refresh,
                            size: 20, color: Colors.grey[500]),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 12),
              ],
            ),
          ),

          // Content
          if (loading)
            const SliverFillRemaining(
              child: Center(child: CircularProgressIndicator()),
            )
          else if (error != null)
            SliverFillRemaining(
              child: _EmptyState(
                icon: Icons.wifi_off,
                message: 'ไม่สามารถโหลดข้อมูลได้',
                action: TextButton(
                  onPressed: onRefresh,
                  child: const Text('ลองอีกครั้ง'),
                ),
              ),
            )
          else if (active.isEmpty)
            const SliverFillRemaining(
              child: _EmptyState(
                icon: Icons.directions_bus_outlined,
                message: 'ยังไม่มีสายรถที่เปิดให้บริการ',
              ),
            )
          else
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 24),
              sliver: SliverList(
                delegate: SliverChildBuilderDelegate(
                  (ctx, i) => _RouteCard(route: active[i]),
                  childCount: active.length,
                ),
              ),
            ),
        ],
      ),
    );
  }
}

// ─── Route Card ──────────────────────────────────────────────────────────────

class _RouteCard extends StatelessWidget {
  final RouteModel route;
  const _RouteCard({required this.route});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFF1F5F9)),
        boxShadow: const [
          BoxShadow(
              color: Color(0x0A000000), blurRadius: 8, offset: Offset(0, 2))
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(16),
          onTap: () => Navigator.of(context).push(
            MaterialPageRoute(builder: (_) => RouteDetail(route: route)),
          ),
          child: Padding(
            padding: const EdgeInsets.all(14),
            child: Row(children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: const Color(0xFFDCFCE7),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(Icons.directions_bus,
                    color: Color(0xFF16A34A), size: 22),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(children: [
                        Text(route.code,
                            style: const TextStyle(
                                fontSize: 11,
                                color: Color(0xFF6B7280),
                                fontWeight: FontWeight.w600)),
                        if (route.zoneName != null) ...[
                          const SizedBox(width: 6),
                          Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 6, vertical: 1),
                            decoration: BoxDecoration(
                              color: const Color(0xFFEFF6FF),
                              borderRadius: BorderRadius.circular(99),
                            ),
                            child: Text(route.zoneName!,
                                style: const TextStyle(
                                    fontSize: 10,
                                    color: Color(0xFF2563EB),
                                    fontWeight: FontWeight.w600)),
                          ),
                        ],
                      ]),
                      const SizedBox(height: 2),
                      Text(route.name,
                          style: const TextStyle(
                              fontSize: 14, fontWeight: FontWeight.w700),
                          overflow: TextOverflow.ellipsis),
                      const SizedBox(height: 4),
                      Row(children: [
                        const Icon(Icons.circle,
                            size: 7, color: Color(0xFF3B82F6)),
                        const SizedBox(width: 5),
                        Expanded(
                            child: Text(route.startLocation,
                                style: const TextStyle(
                                    fontSize: 11, color: Color(0xFF6B7280)),
                                overflow: TextOverflow.ellipsis)),
                      ]),
                      const SizedBox(height: 2),
                      Row(children: [
                        const Icon(Icons.location_on,
                            size: 7, color: Color(0xFFEF4444)),
                        const SizedBox(width: 5),
                        Expanded(
                            child: Text(route.endLocation,
                                style: const TextStyle(
                                    fontSize: 11, color: Color(0xFF6B7280)),
                                overflow: TextOverflow.ellipsis)),
                      ]),
                    ]),
              ),
              const SizedBox(width: 8),
              // Quick waiting button
              GestureDetector(
                onTap: () => Navigator.of(context).push(
                  MaterialPageRoute(builder: (_) => RouteDetail(route: route)),
                ),
                child: Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                  decoration: BoxDecoration(
                    color: const Color(0xFF2563EB),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: const Text('แจ้งรอ',
                      style: TextStyle(
                          fontSize: 11,
                          color: Colors.white,
                          fontWeight: FontWeight.w700)),
                ),
              ),
            ]),
          ),
        ),
      ),
    );
  }
}

// ─── Empty State ─────────────────────────────────────────────────────────────

class _EmptyState extends StatelessWidget {
  final IconData icon;
  final String message;
  final Widget? action;

  const _EmptyState({required this.icon, required this.message, this.action});

  @override
  Widget build(BuildContext context) => Center(
        child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
          Icon(icon, size: 48, color: Colors.grey[300]),
          const SizedBox(height: 12),
          Text(message,
              style: TextStyle(fontSize: 14, color: Colors.grey[500])),
          if (action != null) action!,
        ]),
      );
}
