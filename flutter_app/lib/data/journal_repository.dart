import 'dart:convert';
import 'dart:io';
import 'dart:typed_data';

import 'package:image_picker/image_picker.dart';
import 'package:path/path.dart' as p;
import 'package:path_provider/path_provider.dart';
import 'package:sqflite/sqflite.dart';
import 'package:uuid/uuid.dart';

import '../models/journal_entry.dart';

class JournalRepository {
  static const _maxPhotoBytes = 6 * 1024 * 1024;
  static const _uuid = Uuid();

  Database? _database;
  Directory? _photoDirectory;

  Future<void> initialize() async {
    final documents = await getApplicationDocumentsDirectory();
    _photoDirectory = Directory(p.join(documents.path, 'journal_photos'));
    await _photoDirectory!.create(recursive: true);
    _database = await openDatabase(
      p.join(await getDatabasesPath(), 'star_sea_journal.sqlite'),
      version: 1,
      onConfigure: (db) async => db.execute('PRAGMA foreign_keys = ON'),
      onCreate: (db, _) async {
        await db.execute('''
          CREATE TABLE entries (
            id TEXT PRIMARY KEY NOT NULL,
            text TEXT NOT NULL,
            type TEXT NOT NULL,
            mood TEXT NOT NULL,
            tags_json TEXT NOT NULL,
            occurred_at TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
          )
        ''');
        await db.execute(
          'CREATE INDEX entries_occurred ON entries(occurred_at DESC, created_at DESC)',
        );
        await db.execute('''
          CREATE TABLE photos (
            id TEXT PRIMARY KEY NOT NULL,
            entry_id TEXT NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
            mime TEXT NOT NULL,
            created_at TEXT NOT NULL
          )
        ''');
        await db.execute(
          'CREATE INDEX photos_entry ON photos(entry_id, created_at)',
        );
      },
    );
  }

  Database get _db {
    final value = _database;
    if (value == null) throw StateError('数据库尚未初始化');
    return value;
  }

  Future<List<JournalEntry>> listEntries() async {
    final rows = await _db.query(
      'entries',
      orderBy: 'occurred_at DESC, created_at DESC',
    );
    final photos = await _db.query('photos', orderBy: 'created_at, id');
    final photosByEntry = <String, List<JournalPhoto>>{};
    for (final row in photos) {
      photosByEntry
          .putIfAbsent(row['entry_id']! as String, () => [])
          .add(
            JournalPhoto(
              id: row['id']! as String,
              mime: row['mime']! as String,
            ),
          );
    }
    return rows
        .map(
          (row) => _entryFromRow(
            row,
            photosByEntry[row['id']! as String] ?? const [],
          ),
        )
        .toList();
  }

  Future<JournalEntry> createEntry(EntryDraft draft) async {
    final id = _uuid.v4();
    final now = DateTime.now().toUtc().toIso8601String();
    await _db.insert('entries', {
      'id': id,
      ..._draftMap(draft),
      'created_at': now,
      'updated_at': now,
    });
    return _getEntry(id);
  }

  Future<JournalEntry> updateEntry(String id, EntryDraft draft) async {
    final changed = await _db.update(
      'entries',
      {
        ..._draftMap(draft),
        'updated_at': DateTime.now().toUtc().toIso8601String(),
      },
      where: 'id = ?',
      whereArgs: [id],
    );
    if (changed == 0) throw StateError('找不到这条记录');
    return _getEntry(id);
  }

  Future<void> deleteEntry(String id) async {
    final photos = await _db.query(
      'photos',
      where: 'entry_id = ?',
      whereArgs: [id],
    );
    await _db.delete('entries', where: 'id = ?', whereArgs: [id]);
    for (final photo in photos) {
      await _deleteFile(photo['id']! as String);
    }
  }

  Future<JournalPhoto> addPhoto(String entryId, XFile source) async {
    final count =
        Sqflite.firstIntValue(
          await _db.rawQuery('SELECT COUNT(*) FROM photos WHERE entry_id = ?', [
            entryId,
          ]),
        ) ??
        0;
    if (count >= 5) throw StateError('每条记录最多 5 张照片');
    final bytes = await source.readAsBytes();
    if (bytes.isEmpty || bytes.length > _maxPhotoBytes) {
      throw StateError('每张照片不能超过 6 MB');
    }
    final mime = _detectMime(bytes);
    final extension = switch (mime) {
      'image/png' => 'png',
      'image/webp' => 'webp',
      _ => 'jpg',
    };
    final path = p.join(_photoDirectory!.path, '${_uuid.v4()}.$extension');
    await File(path).writeAsBytes(bytes, flush: true);
    try {
      await _db.insert('photos', {
        'id': path,
        'entry_id': entryId,
        'mime': mime,
        'created_at': DateTime.now().toUtc().toIso8601String(),
      });
    } catch (_) {
      await _deleteFile(path);
      rethrow;
    }
    return JournalPhoto(id: path, mime: mime);
  }

  Future<void> removePhoto(String id) async {
    await _db.delete('photos', where: 'id = ?', whereArgs: [id]);
    await _deleteFile(id);
  }

  Future<File> createBackupFile() async {
    final entries = await listEntries();
    final encoded = <Map<String, Object?>>[];
    for (final entry in entries) {
      final photos = <Map<String, String>>[];
      for (final photo in entry.photos) {
        final file = File(photo.id);
        if (!await file.exists()) throw StateError('有照片文件已丢失，无法生成完整备份');
        photos.add({
          'mime': photo.mime,
          'base64': base64Encode(await file.readAsBytes()),
        });
      }
      encoded.add({
        'id': entry.id,
        'text': entry.text,
        'type': entry.type.value,
        'mood': entry.mood.value,
        'tags': entry.tags,
        'occurredAt': entry.occurredAt.toUtc().toIso8601String(),
        'createdAt': entry.createdAt.toUtc().toIso8601String(),
        'updatedAt': entry.updatedAt.toUtc().toIso8601String(),
        'photos': photos,
      });
    }
    final cache = await getTemporaryDirectory();
    final stamp = DateTime.now().toIso8601String().substring(0, 10);
    final file = File(p.join(cache.path, '星海日记备份-$stamp.json'));
    return file.writeAsString(
      const JsonEncoder.withIndent('  ').convert({
        'format': 'star-sea-journal-flutter-v1',
        'exportedAt': DateTime.now().toUtc().toIso8601String(),
        'entries': encoded,
      }),
      flush: true,
    );
  }

  Future<({int imported, int skipped})> importBackup(Uint8List bytes) async {
    final decoded = jsonDecode(utf8.decode(bytes));
    if (decoded is! Map<String, dynamic> ||
        decoded['format'] != 'star-sea-journal-flutter-v1' ||
        decoded['entries'] is! List) {
      throw const FormatException('这不是有效的星海日记 Flutter 备份');
    }
    final entries = decoded['entries']! as List;
    if (entries.length > 10000) throw const FormatException('备份最多包含 10000 条记录');
    var imported = 0;
    var skipped = 0;
    for (final raw in entries) {
      if (raw is! Map<String, dynamic>) throw const FormatException('记录格式不正确');
      final id = raw['id'];
      if (id is! String || id.isEmpty) throw const FormatException('记录编号无效');
      final exists =
          Sqflite.firstIntValue(
            await _db.rawQuery('SELECT COUNT(*) FROM entries WHERE id = ?', [
              id,
            ]),
          ) !=
          0;
      if (exists) {
        skipped++;
        continue;
      }
      final text = raw['text'];
      final tags = raw['tags'];
      final photos = raw['photos'];
      if (text is! String ||
          text.length > 50000 ||
          tags is! List ||
          photos is! List ||
          photos.length > 5) {
        throw const FormatException('记录内容无效');
      }
      final now = DateTime.now().toUtc();
      final occurredAt = DateTime.tryParse(raw['occurredAt']?.toString() ?? '');
      if (occurredAt == null) throw const FormatException('记录日期无效');
      await _db.insert('entries', {
        'id': id,
        'text': text.trim(),
        'type': EntryTypeText.parse(raw['type']?.toString() ?? '').value,
        'mood': MoodText.parse(raw['mood']?.toString() ?? '').value,
        'tags_json': jsonEncode(tags.map((value) => value.toString()).toList()),
        'occurred_at': occurredAt.toUtc().toIso8601String(),
        'created_at':
            DateTime.tryParse(
              raw['createdAt']?.toString() ?? '',
            )?.toUtc().toIso8601String() ??
            now.toIso8601String(),
        'updated_at':
            DateTime.tryParse(
              raw['updatedAt']?.toString() ?? '',
            )?.toUtc().toIso8601String() ??
            now.toIso8601String(),
      });
      try {
        for (final photo in photos) {
          if (photo is! Map<String, dynamic> || photo['base64'] is! String) {
            throw const FormatException('照片格式不正确');
          }
          final data = base64Decode(photo['base64']! as String);
          final mime = _detectMime(data);
          final extension = mime == 'image/png'
              ? 'png'
              : mime == 'image/webp'
              ? 'webp'
              : 'jpg';
          final path = p.join(
            _photoDirectory!.path,
            '${_uuid.v4()}.$extension',
          );
          await File(path).writeAsBytes(data, flush: true);
          await _db.insert('photos', {
            'id': path,
            'entry_id': id,
            'mime': mime,
            'created_at': now.toIso8601String(),
          });
        }
        imported++;
      } catch (_) {
        await deleteEntry(id);
        rethrow;
      }
    }
    return (imported: imported, skipped: skipped);
  }

  Map<String, Object?> _draftMap(EntryDraft draft) => {
    'text': draft.text.trim(),
    'type': draft.type.value,
    'mood': draft.mood.value,
    'tags_json': jsonEncode(draft.tags),
    'occurred_at': draft.occurredAt.toUtc().toIso8601String(),
  };

  Future<JournalEntry> _getEntry(String id) async {
    final rows = await _db.query(
      'entries',
      where: 'id = ?',
      whereArgs: [id],
      limit: 1,
    );
    if (rows.isEmpty) throw StateError('找不到这条记录');
    final photos = await _db.query(
      'photos',
      where: 'entry_id = ?',
      whereArgs: [id],
      orderBy: 'created_at, id',
    );
    return _entryFromRow(
      rows.single,
      photos
          .map(
            (row) => JournalPhoto(
              id: row['id']! as String,
              mime: row['mime']! as String,
            ),
          )
          .toList(),
    );
  }

  JournalEntry _entryFromRow(
    Map<String, Object?> row,
    List<JournalPhoto> photos,
  ) {
    final rawTags = jsonDecode(row['tags_json']! as String) as List;
    return JournalEntry(
      id: row['id']! as String,
      text: row['text']! as String,
      type: EntryTypeText.parse(row['type']! as String),
      mood: MoodText.parse(row['mood']! as String),
      tags: rawTags.map((value) => value.toString()).toList(),
      occurredAt: DateTime.parse(row['occurred_at']! as String).toLocal(),
      createdAt: DateTime.parse(row['created_at']! as String).toLocal(),
      updatedAt: DateTime.parse(row['updated_at']! as String).toLocal(),
      photos: photos,
    );
  }

  String _detectMime(Uint8List bytes) {
    if (bytes.length >= 3 &&
        bytes[0] == 0xff &&
        bytes[1] == 0xd8 &&
        bytes[2] == 0xff) {
      return 'image/jpeg';
    }
    const png = [137, 80, 78, 71, 13, 10, 26, 10];
    if (bytes.length >= 8 &&
        List.generate(8, (index) => bytes[index]).join(',') == png.join(',')) {
      return 'image/png';
    }
    if (bytes.length >= 12 &&
        ascii.decode(bytes.sublist(0, 4), allowInvalid: true) == 'RIFF' &&
        ascii.decode(bytes.sublist(8, 12), allowInvalid: true) == 'WEBP') {
      return 'image/webp';
    }
    throw const FormatException('仅支持 JPEG、PNG 或 WebP 照片');
  }

  Future<void> _deleteFile(String path) async {
    final file = File(path);
    if (await file.exists()) await file.delete();
  }
}
