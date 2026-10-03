import 'package:flutter/material.dart';

import '../screens/recall_screen.dart';
import '../state/app_state_scope.dart';
import '../theme/app_theme.dart';
import '../utils/date_text.dart';
import '../utils/mood_calendar.dart';
import 'gradient_background.dart';
import 'mood_glyph.dart';

class MoodRecordCalendar extends StatefulWidget {
  const MoodRecordCalendar({super.key, required this.today});

  final DateTime today;

  @override
  State<MoodRecordCalendar> createState() => _MoodRecordCalendarState();
}

class _MoodRecordCalendarState extends State<MoodRecordCalendar> {
  late DateTime _month;
  late DateTime _selectedDay;

  @override
  void initState() {
    super.initState();
    _selectedDay = calendarLocalDay(widget.today);
    _month = calendarMonth(_selectedDay);
  }

  @override
  void didUpdateWidget(MoodRecordCalendar oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (!calendarSameDay(oldWidget.today, widget.today) &&
        calendarSameDay(_selectedDay, oldWidget.today)) {
      // Follow midnight only while looking at today. Browsing older dates stays
      // in place when the app resumes or the daily reflection updates.
      _selectedDay = calendarLocalDay(widget.today);
      _month = calendarMonth(_selectedDay);
    }
  }

  void _changeMonth(int delta) {
    final next = calendarShiftMonth(_month, delta);
    if (next == _month) return;
    setState(() {
      _month = next;
      _selectedDay = calendarSelectionInMonth(_selectedDay, next);
    });
  }

  @override
  Widget build(BuildContext context) {
    final state = AppStateScope.of(context);
    final records = calendarRecordsByDay(state.entries, month: _month);
    final selected = records[dayKey(_selectedDay)];
    final cells = calendarMonthCells(_month);
    final scaledDateHeight = MediaQuery.textScalerOf(context).scale(13) * 1.3;
    final dayExtent = (scaledDateHeight + 3 + 20 + 12)
        .clamp(52.0, double.infinity)
        .toDouble();
    final firstMonth = DateTime(calendarFirstYear, 1);
    final lastMonth = DateTime(calendarLastYear, 12);
    return GlassCard(
      radius: 26,
      padding: const EdgeInsets.fromLTRB(18, 12, 18, 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              _MonthArrow(
                tooltip: '上一月',
                icon: Icons.chevron_left_rounded,
                onPressed: _month.isAfter(firstMonth)
                    ? () => _changeMonth(-1)
                    : null,
              ),
              Expanded(
                child: Text(
                  '${_month.year} 年 ${_month.month} 月',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: AppColors.heading(context),
                    fontSize: 15,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
              _MonthArrow(
                tooltip: '下一月',
                icon: Icons.chevron_right_rounded,
                onPressed: _month.isBefore(lastMonth)
                    ? () => _changeMonth(1)
                    : null,
              ),
            ],
          ),
          const SizedBox(height: 10),
          Row(
            children: const ['一', '二', '三', '四', '五', '六', '日']
                .map(
                  (label) => Expanded(
                    child: Text(
                      label,
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        color: AppColors.muted(context),
                        fontSize: 11,
                        height: 1.6,
                      ),
                    ),
                  ),
                )
                .toList(),
          ),
          const SizedBox(height: 8),
          GridView.builder(
            shrinkWrap: true,
            primary: false,
            physics: const NeverScrollableScrollPhysics(),
            padding: EdgeInsets.zero,
            gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 7,
              mainAxisExtent: dayExtent,
              crossAxisSpacing: 2,
              mainAxisSpacing: 4,
            ),
            itemCount: cells.length,
            itemBuilder: (context, index) {
              final date = cells[index];
              if (date == null) return const SizedBox.shrink();
              return _CalendarDay(
                date: date,
                records: records[dayKey(date)],
                selected: calendarSameDay(date, _selectedDay),
                today: calendarSameDay(date, widget.today),
                onTap: () => setState(() => _selectedDay = date),
              );
            },
          ),
          const SizedBox(height: 16),
          Divider(color: AppColors.border(context)),
          const SizedBox(height: 16),
          Text(
            '${_selectedDay.month}月${_selectedDay.day}日',
            style: TextStyle(
              color: AppColors.heading(context),
              fontSize: 13,
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(height: 10),
          if (selected == null)
            Text(
              '这一天，还留着一页空白。',
              style: TextStyle(
                color: AppColors.muted(context),
                fontSize: 12,
                height: 1.7,
              ),
            )
          else ...[
            if (selected.moods.isEmpty)
              Text(
                '这一天的片刻，已经悄悄留下。',
                style: TextStyle(
                  color: AppColors.muted(context),
                  fontSize: 12,
                  height: 1.7,
                ),
              )
            else
              Wrap(
                spacing: 7,
                runSpacing: 7,
                children: selected.moods
                    .map(
                      (mood) => MoodBadge(
                        mood: mood.mood,
                        label: mood.label,
                        custom: mood.custom,
                      ),
                    )
                    .toList(),
              ),
            const SizedBox(height: 12),
            _ViewDayRecords(
              onPressed: () => Navigator.of(context).push<void>(
                MaterialPageRoute(
                  builder: (_) => RecallScreen(initialDate: _selectedDay),
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _MonthArrow extends StatelessWidget {
  const _MonthArrow({
    required this.tooltip,
    required this.icon,
    required this.onPressed,
  });

  final String tooltip;
  final IconData icon;
  final VoidCallback? onPressed;

  @override
  Widget build(BuildContext context) => SizedBox.square(
    dimension: 44,
    child: IconButton(
      tooltip: tooltip,
      onPressed: onPressed,
      icon: Icon(icon, size: 20),
      padding: EdgeInsets.zero,
      color: AppColors.body(context),
    ),
  );
}

class _CalendarDay extends StatelessWidget {
  const _CalendarDay({
    required this.date,
    required this.records,
    required this.selected,
    required this.today,
    required this.onTap,
  });

  final DateTime date;
  final CalendarDayRecords? records;
  final bool selected;
  final bool today;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final dark = Theme.of(context).brightness == Brightness.dark;
    final mood = records?.latestMood;
    final label = '${date.year}年${date.month}月${date.day}日'
        '${today ? '，今天' : ''}'
        '${records == null ? '，没有记录' : '，有记录'}'
        '${mood == null ? '' : '，${mood.label}'}';
    return Semantics(
      label: label,
      button: true,
      selected: selected,
      onTap: onTap,
      child: ExcludeSemantics(
        child: Material(
          color: selected
              ? (dark
                    ? const Color.fromRGBO(255, 250, 255, .20)
                    : const Color.fromRGBO(174, 153, 218, .22))
              : Colors.transparent,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(15),
            side: BorderSide(
              color: today
                  ? AppColors.heading(context).withValues(alpha: .42)
                  : Colors.transparent,
            ),
          ),
          child: InkWell(
            onTap: onTap,
            borderRadius: BorderRadius.circular(15),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  '${date.day}',
                  style: TextStyle(
                    color: selected || today
                        ? AppColors.heading(context)
                        : AppColors.body(context),
                    fontSize: 13,
                    height: 1.3,
                    fontWeight: selected ? FontWeight.w600 : FontWeight.w400,
                  ),
                ),
                const SizedBox(height: 3),
                SizedBox(
                  height: 20,
                  child: mood != null
                      ? MoodGlyph(
                          mood: mood.mood,
                          custom: mood.custom,
                          selected: selected,
                          size: 20,
                        )
                      : Center(
                          child: records == null
                              ? const SizedBox.shrink()
                              : Container(
                                  width: 4,
                                  height: 4,
                                  decoration: BoxDecoration(
                                    shape: BoxShape.circle,
                                    color: dark
                                        ? const Color(0xffd5c9fb)
                                        : AppColors.lightPrimary,
                                    boxShadow: [
                                      BoxShadow(
                                        color: AppColors.darkPrimary
                                            .withValues(alpha: .38),
                                        blurRadius: 5,
                                      ),
                                    ],
                                  ),
                                ),
                        ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _ViewDayRecords extends StatelessWidget {
  const _ViewDayRecords({required this.onPressed});

  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) => SizedBox(
    width: double.infinity,
    height: 44,
    child: TextButton(
      onPressed: onPressed,
      style: TextButton.styleFrom(
        foregroundColor: AppColors.heading(context),
        backgroundColor: Theme.of(context).brightness == Brightness.dark
            ? Colors.white.withValues(alpha: .10)
            : AppColors.lightPrimary.withValues(alpha: .10),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        textStyle: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500),
      ),
      child: const Text('查看当天记录'),
    ),
  );
}
