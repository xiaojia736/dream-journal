enum EntryType { moment, dream, diary, os }

enum Mood { none, happy, calm, sad, anxious, excited, confused, scared }

extension EntryTypeText on EntryType {
  String get value => name;

  String get label => switch (this) {
    EntryType.moment => '生活',
    EntryType.dream => '梦境',
    EntryType.diary => '日记',
    EntryType.os => '内心 OS',
  };

  static EntryType parse(String value) => EntryType.values.firstWhere(
    (type) => type.name == value,
    orElse: () => EntryType.moment,
  );
}

extension MoodText on Mood {
  String get value => this == Mood.none ? '' : name;

  String get label => switch (this) {
    Mood.none => '',
    Mood.happy => '开心',
    Mood.calm => '平静',
    Mood.sad => '难过',
    Mood.anxious => '焦虑',
    Mood.excited => '兴奋',
    Mood.confused => '困惑',
    Mood.scared => '恐惧',
  };

  String get emoji => switch (this) {
    Mood.none => '',
    Mood.happy => '😊',
    Mood.calm => '😌',
    Mood.sad => '😢',
    Mood.anxious => '😰',
    Mood.excited => '🤩',
    Mood.confused => '😵',
    Mood.scared => '😱',
  };

  static Mood parse(String value) => Mood.values.firstWhere(
    (mood) => mood.value == value,
    orElse: () => Mood.none,
  );
}

class JournalPhoto {
  const JournalPhoto({required this.id, required this.mime});

  final String id;
  final String mime;
}

class JournalEntry {
  const JournalEntry({
    required this.id,
    required this.text,
    required this.type,
    required this.mood,
    required this.tags,
    required this.occurredAt,
    required this.createdAt,
    required this.updatedAt,
    required this.photos,
  });

  final String id;
  final String text;
  final EntryType type;
  final Mood mood;
  final List<String> tags;
  final DateTime occurredAt;
  final DateTime createdAt;
  final DateTime updatedAt;
  final List<JournalPhoto> photos;

  JournalEntry copyWith({List<JournalPhoto>? photos}) => JournalEntry(
    id: id,
    text: text,
    type: type,
    mood: mood,
    tags: tags,
    occurredAt: occurredAt,
    createdAt: createdAt,
    updatedAt: updatedAt,
    photos: photos ?? this.photos,
  );
}

class EntryDraft {
  const EntryDraft({
    required this.text,
    required this.type,
    required this.mood,
    required this.tags,
    required this.occurredAt,
  });

  final String text;
  final EntryType type;
  final Mood mood;
  final List<String> tags;
  final DateTime occurredAt;
}
