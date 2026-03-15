import 'package:flutter/material.dart';

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
        onDestinationSelected: (index) {
          setState(() => currentIndex = index);
        },
      ),
    );
  }
}

class PassengerScreen extends StatelessWidget {
  const PassengerScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final routes = const [
      RouteCardData('R1', 'Campus Loop', 'Main Gate', 'Engineering Building', true),
      RouteCardData('R2', 'City Connector', 'Bus Terminal', 'Central Market', false),
    ];

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        const SectionTitle('Passenger'),
        const SummaryCard(
          title: 'Passenger Flow',
          description: 'Browse routes, open a route, watch live bus positions, then mark waiting for bus.',
          icon: Icons.map,
        ),
        const SizedBox(height: 16),
        ElevatedButton.icon(
          onPressed: () {},
          icon: const Icon(Icons.access_time_filled),
          label: const Text('Mark: Waiting for Bus'),
        ),
        const SizedBox(height: 16),
        ...routes.map((route) => RouteCard(route: route)),
      ],
    );
  }
}

class DriverScreen extends StatelessWidget {
  const DriverScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: const [
        SectionTitle('Driver'),
        SummaryCard(
          title: 'Driver Operation',
          description: 'Login, switch ON duty, send GPS every 5–10 seconds, and see waiting passengers.',
          icon: Icons.route,
        ),
        StatusTile(label: 'Duty Status', value: 'OFF'),
        StatusTile(label: 'Assigned Bus', value: '10-1234'),
        StatusTile(label: 'Assigned Route', value: 'Campus Loop'),
        StatusTile(label: 'GPS Upload Interval', value: '5–10 seconds'),
      ],
    );
  }
}

class AdminInfoScreen extends StatelessWidget {
  const AdminInfoScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: const [
        SectionTitle('Admin'),
        SummaryCard(
          title: 'Admin Dashboard Scope',
          description: 'Super Admin manages all routes/admins/buses. Route Admin is limited to assigned routes.',
          icon: Icons.dashboard_customize,
        ),
        StatusTile(label: 'Super Admin', value: 'Manage all routes, buses, admins'),
        StatusTile(label: 'Route Admin', value: 'Manage only assigned route data'),
        StatusTile(label: 'Realtime Source', value: 'Supabase Realtime'),
        StatusTile(label: 'Map Provider', value: 'Google Maps API'),
      ],
    );
  }
}

class RouteCardData {
  final String code;
  final String name;
  final String start;
  final String end;
  final bool live;

  const RouteCardData(this.code, this.name, this.start, this.end, this.live);
}

class RouteCard extends StatelessWidget {
  final RouteCardData route;

  const RouteCard({super.key, required this.route});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: ListTile(
        leading: CircleAvatar(child: Text(route.code)),
        title: Text(route.name),
        subtitle: Text('${route.start} → ${route.end}'),
        trailing: Chip(
          label: Text(route.live ? 'LIVE' : 'IDLE'),
          backgroundColor: route.live ? Colors.green.shade100 : Colors.grey.shade200,
        ),
      ),
    );
  }
}

class SectionTitle extends StatelessWidget {
  final String text;

  const SectionTitle(this.text, {super.key});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Text(text, style: Theme.of(context).textTheme.headlineMedium),
    );
  }
}

class SummaryCard extends StatelessWidget {
  final String title;
  final String description;
  final IconData icon;

  const SummaryCard({
    super.key,
    required this.title,
    required this.description,
    required this.icon,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, size: 36),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: Theme.of(context).textTheme.titleLarge),
                  const SizedBox(height: 8),
                  Text(description),
                ],
              ),
            )
          ],
        ),
      ),
    );
  }
}

class StatusTile extends StatelessWidget {
  final String label;
  final String value;

  const StatusTile({super.key, required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: ListTile(
        title: Text(label),
        subtitle: Text(value),
      ),
    );
  }
}
