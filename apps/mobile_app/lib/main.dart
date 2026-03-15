import 'package:flutter/material.dart';

import 'screens/admin_info_screen.dart';
import 'screens/driver_screen.dart';
import 'screens/passenger_screen.dart';

void main() {
  runApp(const BusTrackingApp());
}

class BusTrackingApp extends StatelessWidget {
  const BusTrackingApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'BUS TRACKING SYSTEM',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.blue),
        useMaterial3: true,
      ),
      home: const MainShell(),
    );
  }
}

class MainShell extends StatefulWidget {
  const MainShell({super.key});

  @override
  State<MainShell> createState() => _MainShellState();
}

class _MainShellState extends State<MainShell> {
  int currentIndex = 0;

  final screens = const [
    PassengerScreen(),
    DriverScreen(),
    AdminInfoScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('BUS TRACKING SYSTEM')),
      body: screens[currentIndex],
      bottomNavigationBar: NavigationBar(
        selectedIndex: currentIndex,
        destinations: const [
          NavigationDestination(icon: Icon(Icons.person_pin_circle), label: 'Passenger'),
          NavigationDestination(icon: Icon(Icons.directions_bus), label: 'Driver'),
          NavigationDestination(icon: Icon(Icons.admin_panel_settings), label: 'Admin'),
        ],
        onDestinationSelected: (index) => setState(() => currentIndex = index),
      ),
    );
  }
}
