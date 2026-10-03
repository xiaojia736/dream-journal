import 'dart:async';

import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:share_plus/share_plus.dart';

import '../state/app_state_scope.dart';
import '../theme/app_theme.dart';
import '../utils/daily_quote.dart';
import '../widgets/gradient_background.dart';
import '../widgets/mood_record_calendar.dart';
import 'pin_screen.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key, this.active = true});

  final bool active;

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen>
    with WidgetsBindingObserver {
  bool _busy = false;
  bool _backupMenuOpen = false;
  DateTime _quoteDate = DateTime.now();
  Timer? _quoteTimer;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _scheduleQuoteRefresh();
  }

  @override
  void didUpdateWidget(SettingsScreen oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.active && !oldWidget.active) _refreshQuoteDate();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) _refreshQuoteDate();
  }

  void _refreshQuoteDate() {
    if (!mounted) return;
    final now = DateTime.now();
    if (!DateUtils.isSameDay(now, _quoteDate)) {
      setState(() => _quoteDate = now);
    }
    _scheduleQuoteRefresh();
  }

  void _scheduleQuoteRefresh() {
    _quoteTimer?.cancel();
    final now = DateTime.now();
    final midnight = DateTime(now.year, now.month, now.day + 1);
    _quoteTimer = Timer(
      midnight.difference(now) + const Duration(seconds: 1),
      _refreshQuoteDate,
    );
  }

  @override
  void dispose() {
    _quoteTimer?.cancel();
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  Future<void> _exportBackup() async {
    setState(() => _busy = true);
    try {
      final path = await AppStateScope.of(context).exportBackup();
      await SharePlus.instance.share(
        ShareParams(files: [XFile(path)], subject: '星海日记备份'),
      );
    } catch (error) {
      if (mounted) showError(context, error, title: '导出失败');
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _importBackup() async {
    try {
      final file = await FilePicker.pickFile(
        type: FileType.custom,
        allowedExtensions: const ['json'],
      );
      if (file == null || !mounted) return;
      final confirmed = await showDialog<bool>(
        context: context,
        builder: (context) => AlertDialog(
          title: const Text('导入记录'),
          content: const Text('备份中的记录会与本机记录合并，相同编号会跳过。'),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context, false),
              child: const Text('取消'),
            ),
            FilledButton(
              onPressed: () => Navigator.pop(context, true),
              child: const Text('导入'),
            ),
          ],
        ),
      );
      if (confirmed != true || !mounted) return;
      setState(() => _busy = true);
      final result = await AppStateScope.of(
        context,
      ).importBackup(await file.readAsBytes());
      if (!mounted) return;
      await showDialog<void>(
        context: context,
        builder: (context) => AlertDialog(
          title: const Text('导入完成'),
          content: Text('新增 ${result.imported} 条，跳过 ${result.skipped} 条。'),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('完成'),
            ),
          ],
        ),
      );
    } catch (error) {
      if (mounted) showError(context, error, title: '导入失败');
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _openBackupMenu() async {
    if (_busy || _backupMenuOpen) return;
    _backupMenuOpen = true;
    try {
      final action = await showModalBottomSheet<_BackupAction>(
        context: context,
        useSafeArea: true,
        showDragHandle: true,
        builder: (sheetContext) => SafeArea(
          top: false,
          child: Padding(
            padding: const EdgeInsets.fromLTRB(12, 4, 12, 20),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                ListTile(
                  leading: const Icon(Icons.file_download_outlined),
                  title: const Text('导入备份'),
                  onTap: () => Navigator.pop(
                    sheetContext,
                    _BackupAction.importBackup,
                  ),
                ),
                ListTile(
                  leading: const Icon(Icons.ios_share_outlined),
                  title: const Text('导出完整备份'),
                  onTap: () => Navigator.pop(
                    sheetContext,
                    _BackupAction.exportBackup,
                  ),
                ),
              ],
            ),
          ),
        ),
      );
      if (!mounted || action == null) return;
      if (action == _BackupAction.importBackup) {
        await _importBackup();
      } else {
        await _exportBackup();
      }
    } finally {
      _backupMenuOpen = false;
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = AppStateScope.of(context);
    return GradientBackground(
      child: SafeArea(
        bottom: false,
        child: ListView(
          padding: const EdgeInsets.fromLTRB(20, 18, 20, 130),
          children: [
            SizedBox(
              height: 48,
              child: Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  _TopAction(
                    icon: state.isDark
                        ? Icons.light_mode_outlined
                        : Icons.dark_mode_outlined,
                    tooltip: state.isDark ? '切换浅色外观' : '切换深色外观',
                    onPressed: () => state.setDark(!state.isDark),
                  ),
                  const SizedBox(width: 8),
                  _TopAction(
                    icon: Icons.lock_outline_rounded,
                    tooltip: '隐私锁',
                    onPressed: () => Navigator.of(context).push<void>(
                      MaterialPageRoute(builder: (_) => const PinScreen()),
                    ),
                  ),
                  const SizedBox(width: 8),
                  _TopAction(
                    icon: Icons.backup_outlined,
                    tooltip: '备份',
                    onPressed: _busy ? null : _openBackupMenu,
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            _DreamReflectionCard(text: dailyQuote(_quoteDate)),
            const SizedBox(height: 18),
            MoodRecordCalendar(today: _quoteDate),
            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }
}

class _DreamReflectionCard extends StatelessWidget {
  const _DreamReflectionCard({required this.text});

  final String text;

  @override
  Widget build(BuildContext context) {
    final dark = Theme.of(context).brightness == Brightness.dark;
    return GlassCard(
      radius: 30,
      padding: EdgeInsets.zero,
      gradient: LinearGradient(
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
        colors: dark
            ? const [
                Color.fromRGBO(233, 230, 255, .13),
                Color.fromRGBO(233, 230, 255, .065),
              ]
            : const [
                Color.fromRGBO(255, 255, 255, .70),
                Color.fromRGBO(250, 245, 255, .40),
              ],
      ),
      child: Stack(
        children: [
          Positioned.fill(
            child: IgnorePointer(
              child: DecoratedBox(
                decoration: BoxDecoration(
                  gradient: RadialGradient(
                    center: const Alignment(-1, -1),
                    radius: 1.25,
                    colors: [
                      const Color(0xffb2eee9).withValues(
                        alpha: dark ? .12 : .26,
                      ),
                      const Color(0x00b2eee9),
                    ],
                  ),
                ),
              ),
            ),
          ),
          Positioned.fill(
            child: IgnorePointer(
              child: DecoratedBox(
                decoration: BoxDecoration(
                  gradient: RadialGradient(
                    center: const Alignment(1, 1),
                    radius: 1.15,
                    colors: [
                      const Color(0xfff0b8de).withValues(
                        alpha: dark ? .12 : .20,
                      ),
                      const Color(0x00f0b8de),
                    ],
                  ),
                ),
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(22),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                ExcludeSemantics(
                  child: Row(
                    children: [
                      Icon(
                        Icons.dark_mode_outlined,
                        size: 16,
                        color: dark
                            ? const Color(0xffe1d3fc)
                            : const Color(0xff9f88c4),
                      ),
                      const Spacer(),
                      Icon(
                        Icons.auto_awesome_outlined,
                        size: 12,
                        color: AppColors.muted(context).withValues(alpha: .6),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 12),
                Text(
                  text,
                  textAlign: TextAlign.start,
                  style: TextStyle(
                    color: AppColors.body(context),
                    fontSize: 14.5,
                    fontWeight: FontWeight.w400,
                    height: 1.85,
                    letterSpacing: .2,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

enum _BackupAction { importBackup, exportBackup }

class _TopAction extends StatelessWidget {
  const _TopAction({
    required this.icon,
    required this.tooltip,
    required this.onPressed,
  });

  final IconData icon;
  final String tooltip;
  final VoidCallback? onPressed;

  @override
  Widget build(BuildContext context) => SizedBox.square(
    dimension: 44,
    child: IconButton(
      tooltip: tooltip,
      onPressed: onPressed,
      icon: Icon(icon, size: 20),
      color: AppColors.heading(context),
      padding: EdgeInsets.zero,
    ),
  );
}
