import 'package:flutter_test/flutter_test.dart';
import 'package:star_sea_journal/models/journal_entry.dart';
import 'package:star_sea_journal/utils/date_text.dart';
import 'package:star_sea_journal/utils/mood_calendar.dart';

void main() {
  test('Monday-first grids align short, leap and six-week months', () {
    final february = calendarMonthCells(DateTime(2024, 2));
    expect(february.length, 35);
    expect(february.take(3), everyElement(isNull));
    expect(february[3], DateTime(2024, 2, 1));
    expect(february[31], DateTime(2024, 2, 29));
    expect(february.whereType<DateTime>().length, 29);

    final mondayStart = calendarMonthCells(DateTime(2021, 2));
    expect(mondayStart.length, 28);
    expect(mondayStart.first, DateTime(2021, 2, 1));
    expect(mondayStart.last, DateTime(2021, 2, 28));

    final sixWeeks = calendarMonthCells(DateTime(2026, 3));
    expect(sixWeeks.length, 42);
    expect(sixWeeks.take(6), everyElement(isNull));
    expect(sixWeeks[6], DateTime(2026, 3, 1));
    expect(sixWeeks[36], DateTime(2026, 3, 31));
  });

  test('month navigation crosses years and clamps navigation bounds', () {
    expect(calendarShiftMonth(DateTime(2026, 12), 1), DateTime(2027, 1));
    expect(calendarShiftMonth(DateTime(2026, 1), -1), DateTime(2025, 12));
    expect(calendarShiftMonth(DateTime(1900, 1), -1), DateTime(1900, 1));
    expect(calendarShiftMonth(DateTime(2100, 12), 1), DateTime(2100, 12));
    expect(calendarMonthDays(DateTime(1900, 2)), 28);
    expect(calendarMonthDays(DateTime(2000, 2)), 29);
    expect(calendarMonthDays(DateTime(2100, 2)), 28);
  });

  test('selection carries the day number and clips to month end', () {
    expect(
      calendarSelectionInMonth(DateTime(2024, 1, 31), DateTime(2024, 2)),
      DateTime(2024, 2, 29),
    );
    expect(
      calendarSelectionInMonth(DateTime(2026, 1, 31), DateTime(2026, 2)),
      DateTime(2026, 2, 28),
    );
    expect(
      calendarSelectionInMonth(DateTime(2026, 12, 3), DateTime(2027, 1)),
      DateTime(2027, 1, 3),
    );
  });

  test('grouping follows local occurredAt rather than createdAt or UTC keys', () {
    final local = DateTime(2026, 10, 3, 0, 15);
    final entry = _entry(
      'near-midnight',
      local.toUtc(),
      createdAt: DateTime(2026, 10, 4),
    );
    final grouped = calendarRecordsByDay([entry], month: DateTime(2026, 10));
    expect(grouped.keys, ['2026-10-03']);
    expect(grouped['2026-10-03']!.date, DateTime(2026, 10, 3));
    expect(calendarSameDay(local, local.toUtc()), isTrue);

    final anotherMonth = _entry('september', DateTime(2026, 9, 30, 23, 59));
    expect(
      calendarRecordsByDay([entry, anotherMonth], month: DateTime(2026, 10))
          .keys,
      ['2026-10-03'],
    );
  });

  test('latest real mood wins while all distinct day moods remain available', () {
    final entries = [
      _entry('early-calm', DateTime(2026, 10, 3, 8), mood: Mood.calm),
      _entry('happy', DateTime(2026, 10, 3, 12), mood: Mood.happy),
      _entry('custom', DateTime(2026, 10, 3, 15), customMood: ' 想念 '),
      _entry('late-calm', DateTime(2026, 10, 3, 16), mood: Mood.calm),
      _entry('latest-no-mood', DateTime(2026, 10, 3, 20)),
      _entry('duplicate-custom', DateTime(2026, 10, 3, 14), customMood: '想念'),
    ];
    final day = calendarRecordsByDay(entries)['2026-10-03']!;
    expect(day.records.first.id, 'latest-no-mood');
    expect(day.latestMood!.mood, Mood.calm);
    expect(day.moods.map((mood) => mood.label), ['平静', '想念', '开心']);
    expect(day.moods[1].custom, isTrue);
    expect(day.moods[1].mood, Mood.none);
    // Grouping sorts its own lists; the AppState entry list stays untouched.
    expect(entries.first.id, 'early-calm');
  });

  test('blank moods are not invented and ties are deterministic', () {
    final date = DateTime(2026, 10, 3, 12);
    final blank = calendarRecordsByDay([
      _entry('blank', date, customMood: '  '),
    ])[dayKey(date)]!;
    expect(blank.moods, isEmpty);
    expect(blank.latestMood, isNull);

    final a = _entry('a', date, mood: Mood.sad);
    final b = _entry('b', date, mood: Mood.happy);
    expect(
      calendarRecordsByDay([b, a])[dayKey(date)]!.latestMood!.mood,
      calendarRecordsByDay([a, b])[dayKey(date)]!.latestMood!.mood,
    );
    expect(calendarRecordsByDay(const <JournalEntry>[]), isEmpty);
  });
}

JournalEntry _entry(
  String id,
  DateTime date, {
  Mood mood = Mood.none,
  String customMood = '',
  DateTime? createdAt,
}) => JournalEntry(
  id: id,
  text: '记录',
  type: EntryType.moment,
  mood: mood,
  customMood: customMood,
  tags: const [],
  occurredAt: date,
  createdAt: createdAt ?? date,
  updatedAt: date,
  photos: const [],
);
