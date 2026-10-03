import 'dart:io';
import 'dart:math';

import 'package:flutter/material.dart';

import '../state/app_state_scope.dart';
import '../theme/app_theme.dart';
import '../utils/date_text.dart';
import '../widgets/gradient_background.dart';
import 'entry_detail_screen.dart';

class StatsScreen extends StatefulWidget {
  const StatsScreen({super.key, this.active = true});

  final bool active;

  @override
  State<StatsScreen> createState() => _StatsScreenState();
}

class _StatsScreenState extends State<StatsScreen> {
  final _random = Random();
  final _scroll = ScrollController();
  List<_WallPhoto> _photos = [];
  bool _loaded = false;

  List<_WallPhoto> _collectPhotos() => [
    for (final entry in AppStateScope.of(context).entries)
      for (final photo in entry.photos)
        _WallPhoto(
          entryId: entry.id,
          photoId: photo.id,
          date: entry.occurredAt.toLocal(),
        ),
  ];

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final pool = _collectPhotos();
    if (!_loaded) {
      _photos = pool;
      if (widget.active) _photos.shuffle(_random);
      _loaded = true;
      return;
    }
    final current = {for (final photo in pool) photo.key: photo};
    final previousKeys = _photos.map((photo) => photo.key).toSet();
    _photos = [
      for (final photo in _photos)
        if (current.containsKey(photo.key)) current[photo.key]!,
      for (final photo in pool)
        if (!previousKeys.contains(photo.key)) photo,
    ];
  }

  @override
  void didUpdateWidget(StatsScreen oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.active && !oldWidget.active) _shufflePhotos();
  }

  void _shufflePhotos() {
    final next = _collectPhotos()..shuffle(_random);
    if (next.length > 1 &&
        _photos.isNotEmpty &&
        next.first.key == _photos.first.key) {
      final other = 1 + _random.nextInt(next.length - 1);
      final first = next.first;
      next[0] = next[other];
      next[other] = first;
    }
    setState(() => _photos = next);
    if (_scroll.hasClients) _scroll.jumpTo(0);
  }

  Future<void> _openPhoto(_WallPhoto photo) async {
    final entry = AppStateScope.of(context).entryById(photo.entryId);
    if (entry == null || !entry.photos.any((item) => item.id == photo.photoId)) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('这张照片已移走或删除。')),
      );
      return;
    }
    await Navigator.of(context).push<void>(
      MaterialPageRoute(
        builder: (_) => EntryDetailScreen(
          entryId: photo.entryId,
          initialPhotoId: photo.photoId,
        ),
      ),
    );
  }

  @override
  void dispose() {
    _scroll.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => GradientBackground(
    child: SafeArea(
      bottom: false,
      child: CustomScrollView(
        controller: _scroll,
        slivers: [
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(20, 18, 20, 22),
            sliver: SliverToBoxAdapter(
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          '我的星海',
                          style: Theme.of(context).textTheme.headlineMedium
                              ?.copyWith(fontWeight: FontWeight.w700),
                        ),
                        const SizedBox(height: 7),
                        Text(
                          '让照片，替你拾起那些微光',
                          style: TextStyle(
                            color: AppColors.muted(context),
                            fontSize: 13,
                            height: 1.6,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 12),
                  SizedBox.square(
                    dimension: 44,
                    child: IconButton(
                      tooltip: '换一组照片',
                      onPressed: _photos.length > 1 ? _shufflePhotos : null,
                      icon: const Icon(Icons.shuffle_rounded, size: 21),
                      color: AppColors.heading(context),
                    ),
                  ),
                ],
              ),
            ),
          ),
          if (_photos.isEmpty)
            SliverFillRemaining(
              hasScrollBody: false,
              child: Padding(
                padding: const EdgeInsets.fromLTRB(40, 0, 40, 110),
                child: Center(
                  child: Text(
                    '收藏一张照片，\n让生活里的微光慢慢铺满这里。',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      color: AppColors.muted(context),
                      fontSize: 14,
                      height: 1.9,
                    ),
                  ),
                ),
              ),
            )
          else ...[
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(20, 0, 20, 10),
              sliver: SliverToBoxAdapter(
                child: AspectRatio(
                  aspectRatio: 4 / 3,
                  child: _WallTile(
                    photo: _photos.first,
                    radius: 22,
                    hero: true,
                    onTap: () => _openPhoto(_photos.first),
                  ),
                ),
              ),
            ),
            if (_photos.length > 1)
              SliverPadding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                sliver: SliverGrid(
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 2,
                    crossAxisSpacing: 10,
                    mainAxisSpacing: 10,
                    childAspectRatio: 1,
                  ),
                  delegate: SliverChildBuilderDelegate(
                    (context, index) => _WallTile(
                      key: ValueKey(_photos[index + 1].key),
                      photo: _photos[index + 1],
                      radius: 16,
                      onTap: () => _openPhoto(_photos[index + 1]),
                    ),
                    childCount: _photos.length - 1,
                  ),
                ),
              ),
            const SliverToBoxAdapter(child: SizedBox(height: 130)),
          ],
        ],
      ),
    ),
  );
}

class _WallPhoto {
  const _WallPhoto({
    required this.entryId,
    required this.photoId,
    required this.date,
  });

  final String entryId;
  final String photoId;
  final DateTime date;

  String get key => '$entryId\u0000$photoId';
}

class _WallTile extends StatelessWidget {
  const _WallTile({
    super.key,
    required this.photo,
    required this.radius,
    required this.onTap,
    this.hero = false,
  });

  final _WallPhoto photo;
  final double radius;
  final VoidCallback onTap;
  final bool hero;

  @override
  Widget build(BuildContext context) => Semantics(
    button: true,
    label: '打开${shortDate(photo.date)}的照片记录',
    child: GestureDetector(
      onTap: onTap,
      child: ClipRRect(
        borderRadius: BorderRadius.circular(radius),
        child: Stack(
          fit: StackFit.expand,
          children: [
            Image.file(
              File(photo.photoId),
              fit: BoxFit.cover,
              cacheWidth: hero ? 1000 : 500,
              excludeFromSemantics: true,
              errorBuilder: (_, _, _) => ColoredBox(
                color: AppColors.soft(context),
                child: Icon(
                  Icons.broken_image_outlined,
                  color: AppColors.muted(context),
                ),
              ),
            ),
            Positioned(
              right: 9,
              bottom: 9,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 4),
                decoration: BoxDecoration(
                  color: const Color(0xff090714).withValues(alpha: .62),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  shortDate(photo.date),
                  style: const TextStyle(color: Colors.white, fontSize: 10),
                ),
              ),
            ),
          ],
        ),
      ),
    ),
  );
}
