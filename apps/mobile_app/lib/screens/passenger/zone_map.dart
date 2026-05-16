import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:provider/provider.dart';
import '../../models/bus_model.dart';
import '../../models/route_model.dart';
import '../../models/zone_model.dart';
import '../../providers/route_provider.dart';
import '../../utils/map_markers.dart';
import 'route_detail.dart';

class ZoneMapScreen extends StatefulWidget {
  final ZoneModel zone;
  const ZoneMapScreen({super.key, required this.zone});

  @override
  State<ZoneMapScreen> createState() => _ZoneMapScreenState();
}

class _ZoneMapScreenState extends State<ZoneMapScreen> {
  GoogleMapController? _mapController;
  BitmapDescriptor? _busIcon;
  static const _defaultCenter = LatLng(13.7563, 100.5018);
  bool _showRouteSheet = false;

  @override
  void initState() {
    super.initState();
    createBusMarker().then((icon) {
      if (mounted) setState(() => _busIcon = icon);
    });
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

  Set<Marker> _buildMarkers(List<BusModel> buses, List<RouteModel> routes) {
    final markers = <Marker>{};

    // Bus markers
    for (final bus in buses) {
      if (!bus.hasLocation || !bus.isOnDuty) continue;
      markers.add(Marker(
        markerId: MarkerId('bus_${bus.id}'),
        position: LatLng(bus.currentLat!, bus.currentLng!),
        icon: _busIcon ?? BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueBlue),
        infoWindow: InfoWindow(
          title: bus.plateNumber,
          snippet: 'กำลังวิ่ง',
        ),
      ));
    }

    // Route start/end markers
    for (final route in routes) {
      final start = route.startLatLng;
      final end = route.endLatLng;
      if (start != null) {
        markers.add(Marker(
          markerId: MarkerId('start_${route.id}'),
          position: start,
          icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueGreen),
          infoWindow: InfoWindow(
            title: '▶ ${route.name}',
            snippet: route.startLocation.isNotEmpty ? route.startLocation : 'จุดต้นทาง',
          ),
        ));
      }
      if (end != null) {
        markers.add(Marker(
          markerId: MarkerId('end_${route.id}'),
          position: end,
          icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueRed),
          infoWindow: InfoWindow(
            title: '⏹ ${route.name}',
            snippet: route.endLocation.isNotEmpty ? route.endLocation : 'จุดปลายทาง',
          ),
        ));
      }
    }

    return markers;
  }

  Set<Polyline> _buildPolylines(List<RouteModel> routes) {
    final polylines = <Polyline>{};
    for (final route in routes) {
      List<LatLng>? pts;
      bool defined = false;
      if (route.hasPolyline) {
        final decoded = RouteModel.decodePolyline(route.routePolyline!);
        pts = decoded.length >= 2 ? decoded : null;
        defined = true;
      } else if (route.hasWaypoints) {
        pts = route.waypointLatLngs;
        defined = true;
      } else {
        final s = route.startLatLng;
        final e = route.endLatLng;
        if (s != null && e != null) pts = [s, e];
      }
      if (pts != null && pts.length >= 2) {
        polylines.add(Polyline(
          polylineId: PolylineId('route_${route.id}'),
          points: pts,
          color: const Color(0xFF2563EB),
          width: defined ? 4 : 2,
          patterns: defined ? [] : [PatternItem.dash(10), PatternItem.gap(6)],
        ));
      }
    }
    return polylines;
  }

  // Collect all LatLng points (buses + route coords) for fitting camera
  List<LatLng> _allPoints(List<BusModel> buses, List<RouteModel> routes) {
    final pts = <LatLng>[];
    for (final b in buses) {
      if (b.hasLocation && b.isOnDuty) pts.add(LatLng(b.currentLat!, b.currentLng!));
    }
    for (final r in routes) {
      if (r.startLatLng != null) pts.add(r.startLatLng!);
      if (r.endLatLng != null) pts.add(r.endLatLng!);
    }
    return pts;
  }

  void _fitMarkers(List<BusModel> buses, [List<RouteModel>? routes]) {
    if (_mapController == null) return;
    final pts = _allPoints(buses, routes ?? []);
    if (pts.isEmpty) return;
    if (pts.length == 1) {
      _mapController!.animateCamera(
          CameraUpdate.newLatLngZoom(pts.first, 14));
      return;
    }
    double minLat = pts.first.latitude, maxLat = minLat;
    double minLng = pts.first.longitude, maxLng = minLng;
    for (final p in pts) {
      if (p.latitude < minLat) minLat = p.latitude;
      if (p.latitude > maxLat) maxLat = p.latitude;
      if (p.longitude < minLng) minLng = p.longitude;
      if (p.longitude > maxLng) maxLng = p.longitude;
    }
    _mapController!.animateCamera(CameraUpdate.newLatLngBounds(
      LatLngBounds(
        southwest: LatLng(minLat - 0.008, minLng - 0.008),
        northeast: LatLng(maxLat + 0.008, maxLng + 0.008),
      ),
      60,
    ));
  }

  // Navigate map to a specific route's start point
  void _focusRoute(RouteModel route) {
    final start = route.startLatLng;
    final end = route.endLatLng;
    if (start == null && end == null) return;
    setState(() => _showRouteSheet = false);
    if (start != null && end != null) {
      _fitMarkers([], [route]);
    } else {
      _mapController?.animateCamera(
          CameraUpdate.newLatLngZoom(start ?? end!, 15));
    }
  }

  @override
  Widget build(BuildContext context) {
    final rp = context.watch<RouteProvider>();
    final zoneBuses = rp.busesInZone(widget.zone.id);
    final zoneRoutes = rp.routesInZone(widget.zone.id);
    final markers = _buildMarkers(zoneBuses, zoneRoutes);
    final polylines = _buildPolylines(zoneRoutes);
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
            polylines: polylines,
            myLocationEnabled: true,
            myLocationButtonEnabled: true,
            zoomControlsEnabled: false,
            onMapCreated: (ctrl) {
              _mapController = ctrl;
              WidgetsBinding.instance.addPostFrameCallback((_) {
                _fitMarkers(zoneBuses, zoneRoutes);
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
              onPressed: () => _fitMarkers(zoneBuses, zoneRoutes),
              child: const Icon(Icons.fit_screen, size: 20),
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
                onTapRoute: _focusRoute,
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
  final ValueChanged<RouteModel> onTapRoute;

  const _RouteSheet({
    required this.routes,
    required this.buses,
    required this.onClose,
    required this.onTapBus,
    required this.onTapRoute,
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
                      final hasCoords =
                          route.startLatLng != null || route.endLatLng != null;
                      return _RouteRow(
                        route: route,
                        onDutyBuses: routeBuses,
                        hasCoords: hasCoords,
                        onTapBus: onTapBus,
                        onTapRoute: () => Navigator.of(context).push(
                          MaterialPageRoute(
                              builder: (_) => RouteDetail(route: route)),
                        ),
                        onTapPin: hasCoords ? () => onTapRoute(route) : null,
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
  final bool hasCoords;
  final ValueChanged<BusModel> onTapBus;
  final VoidCallback onTapRoute;
  final VoidCallback? onTapPin;

  const _RouteRow({
    required this.route,
    required this.onDutyBuses,
    required this.hasCoords,
    required this.onTapBus,
    required this.onTapRoute,
    this.onTapPin,
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
          // Pin button — focus route on map
          if (hasCoords)
            GestureDetector(
              onTap: onTapPin,
              child: const Padding(
                padding: EdgeInsets.symmetric(horizontal: 4),
                child: Icon(Icons.location_on,
                    size: 18, color: Color(0xFF16A34A)),
              ),
            )
          else
            const SizedBox(width: 4),
          const Icon(Icons.chevron_right, size: 16, color: Colors.grey),
        ]),
      ),
    );
  }
}
