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
}
