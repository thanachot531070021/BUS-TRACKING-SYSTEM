import 'dart:async';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../models/announcement_model.dart';
import '../../providers/announcement_provider.dart';
import '../../providers/auth_provider.dart';
import '../../providers/favorites_provider.dart';
import 'route_detail.dart';

class NewsTab extends StatefulWidget {
  final void Function(int) onSwitchTab;
  const NewsTab({super.key, required this.onSwitchTab});

  @override
  State<NewsTab> createState() => _NewsTabState();
}

class _NewsTabState extends State<NewsTab> {
  final _pageCtrl = PageController();
  Timer? _autoScrollTimer;
  int _currentPage = 0;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      context.read<AnnouncementProvider>().load();
      context.read<FavoritesProvider>().load();
    });
  }

  @override
  void dispose() {
    _autoScrollTimer?.cancel();
    _pageCtrl.dispose();
    super.dispose();
  }

  void _startAutoScroll(int count) {
    _autoScrollTimer?.cancel();
    if (count <= 1) return;
    _autoScrollTimer = Timer.periodic(const Duration(seconds: 4), (_) {
      if (!mounted || !_pageCtrl.hasClients) return;
      final next = (_currentPage + 1) % count;
      _pageCtrl.animateToPage(
        next,
        duration: const Duration(milliseconds: 500),
        curve: Curves.easeInOut,
      );
    });
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final ann = context.watch<AnnouncementProvider>();
    final favs = context.watch<FavoritesProvider>();
    final name = auth.user?.displayName ?? 'ผู้ใช้';
    final initial = name[0].toUpperCase();

    final promos = ann.promos.isNotEmpty
        ? ann.promos
        : AnnouncementModel.fallbackPromos();
    final news = ann.news.isNotEmpty
        ? ann.news
        : AnnouncementModel.fallbackNews();
    final favorites = favs.favoriteRoutes.take(3).toList();

    return Scaffold(
      backgroundColor: const Color(0xFFF6F7FB),
      body: SafeArea(
        child: CustomScrollView(
          slivers: [
            // ── Greeting header ──────────────────────────────────────────────
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 10, 20, 14),
                child: Row(
                  children: [
                    Container(
                      width: 44,
                      height: 44,
                      decoration: const BoxDecoration(
                        gradient: LinearGradient(
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                          colors: [Color(0xFFa78bfa), Color(0xFF6366f1)],
                        ),
                        shape: BoxShape.circle,
                      ),
                      child: Center(
                        child: Text(initial,
                            style: const TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.w800,
                                fontSize: 17)),
                      ),
                    ),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('สวัสดี 👋',
                              style: TextStyle(
                                  fontSize: 13,
                                  color: Color(0xFF6B7891),
                                  fontWeight: FontWeight.w500)),
                          Text(name,
                              style: const TextStyle(
                                  fontSize: 17,
                                  fontWeight: FontWeight.w700,
                                  color: Color(0xFF0F172A))),
                        ],
                      ),
                    ),
                    Stack(
                      clipBehavior: Clip.none,
                      children: [
                        Container(
                          width: 40,
                          height: 40,
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: const Icon(Icons.notifications_outlined,
                              size: 22, color: Color(0xFF0F172A)),
                        ),
                        Positioned(
                          top: 8,
                          right: 8,
                          child: Container(
                            width: 8,
                            height: 8,
                            decoration: const BoxDecoration(
                                color: Color(0xFFEF4444),
                                shape: BoxShape.circle),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),

            SliverPadding(
              padding: const EdgeInsets.fromLTRB(20, 0, 20, 24),
              sliver: SliverList(
                delegate: SliverChildListDelegate([
                  // ── Promo Carousel ──────────────────────────────────────────
                  _PromoCarousel(
                    promos: promos,
                    pageCtrl: _pageCtrl,
                    currentPage: _currentPage,
                    onPageChanged: (i) {
                      setState(() => _currentPage = i);
                    },
                    onInit: () => _startAutoScroll(promos.length),
                  ),
                  const SizedBox(height: 18),

                  // ── Quick actions ───────────────────────────────────────────
                  const _SectionLabel(title: 'ลัด'),
                  const SizedBox(height: 10),
                  _QuickActions(onSwitchTab: widget.onSwitchTab),
                  const SizedBox(height: 18),

                  // ── Favorites ───────────────────────────────────────────────
                  _SectionLabel(
                    title: 'เส้นทางโปรดของคุณ',
                    link: favorites.isNotEmpty ? 'จัดการ' : null,
                    onLink: () => widget.onSwitchTab(1),
                  ),
                  const SizedBox(height: 10),
                  if (favs.loading)
                    const SizedBox(
                      height: 60,
                      child: Center(
                          child: CircularProgressIndicator(strokeWidth: 2)),
                    )
                  else if (favorites.isEmpty)
                    _EmptyFavorites(onTap: () => widget.onSwitchTab(1))
                  else
                    for (final r in favorites)
                      Padding(
                        padding: const EdgeInsets.only(bottom: 10),
                        child: _FavoriteRouteCard(
                          routeCode: r.code,
                          routeName: r.name,
                          from: r.startLocation,
                          to: r.endLocation,
                          isFavorite: true,
                          onTap: () => Navigator.of(context).push(
                            MaterialPageRoute(
                                builder: (_) => RouteDetail(route: r)),
                          ),
                          onFavoriteTap: () =>
                              context.read<FavoritesProvider>().remove(r.id),
                        ),
                      ),
                  const SizedBox(height: 8),

                  // ── News feed ───────────────────────────────────────────────
                  const _SectionLabel(
                      title: 'ข่าวสาร & ประกาศ', link: 'ดูทั้งหมด'),
                  const SizedBox(height: 10),
                  if (ann.loading && news.isEmpty)
                    const SizedBox(
                      height: 80,
                      child: Center(
                          child: CircularProgressIndicator(strokeWidth: 2)),
                    )
                  else
                    for (final n in news)
                      Padding(
                        padding: const EdgeInsets.only(bottom: 12),
                        child: _NewsCard(item: n),
                      ),
                ]),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ─── Promo Carousel ───────────────────────────────────────────────────────────

class _PromoCarousel extends StatefulWidget {
  final List<AnnouncementModel> promos;
  final PageController pageCtrl;
  final int currentPage;
  final void Function(int) onPageChanged;
  final VoidCallback onInit;

  const _PromoCarousel({
    required this.promos,
    required this.pageCtrl,
    required this.currentPage,
    required this.onPageChanged,
    required this.onInit,
  });

  @override
  State<_PromoCarousel> createState() => _PromoCarouselState();
}

class _PromoCarouselState extends State<_PromoCarousel> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => widget.onInit());
  }

  @override
  Widget build(BuildContext context) {
    final promos = widget.promos;
    return Column(
      children: [
        SizedBox(
          height: 178,
          child: PageView.builder(
            controller: widget.pageCtrl,
            onPageChanged: widget.onPageChanged,
            itemCount: promos.length,
            itemBuilder: (_, i) => Padding(
              padding: const EdgeInsets.symmetric(horizontal: 2),
              child: _PromoBannerCard(item: promos[i]),
            ),
          ),
        ),
        if (promos.length > 1) ...[
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: List.generate(
              promos.length,
              (i) => AnimatedContainer(
                duration: const Duration(milliseconds: 300),
                margin: const EdgeInsets.symmetric(horizontal: 3),
                width: i == widget.currentPage ? 20 : 6,
                height: 6,
                decoration: BoxDecoration(
                  color: i == widget.currentPage
                      ? const Color(0xFF3B82F6)
                      : const Color(0xFFCBD5E1),
                  borderRadius: BorderRadius.circular(3),
                ),
              ),
            ),
          ),
        ],
      ],
    );
  }
}

class _PromoBannerCard extends StatelessWidget {
  final AnnouncementModel item;
  const _PromoBannerCard({required this.item});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFF3B82F6), Color(0xFF1D4ED8)],
        ),
        borderRadius: BorderRadius.circular(22),
      ),
      clipBehavior: Clip.antiAlias,
      child: Stack(
        children: [
          Positioned(
            top: -40, right: -40,
            child: Container(
              width: 180, height: 180,
              decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.10),
                  shape: BoxShape.circle),
            ),
          ),
          Positioned(
            bottom: -50, left: -30,
            child: Container(
              width: 160, height: 160,
              decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.08),
                  shape: BoxShape.circle),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(22),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      if (item.tag != null)
                        Text(
                          item.tag!.toUpperCase(),
                          style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w700,
                              color: Colors.white.withValues(alpha: 0.85),
                              letterSpacing: 0.7),
                        ),
                      const SizedBox(height: 5),
                      Text(
                        item.title,
                        style: const TextStyle(
                            fontSize: 21,
                            fontWeight: FontWeight.w800,
                            color: Colors.white,
                            height: 1.2,
                            letterSpacing: -0.3),
                      ),
                      if (item.subtitle != null) ...[
                        const SizedBox(height: 5),
                        Text(item.subtitle!,
                            style: TextStyle(
                                fontSize: 12.5,
                                color:
                                    Colors.white.withValues(alpha: 0.88))),
                      ],
                      if (item.ctaText != null) ...[
                        const SizedBox(height: 12),
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 16, vertical: 8),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text(item.ctaText!,
                                  style: const TextStyle(
                                      fontSize: 13,
                                      fontWeight: FontWeight.w800,
                                      color: Color(0xFF1D4ED8))),
                              const SizedBox(width: 4),
                              const Icon(Icons.arrow_forward,
                                  size: 14, color: Color(0xFF1D4ED8)),
                            ],
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
                if (item.iconEmoji != null)
                  Text(item.iconEmoji!,
                      style: const TextStyle(fontSize: 50, height: 1)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Quick Actions Grid ───────────────────────────────────────────────────────

class _QuickActions extends StatelessWidget {
  final void Function(int) onSwitchTab;
  const _QuickActions({required this.onSwitchTab});

  @override
  Widget build(BuildContext context) {
    final items = [
      _QA(icon: Icons.star_outline,    label: 'เส้นทางโปรด', bg: const Color(0xFFDBEAFE), fg: const Color(0xFF1E40AF), onTap: () => onSwitchTab(1)),
      _QA(icon: Icons.location_on_outlined, label: 'ใกล้บ้าน', bg: const Color(0xFFE1F5EE), fg: const Color(0xFF0A6B3B), onTap: () => onSwitchTab(2)),
      _QA(icon: Icons.history,         label: 'ประวัติ',     bg: const Color(0xFFF3E8FF), fg: const Color(0xFF6B21A8), onTap: () => onSwitchTab(3)),
      _QA(
        icon: Icons.help_outline,
        label: 'ช่วยเหลือ',
        bg: const Color(0xFFFEF9C3),
        fg: const Color(0xFF854D0E),
        onTap: () => ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('ช่วยเหลือ — เร็วๆ นี้'), duration: Duration(seconds: 2)),
        ),
      ),
    ];

    return Row(
      children: items
          .map((qa) => Expanded(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 4),
                  child: _QAButton(qa: qa),
                ),
              ))
          .toList(),
    );
  }
}

class _QA {
  final IconData icon;
  final String label;
  final Color bg;
  final Color fg;
  final VoidCallback onTap;
  const _QA({required this.icon, required this.label, required this.bg, required this.fg, required this.onTap});
}

class _QAButton extends StatelessWidget {
  final _QA qa;
  const _QAButton({required this.qa});

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(16),
      elevation: 0,
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: qa.onTap,
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 8),
          child: Column(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(color: qa.bg, borderRadius: BorderRadius.circular(12)),
                child: Icon(qa.icon, size: 20, color: qa.fg),
              ),
              const SizedBox(height: 8),
              Text(qa.label,
                  textAlign: TextAlign.center,
                  style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Color(0xFF1E2A3A), height: 1.2)),
            ],
          ),
        ),
      ),
    );
  }
}

// ─── Favorite Route Card ──────────────────────────────────────────────────────

class _FavoriteRouteCard extends StatelessWidget {
  final String routeCode;
  final String routeName;
  final String from;
  final String to;
  final bool isFavorite;
  final VoidCallback onTap;
  final VoidCallback onFavoriteTap;

  const _FavoriteRouteCard({
    required this.routeCode,
    required this.routeName,
    required this.from,
    required this.to,
    required this.isFavorite,
    required this.onTap,
    required this.onFavoriteTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(16),
      elevation: 0,
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Row(
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(color: const Color(0xFFDBEAFE), borderRadius: BorderRadius.circular(14)),
                child: Center(
                  child: Text(
                    routeCode.replaceAll('R-', ''),
                    style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: Color(0xFF1E40AF)),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(routeName, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: Color(0xFF0F172A))),
                    const SizedBox(height: 2),
                    Text('$from → $to', style: const TextStyle(fontSize: 13, color: Color(0xFF6B7891)), overflow: TextOverflow.ellipsis),
                  ],
                ),
              ),
              IconButton(
                icon: Icon(isFavorite ? Icons.star : Icons.star_outline,
                    size: 20, color: isFavorite ? const Color(0xFFF59E0B) : const Color(0xFF6B7891)),
                onPressed: onFavoriteTap,
                padding: EdgeInsets.zero,
                constraints: const BoxConstraints(minWidth: 36, minHeight: 36),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ─── Empty Favorites ──────────────────────────────────────────────────────────

class _EmptyFavorites extends StatelessWidget {
  final VoidCallback onTap;
  const _EmptyFavorites({required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: const Color(0xFFE7EBF3), width: 1.5),
        ),
        child: const Row(
          children: [
            Icon(Icons.star_outline, size: 20, color: Color(0xFF6B7891)),
            SizedBox(width: 12),
            Expanded(
              child: Text(
                'ยังไม่มีเส้นทางโปรด — แตะที่ ⭐ ในหน้าเส้นทางเพื่อบันทึก',
                style: TextStyle(fontSize: 13, color: Color(0xFF6B7891)),
              ),
            ),
            Icon(Icons.chevron_right, size: 18, color: Color(0xFF6B7891)),
          ],
        ),
      ),
    );
  }
}

// ─── News Card ────────────────────────────────────────────────────────────────

class _NewsCard extends StatelessWidget {
  final AnnouncementModel item;
  const _NewsCard({required this.item});

  @override
  Widget build(BuildContext context) {
    final (bg, fg) = switch (item.tone) {
      'warning' => (const Color(0xFFFFF4D6), const Color(0xFF8A6306)),
      'success' => (const Color(0xFFDBEAFE), const Color(0xFF1E40AF)),
      'info'    => (const Color(0xFFDBEAFE), const Color(0xFF1E40AF)),
      _         => (const Color(0xFFF1F5F9), const Color(0xFF475569)),
    };
    final icon = switch (item.tone) {
      'warning' => Icons.warning_amber_rounded,
      'success' => Icons.bolt,
      _         => Icons.notifications_active_outlined,
    };

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16)),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(14)),
            child: item.iconEmoji != null
                ? Center(child: Text(item.iconEmoji!, style: const TextStyle(fontSize: 22)))
                : Icon(icon, size: 22, color: fg),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (item.tag != null)
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                        decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(99)),
                        child: Text(item.tag!, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: fg)),
                      ),
                    ],
                  ),
                if (item.tag != null) const SizedBox(height: 4),
                Text(item.title,
                    style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: Color(0xFF0F172A), height: 1.35)),
                if (item.subtitle != null) ...[
                  const SizedBox(height: 4),
                  Text(item.subtitle!, style: const TextStyle(fontSize: 13, color: Color(0xFF6B7891), height: 1.4)),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Section Label ────────────────────────────────────────────────────────────

class _SectionLabel extends StatelessWidget {
  final String title;
  final String? link;
  final VoidCallback? onLink;
  const _SectionLabel({required this.title, this.link, this.onLink});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Text(title.toUpperCase(),
            style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: Color(0xFF6B7891), letterSpacing: 0.5)),
        if (link != null) ...[
          const Spacer(),
          GestureDetector(
            onTap: onLink,
            child: Text(link!, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: Color(0xFF3B82F6))),
          ),
        ],
      ],
    );
  }
}
