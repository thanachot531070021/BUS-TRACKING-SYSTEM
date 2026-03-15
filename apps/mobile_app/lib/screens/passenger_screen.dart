import 'package:flutter/material.dart';

class PassengerScreen extends StatelessWidget {
  const PassengerScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final routes = const [
      ('R1', 'Campus Loop', 'Main Gate', 'Engineering Building', true),
      ('R2', 'City Connector', 'Bus Terminal', 'Central Market', false),
    ];

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Text('Passenger', style: Theme.of(context).textTheme.headlineMedium),
        const SizedBox(height: 12),
        const Card(
          child: Padding(
            padding: EdgeInsets.all(16),
            child: Text('Browse routes, view live buses, and mark waiting for bus.'),
          ),
        ),
        const SizedBox(height: 16),
        ElevatedButton.icon(
          onPressed: () {},
          icon: const Icon(Icons.access_time_filled),
          label: const Text('Mark: Waiting for Bus'),
        ),
        const SizedBox(height: 16),
        ...routes.map((route) => Card(
              margin: const EdgeInsets.only(bottom: 12),
              child: ListTile(
                leading: CircleAvatar(child: Text(route.$1)),
                title: Text(route.$2),
                subtitle: Text('${route.$3} → ${route.$4}'),
                trailing: Chip(
                  label: Text(route.$5 ? 'LIVE' : 'IDLE'),
                ),
              ),
            )),
      ],
    );
  }
}
