import 'dart:io';

import 'package:flutter/material.dart';

import '../models/journal_entry.dart';
import '../theme/app_theme.dart';
import '../utils/date_text.dart';
import 'gradient_background.dart';

class JournalRecordCard extends StatelessWidget {
  const JournalRecordCard({
    super.key,
    required this.entry,
    required this.onTap,
    this.fullContent = false,
  });

  final JournalEntry entry;
  final VoidCallback onTap;
  final bool fullContent;

  @override
  Widget build(BuildContext context) {
    final lines = fullContent
        ? entry.text.replaceAll('\r\n', '\n').split('\n')
        : entry.text.trim().split(RegExp(r'\n+'));
    final title = fullContent && entry.text.trim().isNotEmpty
        ? lines.first
        : lines.firstOrNull?.isNotEmpty == true
        ? lines.first
        : (entry.photos.isNotEmpty ? '照片记录' : '一段生活记录');
    final summary = fullContent
        ? lines.skip(1).join('\n')
        : lines.skip(1).join(' ').trim();
    return GlassCard(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(20),
      radius: 20,
      diary: true,
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
                maxLines: fullContent ? null : 2,
                overflow: fullContent
                    ? TextOverflow.visible
                    : TextOverflow.ellipsis,
                style: TextStyle(
                  color: AppColors.heading(context),
                  fontSize: 18,
                  fontWeight: FontWeight.w600,
                  height: 1.6,
                ),
              ),
              if (summary.isNotEmpty) ...[
                const SizedBox(height: 5),
                Text(
                  summary,
                  maxLines: fullContent ? null : 3,
                  overflow: fullContent
                      ? TextOverflow.visible
                      : TextOverflow.ellipsis,
                  style: TextStyle(
                    color: AppColors.body(context),
                    fontSize: 13,
                    height: 1.65,
                  ),
                ),
              ],
            ],
          ),
          if (entry.photos.isNotEmpty) ...[
            const SizedBox(height: 13),
            if (fullContent)
              _FullPhotos(paths: entry.photos.map((photo) => photo.id).toList())
            else
              _PhotoStrip(paths: entry.photos.map((photo) => photo.id).toList()),
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
            color: dark ? AppColors.darkSelectedText : AppColors.lightPrimary,
          ),
          const SizedBox(width: 5),
          Text(
            shortDate(date.toLocal()),
            style: TextStyle(
              color: dark ? AppColors.darkSelectedText : AppColors.lightMuted,
              fontSize: 11,
              fontWeight: dark ? FontWeight.w700 : FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}

class _FullPhotos extends StatelessWidget {
  const _FullPhotos({required this.paths});

  final List<String> paths;

  @override
  Widget build(BuildContext context) => GridView.count(
    crossAxisCount: paths.length == 1 ? 1 : 2,
    childAspectRatio: paths.length == 1 ? 4 / 3 : 1,
    shrinkWrap: true,
    primary: false,
    physics: const NeverScrollableScrollPhysics(),
    padding: EdgeInsets.zero,
    mainAxisSpacing: 8,
    crossAxisSpacing: 8,
    children: [
      for (final path in paths)
        _PhotoFrame(
          child: ClipRRect(
            borderRadius: BorderRadius.circular(10),
            child: _Photo(path: path, fit: BoxFit.contain),
          ),
        ),
    ],
  );
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
  const _Photo({required this.path, this.fit = BoxFit.cover});

  final String path;
  final BoxFit fit;

  @override
  Widget build(BuildContext context) {
    return Image.file(
      File(path),
      fit: fit,
      errorBuilder: (_, _, _) => ColoredBox(
        color: AppColors.soft(context),
        child: const Center(child: Icon(Icons.broken_image_outlined)),
      ),
    );
  }
}
