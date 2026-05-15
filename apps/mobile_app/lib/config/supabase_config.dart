class SupabaseConfig {
  // Fill these in from your Supabase project Settings → API
  // Required for Realtime subscriptions (bus positions, waiting passengers)
  static const String url = 'https://vvdczpstdkncajsnxmcq.supabase.co';
  static const String anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3';

  // Realtime tables (must have Realtime enabled in Supabase Dashboard)
  static const String busesTable = 'buses';
  static const String waitingTable = 'passenger_waiting';
}

