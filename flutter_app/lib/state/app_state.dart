import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:image_picker/image_picker.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../data/journal_repository.dart';
import '../models/journal_entry.dart';

class AppState extends ChangeNotifier {
  static const _themeKey = 'theme';
  static const _pinKey = 'appPin';

  final JournalRepository _repository = JournalRepository();
  final FlutterSecureStorage _secureStorage = const FlutterSecureStorage();

  List<JournalEntry> _entries = const [];
  bool _isDark = true;
  String _pin = '';
  bool _locked = false;

  List<JournalEntry> get entries => _entries;
  bool get isDark => _isDark;
  bool get hasPin => _pin.isNotEmpty;
  bool get locked => _locked;

  Future<void> initialize() async {
    await _repository.initialize();
    final preferences = await SharedPreferences.getInstance();
    _isDark = preferences.getString(_themeKey) != 'light';
    _pin = await _secureStorage.read(key: _pinKey) ?? '';
    _locked = _pin.isNotEmpty;
    await refresh();
  }

  JournalEntry? entryById(String id) {
    for (final entry in _entries) {
      if (entry.id == id) return entry;
    }
    return null;
  }

  Future<void> refresh() async {
    _entries = await _repository.listEntries();
    notifyListeners();
  }

  Future<String> saveEntry({
    String? id,
    required EntryDraft draft,
    required List<String> removedPhotoIds,
    required List<XFile> newPhotos,
  }) async {
    final saved = id == null
        ? await _repository.createEntry(draft)
        : await _repository.updateEntry(id, draft);
    for (final photoId in removedPhotoIds) {
      await _repository.removePhoto(photoId);
    }
    for (final photo in newPhotos) {
      await _repository.addPhoto(saved.id, photo);
    }
    await refresh();
    return saved.id;
  }

  Future<void> deleteEntry(String id) async {
    await _repository.deleteEntry(id);
    await refresh();
  }

  Future<void> setDark(bool value) async {
    _isDark = value;
    final preferences = await SharedPreferences.getInstance();
    await preferences.setString(_themeKey, value ? 'dark' : 'light');
    notifyListeners();
  }

  bool unlock(String value) {
    if (value != _pin) return false;
    _locked = false;
    notifyListeners();
    return true;
  }

  Future<void> setPin({required String next, required String current}) async {
    if (_pin.isNotEmpty && current != _pin) throw StateError('当前隐私密码不正确');
    if (next.isNotEmpty && !RegExp(r'^\d{4}$').hasMatch(next)) {
      throw StateError('请输入 4 位数字密码');
    }
    if (next.isEmpty) {
      await _secureStorage.delete(key: _pinKey);
    } else {
      await _secureStorage.write(key: _pinKey, value: next);
    }
    _pin = next;
    _locked = false;
    notifyListeners();
  }

  Future<String> exportBackup() async =>
      (await _repository.createBackupFile()).path;

  Future<({int imported, int skipped})> importBackup(Uint8List bytes) async {
    final result = await _repository.importBackup(bytes);
    await refresh();
    return result;
  }
}
