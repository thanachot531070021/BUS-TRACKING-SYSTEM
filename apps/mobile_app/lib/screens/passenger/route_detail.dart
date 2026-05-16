import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:provider/provider.dart';
import '../../models/bus_model.dart';
import '../../models/route_model.dart';
import '../../providers/route_provider.dart';
import '../../services/location_service.dart';
import '../../services/api_service.dart';
import '../../utils/map_markers.dart';

class RouteDetail extends StatefulWidget {
  final RouteModel route;
  const RouteDetail({super.key, required this.route});

  @override
  State<RouteDetail> createState() => _RouteDetailState();
}

class _RouteDetailState extends State<RouteDetail> {
  bool _waitingLoading = false;
  GoogleMapController? _mapController;
  BitmapDescriptor? _busIcon;
  static const _defaultCenter = LatLng(13.7563, 100.5018);

  // Decode Google encoded polyline → list of LatLng
  static List<LatLng> _decodePolyline(String encoded) {
    final pts = <LatLng>[];
    int idx = 0, lat = 0, lng = 0;
    while (idx < encoded.length) {
      int shift = 0, r = 0, b;
      do { b = encoded.codeUnitAt(idx++) - 63; r |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
      lat += (r & 1) != 0 ? ~(r >> 1) : (r >> 1);
      shift = 0; r = 0;
      do { b = encoded.codeUnitAt(idx++) - 63; r |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
      lng += (r & 1) != 0 ? ~(r >> 1) : (r >> 1);
      pts.add(LatLng(lat / 1e5, lng / 1e5));
    }
    return pts;
  }

  @override
  void initState() {
    super.initState();
    createBusMarker().then((icon) {
      if (mounted) setState(() => _busIcon = icon);
    });
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      final rp = context.read<RouteProvider>();
      rp.loadLiveBuses(widget.route.id);
      rp.startBusPolling(widget.route.id);
    });
  }

  @override
  void dispose() {
    _mapController?.dispose();
    context.read<RouteProvider>().stopBusPolling();
    super.dispose();
  }

  Future<void> _markWaiting() async {
    setState(() => _waitingLoading = true);
    final rp = context.read<RouteProvider>();
    final loc = LocationService(apiService);
    final pos = await loc.getCurrentLocation();

    if (!mounted) return;

    // GPS is required by the backend
    if (pos == null) {
      setState(() => _waitingLoading = false);
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
        content: Text('❌ ไม่สามารถรับตำแหน่ง GPS ได้ กรุณาเปิด GPS แล้วลองอีกครั้ง'),
        backgroundColor: Color(0xFFEF4444),
      ));
      return;
    }

    final ok = await rp.createWaiting(
      widget.route.id,
      lat: pos.latitude,
      lng: pos.longitude,
    );
    if (!mounted) return;
    setState(() => _waitingLoading = false);

    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Text(ok ? '✅ บันทึกการรอรถแล้ว' : '❌ เกิดข้อผิดพลาด'),
      backgroundColor: ok ? const Color(0xFF10B981) : const Color(0xFFEF4444),
    ));
  }

  Future<void> _cancelWaiting() async {
    final rp = context.read<RouteProvider>();
    final ok = await rp.cancelWaiting();
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Text(ok ? '✅ ยกเลิกการรอรถแล้ว' : '❌ เกิดข้อผิดพลาด'),
      backgroundColor: ok ? const Color(0xFF6B7280) : const Color(0xFFEF4444),
    ));
  }

  // Build markers: blue for buses, green/red for start/end, orange for waiting
  Set<Marker> _buildMarkers(RouteProvider rp) {
    final markers = <Marker>{};

    for (final bus in rp.liveBuses) {
      if (!bus.hasLocation) continue;
      markers.add(Marker(
        markerId: MarkerId('bus_${bus.id}'),
        position: LatLng(bus.currentLat!, bus.currentLng!),
        icon: _busIcon ?? BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueBlue),
        infoWindow: InfoWindow(
          title: bus.plateNumber,
          snippet: bus.isOnDuty ? 'กำลังวิ่ง' : 'หยุด',
        ),
      ));
    }

    final start = widget.route.startLatLng;
    final end = widget.route.endLatLng;
    if (start != null) {
      markers.add(Marker(
        markerId: const MarkerId('route_start'),
        position: start,
        icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueGreen),
        infoWindow: InfoWindow(
          title: '▶ ${widget.route.startLocation}',
          snippet: 'จุดต้นทาง',
        ),
      ));
    }
    if (end != null) {
      markers.add(Marker(
        markerId: const MarkerId('route_end'),
        position: end,
        icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueRed),
        infoWindow: InfoWindow(
          title: '⏹ ${widget.route.endLocation}',
          snippet: 'จุดปลายทาง',
        ),
      ));
    }

    if (rp.myWaiting?.lat != null && rp.myWaiting?.lng != null) {
      markers.add(Marker(
        markerId: const MarkerId('my_waiting'),
        position: LatLng(rp.myWaiting!.lat!, rp.myWaiting!.lng!),
        icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueOrange),
        infoWindow: const InfoWindow(title: 'ตำแหน่งรอรถของคุณ'),
      ));
    }

    return markers;
  }

  Set<Polyline> _buildPolylines() {
    final route = widget.route;
    List<LatLng> pts = [];
    bool isDefined = false; // true = waypoints/polyline, false = straight fallback

    if (route.hasWaypoints) {
      pts = route.waypointLatLngs!;
      isDefined = true;
    } else if (route.hasPolyline) {
      pts = _decodePolyline(route.routePolyline!);
      isDefined = true;
    } else {
      final s = route.startLatLng;
      final e = route.endLatLng;
      if (s != null) pts.add(s);
      if (e != null) pts.add(e);
    }

    if (pts.length < 2) return {};
    return {
      Polyline(
        polylineId: const PolylineId('route'),
        points: pts,
        color: const Color(0xFF2563EB),
        width: isDefined ? 5 : 3,
        patterns: isDefined ? [] : [PatternItem.dash(12), PatternItem.gap(6)],
      ),
    };
  }

  LatLng _getMapCenter(List<BusModel> buses) {
    for (final bus in buses) {
      if (bus.hasLocation) return LatLng(bus.currentLat!, bus.currentLng!);
    }
    return widget.route.startLatLng ?? widget.route.endLatLng ?? _defaultCenter;
  }

  // Fit camera to show buses + route start/end
  void _fitCamera(List<BusModel> buses) {
    if (_mapController == null) return;
    final pts = <LatLng>[];
    for (final b in buses) {
      if (b.hasLocation) pts.add(LatLng(b.currentLat!, b.currentLng!));
    }
    final start = widget.route.startLatLng;
    final end = widget.route.endLatLng;
    if (start != null) pts.add(start);
    if (end != null) pts.add(end);

    if (pts.isEmpty) return;
    if (pts.length == 1) {
      _mapController!.animateCamera(CameraUpdate.newLatLngZoom(pts.first, 14));
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

  @override
  Widget build(BuildContext context) {
    final rp = context.watch<RouteProvider>();
    final markers = _buildMarkers(rp);
    final polylines = _buildPolylines();
    final initialCenter = _getMapCenter(rp.liveBuses);

    return Scaffold(
      backgroundColor: const Color(0xFFF1F5F9),
      appBar: AppBar(
        title: Text(widget.route.name,
            style: const TextStyle(fontWeight: FontWeight.w700)),
        backgroundColor: const Color(0xFF1D4ED8),
        foregroundColor: Colors.white,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => rp.loadLiveBuses(widget.route.id),
          ),
        ],
      ),
      body: Column(
        children: [
          // --- Map ---
          SizedBox(
            height: 240,
            child: Stack(
              children: [
                GoogleMap(
                  initialCameraPosition: CameraPosition(
                    target: initialCenter,
                    zoom: 14,
                  ),
                  markers: markers,
                  polylines: polylines,
                  myLocationEnabled: true,
                  myLocationButtonEnabled: false,
                  zoomControlsEnabled: false,
                  onMapCreated: (ctrl) {
                    _mapController = ctrl;
                    WidgetsBinding.instance.addPostFrameCallback((_) {
                      _fitCamera(rp.liveBuses);
                    });
                  },
                ),
                // Overlay: bus count badge
                Positioned(
                  top: 10,
                  left: 10,
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 10, vertical: 6),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(20),
                      boxShadow: [
                        BoxShadow(
                            color: Colors.black.withValues(alpha:0.15),
                            blurRadius: 6)
                      ],
                    ),
                    child: Row(children: [
                      const Icon(Icons.directions_bus,
                          size: 14, color: Color(0xFF2563EB)),
                      const SizedBox(width: 4),
                      Text(
                        '${rp.liveBuses.where((b) => b.isOnDuty).length} คัน',
                        style: const TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w700,
                            color: Color(0xFF1E40AF)),
                      ),
                      if (rp.busLoading) ...[
                        const SizedBox(width: 6),
                        const SizedBox(
                          width: 10,
                          height: 10,
                          child: CircularProgressIndicator(strokeWidth: 1.5),
                        ),
                      ],
                    ]),
                  ),
                ),
                // Locate buses button
                Positioned(
                  bottom: 10,
                  right: 10,
                  child: FloatingActionButton.small(
                    heroTag: 'fit_buses',
                    backgroundColor: Colors.white,
                    foregroundColor: const Color(0xFF2563EB),
                    elevation: 2,
                    onPressed: () => _fitCamera(rp.liveBuses),
                    child: const Icon(Icons.directions_bus, size: 18),
                  ),
                ),
              ],
            ),
          ),

          // --- Scrollable content ---
          Expanded(
            child: ListView(
              padding: const EdgeInsets.all(16),
              children: [
                _infoCard(),
                const SizedBox(height: 14),
                _waitingCard(rp),
                const SizedBox(height: 14),
                _liveBusesCard(rp),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _infoCard() => Card(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        elevation: 0,
        child: Padding(
          padding: const EdgeInsets.all(16),
          child:
              Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(children: [
              const Icon(Icons.route, color: Color(0xFF3B82F6), size: 20),
              const SizedBox(width: 8),
              const Text('ข้อมูลเส้นทาง',
                  style: TextStyle(fontWeight: FontWeight.w700, fontSize: 15)),
            ]),
            const Divider(height: 20),
            _infoRow(Icons.circle_outlined, 'จุดเริ่มต้น',
                widget.route.startLocation),
            const SizedBox(height: 8),
            _infoRow(Icons.location_on_outlined, 'จุดสิ้นสุด',
                widget.route.endLocation),
            const SizedBox(height: 8),
            _infoRow(Icons.tag, 'รหัสเส้นทาง', widget.route.code),
          ]),
        ),
      );

  Widget _infoRow(IconData icon, String label, String value) => Row(
        children: [
          Icon(icon, size: 16, color: Colors.grey),
          const SizedBox(width: 8),
          Text('$label: ',
              style: const TextStyle(color: Colors.grey, fontSize: 13)),
          Expanded(
              child: Text(value,
                  style: const TextStyle(
                      fontSize: 13, fontWeight: FontWeight.w600))),
        ],
      );

  Widget _waitingCard(RouteProvider rp) => Card(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        elevation: 0,
        child: Padding(
          padding: const EdgeInsets.all(16),
          child:
              Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(children: [
              Icon(
                rp.isWaiting ? Icons.access_time_filled : Icons.access_time,
                color: rp.isWaiting
                    ? const Color(0xFFF59E0B)
                    : const Color(0xFF6B7280),
                size: 20,
              ),
              const SizedBox(width: 8),
              Text(
                rp.isWaiting ? 'กำลังรอรถ...' : 'แจ้งรอรถ',
                style: const TextStyle(
                    fontWeight: FontWeight.w700, fontSize: 15),
              ),
            ]),
            const SizedBox(height: 14),
            SizedBox(
              width: double.infinity,
              height: 46,
              child: rp.isWaiting
                  ? OutlinedButton.icon(
                      onPressed: _cancelWaiting,
                      icon: const Icon(Icons.cancel_outlined),
                      label: const Text('ยกเลิกการรอ'),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: const Color(0xFFEF4444),
                        side: const BorderSide(color: Color(0xFFEF4444)),
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(10)),
                      ),
                    )
                  : ElevatedButton.icon(
                      onPressed: _waitingLoading ? null : _markWaiting,
                      icon: _waitingLoading
                          ? const SizedBox(
                              width: 16,
                              height: 16,
                              child: CircularProgressIndicator(
                                  strokeWidth: 2, color: Colors.white))
                          : const Icon(Icons.pan_tool_alt),
                      label: const Text('แจ้งรอรถ'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF2563EB),
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(10)),
                        elevation: 0,
                      ),
                    ),
            ),
          ]),
        ),
      );

  Widget _liveBusesCard(RouteProvider rp) => Card(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        elevation: 0,
        child: Padding(
          padding: const EdgeInsets.all(16),
          child:
              Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(children: [
              const Icon(Icons.directions_bus,
                  color: Color(0xFF3B82F6), size: 20),
              const SizedBox(width: 8),
              const Text('รถที่ให้บริการ',
                  style: TextStyle(fontWeight: FontWeight.w700, fontSize: 15)),
              const Spacer(),
              if (rp.busLoading)
                const SizedBox(
                    width: 16,
                    height: 16,
                    child: CircularProgressIndicator(strokeWidth: 2)),
            ]),
            const Divider(height: 20),
            if (rp.liveBuses.isEmpty && !rp.busLoading)
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 16),
                child: Center(
                    child: Text('ยังไม่มีรถให้บริการ',
                        style: TextStyle(color: Colors.grey))),
              )
            else
              ...rp.liveBuses.map((bus) => ListTile(
                    contentPadding: EdgeInsets.zero,
                    leading: Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        color: bus.isOnDuty
                            ? const Color(0xFFDCFCE7)
                            : const Color(0xFFF1F5F9),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Icon(Icons.directions_bus,
                          color: bus.isOnDuty
                              ? const Color(0xFF16A34A)
                              : Colors.grey,
                          size: 20),
                    ),
                    title: Text(bus.plateNumber,
                        style: const TextStyle(fontWeight: FontWeight.w700)),
                    subtitle: Text(
                        bus.hasLocation
                            ? '📍 ${bus.currentLat!.toStringAsFixed(4)}, ${bus.currentLng!.toStringAsFixed(4)}'
                            : 'ไม่มีข้อมูลตำแหน่ง',
                        style: const TextStyle(fontSize: 12)),
                    trailing: Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: bus.isOnDuty
                            ? const Color(0xFFDCFCE7)
                            : const Color(0xFFF1F5F9),
                        borderRadius: BorderRadius.circular(999),
                      ),
                      child: Text(
                        bus.isOnDuty ? 'กำลังวิ่ง' : 'หยุด',
                        style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                            color: bus.isOnDuty
                                ? const Color(0xFF166534)
                                : Colors.grey),
                      ),
                    ),
                    // Tap to move map to this bus
                    onTap: bus.hasLocation
                        ? () => _mapController?.animateCamera(
                              CameraUpdate.newLatLngZoom(
                                LatLng(bus.currentLat!, bus.currentLng!),
                                16,
                              ),
                            )
                        : null,
                  )),
          ]),
        ),
      );
}
