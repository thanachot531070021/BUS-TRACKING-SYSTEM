import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'home_tab.dart';
import 'news_tab.dart';
import 'routes_tab.dart';
import 'profile_tab.dart';

class PassengerMainScreen extends StatefulWidget {
  const PassengerMainScreen({super.key});

  @override
  State<PassengerMainScreen> createState() => _PassengerMainScreenState();
}

class _PassengerMainScreenState extends State<PassengerMainScreen> {
  int _index = 0;

  @override
  void initState() {
    super.initState();
    SystemChrome.setSystemUIOverlayStyle(const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.dark,
    ));
  }

  void _switchTab(int i) => setState(() => _index = i);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF6F7FB),
      body: IndexedStack(
        index: _index,
        children: [
          NewsTab(onSwitchTab: _switchTab),
          const RoutesTab(),
          const HomeTab(),
          const ProfileTab(),
        ],
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _index,
        onDestinationSelected: _switchTab,
        backgroundColor: Colors.white,
        elevation: 0,
        shadowColor: Colors.transparent,
        indicatorColor: const Color(0xFFEFF6FF),
        labelBehavior: NavigationDestinationLabelBehavior.alwaysShow,
        animationDuration: const Duration(milliseconds: 300),
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.home_outlined),
            selectedIcon: Icon(Icons.home, color: Color(0xFF2563EB)),
            label: 'หน้าแรก',
          ),
          NavigationDestination(
            icon: Icon(Icons.route_outlined),
            selectedIcon: Icon(Icons.route, color: Color(0xFF2563EB)),
            label: 'เส้นทาง',
          ),
          NavigationDestination(
            icon: Icon(Icons.map_outlined),
            selectedIcon: Icon(Icons.map, color: Color(0xFF2563EB)),
            label: 'แผนที่',
          ),
          NavigationDestination(
            icon: Icon(Icons.person_outline),
            selectedIcon: Icon(Icons.person, color: Color(0xFF2563EB)),
            label: 'โปรไฟล์',
          ),
        ],
      ),
    );
  }
}
