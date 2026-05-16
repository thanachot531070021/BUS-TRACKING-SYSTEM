import 'package:flutter/material.dart';

class InboxTab extends StatefulWidget {
  final double topBarHeight;
  const InboxTab({super.key, required this.topBarHeight});

  @override
  State<InboxTab> createState() => _InboxTabState();
}

class _InboxTabState extends State<InboxTab>
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
        Container(
          color: Colors.white,
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('กล่องข้อความ',
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
                  Tab(text: 'แจ้งเตือน'),
                  Tab(text: 'แชท'),
                ],
              ),
            ],
          ),
        ),
        Expanded(
          child: TabBarView(
            controller: _tabCtrl,
            children: [
              _NotificationsTab(),
              _ChatTab(),
            ],
          ),
        ),
      ],
    );
  }
}

// ─── Notifications Tab ────────────────────────────────────────────────────────

class _NotificationsTab extends StatelessWidget {
  static const _items = [
    _NotifItem(
      icon: Icons.directions_bus,
      iconBg: Color(0xFFDCFCE7),
      iconColor: Color(0xFF16A34A),
      title: 'รถกำลังจะถึงจุดจอด',
      body: 'รถสาย R-001 กำลังจะมาถึงจุดจอดของคุณในอีก 3 นาที',
      time: '09:30',
      unread: true,
    ),
    _NotifItem(
      icon: Icons.check_circle,
      iconBg: Color(0xFFEFF6FF),
      iconColor: Color(0xFF2563EB),
      title: 'รับผู้โดยสารสำเร็จ',
      body: 'คนขับได้รับข้อมูลการรอรถของคุณแล้ว',
      time: 'เมื่อวาน',
      unread: false,
    ),
    _NotifItem(
      icon: Icons.info_outline,
      iconBg: Color(0xFFFEF3C7),
      iconColor: Color(0xFFD97706),
      title: 'แจ้งเตือนจากระบบ',
      body: 'มีการอัปเดตตารางเวลารถ กรุณาตรวจสอบอีกครั้ง',
      time: '2 วันที่แล้ว',
      unread: false,
    ),
  ];

  @override
  Widget build(BuildContext context) {
    return ListView.separated(
      padding: const EdgeInsets.symmetric(vertical: 8),
      itemCount: _items.length,
      separatorBuilder: (_, __) =>
          const Divider(height: 1, indent: 72),
      itemBuilder: (_, i) => _NotifTile(item: _items[i]),
    );
  }
}

class _NotifItem {
  final IconData icon;
  final Color iconBg, iconColor;
  final String title, body, time;
  final bool unread;

  const _NotifItem({
    required this.icon,
    required this.iconBg,
    required this.iconColor,
    required this.title,
    required this.body,
    required this.time,
    required this.unread,
  });
}

class _NotifTile extends StatelessWidget {
  final _NotifItem item;
  const _NotifTile({required this.item});

  @override
  Widget build(BuildContext context) {
    return ListTile(
      contentPadding:
          const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      leading: Container(
        width: 46,
        height: 46,
        decoration: BoxDecoration(
          color: item.iconBg,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Icon(item.icon, color: item.iconColor, size: 22),
      ),
      title: Text(item.title,
          style: TextStyle(
              fontSize: 14,
              fontWeight:
                  item.unread ? FontWeight.w700 : FontWeight.w500)),
      subtitle: Text(item.body,
          style: TextStyle(
              fontSize: 12, color: Colors.grey[500]),
          maxLines: 2,
          overflow: TextOverflow.ellipsis),
      trailing: Column(
        mainAxisAlignment: MainAxisAlignment.start,
        children: [
          Text(item.time,
              style: TextStyle(
                  fontSize: 11,
                  color: item.unread
                      ? const Color(0xFF2563EB)
                      : Colors.grey[400])),
          if (item.unread) ...[
            const SizedBox(height: 4),
            Container(
              width: 8,
              height: 8,
              decoration: const BoxDecoration(
                color: Color(0xFF2563EB),
                shape: BoxShape.circle,
              ),
            ),
          ],
        ],
      ),
    );
  }
}

// ─── Chat Tab ─────────────────────────────────────────────────────────────────

class _ChatTab extends StatelessWidget {
  @override
  Widget build(BuildContext context) => Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                width: 80,
                height: 80,
                decoration: BoxDecoration(
                  color: const Color(0xFFEFF6FF),
                  borderRadius: BorderRadius.circular(24),
                ),
                child: const Icon(Icons.chat_bubble_outline,
                    size: 38, color: Color(0xFF2563EB)),
              ),
              const SizedBox(height: 20),
              const Text('ระบบแชท',
                  style: TextStyle(
                      fontSize: 18, fontWeight: FontWeight.w700)),
              const SizedBox(height: 8),
              Text(
                'ฟีเจอร์แชทกับคนขับและทีมบริการ\nจะเปิดให้ใช้งานเร็วๆ นี้',
                style: TextStyle(
                    fontSize: 13,
                    color: Colors.grey[500],
                    height: 1.6),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 24),
              Container(
                padding: const EdgeInsets.symmetric(
                    horizontal: 20, vertical: 10),
                decoration: BoxDecoration(
                  color: const Color(0xFFEFF6FF),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: const Text('เร็วๆ นี้',
                    style: TextStyle(
                        fontSize: 13,
                        color: Color(0xFF2563EB),
                        fontWeight: FontWeight.w600)),
              ),
            ],
          ),
        ),
      );
}
