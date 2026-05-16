import 'dart:ui' as ui;
import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';

/// Renders a pin-shaped bus marker on Canvas → BitmapDescriptor.
/// Call once in initState and cache the result.
Future<BitmapDescriptor> createBusMarker({
  Color color = const Color(0xFF2563EB),
}) async {
  const double w = 56;
  const double bodyH = 42.0;

  final recorder = ui.PictureRecorder();
  final canvas = Canvas(recorder, Rect.fromLTWH(0, 0, w, w));

  // Drop shadow
  canvas.drawRRect(
    RRect.fromRectAndRadius(
      Rect.fromLTWH(2, 3, w - 2, bodyH),
      const Radius.circular(10),
    ),
    Paint()
      ..color = const Color(0x33000000)
      ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 3),
  );

  // Badge background
  canvas.drawRRect(
    RRect.fromRectAndRadius(Rect.fromLTWH(0, 0, w, bodyH), const Radius.circular(10)),
    Paint()..color = color,
  );

  // Pin triangle at bottom
  canvas.drawPath(
    Path()
      ..moveTo(w * 0.33, bodyH - 1)
      ..lineTo(w * 0.67, bodyH - 1)
      ..lineTo(w * 0.5, w)
      ..close(),
    Paint()..color = color,
  );

  // Bus icon (MaterialIcons font)
  final tp = TextPainter(
    text: TextSpan(
      text: String.fromCharCode(Icons.directions_bus.codePoint),
      style: const TextStyle(
        fontSize: 26,
        fontFamily: 'MaterialIcons',
        color: Colors.white,
      ),
    ),
    textDirection: TextDirection.ltr,
  )..layout();
  tp.paint(canvas, Offset((w - tp.width) / 2, (bodyH - tp.height) / 2));

  final img = await recorder.endRecording().toImage(w.toInt(), w.toInt());
  final bytes =
      (await img.toByteData(format: ui.ImageByteFormat.png))!.buffer.asUint8List();
  return BitmapDescriptor.fromBytes(bytes);
}
