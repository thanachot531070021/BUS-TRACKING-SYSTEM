import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../models/route_model.dart';
import '../../providers/route_provider.dart';
import '../../services/location_service.dart';
import '../../services/api_service.dart';

class RouteDetail extends StatefulWidget {
  final RouteModel route;
  const RouteDetail({super.key, required this.route});

  @override
  State<RouteDetail> createState() => _RouteDetailState();
}

class _RouteDetailState extends State<RouteDetail> {
  bool _waitingLoading = false;

  @override
  void initState() {
    super.initState();
    Future.microtask(
        () => context.read<RouteProvider>().loadLiveBuses(widget.route.id));
  }

  Future<void> _markWaiting() async {
    setState(() => _waitingLoading = true);
    final rp = context.read<RouteProvider>();
    final loc = LocationService(apiService);
    final pos = await loc.getCurrentLocation();

    final ok = await rp.createWaiting(
      widget.route.id,
      lat: pos?.latitude,
      lng: pos?.longitude,
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

  @override
  Widget build(BuildContext context) {
    final rp = context.watch<RouteProvider>();

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
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Route info card
          _infoCard(),
          const SizedBox(height: 14),

          // Waiting action card
          _waitingCard(rp),
          const SizedBox(height: 14),

          // Live buses
          _liveBusesCard(rp),
        ],
      ),
    );
  }

  Widget _infoCard() => Card(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        elevation: 0,
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(children: [
              const Icon(Icons.route, color: Color(0xFF3B82F6), size: 20),
              const SizedBox(width: 8),
              const Text('ข้อมูลเส้นทาง',
                  style: TextStyle(fontWeight: FontWeight.w700, fontSize: 15)),
            ]),
            const Divider(height: 20),
            _infoRow(Icons.circle_outlined, 'จุดเริ่มต้น', widget.route.startLocation),
            const SizedBox(height: 8),
            _infoRow(Icons.location_on_outlined, 'จุดสิ้นสุด', widget.route.endLocation),
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
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
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
                rp.isWaiting ? 'กำลังรอรถ...' : 'รอรถ',
                style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15),
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
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(children: [
              const Icon(Icons.directions_bus,
                  color: Color(0xFF3B82F6), size: 20),
              const SizedBox(width: 8),
              const Text('รถที่ให้บริการ',
                  style:
                      TextStyle(fontWeight: FontWeight.w700, fontSize: 15)),
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
                            ? 'ตำแหน่ง: ${bus.currentLat!.toStringAsFixed(4)}, ${bus.currentLng!.toStringAsFixed(4)}'
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
                  )),
          ]),
        ),
      );
}
