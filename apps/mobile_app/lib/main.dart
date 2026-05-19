import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'config/supabase_config.dart';
import 'providers/announcement_provider.dart';
import 'providers/auth_provider.dart';
import 'providers/driver_provider.dart';
import 'providers/favorites_provider.dart';
import 'providers/route_provider.dart';
import 'screens/splash_screen.dart';
import 'services/api_service.dart';
import 'services/auth_service.dart';
import 'services/bus_service.dart';
import 'services/location_service.dart';
import 'services/route_service.dart';
import 'services/waiting_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize Supabase (for Realtime subscriptions)
  // Replace SupabaseConfig values with your actual project credentials
  if (SupabaseConfig.url != 'YOUR_SUPABASE_URL') {
    await Supabase.initialize(
      url: SupabaseConfig.url,
      anonKey: SupabaseConfig.anonKey,
    );
  }

  runApp(const BusTrackingApp());
}

class BusTrackingApp extends StatelessWidget {
  const BusTrackingApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        // Services
        Provider<AuthService>(create: (_) => AuthService(apiService)),
        Provider<RouteService>(create: (_) => RouteService(apiService)),
        Provider<BusService>(create: (_) => BusService(apiService)),
        Provider<WaitingService>(create: (_) => WaitingService(apiService)),
        Provider<LocationService>(create: (_) => LocationService(apiService)),

        // Providers (state management)
        ChangeNotifierProvider<AuthProvider>(
          create: (ctx) => AuthProvider(ctx.read<AuthService>()),
        ),
        ChangeNotifierProvider<RouteProvider>(
          create: (ctx) => RouteProvider(
            ctx.read<RouteService>(),
            ctx.read<BusService>(),
            ctx.read<WaitingService>(),
          ),
        ),
        ChangeNotifierProvider<DriverProvider>(
          create: (ctx) => DriverProvider(
            apiService,
            ctx.read<LocationService>(),
            ctx.read<WaitingService>(),
          ),
        ),
        ChangeNotifierProvider<AnnouncementProvider>(
          create: (_) => AnnouncementProvider(),
        ),
        ChangeNotifierProvider<FavoritesProvider>(
          create: (_) => FavoritesProvider(),
        ),
      ],
      child: MaterialApp(
        debugShowCheckedModeBanner: false,
        title: 'Bus Tracking System',
        theme: ThemeData(
          colorScheme: ColorScheme.fromSeed(
            seedColor: const Color(0xFF2563EB),
          ),
          useMaterial3: true,
        ),
        home: const SplashScreen(),
      ),
    );
  }
}
