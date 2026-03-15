import 'package:flutter/material.dart';

class AdminInfoScreen extends StatelessWidget {
  const AdminInfoScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: const [
        Text('Admin', style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold)),
        SizedBox(height: 12),
        Card(child: ListTile(title: Text('Super Admin'), subtitle: Text('Manage all routes, buses, admins'))),
        Card(child: ListTile(title: Text('Route Admin'), subtitle: Text('Manage only assigned route data'))),
        Card(child: ListTile(title: Text('Realtime Source'), subtitle: Text('Supabase Realtime'))),
        Card(child: ListTile(title: Text('Map Provider'), subtitle: Text('Google Maps API'))),
      ],
    );
  }
}
