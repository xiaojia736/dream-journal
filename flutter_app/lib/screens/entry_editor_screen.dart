import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:image_picker/image_picker.dart';

import '../models/journal_entry.dart';
import '../state/app_state_scope.dart';
import '../theme/app_theme.dart';
import '../utils/date_text.dart';
import '../widgets/gradient_background.dart';

class EntryEditorScreen extends StatefulWidget {
  const EntryEditorScreen({super.key, this.entryId});

  final String? entryId;

  @override
  State<EntryEditorScreen> createState() => _EntryEditorScreenState();
}

class _EntryEditorScreenState extends State<EntryEditorScreen> {
  final _text = TextEditingController();
  final _tags = TextEditingController();
  final _picker = ImagePicker();
  EntryType _type = EntryType.moment;
  Mood _mood = Mood.none;
  DateTime _date = DateTime.now();
  final List<XFile> _newPhotos = [];
  final Set<String> _removedPhotoIds = {};
  bool _initialized = false;
  bool _busy = false;

  JournalEntry? _entry(BuildContext context) => widget.entryId == null
      ? null
      : AppStateScope.of(context).entryById(widget.entryId!);

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_initialized) return;
    final entry = _entry(context);
    if (entry != null) {
      _text.text = entry.text;
      _tags.text = entry.tags.join('，');
      _type = entry.type;
      _mood = entry.mood;
      _date = entry.occurredAt;
    }
    _initialized = true;
  }

  @override
  void dispose() {
    _text.dispose();
    _tags.dispose();
    super.dispose();
  }

  Future<void> _pickPhotos(ImageSource source) async {
    final existingCount =
        (_entry(context)?.photos.length ?? 0) - _removedPhotoIds.length;
    final remaining = 5 - existingCount - _newPhotos.length;
    if (remaining <= 0) {
      _message('照片已满', '每条记录最多可以添加 5 张照片。');
      return;
    }
    try {
      if (source == ImageSource.camera) {
        final photo = await _picker.pickImage(source: source, imageQuality: 72);
        if (photo != null) setState(() => _newPhotos.add(photo));
      } else {
        final photos = await _picker.pickMultiImage(
          imageQuality: 72,
          limit: remaining,
        );
        setState(() => _newPhotos.addAll(photos.take(remaining)));
      }
    } catch (error) {
      if (mounted) showError(context, error, title: '无法获取照片');
    }
  }

  Future<void> _chooseDate() async {
    final selected = await showDatePicker(
      context: context,
      initialDate: _date,
      firstDate: DateTime(1900),
      lastDate: DateTime.now().add(const Duration(days: 3650)),
    );
    if (selected == null) return;
    setState(
      () => _date = DateTime(
        selected.year,
        selected.month,
        selected.day,
        _date.hour,
        _date.minute,
      ),
    );
  }

  Future<void> _chooseTime() async {
    final selected = await showTimePicker(
      context: context,
      initialTime: TimeOfDay.fromDateTime(_date),
    );
    if (selected == null) return;
    setState(
      () => _date = DateTime(
        _date.year,
        _date.month,
        _date.day,
        selected.hour,
        selected.minute,
      ),
    );
  }

  Future<void> _save() async {
    final existingCount =
        (_entry(context)?.photos.length ?? 0) - _removedPhotoIds.length;
    if (_text.text.trim().isEmpty && existingCount + _newPhotos.length == 0) {
      _message('还没有内容', '写下一点文字，或添加一张照片再保存吧。');
      return;
    }
    final tags = _tags.text
        .split(RegExp(r'[，,\s]+'))
        .map((tag) => tag.trim())
        .where((tag) => tag.isNotEmpty)
        .toSet()
        .take(20)
        .toList();
    if (tags.any((tag) => tag.length > 30)) {
      _message('标签太长', '每个标签最多 30 个字符。');
      return;
    }
    setState(() => _busy = true);
    try {
      final id = await AppStateScope.of(context).saveEntry(
        id: widget.entryId,
        draft: EntryDraft(
          text: _text.text,
          type: _type,
          mood: _mood,
          tags: tags,
          occurredAt: _date,
        ),
        removedPhotoIds: _removedPhotoIds.toList(),
        newPhotos: _newPhotos,
      );
      if (mounted) Navigator.pop(context, id);
    } catch (error) {
      if (mounted) showError(context, error, title: '保存失败');
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  void _message(String title, String content) {
    showDialog<void>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(title),
        content: Text(content),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('知道了'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final entry = _entry(context);
    if (widget.entryId != null && entry == null) {
      return const Scaffold(body: Center(child: Text('找不到这条记录')));
    }
    final visiblePhotos =
        entry?.photos
            .where((photo) => !_removedPhotoIds.contains(photo.id))
            .toList() ??
        const <JournalPhoto>[];
    return Scaffold(
      body: GradientBackground(
        child: SafeArea(
          child: CustomScrollView(
            keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
            slivers: [
              SliverAppBar(
                pinned: true,
                title: Text(entry == null ? '记录此刻' : '编辑记录'),
                backgroundColor: Theme.of(
                  context,
                ).scaffoldBackgroundColor.withValues(alpha: .92),
              ),
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(20, 12, 20, 38),
                sliver: SliverList.list(
                  children: [
                    Text(
                      entry == null ? '生活、梦境和心情，都值得留在星海里' : '把这段记忆补充得更完整',
                      style: TextStyle(color: AppColors.muted(context)),
                    ),
                    const SizedBox(height: 24),
                    const _Label('记录类型'),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: [
                        for (final type in EntryType.values)
                          ChoiceChip(
                            label: Text(type.label),
                            selected: _type == type,
                            onSelected: (_) => setState(() => _type = type),
                          ),
                      ],
                    ),
                    const SizedBox(height: 22),
                    const _Label('发生时间'),
                    Row(
                      children: [
                        Expanded(
                          child: OutlinedButton.icon(
                            onPressed: _chooseDate,
                            icon: const Icon(Icons.calendar_today_outlined),
                            label: Text(shortDate(_date)),
                          ),
                        ),
                        const SizedBox(width: 10),
                        OutlinedButton.icon(
                          onPressed: _chooseTime,
                          icon: const Icon(Icons.schedule),
                          label: Text(
                            '${twoDigits(_date.hour)}:${twoDigits(_date.minute)}',
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 22),
                    const _Label('想记下什么？'),
                    TextField(
                      controller: _text,
                      minLines: 7,
                      maxLines: 14,
                      maxLength: 50000,
                      maxLengthEnforcement: MaxLengthEnforcement.enforced,
                      decoration: const InputDecoration(
                        hintText: '今天发生了什么？写下地点、人物和心情……',
                      ),
                    ),
                    const SizedBox(height: 18),
                    const _Label('情绪'),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: [
                        for (final mood in Mood.values.where(
                          (value) => value != Mood.none,
                        ))
                          ChoiceChip(
                            label: Text('${mood.emoji} ${mood.label}'),
                            selected: _mood == mood,
                            onSelected: (_) => setState(
                              () => _mood = _mood == mood ? Mood.none : mood,
                            ),
                          ),
                      ],
                    ),
                    const SizedBox(height: 22),
                    const _Label('标签'),
                    TextField(
                      controller: _tags,
                      decoration: const InputDecoration(
                        hintText: '用逗号或空格分隔，如：旅行，家人',
                      ),
                    ),
                    const SizedBox(height: 22),
                    const _Label('照片 · 最多 5 张'),
                    if (visiblePhotos.isNotEmpty || _newPhotos.isNotEmpty)
                      SizedBox(
                        height: 92,
                        child: ListView(
                          scrollDirection: Axis.horizontal,
                          children: [
                            for (final photo in visiblePhotos)
                              _PhotoTile(
                                path: photo.id,
                                onRemove: () => setState(
                                  () => _removedPhotoIds.add(photo.id),
                                ),
                              ),
                            for (
                              var index = 0;
                              index < _newPhotos.length;
                              index++
                            )
                              _PhotoTile(
                                path: _newPhotos[index].path,
                                onRemove: () =>
                                    setState(() => _newPhotos.removeAt(index)),
                              ),
                          ],
                        ),
                      ),
                    const SizedBox(height: 10),
                    Row(
                      children: [
                        FilledButton.tonalIcon(
                          onPressed: () => _pickPhotos(ImageSource.gallery),
                          icon: const Icon(Icons.photo_library_outlined),
                          label: const Text('相册'),
                        ),
                        const SizedBox(width: 10),
                        FilledButton.tonalIcon(
                          onPressed: () => _pickPhotos(ImageSource.camera),
                          icon: const Icon(Icons.photo_camera_outlined),
                          label: const Text('拍照'),
                        ),
                      ],
                    ),
                    const SizedBox(height: 28),
                    PrimaryAction(label: '保存记录', onPressed: _save, busy: _busy),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _Label extends StatelessWidget {
  const _Label(this.text);

  final String text;

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(bottom: 9),
    child: Text(text, style: TextStyle(color: AppColors.muted(context))),
  );
}

class _PhotoTile extends StatelessWidget {
  const _PhotoTile({required this.path, required this.onRemove});

  final String path;
  final VoidCallback onRemove;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(right: 10),
      child: Stack(
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(12),
            child: Image.file(
              File(path),
              width: 86,
              height: 86,
              fit: BoxFit.cover,
            ),
          ),
          Positioned(
            right: 3,
            top: 3,
            child: IconButton.filled(
              onPressed: onRemove,
              icon: const Icon(Icons.close, size: 15),
              padding: EdgeInsets.zero,
              constraints: const BoxConstraints.tightFor(width: 26, height: 26),
            ),
          ),
        ],
      ),
    );
  }
}
