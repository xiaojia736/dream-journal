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

class _HomeScreenState extends State<HomeScreen>
    with SingleTickerProviderStateMixin {
  final _search = TextEditingController();
  late final AnimationController _starController;
  EntryType? _filter;

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
              : _WriteFab(onTap: _openEditor),
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
                                  ?.copyWith(
                                    fontWeight: FontWeight.w700,
                                    letterSpacing: -.5,
                                  ),
                            ),
                            ScaleTransition(
                              scale: _starController,
                              child: Container(
                                width: 40,
                                height: 40,
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
                                child: ShaderMask(
                                  shaderCallback: (bounds) =>
                                      const LinearGradient(
                                        colors: [
                                          Color(0xffa78bfa),
                                          Color(0xff818cf8),
                                        ],
                                      ).createShader(bounds),
                                  child: const Icon(
                                    Icons.auto_awesome,
                                    size: 19,
                                    color: Colors.white,
                                  ),
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 4),
                        _HomeSubtitle(
                          dark: Theme.of(context).brightness == Brightness.dark,
                        ),
                        const SizedBox(height: 16),
                        SizedBox(
                          height: 44,
                          child: TextField(
                            controller: _search,
                            onChanged: (_) => setState(() {}),
                            decoration: InputDecoration(
                              hintText: '搜索文字、标签或日期',
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
                        const SizedBox(height: 10),
                        SizedBox(
                          height: 35,
                          child: Stack(
                            children: [
                              ListView(
                                scrollDirection: Axis.horizontal,
                                padding: const EdgeInsets.only(right: 28),
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
                                      onTap: () =>
                                          setState(() => _filter = type),
                                    ),
                                ],
                              ),
                              Positioned(
                                top: 0,
                                right: 0,
                                bottom: 0,
                                child: IgnorePointer(
                                  child: Container(
                                    width: 30,
                                    decoration: BoxDecoration(
                                      gradient: LinearGradient(
                                        colors: [
                                          Colors.transparent,
                                          Theme.of(
                                            context,
                                          ).scaffoldBackgroundColor,
                                        ],
                                      ),
                                    ),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 15),
                        if (entries.isNotEmpty)
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                _filter?.label ?? '我的记录',
                                style: const TextStyle(
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
        labelStyle: TextStyle(
          fontSize: 12,
          fontWeight: selected ? FontWeight.w600 : FontWeight.w400,
        ),
        padding: const EdgeInsets.symmetric(horizontal: 4),
        visualDensity: VisualDensity.compact,
        side: BorderSide(
          color: selected
              ? Theme.of(context).colorScheme.primary.withValues(alpha: .35)
              : AppColors.border(context).withValues(alpha: .7),
        ),
        onSelected: (_) => onTap(),
      ),
    );
  }
}

class _WriteFab extends StatelessWidget {
  const _WriteFab({required this.onTap});

  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final dark = Theme.of(context).brightness == Brightness.dark;
    final glow = dark ? AppColors.darkPrimary : AppColors.lightPrimary;
    return Container(
      width: 58,
      height: 58,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        boxShadow: [
          BoxShadow(
            color: glow.withValues(alpha: dark ? .5 : .3),
            blurRadius: 22,
            spreadRadius: dark ? 2 : 1,
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        shape: const CircleBorder(),
        clipBehavior: Clip.antiAlias,
        child: Ink(
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: dark
                  ? const [Color(0xffa78bfa), Color(0xff818cf8)]
                  : const [Color(0xffe78b70), Color(0xffe9c46a)],
            ),
          ),
          child: InkWell(
            customBorder: const CircleBorder(),
            splashColor: (dark ? AppColors.darkAccent : Colors.white)
                .withValues(alpha: .38),
            onTap: onTap,
            child: Icon(
              dark ? Icons.auto_awesome : Icons.edit_rounded,
              color: dark ? AppColors.darkAccent : Colors.white,
              size: 24,
            ),
          ),
        ),
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
          const TextSpan(text: '朋友，收藏生活中每一颗'),
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
    return GlassCard(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(17),
      onTap: onTap,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              _DateBadge(date: entry.occurredAt),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 5),
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
          const SizedBox(height: 11),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  fontSize: 17,
                  fontWeight: FontWeight.w600,
                  height: 1.55,
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
                    height: 1.65,
                  ),
                ),
              ],
            ],
          ),
          if (entry.photos.isNotEmpty) ...[
            const SizedBox(height: 13),
            _PhotoStrip(paths: entry.photos.map((photo) => photo.id).toList()),
          ],
          if (entry.mood != Mood.none || entry.tags.isNotEmpty) ...[
            const SizedBox(height: 12),
            Wrap(
              spacing: 10,
              runSpacing: 7,
              children: [
                if (entry.mood != Mood.none)
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 9,
                      vertical: 5,
                    ),
                    decoration: BoxDecoration(
                      color: AppColors.accent(context).withValues(alpha: .14),
                      borderRadius: BorderRadius.circular(99),
                      border: Border.all(
                        color: AppColors.accent(context).withValues(alpha: .22),
                      ),
                    ),
                    child: Text(
                      '${entry.mood.emoji} ${entry.mood.label}',
                      style: TextStyle(
                        color: Theme.of(context).brightness == Brightness.dark
                            ? AppColors.darkAccent
                            : const Color(0xffa96539),
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                      ),
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
    );
  }
}

class _DateBadge extends StatelessWidget {
  const _DateBadge({required this.date});

  final DateTime date;

  @override
  Widget build(BuildContext context) {
    final dark = Theme.of(context).brightness == Brightness.dark;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 5),
      decoration: BoxDecoration(
        color: dark
            ? AppColors.darkSoft.withValues(alpha: .72)
            : const Color(0xfffff5ec),
        borderRadius: BorderRadius.circular(9),
        border: Border.all(
          color: dark
              ? AppColors.darkBorder
              : AppColors.lightPrimary.withValues(alpha: .17),
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            dark ? Icons.star_outline_rounded : Icons.calendar_today_outlined,
            size: 12,
            color: dark ? AppColors.darkAccent : AppColors.lightPrimary,
          ),
          const SizedBox(width: 5),
          Text(
            shortDate(date),
            style: TextStyle(
              color: dark ? AppColors.darkMuted : AppColors.lightMuted,
              fontSize: 11,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}

class _PhotoStrip extends StatelessWidget {
  const _PhotoStrip({required this.paths});

  final List<String> paths;

  @override
  Widget build(BuildContext context) {
    final visible = paths.take(3).toList();
    if (visible.length == 1) {
      return _PhotoFrame(
        child: AspectRatio(
          aspectRatio: 16 / 8.5,
          child: ClipRRect(
            borderRadius: BorderRadius.circular(10),
            child: _Photo(path: visible.first),
          ),
        ),
      );
    }
    return SizedBox(
      height: 96,
      child: Row(
        children: [
          for (var i = 0; i < visible.length; i++) ...[
            if (i > 0) const SizedBox(width: 7),
            Expanded(
              child: _PhotoFrame(
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(9),
                  child: Stack(
                    fit: StackFit.expand,
                    children: [
                      _Photo(path: visible[i]),
                      if (i == 2 && paths.length > 3)
                        ColoredBox(
                          color: Colors.black.withValues(alpha: .38),
                          child: Center(
                            child: Text(
                              '+${paths.length - 3}',
                              style: const TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.w600,
                                fontSize: 16,
                              ),
                            ),
                          ),
                        ),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _PhotoFrame extends StatelessWidget {
  const _PhotoFrame({required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    final dark = Theme.of(context).brightness == Brightness.dark;
    return Container(
      padding: dark ? EdgeInsets.zero : const EdgeInsets.fromLTRB(5, 5, 5, 8),
      decoration: BoxDecoration(
        color: dark ? Colors.transparent : Colors.white.withValues(alpha: .96),
        borderRadius: BorderRadius.circular(13),
        border: Border.all(color: dark ? AppColors.darkBorder : Colors.white),
        boxShadow: [
          BoxShadow(
            color: (dark ? Colors.black : const Color(0xffb49682)).withValues(
              alpha: dark ? .16 : .13,
            ),
            blurRadius: dark ? 12 : 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: child,
    );
  }
}

class _Photo extends StatelessWidget {
  const _Photo({required this.path});

  final String path;

  @override
  Widget build(BuildContext context) {
    return Image.file(
      File(path),
      fit: BoxFit.cover,
      errorBuilder: (_, _, _) => ColoredBox(
        color: AppColors.soft(context),
        child: const Center(child: Icon(Icons.broken_image_outlined)),
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
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: dark
                ? const [Color(0xcc382b65), Color(0xb826204a)]
                : const [Color(0xffe07a5f), Color(0xffe9a66e)],
          ),
          borderRadius: BorderRadius.circular(18),
          boxShadow: [
            BoxShadow(
              color: (dark ? AppColors.darkPrimary : AppColors.lightPrimary)
                  .withValues(alpha: .22),
              blurRadius: 24,
              offset: const Offset(0, 10),
            ),
          ],
        ),
        child: Stack(
          children: [
            if (dark)
              const Positioned.fill(
                child: IgnorePointer(
                  child: CustomPaint(painter: _EmptyConstellationPainter()),
                ),
              ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  Icons.auto_awesome,
                  color: dark ? AppColors.darkAccent : Colors.white,
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
                const Text(
                  '从此刻开始记录',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 21,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 6),
                const Text(
                  '一张照片、一段日常、一个梦。\n把值得珍藏的瞬间留在这里。',
                  style: TextStyle(color: Color(0xfff1edff), height: 1.55),
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

class _EmptyConstellationPainter extends CustomPainter {
  const _EmptyConstellationPainter();

  static const _points = [
    Offset(.56, .2),
    Offset(.7, .1),
    Offset(.82, .3),
    Offset(.94, .18),
    Offset(.75, .53),
    Offset(.91, .66),
  ];

  @override
  void paint(Canvas canvas, Size size) {
    final line = Paint()
      ..color = const Color(0xffc4b5fd).withValues(alpha: .22)
      ..strokeWidth = 1;
    final star = Paint()..color = AppColors.darkAccent.withValues(alpha: .72);
    for (var i = 1; i < _points.length; i++) {
      canvas.drawLine(
        Offset(_points[i - 1].dx * size.width, _points[i - 1].dy * size.height),
        Offset(_points[i].dx * size.width, _points[i].dy * size.height),
        line,
      );
    }
    for (final point in _points) {
      canvas.drawCircle(
        Offset(point.dx * size.width, point.dy * size.height),
        2.1,
        star,
      );
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
