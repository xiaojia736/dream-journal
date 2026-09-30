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
                gradient: const LinearGradient(
                  colors: [Color(0xff394a81), Color(0xff6b5b9f)],
                ),
                borderRadius: BorderRadius.circular(24),
              ),
              child: Column(
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
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 52,
                          fontWeight: FontWeight.w900,
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
                    entries.isEmpty ? '从今天开始，留住生活里的一点光。' : '生活、心情与梦，都在这里留下了痕迹。',
                    style: const TextStyle(
                      color: Color(0xffede9ff),
                      height: 1.5,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 14),
            Row(
              children: [
                Expanded(
                  child: _MetricCard(
                    icon: Icons.local_fire_department_outlined,
                    value: _streak(entries),
                    label: '连续记录天数',
                  ),
                ),
                const SizedBox(width: 11),
                Expanded(
                  child: _MetricCard(
                    icon: Icons.photo_library_outlined,
                    value: photoCount,
                    label: '收藏的照片',
                  ),
                ),
              ],
            ),
            const SizedBox(height: 14),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(19),
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
                            fontWeight: FontWeight.w800,
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
                    GridView.count(
                      crossAxisCount: 7,
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      mainAxisSpacing: 8,
                      crossAxisSpacing: 8,
                      children: [
                        for (final day in activeDays)
                          Container(
                            alignment: Alignment.center,
                            decoration: BoxDecoration(
                              color: day.active
                                  ? Theme.of(context).colorScheme.primary
                                  : AppColors.soft(context),
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: Text(
                              '${day.date.day}',
                              style: TextStyle(
                                color: day.active
                                    ? Theme.of(context).colorScheme.onPrimary
                                    : AppColors.muted(context),
                                fontSize: 11,
                                fontWeight: day.active
                                    ? FontWeight.w800
                                    : FontWeight.w500,
                              ),
                            ),
                          ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 14),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(19),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      '心情足迹',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w800,
                      ),
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
                                child: LinearProgressIndicator(
                                  value: item.value / peakMood,
                                  borderRadius: BorderRadius.circular(6),
                                  minHeight: 8,
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
            ),
            const SizedBox(height: 14),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(19),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      '记录分类',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w800,
                      ),
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
                                style: TextStyle(
                                  color: AppColors.muted(context),
                                ),
                              ),
                            ),
                            SizedBox(
                              width: 100,
                              child: LinearProgressIndicator(
                                value: entries.isEmpty
                                    ? 0
                                    : typeCounts[type]! / entries.length,
                                borderRadius: BorderRadius.circular(4),
                                minHeight: 6,
                              ),
                            ),
                            SizedBox(
                              width: 34,
                              child: Text(
                                '${typeCounts[type]}',
                                textAlign: TextAlign.end,
                                style: const TextStyle(
                                  fontWeight: FontWeight.w800,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                  ],
                ),
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
  });

  final IconData icon;
  final int value;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: EdgeInsets.zero,
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, color: AppColors.accent(context)),
            const SizedBox(height: 7),
            Text(
              '$value',
              style: const TextStyle(fontSize: 27, fontWeight: FontWeight.w900),
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
