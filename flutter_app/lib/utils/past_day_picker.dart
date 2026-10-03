import 'dart:math';

import '../models/journal_entry.dart';
import 'date_text.dart';

/// One candidate per local calendar date, regardless of its record count.
List<DateTime> pastRecordDays(
  Iterable<JournalEntry> entries, {
  required DateTime now,
}) {
  final localNow = now.toLocal();
  final today = DateTime(localNow.year, localNow.month, localNow.day);
  final days = <DateTime>{};
  for (final entry in entries) {
    final localDate = entry.occurredAt.toLocal();
    final day = DateTime(localDate.year, localDate.month, localDate.day);
    if (day.isBefore(today)) days.add(day);
  }
  return days.toList()..sort((a, b) => b.compareTo(a));
}

DateTime? pickPastDay(
  Iterable<JournalEntry> entries, {
  required DateTime now,
  DateTime? previous,
  Random? random,
}) {
  final days = pastRecordDays(entries, now: now);
  if (days.isEmpty) return null;
  final candidates = days.length > 1 && previous != null
      ? days.where((day) => dayKey(day) != dayKey(previous.toLocal())).toList()
      : days;
  return candidates[(random ?? Random()).nextInt(candidates.length)];
}
