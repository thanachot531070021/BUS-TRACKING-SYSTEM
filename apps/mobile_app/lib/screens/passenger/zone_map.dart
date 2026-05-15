import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:provider/provider.dart';
import '../../models/bus_model.dart';
import '../../models/route_model.dart';
import '../../models/zone_model.dart';
import '../../providers/route_provider.dart';
import 'route_detail.dart';

class ZoneMapScreen extends StatefulWidget {
  final ZoneModel zone;
  const ZoneMapScreen({super.key, required this.zone});

  @override
  State<ZoneMapScreen> createState() => _ZoneMapScreenState();
}

class _ZoneMapScreenState extends State<ZoneMapScreen> {
  GoogleMapController? _mapController;
  static const _defaultCenter = LatLng(13.7563, 100.5018);
  bool _showRouteSheet = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      final rp = context.read<RouteProvider>();
      rp.loadAllLiveBuses();
      rp.startZoneBusPolling();
    });
  }

  @override
  void dispose() {
    _mapController?.dispose();
    context.read<RouteProvider>().stopZoneBusPolling();
    super.dispose();
  }

  Set<Marker> _buildMarkers(List<BusModel> buses) {
    final markers = <Marker>{};
    for (final bus in buses) {
      if (!bus.hasLocation || !bus.isOnDuty) continue;
      markers.add(Marker(
        markerId: MarkerId('bus_${bus.id}'),
        position: LatLng(bus.currentLat!, bus.currentLng!),
        icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueBlue),
        infoWindow: InfoWindow(
          title: bus.plateNumber,
          snippet: 'กำลังวิ่ง',
        ),
      ));
    }
    return markers;
  }

  void _fitMarkers(List<BusModel> buses) {
    if (_mapController == null) return;
    final active = buses.where((b) => b.hasLocation && b.isOnDuty).toList();
    if (active.isEmpty) return;
    if (active.length == 1) {
      _mapController!.animateCamera(CameraUpdate.newLatLngZoom(
        LatLng(active.first.currentLat!, active.first.currentLng!),
        14,
      ));
      return;
    }
    double minLat = active.first.currentLat!;
    double maxLat = minLat;
    double minLng = active.first.currentLng!;
    double maxLng = minLng;
    for (final b in active) {
      if (b.currentLat! < minLat) minLat = b.currentLat!;
      if (b.currentLat! > maxLat) maxLat = b.currentLat!;
      if (b.currentLng! < minLng) minLng = b.currentLng!;
      if (b.currentLng! > maxLng) maxLng = b.currentLng!;
    }
    _mapController!.animateCamera(CameraUpdate.newLatLngBounds(
      LatLngBounds(
        southwest: LatLng(minLat - 0.01, minLng - 0.01),
        northeast: LatLng(maxLat + 0.01, maxLng + 0.01),
      ),
      60,
    ));
  }

  @override
  Widget build(BuildContext context) {
    final rp = context.watch<RouteProvider>();
    final zoneBuses = rp.busesInZone(widget.zone.id);
    final zoneRoutes = rp.routesInZone(widget.zone.id);
    final markers = _buildMarkers(zoneBuses);
    final onDutyCount = zoneBuses.where((b) => b.isOnDuty).length;

    return Scaffold(
      backgroundColor: const Color(0xFFF1F5F9),
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(widget.zone.name,
                style: const TextStyle(
                    fontWeight: FontWeight.w700, fontSize: 16)),
            Text('${widget.zone.code} · ${zoneRoutes.length} เส้นทาง',
                style: const TextStyle(fontSize: 11, color: Colors.white70)),
          ],
        ),
        backgroundColor: const Color(0xFF1D4ED8),
        foregroundColor: Colors.white,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => rp.loadAllLiveBuses(),
          ),
          IconButton(
            icon: Icon(
              _showRouteSheet ? Icons.map : Icons.list,
            ),
            tooltip: _showRouteSheet ? 'ดูแผนที่' : 'ดูรายการสาย',
            onPressed: () => setState(() => _showRouteSheet = !_showRouteSheet),
          ),
        ],
      ),
      body: Stack(
        children: [
          // --- Full-screen Map ---
          GoogleMap(
            initialCameraPosition: const CameraPosition(
              target: _defaultCenter,
              zoom: 12,
            ),
            markers: markers,
            myLocationEnabled: true,
            myLocationButtonEnabled: true,
            zoomControlsEnabled: false,
            onMapCreated: (ctrl) {
              _mapController = ctrl;
              WidgetsBinding.instance.addPostFrameCallback((_) {
                _fitMarkers(zoneBuses);
              });
            },
          ),

          // --- Top badge: bus count ---
          Positioned(
            top: 10,
            left: 10,
            child: Container(
              padding:
                  const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
                boxShadow: [
                  BoxShadow(
                      color: Colors.black.withValues(alpha: 0.15),
                      blurRadius: 8)
                ],
              ),
              child: Row(children: [
                const Icon(Icons.directions_bus,
                    size: 15, color: Color(0xFF2563EB)),
                const SizedBox(width: 5),
                Text(
                  '$onDutyCount คันกำลังวิ่ง',
                  style: const TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                      color: Color(0xFF1E40AF)),
                ),
                if (rp.allBusLoading) ...[
                  const SizedBox(width: 6),
                  const SizedBox(
                    width: 11,
                    height: 11,
                    child: CircularProgressIndicator(strokeWidth: 1.5),
                  ),
                ],
              ]),
            ),
          ),

          // --- Fit buses FAB ---
          Positioned(
            bottom: _showRouteSheet ? 340 : 16,
            right: 16,
            child: FloatingActionButton.small(
              heroTag: 'fit_zone',
              backgroundColor: Colors.white,
              foregroundColor: const Color(0xFF2563EB),
              elevation: 2,
              onPressed: () => _fitMarkers(zoneBuses),
              child: const Icon(Icons.my_location, size: 20),
            ),
          ),

          // --- Route list bottom sheet ---
          if (_showRouteSheet)
            Positioned(
              left: 0,
              right: 0,
              bottom: 0,
              child: _RouteSheet(
                routes: zoneRoutes,
                buses: zoneBuses,
                onClose: () => setState(() => _showRouteSheet = false),
                onTapBus: (bus) {
                  if (!bus.hasLocation) return;
                  setState(() => _showRouteSheet = false);
                  _mapController?.animateCamera(
                    CameraUpdate.newLatLngZoom(
                      LatLng(bus.currentLat!, bus.currentLng!),
                      16,
                    ),
                  );
                },
              ),
            ),
        ],
      ),
    );
  }
}

// ── Bottom sheet: route list with buses ────────────────────────────────────────

class _RouteSheet extends StatelessWidget {
  final List<RouteModel> routes;
  final List<BusModel> buses;
  final VoidCallback onClose;
  final ValueChanged<BusModel> onTapBus;

  const _RouteSheet({
    required this.routes,
    required this.buses,
    required this.onClose,
    required this.onTapBus,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 320,
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        boxShadow: [BoxShadow(color: Colors.black12, blurRadius: 12)],
      ),
      child: Column(
        children: [
          // Handle + header
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 8, 0),
            child: Row(children: [
              const Icon(Icons.route, color: Color(0xFF2563EB), size: 18),
              const SizedBox(width: 8),
              Text(
                'เส้นทางในโซน (${routes.length})',
                style: const TextStyle(
                    fontWeight: FontWeight.w700, fontSize: 15),
              ),
              const Spacer(),
              IconButton(
                icon: const Icon(Icons.close, size: 20),
                onPressed: onClose,
                padding: EdgeInsets.zero,
                constraints: const BoxConstraints(),
              ),
            ]),
          ),
          const Divider(height: 12),
          Expanded(
            child: routes.isEmpty
                ? const Center(
                    child: Text('ไม่มีเส้นทางในโซนนี้',
                        style: TextStyle(color: Colors.grey)))
                : ListView.builder(
                    padding: const EdgeInsets.symmetric(horizontal: 12),
                    itemCount: routes.length,
                    itemBuilder: (_, i) {
                      final route = routes[i];
                      final routeBuses = buses
                          .where((b) => b.routeId == route.id && b.isOnDuty)
                          .toList();
                      return _RouteRow(
                        route: route,
                        onDutyBuses: routeBuses,
                        onTapBus: onTapBus,
                        onTapRoute: () => Navigator.of(context).push(
                          MaterialPageRoute(
                              builder: (_) => RouteDetail(route: route)),
                        ),
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }
}

class _RouteRow extends StatelessWidget {
  final RouteModel route;
  final List<BusModel> onDutyBuses;
  final ValueChanged<BusModel> onTapBus;
  final VoidCallback onTapRoute;

  const _RouteRow({
    required this.route,
    required this.onDutyBuses,
    required this.onTapBus,
    required this.onTapRoute,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      borderRadius: BorderRadius.circular(10),
      onTap: onTapRoute,
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 4),
        child: Row(children: [
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              color: route.isActive
                  ? const Color(0xFFDCFCE7)
                  : const Color(0xFFF1F5F9),
              borderRadius: BorderRadius.circular(9),
            ),
            child: Icon(Icons.directions_bus,
                size: 18,
                color: route.isActive
                    ? const Color(0xFF16A34A)
                    : Colors.grey),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(route.name,
                    style: const TextStyle(
                        fontWeight: FontWeight.w600, fontSize: 13)),
                Text('${route.code} · ${route.startLocation} → ${route.endLocation}',
                    style: const TextStyle(
                        fontSize: 11, color: Color(0xFF6B7280)),
                    overflow: TextOverflow.ellipsis),
              ],
            ),
          ),
          // Bus count badge
          if (onDutyBuses.isNotEmpty)
            GestureDetector(
              onTap: () => onTapBus(onDutyBuses.first),
              child: Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: const Color(0xFF2563EB),
                  borderRadius: BorderRadius.circular(999),
                ),
                child: Text('${onDutyBuses.length} คัน',
                    style: const TextStyle(
                        fontSize: 11,
                        color: Colors.white,
                        fontWeight: FontWeight.w700)),
              ),
            )
          else
            Container(
              padding:
                  const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
              decoration: BoxDecoration(
                color: const Color(0xFFF1F5F9),
                borderRadius: BorderRadius.circular(999),
              ),
              child: const Text('ไม่มีรถ',
                  style: TextStyle(
                      fontSize: 11,
                      color: Colors.grey,
                      fontWeight: FontWeight.w600)),
            ),
          const SizedBox(width: 4),
          const Icon(Icons.chevron_right, size: 16, color: Colors.grey),
        ]),
      ),
    );
  }
}
