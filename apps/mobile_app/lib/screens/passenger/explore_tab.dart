import 'package:flutter/material.dart';

class ExploreTab extends StatelessWidget {
  final double topBarHeight;
  const ExploreTab({super.key, required this.topBarHeight});

  static const _announcements = [
    _Announcement(
      icon: Icons.campaign_outlined,
      iconColor: Color(0xFF2563EB),
      iconBg: Color(0xFFEFF6FF),
      tag: 'ประกาศ',
      tagColor: Color(0xFF2563EB),
      tagBg: Color(0xFFEFF6FF),
      title: 'ปรับเวลาให้บริการช่วงวันหยุด',
      body:
          'ในช่วงวันหยุดนักขัตฤกษ์ รถโดยสารจะปรับเวลาให้บริการ กรุณาตรวจสอบตารางเวลาล่าสุดในแอป',
      time: 'วันนี้',
    ),
    _Announcement(
      icon: Icons.route,
      iconColor: Color(0xFF16A34A),
      iconBg: Color(0xFFDCFCE7),
      tag: 'เส้นทางใหม่',
      tagColor: Color(0xFF16A34A),
      tagBg: Color(0xFFDCFCE7),
      title: 'เพิ่มสายรถใหม่ ครอบคลุมพื้นที่ชานเมือง',
      body:
          'ขยายการให้บริการไปยังพื้นที่ชานเมือง เพื่ออำนวยความสะดวกให้ผู้โดยสารมากขึ้น',
      time: '2 วันที่แล้ว',
    ),
    _Announcement(
      icon: Icons.build_outlined,
      iconColor: Color(0xFFD97706),
      iconBg: Color(0xFFFEF3C7),
      tag: 'บำรุงรักษา',
      tagColor: Color(0xFFD97706),
      tagBg: Color(0xFFFEF3C7),
      title: 'งดให้บริการชั่วคราวบางสาย',
      body:
          'สายรถบางสายจะงดให้บริการชั่วคราวเพื่อบำรุงรักษารถและเส้นทาง ขออภัยในความไม่สะดวก',
      time: '5 วันที่แล้ว',
    ),
    _Announcement(
      icon: Icons.star_outline,
      iconColor: Color(0xFF7C3AED),
      iconBg: Color(0xFFEDE9FE),
      tag: 'ฟีเจอร์ใหม่',
      tagColor: Color(0xFF7C3AED),
      tagBg: Color(0xFFEDE9FE),
      title: 'ติดตามรถ Real-time บนแผนที่',
      body:
          'ตอนนี้คุณสามารถดูตำแหน่งรถโดยสารแบบ Real-time บนแผนที่ได้แล้ว กดแท็บ "หน้าหลัก" เพื่อใช้งาน',
      time: '1 สัปดาห์ที่แล้ว',
    ),
  ];

  @override
  Widget build(BuildContext context) {
    return CustomScrollView(
      slivers: [
        SliverToBoxAdapter(
          child: SizedBox(height: topBarHeight + 8),
        ),
        SliverPadding(
          padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
          sliver: SliverToBoxAdapter(
            child: Row(children: [
              const Text('ข่าวสาร & ประกาศ',
                  style: TextStyle(
                      fontSize: 18, fontWeight: FontWeight.w800)),
              const Spacer(),
              Text('${_announcements.length} รายการ',
                  style: TextStyle(
                      fontSize: 12, color: Colors.grey[500])),
            ]),
          ),
        ),
        SliverPadding(
          padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
          sliver: SliverList(
            delegate: SliverChildBuilderDelegate(
              (_, i) => _AnnouncementCard(item: _announcements[i]),
              childCount: _announcements.length,
            ),
          ),
        ),
      ],
    );
  }
}

class _Announcement {
  final IconData icon;
  final Color iconColor, iconBg;
  final String tag, title, body, time;
  final Color tagColor, tagBg;

  const _Announcement({
    required this.icon,
    required this.iconColor,
    required this.iconBg,
    required this.tag,
    required this.tagColor,
    required this.tagBg,
    required this.title,
    required this.body,
    required this.time,
  });
}

class _AnnouncementCard extends StatelessWidget {
  final _Announcement item;
  const _AnnouncementCard({required this.item});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: const [
          BoxShadow(
              color: Color(0x0A000000), blurRadius: 8, offset: Offset(0, 2))
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(16),
          onTap: () {},
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: 46,
                  height: 46,
                  decoration: BoxDecoration(
                    color: item.iconBg,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(item.icon, color: item.iconColor, size: 22),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(children: [
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 8, vertical: 2),
                          decoration: BoxDecoration(
                            color: item.tagBg,
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Text(item.tag,
                              style: TextStyle(
                                  fontSize: 10,
                                  fontWeight: FontWeight.w600,
                                  color: item.tagColor)),
                        ),
                        const Spacer(),
                        Text(item.time,
                            style: TextStyle(
                                fontSize: 11, color: Colors.grey[400])),
                      ]),
                      const SizedBox(height: 6),
                      Text(item.title,
                          style: const TextStyle(
                              fontSize: 14, fontWeight: FontWeight.w700)),
                      const SizedBox(height: 4),
                      Text(item.body,
                          style: TextStyle(
                              fontSize: 12,
                              color: Colors.grey[600],
                              height: 1.5),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
