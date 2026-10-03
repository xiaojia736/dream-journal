import 'package:flutter_test/flutter_test.dart';
import 'package:star_sea_journal/models/journal_entry.dart';

void main() {
  test('entry type and mood values round trip', () {
    expect(EntryTypeText.parse('dream'), EntryType.dream);
    expect(EntryType.dream.label, '梦境');
    expect(MoodText.parse('calm'), Mood.calm);
    expect(Mood.calm.emoji, '😌');
    expect(Mood.none.value, '');
  });

  test('existing entries and drafts default to no custom mood', () {
    final date = DateTime(2026, 10, 3);
    final entry = JournalEntry(
      id: 'old-entry',
      text: '今天很平静',
      type: EntryType.diary,
      mood: Mood.calm,
      tags: const [],
      occurredAt: date,
      createdAt: date,
      updatedAt: date,
      photos: const [],
    );
    final draft = EntryDraft(
      text: entry.text,
      type: entry.type,
      mood: entry.mood,
      tags: entry.tags,
      occurredAt: date,
    );

    expect(entry.customMood, '');
    expect(draft.customMood, '');
    expect(entry.moodLabel, '平静');
    expect(entry.hasMood, isTrue);
  });

  test('custom mood takes precedence and blank text falls back to preset', () {
    final entry = _entry(mood: Mood.happy, customMood: '  期待明天  ');

    expect(entry.moodLabel, '期待明天');
    expect(entry.hasMood, isTrue);
    expect(entry.copyWith(customMood: '   ').moodLabel, '开心');
    expect(_entry().hasMood, isFalse);
    expect(_entry(customMood: '   ').hasMood, isFalse);
  });

  test('copyWith preserves custom mood when replacing photos and can clear it', () {
    final entry = _entry(customMood: '思念');
    const photo = JournalPhoto(id: '/photos/one.jpg', mime: 'image/jpeg');
    final copied = entry.copyWith(photos: const [photo]);

    expect(copied.customMood, '思念');
    expect(copied.moodLabel, '思念');
    expect(copied.photos, const [photo]);
    expect(copied.id, entry.id);
    expect(copied.occurredAt, entry.occurredAt);
    expect(copied.copyWith(customMood: '').hasMood, isFalse);
  });
}

JournalEntry _entry({Mood mood = Mood.none, String customMood = ''}) {
  final date = DateTime(2026, 10, 3);
  return JournalEntry(
    id: 'entry',
    text: '记录一个瞬间',
    type: EntryType.moment,
    mood: mood,
    customMood: customMood,
    tags: const ['生活'],
    occurredAt: date,
    createdAt: date,
    updatedAt: date,
    photos: const [],
  );
}
