import 'package:flutter/material.dart';

import '../models/journal_entry.dart';
import '../state/app_state_scope.dart';
import '../theme/app_theme.dart';
import '../utils/date_text.dart';
import '../widgets/gradient_background.dart';

class StatsScreen extends StatelessWidget {
  const StatsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final entries = AppStateScope.of(context).entries;
    final dark = Theme.of(context).brightness == Brightness.dark;
    final typeCounts = {for (final type in EntryType.values) type: 0};
    final moodCounts = <Mood, int>{};
    final days = <String>{};
    var photoCount = 0;
    for (final entry in entries) {
      typeCounts[entry.type] = typeCounts[entry.type]! + 1;
      if (entry.mood != Mood.none) {
        moodCounts[entry.mood] = (moodCounts[entry.mood] ?? 0) + 1;
      }
      days.add(dayKey(entry.occurredAt));
      photoCount += entry.photos.length;
    }
    final activeDays = List.generate(28, (index) {
      final date = DateTime.now().subtract(Duration(days: 27 - index));
      return (date: date, active: days.contains(dayKey(date)));
    });
    final peakMood = moodCounts.values.fold<int>(
      1,
      (peak, value) => value > peak ? value : peak,
    );
    return GradientBackground(
      child: SafeArea(
        bottom: false,
        child: ListView(
          padding: const EdgeInsets.fromLTRB(20, 18, 20, 80),
          children: [
            const PageTitle('星海图鉴', subtitle: '回望那些被你认真收藏的日子'),
            Container(
              padding: const EdgeInsets.all(22),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: dark
                      ? const [Color(0xff28204f), Color(0xff51417c)]
                      : const [Color(0xffe07a5f), Color(0xffe9a66e)],
                ),
                borderRadius: BorderRadius.circular(18),
                boxShadow: [
                  BoxShadow(
                    color:
                        (dark ? AppColors.darkPrimary : AppColors.lightPrimary)
                            .withValues(alpha: .24),
                    blurRadius: 24,
                    offset: const Offset(0, 10),
                  ),
                ],
              ),
              child: Stack(
                children: [
                  const Positioned(
                    right: 0,
                    top: 0,
                    child: Icon(
                      Icons.auto_awesome,
                      color: Color(0x66ffffff),
                      size: 34,
                    ),
                  ),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        '累计记录',
                        style: TextStyle(
                          color: Color(0xffefecff),
                          letterSpacing: 1,
                        ),
                      ),
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.baseline,
                        textBaseline: TextBaseline.alphabetic,
                        children: [
                          Text(
                            '${entries.length}',
                            style: TextStyle(
                              color: dark ? AppColors.darkAccent : Colors.white,
                              fontSize: 52,
                              fontWeight: FontWeight.w700,
                              shadows: dark
                                  ? [
                                      Shadow(
                                        color: AppColors.darkAccent.withValues(
                                          alpha: .42,
                                        ),
                                        blurRadius: 10,
                                      ),
                                    ]
                                  : null,
                            ),
                          ),
                          const SizedBox(width: 6),
                          const Text(
                            '段珍贵的记忆',
                            style: TextStyle(
                              color: Color(0xfff3eeff),
                              fontSize: 16,
                            ),
                          ),
                        ],
                      ),
                      Text(
                        entries.isEmpty
                            ? '从今天开始，留住生活里的一点光。'
                            : '生活、心情与梦，都在这里留下了痕迹。',
                        style: const TextStyle(
                          color: Color(0xffede9ff),
                          height: 1.5,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 14),
            IntrinsicHeight(
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Expanded(
                    flex: 3,
                    child: _MetricCard(
                      icon: Icons.local_fire_department_outlined,
                      value: _streak(entries),
                      label: '连续记录天数',
                      emphasized: true,
                    ),
                  ),
                  const SizedBox(width: 11),
                  Expanded(
                    flex: 2,
                    child: _MetricCard(
                      icon: Icons.photo_library_outlined,
                      value: photoCount,
                      label: '收藏的照片',
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 14),
            GlassCard(
              padding: const EdgeInsets.all(17),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        '最近 28 天',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      Text(
                        '点亮 ${activeDays.where((day) => day.active).length} 天',
                        style: TextStyle(
                          color: AppColors.muted(context),
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 18),
                  Stack(
                    children: [
                      Positioned.fill(
                        child: CustomPaint(
                          painter: _ConstellationPainter(
                            activeDays.map((day) => day.active).toList(),
                            dark: dark,
                          ),
                        ),
                      ),
                      GridView.count(
                        crossAxisCount: 7,
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        mainAxisSpacing: 6,
                        crossAxisSpacing: 6,
                        children: [
                          for (final day in activeDays)
                            _StarlightDay(date: day.date, active: day.active),
                        ],
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 14),
            GlassCard(
              padding: const EdgeInsets.all(19),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    '心情足迹',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600),
                  ),
                  const SizedBox(height: 17),
                  if (moodCounts.isEmpty)
                    Text(
                      '记录心情后，这里会慢慢画出你的情绪星图。',
                      style: TextStyle(
                        color: AppColors.muted(context),
                        height: 1.5,
                      ),
                    )
                  else
                    for (final item
                        in moodCounts.entries.toList()
                          ..sort((a, b) => b.value.compareTo(a.value)))
                      Padding(
                        padding: const EdgeInsets.only(bottom: 13),
                        child: Row(
                          children: [
                            SizedBox(
                              width: 82,
                              child: Text(
                                '${item.key.emoji} ${item.key.label}',
                                style: const TextStyle(fontSize: 13),
                              ),
                            ),
                            Expanded(
                              child: _GlowProgressBar(
                                value: item.value / peakMood,
                              ),
                            ),
                            SizedBox(
                              width: 30,
                              child: Text(
                                '${item.value}',
                                textAlign: TextAlign.end,
                                style: TextStyle(
                                  color: AppColors.muted(context),
                                  fontSize: 12,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                ],
              ),
            ),
            const SizedBox(height: 14),
            GlassCard(
              padding: const EdgeInsets.all(19),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    '记录分类',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600),
                  ),
                  const SizedBox(height: 17),
                  for (final type in EntryType.values)
                    Padding(
                      padding: const EdgeInsets.only(bottom: 13),
                      child: Row(
                        children: [
                          Expanded(
                            child: Text(
                              type.label,
                              style: TextStyle(color: AppColors.muted(context)),
                            ),
                          ),
                          SizedBox(
                            width: 100,
                            child: _GlowProgressBar(
                              value: entries.isEmpty
                                  ? 0
                                  : typeCounts[type]! / entries.length,
                              height: 6,
                            ),
                          ),
                          SizedBox(
                            width: 34,
                            child: Text(
                              '${typeCounts[type]}',
                              textAlign: TextAlign.end,
                              style: const TextStyle(
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  int _streak(List<JournalEntry> entries) {
    final days = entries.map((entry) => dayKey(entry.occurredAt)).toSet();
    var cursor = DateTime.now();
    if (!days.contains(dayKey(cursor))) {
      cursor = cursor.subtract(const Duration(days: 1));
    }
    var count = 0;
    while (count < 366 && days.contains(dayKey(cursor))) {
      count++;
      cursor = cursor.subtract(const Duration(days: 1));
    }
    return count;
  }
}

class _MetricCard extends StatelessWidget {
  const _MetricCard({
    required this.icon,
    required this.value,
    required this.label,
    this.emphasized = false,
  });

  final IconData icon;
  final int value;
  final String label;
  final bool emphasized;

  @override
  Widget build(BuildContext context) {
    final dark = Theme.of(context).brightness == Brightness.dark;
    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(18),
        gradient: emphasized
            ? LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [
                  Theme.of(context).colorScheme.primary.withValues(alpha: .28),
                  AppColors.soft(context).withValues(alpha: .72),
                ],
              )
            : null,
        color: emphasized
            ? null
            : dark
            ? const Color(0xff2d244a).withValues(alpha: .55)
            : Theme.of(context).colorScheme.surface,
        border: Border.all(
          color: dark
              ? Colors.white.withValues(alpha: .12)
              : AppColors.border(context),
        ),
      ),
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, color: AppColors.accent(context)),
            const SizedBox(height: 7),
            Text(
              '$value',
              style: const TextStyle(fontSize: 28, fontWeight: FontWeight.w700),
            ),
            Text(
              label,
              style: TextStyle(color: AppColors.muted(context), fontSize: 12),
            ),
          ],
        ),
      ),
    );
  }
}

class _StarlightDay extends StatelessWidget {
  const _StarlightDay({required this.date, required this.active});

  final DateTime date;
  final bool active;

  @override
  Widget build(BuildContext context) {
    final dark = Theme.of(context).brightness == Brightness.dark;
    final starColor = dark ? AppColors.darkAccent : AppColors.lightPrimary;
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        if (active)
          Icon(
            Icons.auto_awesome,
            size: 15,
            color: starColor,
            shadows: [
              Shadow(color: starColor.withValues(alpha: .9), blurRadius: 9),
              Shadow(color: starColor.withValues(alpha: .45), blurRadius: 15),
            ],
          )
        else
          Container(
            width: 5,
            height: 5,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: AppColors.muted(context).withValues(alpha: .25),
            ),
          ),
        const SizedBox(height: 5),
        Text(
          '${date.day}',
          style: TextStyle(
            color: active
                ? starColor
                : AppColors.muted(context).withValues(alpha: .75),
            fontSize: 11,
            fontWeight: active ? FontWeight.w600 : FontWeight.w400,
          ),
        ),
      ],
    );
  }
}

class _GlowProgressBar extends StatelessWidget {
  const _GlowProgressBar({required this.value, this.height = 8});

  final double value;
  final double height;

  @override
  Widget build(BuildContext context) {
    final dark = Theme.of(context).brightness == Brightness.dark;
    return LayoutBuilder(
      builder: (context, constraints) {
        final width = constraints.maxWidth * value.clamp(0.0, 1.0);
        return Container(
          height: height,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(height),
            color: dark
                ? Colors.white.withValues(alpha: .08)
                : AppColors.lightBorder,
          ),
          alignment: Alignment.centerLeft,
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 300),
            width: width,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(height),
              gradient: LinearGradient(
                colors: dark
                    ? const [Color(0xff7c3aed), Color(0xffec8cff)]
                    : const [Color(0xffe07a5f), Color(0xffe9c46a)],
              ),
              boxShadow: width > 0 && dark
                  ? [
                      BoxShadow(
                        color: const Color(0xffa855f7).withValues(alpha: .52),
                        blurRadius: 7,
                      ),
                    ]
                  : null,
            ),
          ),
        );
      },
    );
  }
}

class _ConstellationPainter extends CustomPainter {
  const _ConstellationPainter(this.active, {required this.dark});

  final List<bool> active;
  final bool dark;

  @override
  void paint(Canvas canvas, Size size) {
    const gap = 6.0;
    final cellWidth = (size.width - gap * 6) / 7;
    final cellHeight = (size.height - gap * 3) / 4;
    final color = dark ? AppColors.darkAccent : AppColors.lightPrimary;
    final paint = Paint()
      ..color = color.withValues(alpha: dark ? .2 : .14)
      ..strokeWidth = 1
      ..style = PaintingStyle.stroke;
    for (var i = 1; i < active.length; i++) {
      if (!active[i] || !active[i - 1]) continue;
      final from = _point(i - 1, cellWidth, cellHeight, gap);
      final to = _point(i, cellWidth, cellHeight, gap);
      canvas.drawLine(from, to, paint);
    }
  }

  Offset _point(int index, double cellWidth, double cellHeight, double gap) {
    final column = index % 7;
    final row = index ~/ 7;
    return Offset(
      column * (cellWidth + gap) + cellWidth / 2,
      row * (cellHeight + gap) + cellHeight / 2 - 6,
    );
  }

  @override
  bool shouldRepaint(_ConstellationPainter oldDelegate) =>
      oldDelegate.dark != dark || !_sameDays(oldDelegate.active, active);

  bool _sameDays(List<bool> a, List<bool> b) {
    if (a.length != b.length) return false;
    for (var i = 0; i < a.length; i++) {
      if (a[i] != b[i]) return false;
    }
    return true;
  }
}
