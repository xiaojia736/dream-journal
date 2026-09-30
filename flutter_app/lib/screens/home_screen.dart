import 'dart:io';

import 'package:flutter/material.dart';

import '../models/journal_entry.dart';
import '../state/app_state_scope.dart';
import '../theme/app_theme.dart';
import '../utils/date_text.dart';
import '../widgets/gradient_background.dart';
import 'entry_detail_screen.dart';
import 'entry_editor_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final _search = TextEditingController();
  EntryType? _filter;

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  Future<void> _openEditor([JournalEntry? entry]) async {
    final id = await Navigator.of(context).push<String>(
      MaterialPageRoute(builder: (_) => EntryEditorScreen(entryId: entry?.id)),
    );
    if (!mounted || id == null) return;
    await Navigator.of(context).push<void>(
      MaterialPageRoute(builder: (_) => EntryDetailScreen(entryId: id)),
    );
  }

  @override
  Widget build(BuildContext context) {
    final state = AppStateScope.of(context);
    final query = _search.text.trim().toLowerCase();
    final entries = state.entries.where((entry) {
      final filterMatches = _filter == null || entry.type == _filter;
      final searchText =
          '${entry.text} ${entry.tags.join(' ')} ${entry.type.label} ${shortDate(entry.occurredAt)}'
              .toLowerCase();
      return filterMatches && searchText.contains(query);
    }).toList();
    return GradientBackground(
      child: SafeArea(
        bottom: false,
        child: Scaffold(
          backgroundColor: Colors.transparent,
          floatingActionButton: state.entries.isEmpty
              ? null
              : FloatingActionButton.extended(
                  onPressed: _openEditor,
                  icon: const Icon(Icons.add),
                  label: const Text(
                    '写记录',
                    style: TextStyle(fontWeight: FontWeight.w800),
                  ),
                ),
          body: RefreshIndicator(
            onRefresh: state.refresh,
            child: CustomScrollView(
              slivers: [
                SliverPadding(
                  padding: const EdgeInsets.fromLTRB(20, 12, 20, 0),
                  sliver: SliverToBoxAdapter(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          homeDate(DateTime.now()),
                          style: TextStyle(
                            color: AppColors.muted(context),
                            fontSize: 12,
                            fontWeight: FontWeight.w700,
                            letterSpacing: 1.2,
                          ),
                        ),
                        const SizedBox(height: 7),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              '星海日记',
                              style: Theme.of(context).textTheme.headlineMedium
                                  ?.copyWith(fontWeight: FontWeight.w900),
                            ),
                            Container(
                              width: 43,
                              height: 43,
                              decoration: BoxDecoration(
                                color: AppColors.soft(context),
                                borderRadius: BorderRadius.circular(16),
                              ),
                              child: const Icon(Icons.auto_awesome),
                            ),
                          ],
                        ),
                        const SizedBox(height: 4),
                        Text(
                          '收藏生活中每一颗微光',
                          style: TextStyle(color: AppColors.muted(context)),
                        ),
                        const SizedBox(height: 19),
                        TextField(
                          controller: _search,
                          onChanged: (_) => setState(() {}),
                          decoration: InputDecoration(
                            hintText: '搜索文字、标签或日期',
                            prefixIcon: const Icon(Icons.search),
                            suffixIcon: query.isEmpty
                                ? null
                                : IconButton(
                                    onPressed: () {
                                      _search.clear();
                                      setState(() {});
                                    },
                                    icon: const Icon(Icons.close),
                                  ),
                          ),
                        ),
                        const SizedBox(height: 14),
                        SizedBox(
                          height: 42,
                          child: ListView(
                            scrollDirection: Axis.horizontal,
                            children: [
                              _FilterChip(
                                label: '全部',
                                selected: _filter == null,
                                onTap: () => setState(() => _filter = null),
                              ),
                              for (final type in EntryType.values)
                                _FilterChip(
                                  label: type.label,
                                  selected: _filter == type,
                                  onTap: () => setState(() => _filter = type),
                                ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 12),
                        if (entries.isNotEmpty)
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                _filter?.label ?? '我的记录',
                                style: const TextStyle(
                                  fontSize: 18,
                                  fontWeight: FontWeight.w800,
                                ),
                              ),
                              Text(
                                '${entries.length} 条记录',
                                style: TextStyle(
                                  color: AppColors.muted(context),
                                  fontSize: 12,
                                ),
                              ),
                            ],
                          ),
                        const SizedBox(height: 12),
                      ],
                    ),
                  ),
                ),
                if (entries.isEmpty)
                  SliverFillRemaining(
                    hasScrollBody: false,
                    child: _EmptyState(
                      hasAnyEntry: state.entries.isNotEmpty,
                      onCreate: _openEditor,
                      onReset: () {
                        _search.clear();
                        setState(() => _filter = null);
                      },
                    ),
                  )
                else
                  SliverPadding(
                    padding: const EdgeInsets.fromLTRB(20, 0, 20, 110),
                    sliver: SliverList.builder(
                      itemCount: entries.length,
                      itemBuilder: (context, index) => _EntryCard(
                        entry: entries[index],
                        onTap: () => Navigator.of(context).push<void>(
                          MaterialPageRoute(
                            builder: (_) =>
                                EntryDetailScreen(entryId: entries[index].id),
                          ),
                        ),
                      ),
                    ),
                  ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _FilterChip extends StatelessWidget {
  const _FilterChip({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: ChoiceChip(
        label: Text(label),
        selected: selected,
        onSelected: (_) => onTap(),
      ),
    );
  }
}

class _EntryCard extends StatelessWidget {
  const _EntryCard({required this.entry, required this.onTap});

  final JournalEntry entry;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final lines = entry.text.trim().split(RegExp(r'\n+'));
    final title = lines.firstOrNull?.isNotEmpty == true
        ? lines.first
        : (entry.photos.isNotEmpty ? '照片记录' : '一段生活记录');
    final summary = lines.skip(1).join(' ').trim();
    final photo = entry.photos.firstOrNull;
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(17),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    shortDate(entry.occurredAt),
                    style: TextStyle(
                      color: AppColors.muted(context),
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 9,
                      vertical: 5,
                    ),
                    decoration: BoxDecoration(
                      color: AppColors.soft(context),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Text(
                      entry.type.label,
                      style: TextStyle(
                        color: Theme.of(context).colorScheme.primary,
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          title,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            fontSize: 17,
                            fontWeight: FontWeight.w700,
                            height: 1.45,
                          ),
                        ),
                        if (summary.isNotEmpty) ...[
                          const SizedBox(height: 5),
                          Text(
                            summary,
                            maxLines: 3,
                            overflow: TextOverflow.ellipsis,
                            style: TextStyle(
                              color: AppColors.muted(context),
                              fontSize: 13,
                              height: 1.5,
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                  if (photo != null) ...[
                    const SizedBox(width: 13),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(15),
                      child: Image.file(
                        File(photo.id),
                        width: 100,
                        height: 100,
                        fit: BoxFit.cover,
                        errorBuilder: (_, _, _) => const SizedBox(
                          width: 100,
                          height: 100,
                          child: Icon(Icons.broken_image_outlined),
                        ),
                      ),
                    ),
                  ],
                ],
              ),
              if (entry.mood != Mood.none || entry.tags.isNotEmpty) ...[
                const SizedBox(height: 12),
                Wrap(
                  spacing: 10,
                  runSpacing: 7,
                  children: [
                    if (entry.mood != Mood.none)
                      Text(
                        '${entry.mood.emoji} ${entry.mood.label}',
                        style: TextStyle(
                          color: AppColors.accent(context),
                          fontSize: 12,
                        ),
                      ),
                    for (final tag in entry.tags.take(3))
                      Text(
                        '# $tag',
                        style: TextStyle(
                          color: AppColors.muted(context),
                          fontSize: 12,
                        ),
                      ),
                  ],
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

class _EmptyState extends StatelessWidget {
  const _EmptyState({
    required this.hasAnyEntry,
    required this.onCreate,
    required this.onReset,
  });

  final bool hasAnyEntry;
  final VoidCallback onCreate;
  final VoidCallback onReset;

  @override
  Widget build(BuildContext context) {
    if (hasAnyEntry) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.auto_awesome, size: 42),
            const SizedBox(height: 12),
            const Text(
              '暂时没有找到记录',
              style: TextStyle(fontWeight: FontWeight.w700, fontSize: 17),
            ),
            TextButton(onPressed: onReset, child: const Text('查看全部记录')),
          ],
        ),
      );
    }
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 18, 20, 50),
      child: Container(
        padding: const EdgeInsets.all(26),
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            colors: [Color(0xff394a81), Color(0xff6b5b9f)],
          ),
          borderRadius: BorderRadius.circular(25),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.auto_awesome, color: Colors.white, size: 34),
            const SizedBox(height: 10),
            const Text(
              '从此刻开始记录',
              style: TextStyle(
                color: Colors.white,
                fontSize: 23,
                fontWeight: FontWeight.w800,
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              '一张照片、一段日常、一个梦。\n把值得珍藏的瞬间留在这里。',
              style: TextStyle(color: Color(0xfff1edff), height: 1.6),
            ),
            const SizedBox(height: 18),
            FilledButton.tonal(
              onPressed: onCreate,
              child: const Text('写下第一条  →'),
            ),
          ],
        ),
      ),
    );
  }
}
