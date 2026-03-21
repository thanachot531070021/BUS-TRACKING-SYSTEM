import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/driver_provider.dart';
import '../../models/waiting_model.dart';

class WaitingList extends StatefulWidget {
  const WaitingList({super.key});

  @override
  State<WaitingList> createState() => _WaitingListState();
}

class _WaitingListState extends State<WaitingList> {
  @override
  void initState() {
    super.initState();
    Future.microtask(
        () => context.read<DriverProvider>().loadWaitingPassengers());
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

  @override
  Widget build(BuildContext context) {
    final dp = context.watch<DriverProvider>();

    return Scaffold(
      backgroundColor: const Color(0xFFF1F5F9),
      appBar: AppBar(
        title: const Text('ผู้โดยสารรอรับ',
            style: TextStyle(fontWeight: FontWeight.w700)),
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
      body: RefreshIndicator(
        onRefresh: () => dp.loadWaitingPassengers(),
        child: dp.waitingPassengers.isEmpty
            ? ListView(
                children: const [
                  SizedBox(height: 100),
                  Center(
                    child: Column(children: [
                      Icon(Icons.people_outline, size: 52, color: Colors.grey),
                      SizedBox(height: 12),
                      Text('ยังไม่มีผู้โดยสารรอรับ',
                          style: TextStyle(color: Colors.grey, fontSize: 15)),
                    ]),
                  ),
                ],
              )
            : ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: dp.waitingPassengers.length,
                itemBuilder: (_, i) =>
                    _WaitingTile(
                      waiting: dp.waitingPassengers[i],
                      onPickup: () => _pickup(dp.waitingPassengers[i].id),
                    ),
              ),
      ),
    );
  }
}

class _WaitingTile extends StatelessWidget {
  final WaitingModel waiting;
  final VoidCallback onPickup;

  const _WaitingTile({required this.waiting, required this.onPickup});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      elevation: 0,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(children: [
          Container(
            width: 46,
            height: 46,
            decoration: BoxDecoration(
              color: const Color(0xFFFEF9C3),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(Icons.person_pin_circle,
                color: Color(0xFFD97706), size: 26),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'User: ${_short(waiting.userId)}',
                    style: const TextStyle(
                        fontWeight: FontWeight.w700, fontSize: 14),
                  ),
                  const SizedBox(height: 4),
                  if (waiting.lat != null)
                    Text(
                      '📍 ${waiting.lat!.toStringAsFixed(4)}, ${waiting.lng!.toStringAsFixed(4)}',
                      style: const TextStyle(fontSize: 12, color: Colors.grey),
                    ),
                  if (waiting.createdAt != null)
                    Text(
                      '⏰ ${_fmtTime(waiting.createdAt!)}',
                      style: const TextStyle(fontSize: 12, color: Colors.grey),
                    ),
                ]),
          ),
          ElevatedButton(
            onPressed: onPickup,
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF10B981),
              foregroundColor: Colors.white,
              padding:
                  const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(10)),
              elevation: 0,
            ),
            child: const Text('รับแล้ว',
                style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13)),
          ),
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
