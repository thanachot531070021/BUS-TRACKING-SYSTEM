import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/route_provider.dart';
import '../../models/waiting_model.dart';
import 'route_detail.dart';

class ActivityTab extends StatefulWidget {
  final double topBarHeight;
  const ActivityTab({super.key, required this.topBarHeight});

  @override
  State<ActivityTab> createState() => _ActivityTabState();
}

class _ActivityTabState extends State<ActivityTab>
    with SingleTickerProviderStateMixin {
  late final TabController _tabCtrl;

  @override
  void initState() {
    super.initState();
    _tabCtrl = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        SizedBox(height: widget.topBarHeight),

        // Tab bar
        Container(
          color: Colors.white,
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('รายการ',
                  style: TextStyle(
                      fontSize: 20, fontWeight: FontWeight.w800)),
              const SizedBox(height: 12),
              TabBar(
                controller: _tabCtrl,
                labelColor: const Color(0xFF2563EB),
                unselectedLabelColor: Colors.grey,
                indicatorColor: const Color(0xFF2563EB),
                indicatorSize: TabBarIndicatorSize.tab,
                dividerColor: Colors.transparent,
                labelStyle: const TextStyle(
                    fontWeight: FontWeight.w700, fontSize: 14),
                tabs: const [
                  Tab(text: 'กำลังรอ'),
                  Tab(text: 'ประวัติ'),
                ],
              ),
            ],
          ),
        ),

        // Tab content
        Expanded(
          child: TabBarView(
            controller: _tabCtrl,
            children: [
              _ActiveTab(),
              _HistoryTab(),
            ],
          ),
        ),
      ],
    );
  }
}

// ─── Active Waiting Tab ───────────────────────────────────────────────────────

class _ActiveTab extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final rp = context.watch<RouteProvider>();

    if (!rp.isWaiting || rp.myWaiting == null) {
      return _EmptyState(
        icon: Icons.directions_bus_outlined,
        title: 'ยังไม่ได้แจ้งรอรถ',
        subtitle: 'กดปุ่ม "แจ้งรอ" ในหน้าหลักเพื่อแจ้งรอรถ',
      );
    }

    final waiting = rp.myWaiting!;
    return RefreshIndicator(
      onRefresh: () async {},
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [_WaitingCard(waiting: waiting, rp: rp)],
      ),
    );
  }
}

class _WaitingCard extends StatelessWidget {
  final WaitingModel waiting;
  final RouteProvider rp;
  const _WaitingCard({required this.waiting, required this.rp});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF1E40AF), Color(0xFF3B82F6)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
        boxShadow: const [
          BoxShadow(
              color: Color(0x302563EB), blurRadius: 16, offset: Offset(0, 6))
        ],
      ),
      padding: const EdgeInsets.all(20),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.2),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Row(children: [
              Container(
                width: 7,
                height: 7,
                decoration: const BoxDecoration(
                    color: Color(0xFF4ADE80), shape: BoxShape.circle),
              ),
              const SizedBox(width: 6),
              const Text('กำลังรอรถ',
                  style: TextStyle(
                      color: Colors.white,
                      fontSize: 11,
                      fontWeight: FontWeight.w600)),
            ]),
          ),
          const Spacer(),
          GestureDetector(
            onTap: () => _confirmCancel(context),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.15),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(
                    color: Colors.white.withValues(alpha: 0.3)),
              ),
              child: const Text('ยกเลิก',
                  style: TextStyle(
                      color: Colors.white,
                      fontSize: 11,
                      fontWeight: FontWeight.w600)),
            ),
          ),
        ]),
        const SizedBox(height: 16),
        const Text('สายรถที่รออยู่',
            style: TextStyle(color: Colors.white70, fontSize: 11)),
        const SizedBox(height: 4),
        Text(
            rp.routes
                    .where((r) => r.id == waiting.routeId)
                    .firstOrNull
                    ?.name ??
                waiting.routeId ??
                'สายรถ',
            style: const TextStyle(
                color: Colors.white,
                fontSize: 18,
                fontWeight: FontWeight.w800)),
        const SizedBox(height: 16),
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: Colors.white.withValues(alpha: 0.12),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Row(children: [
            const Icon(Icons.location_on, color: Colors.white70, size: 18),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                'lat: ${waiting.lat?.toStringAsFixed(5) ?? '—'}, '
                'lng: ${waiting.lng?.toStringAsFixed(5) ?? '—'}',
                style: const TextStyle(
                    color: Colors.white70, fontSize: 12),
              ),
            ),
          ]),
        ),
        const SizedBox(height: 16),
        SizedBox(
          width: double.infinity,
          child: OutlinedButton.icon(
            onPressed: () {
              final route = rp.routes
                  .where((r) => r.id == waiting.routeId)
                  .firstOrNull;
              if (route == null) return;
              Navigator.of(context).push(
                MaterialPageRoute(
                    builder: (_) => RouteDetail(route: route)),
              );
            },
            icon: const Icon(Icons.map_outlined,
                size: 16, color: Colors.white),
            label: const Text('ดูบนแผนที่',
                style: TextStyle(color: Colors.white)),
            style: OutlinedButton.styleFrom(
              side: const BorderSide(color: Colors.white38),
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(10)),
            ),
          ),
        ),
      ]),
    );
  }

  Future<void> _confirmCancel(BuildContext context) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('ยกเลิกการรอรถ'),
        content: const Text('คุณต้องการยกเลิกการรอรถใช่ไหม?'),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(context, false),
              child: const Text('ไม่')),
          TextButton(
              onPressed: () => Navigator.pop(context, true),
              child: const Text('ยกเลิกการรอ',
                  style: TextStyle(color: Color(0xFFDC2626)))),
        ],
      ),
    );
    if (confirmed == true && context.mounted) {
      await context.read<RouteProvider>().cancelWaiting();
    }
  }
}

// ─── History Tab ──────────────────────────────────────────────────────────────

class _HistoryTab extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return _EmptyState(
      icon: Icons.history,
      title: 'ยังไม่มีประวัติการเดินทาง',
      subtitle: 'ประวัติการแจ้งรอรถจะแสดงที่นี่',
    );
  }
}

// ─── Empty State ──────────────────────────────────────────────────────────────

class _EmptyState extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;

  const _EmptyState(
      {required this.icon, required this.title, required this.subtitle});

  @override
  Widget build(BuildContext context) => Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Container(
                  width: 72,
                  height: 72,
                  decoration: BoxDecoration(
                    color: const Color(0xFFF1F5F9),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Icon(icon, size: 36, color: Colors.grey[400]),
                ),
                const SizedBox(height: 16),
                Text(title,
                    style: const TextStyle(
                        fontSize: 15, fontWeight: FontWeight.w700),
                    textAlign: TextAlign.center),
                const SizedBox(height: 6),
                Text(subtitle,
                    style: TextStyle(
                        fontSize: 13, color: Colors.grey[500]),
                    textAlign: TextAlign.center),
              ]),
        ),
      );
}
