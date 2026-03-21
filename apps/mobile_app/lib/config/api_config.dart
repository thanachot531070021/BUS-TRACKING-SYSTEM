class ApiConfig {
  static const String baseUrl =
      'https://bus-tracking-worker.thanachot-jo888.workers.dev';

  // Auth
  static const String login = '/auth/login';
  static const String me = '/auth/me';

  // Public / Passenger
  static const String routes = '/routes';
  static String routeById(String id) => '/routes/$id';
  static String liveBuses({String? routeId}) =>
      routeId != null ? '/buses/live?routeId=$routeId' : '/buses/live';
  static const String waiting = '/waiting';
  static String waitingById(String id) => '/waiting/$id';
  static String waitingByRoute(String routeId) => '/waiting?routeId=$routeId';

  // Driver
  static const String driverMe = '/driver/me';
  static const String driverDuty = '/drivers/duty';
  static const String locations = '/locations';
  static String driverWaiting({String? routeId}) =>
      routeId != null ? '/driver/waiting?routeId=$routeId' : '/driver/waiting';
  static String driverPickup(String waitingId) =>
      '/driver/waiting/$waitingId/pickup';
}
