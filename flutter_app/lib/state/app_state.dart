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
  bool _initialized = false;
  bool _initializing = false;
  Object? _initializationError;

  List<JournalEntry> get entries => _entries;
  bool get isDark => _isDark;
  bool get hasPin => _pin.isNotEmpty;
  bool get locked => _locked;
  bool get initialized => _initialized;
  Object? get initializationError => _initializationError;

  Future<void> initialize() async {
    if (_initializing) return;
    _initializing = true;
    _initialized = false;
    _initializationError = null;
    notifyListeners();
    try {
      final repositoryFuture = _repository.initialize();
      final preferencesFuture = SharedPreferences.getInstance();
      final pinFuture = _secureStorage.read(key: _pinKey);

      await repositoryFuture;
      final preferences = await preferencesFuture;
      _isDark = preferences.getString(_themeKey) != 'light';
      _pin = await pinFuture ?? '';
      _locked = _pin.isNotEmpty;
      _entries = await _repository.listEntries();
    } catch (error, stackTrace) {
      _initializationError = error;
      FlutterError.reportError(
        FlutterErrorDetails(
          exception: error,
          stack: stackTrace,
          library: '星海日记初始化',
        ),
      );
    } finally {
      _initializing = false;
      _initialized = _initializationError == null;
      notifyListeners();
    }
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
