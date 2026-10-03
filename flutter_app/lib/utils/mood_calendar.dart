import '../models/journal_entry.dart';
import 'date_text.dart';

const calendarFirstYear = 1900;
const calendarLastYear = 2100;

DateTime calendarLocalDay(DateTime date) {
  final local = date.toLocal();
  return DateTime(local.year, local.month, local.day);
}

DateTime calendarMonth(DateTime date) {
  final day = calendarLocalDay(date);
  return DateTime(day.year, day.month);
}

bool calendarSameDay(DateTime a, DateTime b) =>
    dayKey(calendarLocalDay(a)) == dayKey(calendarLocalDay(b));

int calendarMonthDays(DateTime month) =>
    DateTime(month.year, month.month + 1, 0).day;

/// Monday-first, with empty cells completing the first and last weeks.
List<DateTime?> calendarMonthCells(DateTime value) {
  final month = calendarMonth(value);
  final leading = month.weekday - DateTime.monday;
  final days = calendarMonthDays(month);
  final cellCount = ((leading + days + 6) ~/ 7) * 7;
  return List<DateTime?>.generate(cellCount, (index) {
    final day = index - leading + 1;
    return day < 1 || day > days
        ? null
        : DateTime(month.year, month.month, day);
  }, growable: false);
}

DateTime calendarShiftMonth(DateTime value, int delta) {
  final month = calendarMonth(value);
  final next = DateTime(month.year, month.month + delta);
  if (next.year < calendarFirstYear) return DateTime(calendarFirstYear, 1);
  if (next.year > calendarLastYear) return DateTime(calendarLastYear, 12);
  return next;
}

/// Carry the selected day number across months, clipping 31 to a short month.
DateTime calendarSelectionInMonth(DateTime selected, DateTime month) {
  final nextMonth = calendarMonth(month);
  final previousDay = calendarLocalDay(selected).day;
  final lastDay = calendarMonthDays(nextMonth);
  return DateTime(
    nextMonth.year,
    nextMonth.month,
    previousDay > lastDay ? lastDay : previousDay,
  );
}

class CalendarMood {
  const CalendarMood({
    required this.mood,
    required this.label,
    required this.custom,
  });

  final Mood mood;
  final String label;
  final bool custom;

  String get key => custom ? 'custom:$label' : 'preset:${mood.value}';
}

class CalendarDayRecords {
  const CalendarDayRecords({
    required this.date,
    required this.records,
    required this.moods,
  });

  final DateTime date;
  final List<JournalEntry> records;
  final List<CalendarMood> moods;

  CalendarMood? get latestMood => moods.isEmpty ? null : moods.first;
}

/// Calendar dates always follow the device's local occurredAt date.
/// No mood is synthesized for entries without one; the newest real mood is
/// used in a cell even if a later record on that day has no mood.
Map<String, CalendarDayRecords> calendarRecordsByDay(
  Iterable<JournalEntry> entries, {
  DateTime? month,
}) {
  final targetMonth = month == null ? null : calendarMonth(month);
  final grouped = <String, List<JournalEntry>>{};
  for (final entry in entries) {
    final date = calendarLocalDay(entry.occurredAt);
    if (targetMonth != null &&
        (date.year != targetMonth.year || date.month != targetMonth.month)) {
      continue;
    }
    (grouped[dayKey(date)] ??= []).add(entry);
  }
  return grouped.map((key, records) {
    records.sort((a, b) {
      final occurred = b.occurredAt.compareTo(a.occurredAt);
      if (occurred != 0) return occurred;
      final updated = b.updatedAt.compareTo(a.updatedAt);
      return updated != 0 ? updated : a.id.compareTo(b.id);
    });
    final moods = <CalendarMood>[];
    final seen = <String>{};
    for (final entry in records) {
      if (!entry.hasMood) continue;
      final custom = entry.customMood.trim().isNotEmpty;
      final mood = CalendarMood(
        mood: custom ? Mood.none : entry.mood,
        label: entry.moodLabel,
        custom: custom,
      );
      if (seen.add(mood.key)) moods.add(mood);
    }
    return MapEntry(
      key,
      CalendarDayRecords(
        date: calendarLocalDay(records.first.occurredAt),
        records: List.unmodifiable(records),
        moods: List.unmodifiable(moods),
      ),
    );
  });
}
