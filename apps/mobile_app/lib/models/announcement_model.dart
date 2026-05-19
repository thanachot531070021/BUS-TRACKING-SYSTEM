class AnnouncementModel {
  final String id;
  final String title;
  final String? subtitle;
  final String? tag;
  final String type;   // 'promo' | 'news' | 'announcement'
  final String tone;   // 'promo' | 'warning' | 'success' | 'info'
  final String? iconEmoji;
  final String? ctaText;
  final String? ctaUrl;
  final String? imageUrl;
  final int sortOrder;
  final bool isActive;
  final DateTime? endsAt;

  const AnnouncementModel({
    required this.id,
    required this.title,
    this.subtitle,
    this.tag,
    required this.type,
    required this.tone,
    this.iconEmoji,
    this.ctaText,
    this.ctaUrl,
    this.imageUrl,
    this.sortOrder = 0,
    this.isActive = true,
    this.endsAt,
  });

  bool get isPromo => type == 'promo';
  bool get isNews => type == 'news' || type == 'announcement';

  factory AnnouncementModel.fromJson(Map<String, dynamic> json) {
    return AnnouncementModel(
      id:         json['id']?.toString() ?? '',
      title:      json['title']?.toString() ?? '',
      subtitle:   json['subtitle']?.toString(),
      tag:        json['tag']?.toString(),
      type:       json['type']?.toString() ?? 'news',
      tone:       json['tone']?.toString() ?? 'info',
      iconEmoji:  json['icon_emoji']?.toString(),
      ctaText:    json['cta_text']?.toString(),
      ctaUrl:     json['cta_url']?.toString(),
      imageUrl:   json['image_url']?.toString(),
      sortOrder:  (json['sort_order'] as num?)?.toInt() ?? 0,
      isActive:   json['is_active'] == true,
      endsAt:     json['ends_at'] != null
          ? DateTime.tryParse(json['ends_at'].toString())
          : null,
    );
  }

  static List<AnnouncementModel> fromJsonList(dynamic data) {
    if (data is List) return data.map((e) => AnnouncementModel.fromJson(e as Map<String, dynamic>)).toList();
    return [];
  }

  static List<AnnouncementModel> fallbackPromos() => const [
    AnnouncementModel(id: 'f1', title: 'เพื่อนใหม่รับฟรีเครดิต 50 บาท', subtitle: 'ใช้ได้ทุกเส้นทาง · หมดเขต 31 พ.ค.', tag: 'โปรโมชั่นเดือนนี้', type: 'promo', tone: 'promo', iconEmoji: '🎉', ctaText: 'รับเครดิต'),
  ];

  static List<AnnouncementModel> fallbackNews() => const [
    AnnouncementModel(id: 'n1', title: 'R-08 ปรับเปลี่ยนเส้นทางชั่วคราว', subtitle: 'เนื่องจากการก่อสร้างถนนรอบเมือง · 12–18 พ.ค.', tag: 'แจ้งเตือนบริการ', type: 'announcement', tone: 'warning', iconEmoji: '⚠️'),
    AnnouncementModel(id: 'n2', title: 'เพิ่มจุดรอใหม่ได้แล้ว 5 จังหวัด', subtitle: 'เชียงใหม่ · ขอนแก่น · ภูเก็ต · ชลบุรี · นครราชสีมา', tag: 'ฟีเจอร์ใหม่', type: 'news', tone: 'success', iconEmoji: '⚡'),
    AnnouncementModel(id: 'n3', title: 'งดให้บริการ R-04 วันหยุดราชการ', subtitle: 'วันจันทร์ที่ 20 พ.ค. งดให้บริการทั้งวัน', tag: 'ประกาศ', type: 'announcement', tone: 'info', iconEmoji: '📢'),
  ];
}
