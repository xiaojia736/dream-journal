import 'package:flutter_test/flutter_test.dart';
import 'package:star_sea_journal/utils/journal_limits.dart';

void main() {
  test('legacy five-photo and new nine-photo records are valid, ten are not', () {
    expect(isEntryPhotoCountAllowed(5), isTrue);
    expect(isEntryPhotoCountAllowed(9), isTrue);
    expect(isEntryPhotoCountAllowed(10), isFalse);
  });

  test('eight retained photos have one slot and a full record has none', () {
    expect(remainingEntryPhotoSlots(8), 1);
    expect(remainingEntryPhotoSlots(9), 0);
    expect(remainingEntryPhotoSlots(10), 0);
  });

  test('removing old photos makes room for replacements without exceeding nine', () {
    const original = 9;
    const removed = 2;
    const pending = 1;
    final count = original - removed + pending;

    expect(remainingEntryPhotoSlots(count), 1);
    expect(isEntryPhotoCountAllowed(count + 1), isTrue);
    expect(isEntryPhotoCountAllowed(count + 2), isFalse);
  });

  test('a picker that ignores its limit cannot append more than the free slots', () {
    final returnedPhotos = List.generate(10, (index) => 'photo-$index');
    final appended = returnedPhotos.take(remainingEntryPhotoSlots(8)).toList();

    expect(appended, ['photo-0']);
    expect(isEntryPhotoCountAllowed(8 + appended.length), isTrue);
    expect(remainingEntryPhotoSlots(9), 0);
  });
}
