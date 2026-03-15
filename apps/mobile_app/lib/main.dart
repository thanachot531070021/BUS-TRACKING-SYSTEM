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
      ),
      home: const HomeScreen(),
    );
  }
}

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 3,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('BUS TRACKING SYSTEM'),
          bottom: const TabBar(
            tabs: [
              Tab(text: 'Passenger'),
              Tab(text: 'Driver'),
              Tab(text: 'Admin Info'),
            ],
          ),
        ),
        body: const TabBarView(
          children: [
            FeatureList(title: 'Passenger Features', items: [
              'Browse routes',
              'View live bus positions',
              'Mark waiting for bus',
              'Cancel waiting status',
            ]),
            FeatureList(title: 'Driver Features', items: [
              'Login',
              'ON/OFF duty',
              'Send GPS every 5–10 seconds',
              'See waiting passengers',
            ]),
            FeatureList(title: 'Admin Features', items: [
              'Manage routes',
              'Manage buses',
              'Manage admins',
              'Monitor live bus operations',
            ]),
          ],
        ),
      ),
    );
  }
}

class FeatureList extends StatelessWidget {
  final String title;
  final List<String> items;

  const FeatureList({super.key, required this.title, required this.items});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Card(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: Theme.of(context).textTheme.headlineSmall),
              const SizedBox(height: 12),
              ...items.map((item) => Padding(
                    padding: const EdgeInsets.symmetric(vertical: 6),
                    child: Row(
                      children: [
                        const Icon(Icons.check_circle, color: Colors.green),
                        const SizedBox(width: 8),
                        Expanded(child: Text(item)),
                      ],
                    ),
                  )),
            ],
          ),
        ),
      ),
    );
  }
}
