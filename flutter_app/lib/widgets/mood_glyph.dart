import 'dart:math' as math;

import 'package:flutter/material.dart';

import '../models/journal_entry.dart';
import '../theme/app_theme.dart';

/// A shared set of soft, rounded mood symbols, independent of system emoji.
class MoodGlyph extends StatelessWidget {
  const MoodGlyph({
    super.key,
    required this.mood,
    this.custom = false,
    this.selected = false,
    this.size = 28,
  });

  final Mood mood;
  final bool custom;
  final bool selected;
  final double size;

  @override
  Widget build(BuildContext context) => ExcludeSemantics(
    child: SizedBox.square(
      dimension: size,
      child: CustomPaint(
        painter: _MoodGlyphPainter(
          mood,
          custom,
          selected || Theme.of(context).brightness == Brightness.light,
        ),
      ),
    ),
  );
}

class MoodBadge extends StatelessWidget {
  const MoodBadge({
    super.key,
    required this.mood,
    required this.label,
    this.custom = false,
  });

  final Mood mood;
  final String label;
  final bool custom;

  @override
  Widget build(BuildContext context) {
    final dark = Theme.of(context).brightness == Brightness.dark;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 5),
      decoration: BoxDecoration(
        color: dark
            ? Colors.white.withValues(alpha: .04)
            : Colors.white.withValues(alpha: .7),
        borderRadius: BorderRadius.circular(99),
        border: Border.all(color: AppColors.border(context)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          MoodGlyph(mood: mood, custom: custom, size: 23),
          const SizedBox(width: 7),
          Flexible(
            child: Text(
              label,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                color: AppColors.body(context),
                fontSize: 12,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _MoodGlyphPainter extends CustomPainter {
  const _MoodGlyphPainter(this.mood, this.custom, this.darken);

  final Mood mood;
  final bool custom;
  final bool darken;

  Color get color => custom
      ? const Color(0xffe7b6d6)
      : switch (mood) {
          Mood.happy => const Color(0xfff5d883),
          Mood.calm => const Color(0xffb9b8f8),
          Mood.sad => const Color(0xffa5cbec),
          Mood.anxious => const Color(0xffa9d7ce),
          Mood.excited => const Color(0xffe3b5e7),
          Mood.confused => const Color(0xffbcc7df),
          Mood.scared => const Color(0xffbacbd4),
          Mood.none => const Color(0xffe7b6d6),
        };

  @override
  void paint(Canvas canvas, Size size) {
    canvas.save();
    canvas.scale(size.width / 32);
    canvas.drawCircle(
      const Offset(16, 16),
      16,
      Paint()..color = color.withValues(alpha: .15),
    );
    canvas.translate(4, 4);
    final lineColor = darken
        ? Color.lerp(color, AppColors.darkSelectedText, .52)!
        : color;
    final stroke = Paint()
      ..color = lineColor
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.5
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round;
    if (custom || mood == Mood.none) {
      _heart(canvas, stroke);
    } else {
      switch (mood) {
        case Mood.happy:
          canvas.drawCircle(const Offset(12, 12), 3.8, stroke);
          for (var i = 0; i < 8; i++) {
            final angle = i * math.pi / 4;
            canvas.drawLine(
              Offset(12 + math.cos(angle) * 6.7, 12 + math.sin(angle) * 6.7),
              Offset(12 + math.cos(angle) * 8.7, 12 + math.sin(angle) * 8.7),
              stroke,
            );
          }
          break;
        case Mood.calm:
          final moon = Path()
            ..moveTo(17.6, 3.9)
            ..cubicTo(7, 2.1, 2.4, 14, 10, 19.1)
            ..cubicTo(14.7, 22.3, 20, 18.2, 20.1, 14.8)
            ..cubicTo(12.4, 18.5, 7.8, 8.9, 17.6, 3.9)
            ..close();
          canvas.drawPath(moon, stroke);
          break;
        case Mood.sad:
          final drop = Path()
            ..moveTo(12, 3)
            ..cubicTo(10, 7, 5.7, 11.1, 6.5, 15.2)
            ..cubicTo(7.8, 21.5, 17.5, 21.5, 18, 15.2)
            ..cubicTo(18.4, 11.2, 14.1, 6.8, 12, 3)
            ..close();
          canvas.drawPath(drop, stroke);
          canvas.drawArc(
            const Rect.fromLTWH(9, 12, 5, 5),
            1.3,
            1.3,
            false,
            stroke,
          );
          break;
        case Mood.anxious:
          final wind = Path()
            ..moveTo(3, 8)
            ..lineTo(14, 8)
            ..cubicTo(19, 8, 18.5, 2, 14.5, 4.3)
            ..moveTo(3, 12)
            ..lineTo(18, 12)
            ..cubicTo(23, 12, 22, 7, 19, 8)
            ..moveTo(3, 16)
            ..lineTo(13, 16)
            ..cubicTo(17.5, 16, 17, 22, 13, 20);
          canvas.drawPath(wind, stroke);
          break;
        case Mood.excited:
          final star = Path()
            ..moveTo(12, 2.5)
            ..quadraticBezierTo(14, 10, 21.5, 12)
            ..quadraticBezierTo(14, 14, 12, 21.5)
            ..quadraticBezierTo(10, 14, 2.5, 12)
            ..quadraticBezierTo(10, 10, 12, 2.5)
            ..close();
          canvas.drawPath(star, stroke);
          break;
        case Mood.confused:
          final cloud = Path()
            ..moveTo(6, 18)
            ..cubicTo(.5, 17.8, 1, 10, 6.5, 10)
            ..cubicTo(8.6, 2, 18.5, 3, 18.6, 10)
            ..cubicTo(24.5, 11, 23, 18.3, 18, 18)
            ..close();
          canvas.drawPath(cloud, stroke);
          break;
        case Mood.scared:
          final shield = Path()
            ..moveTo(12, 3)
            ..lineTo(19, 6)
            ..lineTo(18.7, 12)
            ..cubicTo(18.4, 16.8, 15.5, 19.7, 12, 21)
            ..cubicTo(8.5, 19.7, 5.6, 16.8, 5.3, 12)
            ..lineTo(5, 6)
            ..close();
          canvas.drawPath(shield, stroke);
          canvas.drawLine(const Offset(12, 8), const Offset(12, 13), stroke);
          canvas.drawCircle(const Offset(12, 16), .6, Paint()..color = lineColor);
          break;
        case Mood.none:
          break;
      }
    }
    canvas.restore();
  }

  void _heart(Canvas canvas, Paint stroke) {
    final heart = Path()
      ..moveTo(12, 20)
      ..cubicTo(9.5, 17.8, 3, 13.2, 3, 8.3)
      ..cubicTo(3, 3, 9.5, 2.5, 12, 7)
      ..cubicTo(14.5, 2.5, 21, 3, 21, 8.3)
      ..cubicTo(21, 13.2, 14.5, 17.8, 12, 20)
      ..close();
    canvas.drawPath(heart, stroke);
  }

  @override
  bool shouldRepaint(_MoodGlyphPainter oldDelegate) =>
      oldDelegate.mood != mood ||
      oldDelegate.custom != custom ||
      oldDelegate.darken != darken;
}
