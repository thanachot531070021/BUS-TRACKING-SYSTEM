import 'package:flutter/material.dart';

class DriverScreen extends StatelessWidget {
  const DriverScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: const [
        Text('Driver', style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold)),
        SizedBox(height: 12),
        Card(child: ListTile(title: Text('Duty Status'), subtitle: Text('OFF'))),
        Card(child: ListTile(title: Text('Assigned Bus'), subtitle: Text('10-1234'))),
        Card(child: ListTile(title: Text('Assigned Route'), subtitle: Text('Campus Loop'))),
        Card(child: ListTile(title: Text('GPS Upload Interval'), subtitle: Text('5–10 seconds'))),
      ],
    );
  }
}
