import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:provider/provider.dart';
import '../../providers/driver_provider.dart';
import '../../models/waiting_model.dart';

class WaitingList extends StatefulWidget {
  const WaitingList({super.key});

  @override
  State<WaitingList> createState() => _WaitingListState();
}

class _WaitingListState extends State<WaitingList> {
  GoogleMapController? _mapController;
  static const _defaultCenter = LatLng(13.7563, 100.5018);

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      context.read<DriverProvider>().loadWaitingPassengers();
    });
  }

  @override
  void dispose() {
    _mapController?.dispose();
    super.dispose();
  }

  Future<void> _pickup(String waitingId) async {
    final dp = context.read<DriverProvider>();
    final ok = await dp.markPickup(waitingId);
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Text(ok ? '✅ รับผู้โดยสารเรียบร้อย' : '❌ เกิดข้อผิดพลาด'),
      backgroundColor:
          ok ? const Color(0xFF10B981) : const Color(0xFFEF4444),
    ));
  }

  Set<Marker> _buildMarkers(List<WaitingModel> passengers) {
    final markers = <Marker>{};
    for (int i = 0; i < passengers.length; i++) {
      final p = passengers[i];
      if (p.lat == null || p.lng == null) continue;
      markers.add(Marker(
        markerId: MarkerId('passenger_${p.id}'),
        position: LatLng(p.lat!, p.lng!),
        icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueOrange),
        infoWindow: InfoWindow(
          title: 'ผู้โดยสาร ${i + 1}',
          snippet: '⏰ ${_fmtTime(p.createdAt)}',
        ),
      ));
    }
    return markers;
  }

  LatLng _getMapCenter(List<WaitingModel> passengers) {
    for (final p in passengers) {
      if (p.lat != null && p.lng != null) return LatLng(p.lat!, p.lng!);
    }
    return _defaultCenter;
  }

  String _fmtTime(DateTime? dt) {
    if (dt == null) return '-';
    return '${dt.hour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')}';
  }

  @override
  Widget build(BuildContext context) {
    final dp = context.watch<DriverProvider>();
    final markers = _buildMarkers(dp.waitingPassengers);
    final center = _getMapCenter(dp.waitingPassengers);

    return Scaffold(
      backgroundColor: const Color(0xFFF1F5F9),
      appBar: AppBar(
        title: Row(children: [
          const Text('ผู้โดยสารรอรับ',
              style: TextStyle(fontWeight: FontWeight.w700)),
          if (dp.waitingPassengers.isNotEmpty) ...[
            const SizedBox(width: 8),
            Container(
              padding:
                  const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha:0.25),
                borderRadius: BorderRadius.circular(999),
              ),
              child: Text(
                '${dp.waitingPassengers.length}',
                style: const TextStyle(
                    fontSize: 13, fontWeight: FontWeight.w700),
              ),
            ),
          ],
        ]),
        backgroundColor: const Color(0xFF0F172A),
        foregroundColor: Colors.white,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => dp.loadWaitingPassengers(),
          ),
        ],
      ),
      body: Column(
        children: [
          // --- Map ---
          SizedBox(
            height: 220,
            child: Stack(
              children: [
                GoogleMap(
                  initialCameraPosition: CameraPosition(
                    target: center,
                    zoom: 14,
                  ),
                  markers: markers,
                  myLocationEnabled: true,
                  myLocationButtonEnabled: false,
                  zoomControlsEnabled: false,
                  onMapCreated: (ctrl) => _mapController = ctrl,
                ),
                // Overlay: passenger count
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
                      const Icon(Icons.people_alt_outlined,
                          size: 14, color: Color(0xFFD97706)),
                      const SizedBox(width: 4),
                      Text(
                        '${dp.waitingPassengers.length} คน',
                        style: const TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w700,
                            color: Color(0xFF92400E)),
                      ),
                    ]),
                  ),
                ),
                if (dp.waitingPassengers.isEmpty)
                  const Center(
                    child: Text(
                      'ยังไม่มีผู้โดยสารรอ',
                      style: TextStyle(
                          color: Colors.grey,
                          fontSize: 13,
                          fontWeight: FontWeight.w500),
                    ),
                  ),
              ],
            ),
          ),

          // --- List ---
          Expanded(
            child: RefreshIndicator(
              onRefresh: () => dp.loadWaitingPassengers(),
              child: dp.waitingPassengers.isEmpty
                  ? ListView(
                      children: const [
                        SizedBox(height: 60),
                        Center(
                          child: Column(children: [
                            Icon(Icons.people_outline,
                                size: 52, color: Colors.grey),
                            SizedBox(height: 12),
                            Text('ยังไม่มีผู้โดยสารรอรับ',
                                style: TextStyle(
                                    color: Colors.grey, fontSize: 15)),
                          ]),
                        ),
                      ],
                    )
                  : ListView.builder(
                      padding: const EdgeInsets.all(16),
                      itemCount: dp.waitingPassengers.length,
                      itemBuilder: (_, i) => _WaitingTile(
                        waiting: dp.waitingPassengers[i],
                        index: i + 1,
                        onPickup: () =>
                            _pickup(dp.waitingPassengers[i].id),
                        onLocate: dp.waitingPassengers[i].lat != null
                            ? () => _mapController?.animateCamera(
                                  CameraUpdate.newLatLngZoom(
                                    LatLng(
                                      dp.waitingPassengers[i].lat!,
                                      dp.waitingPassengers[i].lng!,
                                    ),
                                    17,
                                  ),
                                )
                            : null,
                      ),
                    ),
            ),
          ),
        ],
      ),
    );
  }
}

class _WaitingTile extends StatelessWidget {
  final WaitingModel waiting;
  final int index;
  final VoidCallback onPickup;
  final VoidCallback? onLocate;

  const _WaitingTile({
    required this.waiting,
    required this.index,
    required this.onPickup,
    this.onLocate,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      elevation: 0,
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Row(children: [
          // Index badge
          Container(
            width: 46,
            height: 46,
            decoration: BoxDecoration(
              color: const Color(0xFFFEF9C3),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Center(
              child: Text(
                '$index',
                style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w800,
                    color: Color(0xFFD97706)),
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'ผู้โดยสาร ${_short(waiting.userId)}',
                    style: const TextStyle(
                        fontWeight: FontWeight.w700, fontSize: 14),
                  ),
                  const SizedBox(height: 3),
                  if (waiting.lat != null)
                    Text(
                      '📍 ${waiting.lat!.toStringAsFixed(4)}, ${waiting.lng!.toStringAsFixed(4)}',
                      style: const TextStyle(
                          fontSize: 12, color: Colors.grey),
                    ),
                  if (waiting.createdAt != null)
                    Text(
                      '⏰ รอตั้งแต่ ${_fmtTime(waiting.createdAt!)}',
                      style: const TextStyle(
                          fontSize: 12, color: Colors.grey),
                    ),
                ]),
          ),
          const SizedBox(width: 8),
          Column(children: [
            // Locate on map
            if (onLocate != null)
              IconButton(
                visualDensity: VisualDensity.compact,
                icon: const Icon(Icons.location_on,
                    color: Color(0xFF3B82F6), size: 20),
                onPressed: onLocate,
                tooltip: 'ดูบนแผนที่',
              ),
            // Pickup button
            ElevatedButton(
              onPressed: onPickup,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF10B981),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(
                    horizontal: 12, vertical: 8),
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(10)),
                elevation: 0,
                minimumSize: Size.zero,
              ),
              child: const Text('รับแล้ว',
                  style: TextStyle(
                      fontWeight: FontWeight.w700, fontSize: 13)),
            ),
          ]),
        ]),
      ),
    );
  }

  String _short(String? id) {
    if (id == null) return '-';
    return id.length > 8 ? '${id.substring(0, 8)}…' : id;
  }

  String _fmtTime(DateTime dt) {
    return '${dt.hour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')}';
  }
}
