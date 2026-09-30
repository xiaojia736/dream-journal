import 'dart:io';

import 'package:flutter/material.dart';

import '../models/journal_entry.dart';
import '../state/app_state_scope.dart';
import '../theme/app_theme.dart';
import '../utils/date_text.dart';
import '../widgets/gradient_background.dart';
import 'entry_editor_screen.dart';

class EntryDetailScreen extends StatefulWidget {
  const EntryDetailScreen({super.key, required this.entryId});

  final String entryId;

  @override
  State<EntryDetailScreen> createState() => _EntryDetailScreenState();
}

class _EntryDetailScreenState extends State<EntryDetailScreen> {
  int _photoIndex = 0;

  Future<void> _delete() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('删除这段记录？'),
        content: const Text('删除后无法找回。'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('取消'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('删除'),
          ),
        ],
      ),
    );
    if (confirmed != true || !mounted) return;
    try {
      await AppStateScope.of(context).deleteEntry(widget.entryId);
      if (mounted) Navigator.pop(context);
    } catch (error) {
      if (mounted) showError(context, error, title: '删除失败');
    }
  }

  @override
  Widget build(BuildContext context) {
    final entry = AppStateScope.of(context).entryById(widget.entryId);
    if (entry == null) {
      return Scaffold(
        appBar: AppBar(),
        body: const Center(child: Text('找不到这条记录')),
      );
    }
    return Scaffold(
      body: GradientBackground(
        child: SafeArea(
          child: CustomScrollView(
            slivers: [
              SliverAppBar(
                pinned: true,
                title: const Text('记录详情'),
                backgroundColor: Theme.of(
                  context,
                ).scaffoldBackgroundColor.withValues(alpha: .92),
              ),
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(20, 12, 20, 42),
                sliver: SliverList.list(
                  children: [
                    Text(
                      detailDate(entry.occurredAt),
                      style: TextStyle(
                        color: AppColors.muted(context),
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 10),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: [
                        Chip(label: Text(entry.type.label)),
                        if (entry.mood.value.isNotEmpty)
                          Chip(
                            label: Text(
                              '${entry.mood.emoji} ${entry.mood.label}',
                            ),
                          ),
                      ],
                    ),
                    if (entry.photos.isNotEmpty) ...[
                      const SizedBox(height: 16),
                      AspectRatio(
                        aspectRatio: 1.28,
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(22),
                          child: Stack(
                            children: [
                              PageView.builder(
                                itemCount: entry.photos.length,
                                onPageChanged: (value) =>
                                    setState(() => _photoIndex = value),
                                itemBuilder: (context, index) =>
                                    GestureDetector(
                                      onTap: () => _openPhoto(
                                        entry.photos
                                            .map((photo) => photo.id)
                                            .toList(),
                                        index,
                                      ),
                                      child: Image.file(
                                        File(entry.photos[index].id),
                                        width: double.infinity,
                                        fit: BoxFit.cover,
                                      ),
                                    ),
                              ),
                              Positioned(
                                right: 12,
                                bottom: 12,
                                child: Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 10,
                                    vertical: 6,
                                  ),
                                  decoration: BoxDecoration(
                                    color: const Color(0xcc10182d),
                                    borderRadius: BorderRadius.circular(10),
                                  ),
                                  child: Text(
                                    '${_photoIndex + 1} / ${entry.photos.length}  ·  点击放大',
                                    style: const TextStyle(
                                      color: Colors.white,
                                      fontSize: 12,
                                      fontWeight: FontWeight.w700,
                                    ),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                    const SizedBox(height: 21),
                    Card(
                      child: Padding(
                        padding: const EdgeInsets.all(21),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              '这一刻',
                              style: TextStyle(
                                color: Theme.of(context).colorScheme.primary,
                                fontSize: 12,
                                fontWeight: FontWeight.w800,
                                letterSpacing: 1,
                              ),
                            ),
                            const SizedBox(height: 13),
                            SelectableText(
                              entry.text.trim().isEmpty
                                  ? '这一刻留在照片里。'
                                  : entry.text,
                              style: TextStyle(
                                fontSize: entry.text.trim().isEmpty ? 15 : 17,
                                height: 1.75,
                                color: entry.text.trim().isEmpty
                                    ? AppColors.muted(context)
                                    : null,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                    if (entry.tags.isNotEmpty) ...[
                      const SizedBox(height: 14),
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: [
                          for (final tag in entry.tags)
                            Chip(label: Text('# $tag')),
                        ],
                      ),
                    ],
                    const SizedBox(height: 25),
                    PrimaryAction(
                      label: '编辑这段记录',
                      onPressed: () => Navigator.of(context).push<String>(
                        MaterialPageRoute(
                          builder: (_) => EntryEditorScreen(entryId: entry.id),
                        ),
                      ),
                    ),
                    const SizedBox(height: 6),
                    TextButton(
                      onPressed: _delete,
                      style: TextButton.styleFrom(
                        foregroundColor: Theme.of(context).colorScheme.error,
                      ),
                      child: const Text('删除记录'),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _openPhoto(List<String> paths, int initialIndex) {
    Navigator.of(context).push<void>(
      MaterialPageRoute(
        fullscreenDialog: true,
        builder: (_) => _PhotoViewer(paths: paths, initialIndex: initialIndex),
      ),
    );
  }
}

class _PhotoViewer extends StatefulWidget {
  const _PhotoViewer({required this.paths, required this.initialIndex});

  final List<String> paths;
  final int initialIndex;

  @override
  State<_PhotoViewer> createState() => _PhotoViewerState();
}

class _PhotoViewerState extends State<_PhotoViewer> {
  late int _index = widget.initialIndex;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xff0b1020),
      appBar: AppBar(
        title: Text('${_index + 1} / ${widget.paths.length}'),
        backgroundColor: Colors.transparent,
        foregroundColor: Colors.white,
      ),
      body: PageView.builder(
        controller: PageController(initialPage: widget.initialIndex),
        itemCount: widget.paths.length,
        onPageChanged: (value) => setState(() => _index = value),
        itemBuilder: (context, index) => InteractiveViewer(
          minScale: 1,
          maxScale: 4,
          child: Center(
            child: Image.file(File(widget.paths[index]), fit: BoxFit.contain),
          ),
        ),
      ),
    );
  }
}
