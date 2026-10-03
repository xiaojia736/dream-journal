import 'package:flutter/material.dart';

import '../models/journal_entry.dart';
import '../state/app_state_scope.dart';
import '../theme/app_theme.dart';
import '../utils/date_text.dart';
import '../utils/past_day_picker.dart';
import '../widgets/gradient_background.dart';
import '../widgets/journal_record_card.dart';
import 'entry_detail_screen.dart';
import 'recall_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key, required this.onCreate});

  final VoidCallback onCreate;

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen>
    with SingleTickerProviderStateMixin {
  final _search = TextEditingController();
  late final AnimationController _starController;
  EntryType? _filter;
  DateTime? _lastRecallDay;
  bool _recallOpen = false;

  @override
  void initState() {
    super.initState();
    _starController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1800),
      lowerBound: .92,
      upperBound: 1.06,
    )..repeat(reverse: true);
  }

  @override
  void dispose() {
    _starController.dispose();
    _search.dispose();
    super.dispose();
  }

  Future<void> _openRecall() async {
    if (_recallOpen) return;
    final day = pickPastDay(
      AppStateScope.of(context).entries,
      now: DateTime.now(),
      previous: _lastRecallDay,
    );
    if (day == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('还没有过去的记录，先把今天的微光收藏起来吧。')),
      );
      return;
    }
    _lastRecallDay = day;
    _recallOpen = true;
    try {
      await Navigator.of(context).push<void>(
        MaterialPageRoute(
          builder: (_) => RecallScreen(
            initialDate: day,
          ),
        ),
      );
    } finally {
      _recallOpen = false;
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = AppStateScope.of(context);
    final query = _search.text.trim().toLowerCase();
    final entries = state.entries.where((entry) {
      final filterMatches = _filter == null || entry.type == _filter;
      final searchText =
          '${entry.text} ${entry.tags.join(' ')} ${entry.type.label} ${entry.moodLabel} ${shortDate(entry.occurredAt)}'
              .toLowerCase();
      return filterMatches && searchText.contains(query);
    }).toList();
    return GradientBackground(
      child: SafeArea(
        bottom: false,
        child: RefreshIndicator(
          onRefresh: state.refresh,
          child: CustomScrollView(
            slivers: [
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
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
                      const SizedBox(height: 11),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            '星海日记',
                            style: Theme.of(context).textTheme.headlineMedium
                                ?.copyWith(
                                  fontWeight: FontWeight.w700,
                                  letterSpacing: -.5,
                                ),
                          ),
                          ScaleTransition(
                            scale: _starController,
                            child: Container(
                              width: 44,
                              height: 44,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                color: AppColors.soft(
                                  context,
                                ).withValues(alpha: .72),
                                border: Border.all(
                                  color: Theme.of(context).colorScheme.primary
                                      .withValues(alpha: .28),
                                ),
                                boxShadow: [
                                  BoxShadow(
                                    color: Theme.of(context)
                                        .colorScheme
                                        .primary
                                        .withValues(alpha: .36),
                                    blurRadius: 12,
                                  ),
                                ],
                              ),
                              child: IconButton(
                                tooltip: '随机回顾一天',
                                onPressed: _openRecall,
                                padding: EdgeInsets.zero,
                                icon: ShaderMask(
                                  shaderCallback: (bounds) =>
                                      AppColors.writeGradient.createShader(
                                        bounds,
                                      ),
                                  child: const Icon(
                                    Icons.auto_awesome,
                                    size: 19,
                                    color: Colors.white,
                                  ),
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      _HomeSubtitle(
                        dark: Theme.of(context).brightness == Brightness.dark,
                      ),
                      const SizedBox(height: 20),
                      SizedBox(
                        height: 44,
                        child: TextField(
                          controller: _search,
                          onChanged: (_) => setState(() {}),
                          decoration: InputDecoration(
                            hintText: '搜索文字、标签或日期',
                            fillColor:
                                Theme.of(context).brightness == Brightness.dark
                                ? AppColors.darkCard
                                : null,
                            hintStyle: const TextStyle(fontSize: 13),
                            prefixIcon: const Icon(Icons.search, size: 19),
                            suffixIcon: query.isEmpty
                                ? null
                                : IconButton(
                                    onPressed: () {
                                      _search.clear();
                                      setState(() {});
                                    },
                                    icon: const Icon(Icons.close, size: 18),
                                  ),
                          ),
                        ),
                      ),
                      const SizedBox(height: 14),
                      SizedBox(
                        height: 35,
                        child: ShaderMask(
                          blendMode: BlendMode.dstIn,
                          shaderCallback: (bounds) => const LinearGradient(
                            stops: [0, .91, 1],
                            colors: [
                              Colors.white,
                              Colors.white,
                              Colors.transparent,
                            ],
                          ).createShader(bounds),
                          child: ListView(
                            scrollDirection: Axis.horizontal,
                            padding: const EdgeInsets.only(right: 30),
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
                      ),
                      const SizedBox(height: 19),
                      if (entries.isNotEmpty)
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              _filter?.label ?? '我的记录',
                              style: TextStyle(
                                color: AppColors.heading(context),
                                fontSize: 18,
                                fontWeight: FontWeight.w600,
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
                      const SizedBox(height: 16),
                    ],
                  ),
                ),
              ),
              if (entries.isEmpty)
                SliverFillRemaining(
                  hasScrollBody: false,
                  child: _EmptyState(
                    hasAnyEntry: state.entries.isNotEmpty,
                    onCreate: widget.onCreate,
                    onReset: () {
                      _search.clear();
                      setState(() => _filter = null);
                    },
                  ),
                )
              else
                SliverPadding(
                  padding: const EdgeInsets.fromLTRB(20, 0, 20, 160),
                  sliver: SliverList.builder(
                    itemCount: entries.length,
                    itemBuilder: (context, index) => JournalRecordCard(
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
    final dark = Theme.of(context).brightness == Brightness.dark;
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: ChoiceChip(
        label: Text(label),
        selected: selected,
        labelStyle: TextStyle(
          fontSize: 12,
          fontWeight: selected ? FontWeight.w600 : FontWeight.w400,
          color: dark
              ? selected
                    ? AppColors.darkSelectedText
                    : AppColors.darkCapsuleMuted
              : AppColors.lightText,
        ),
        padding: const EdgeInsets.symmetric(horizontal: 4),
        visualDensity: VisualDensity.compact,
        side: dark ? BorderSide.none : BorderSide(color: AppColors.lightBorder),
        onSelected: (_) => onTap(),
      ),
    );
  }
}

class _HomeSubtitle extends StatelessWidget {
  const _HomeSubtitle({required this.dark});

  final bool dark;

  @override
  Widget build(BuildContext context) {
    final base = TextStyle(color: AppColors.muted(context), fontSize: 14);
    return Text.rich(
      TextSpan(
        style: base,
        children: [
          const TextSpan(text: '佳佳，收藏生活中每一颗'),
          TextSpan(
            text: '微光',
            style: TextStyle(
              color: dark ? AppColors.darkAccent : AppColors.lightPrimary,
              fontWeight: FontWeight.w600,
              shadows: dark
                  ? [
                      Shadow(
                        color: AppColors.darkAccent.withValues(alpha: .55),
                        blurRadius: 8,
                      ),
                    ]
                  : null,
            ),
          ),
        ],
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
    final dark = Theme.of(context).brightness == Brightness.dark;
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
      padding: const EdgeInsets.fromLTRB(20, 10, 20, 50),
      child: GlassCard(
        padding: const EdgeInsets.all(20),
        child: Stack(
          children: [
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  Icons.auto_awesome,
                  color: AppColors.accent(context),
                  size: 30,
                  shadows: dark
                      ? [
                          Shadow(
                            color: AppColors.darkAccent.withValues(alpha: .55),
                            blurRadius: 8,
                          ),
                        ]
                      : null,
                ),
                const SizedBox(height: 8),
                Text(
                  '从此刻开始记录',
                  style: TextStyle(
                    color: AppColors.heading(context),
                    fontSize: 21,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  '一张照片、一段日常、一个梦。\n把值得珍藏的瞬间留在这里。',
                  style: TextStyle(color: AppColors.muted(context), height: 1.55),
                ),
                const SizedBox(height: 14),
                SizedBox(
                  width: 156,
                  child: PrimaryAction(label: '写下第一条  →', onPressed: onCreate),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
