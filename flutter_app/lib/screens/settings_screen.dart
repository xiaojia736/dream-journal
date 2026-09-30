import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:share_plus/share_plus.dart';

import '../state/app_state_scope.dart';
import '../theme/app_theme.dart';
import '../widgets/gradient_background.dart';
import 'pin_screen.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  bool _busy = false;

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

  @override
  Widget build(BuildContext context) {
    final state = AppStateScope.of(context);
    return GradientBackground(
      child: SafeArea(
        bottom: false,
        child: ListView(
          padding: const EdgeInsets.fromLTRB(20, 18, 20, 80),
          children: [
            const PageTitle('设置', subtitle: '管理你的记录与私人空间'),
            const _InfoCard(
              icon: Icons.phone_android,
              title: '这部手机',
              subtitle: '无需网络即可记录。换手机前请先导出完整备份。',
            ),
            const SizedBox(height: 22),
            const _SectionLabel('外观与隐私'),
            _SettingsGroup(
              dataTone: true,
              children: [
                _SettingsRow(
                  icon: state.isDark
                      ? Icons.light_mode_outlined
                      : Icons.dark_mode_outlined,
                  title: state.isDark ? '切换浅色外观' : '切换深色外观',
                  onTap: () => state.setDark(!state.isDark),
                ),
                _SettingsRow(
                  icon: Icons.lock_outline_rounded,
                  title: '隐私锁',
                  subtitle: state.hasPin ? '已开启' : '未开启',
                  onTap: () => Navigator.of(context).push<void>(
                    MaterialPageRoute(builder: (_) => const PinScreen()),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 22),
            const _SectionLabel('数据'),
            _SettingsGroup(
              children: [
                _SettingsRow(
                  icon: Icons.file_download_outlined,
                  title: '导入备份',
                  subtitle: '选择 Flutter 版导出的 JSON',
                  enabled: !_busy,
                  onTap: _importBackup,
                ),
                _SettingsRow(
                  icon: Icons.ios_share_outlined,
                  title: '导出完整备份',
                  subtitle: '包含文字、情绪、标签和照片',
                  enabled: !_busy,
                  onTap: _exportBackup,
                ),
              ],
            ),
            if (_busy)
              const Padding(
                padding: EdgeInsets.all(16),
                child: Center(child: CircularProgressIndicator()),
              ),
            Padding(
              padding: const EdgeInsets.only(top: 15),
              child: Text(
                '星海日记 · 你的生活收藏夹',
                textAlign: TextAlign.center,
                style: TextStyle(color: AppColors.muted(context), fontSize: 12),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _InfoCard extends StatelessWidget {
  const _InfoCard({
    required this.icon,
    required this.title,
    required this.subtitle,
  });

  final IconData icon;
  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    return GlassCard(
      padding: const EdgeInsets.all(18),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 38,
            height: 38,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: AppColors.soft(context),
            ),
            child: Icon(
              icon,
              size: 19,
              color: Theme.of(context).colorScheme.primary,
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: 17,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 5),
                Text(
                  subtitle,
                  style: TextStyle(
                    color: AppColors.muted(context),
                    fontSize: 12,
                    height: 1.5,
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

class _SectionLabel extends StatelessWidget {
  const _SectionLabel(this.label);

  final String label;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(left: 4, bottom: 9),
      child: Text(
        label,
        style: TextStyle(
          color: AppColors.muted(context),
          fontSize: 12,
          fontWeight: FontWeight.w600,
          letterSpacing: .7,
        ),
      ),
    );
  }
}

class _SettingsGroup extends StatelessWidget {
  const _SettingsGroup({required this.children, this.dataTone = false});

  final List<_SettingsRow> children;
  final bool dataTone;

  @override
  Widget build(BuildContext context) {
    return GlassCard(
      padding: EdgeInsets.zero,
      tint: dataTone && Theme.of(context).brightness == Brightness.dark
          ? const Color(0xff243d4a)
          : null,
      child: Column(
        children: [
          for (var i = 0; i < children.length; i++) ...[
            children[i],
            if (i < children.length - 1)
              Padding(
                padding: const EdgeInsets.only(left: 66),
                child: Divider(
                  color: AppColors.border(context).withValues(alpha: .55),
                ),
              ),
          ],
        ],
      ),
    );
  }
}

class _SettingsRow extends StatelessWidget {
  const _SettingsRow({
    required this.icon,
    required this.title,
    required this.onTap,
    this.subtitle,
    this.enabled = true,
  });

  final IconData icon;
  final String title;
  final String? subtitle;
  final VoidCallback onTap;
  final bool enabled;

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: EdgeInsets.zero,
      color: Colors.transparent,
      shape: const RoundedRectangleBorder(),
      child: ListTile(
        enabled: enabled,
        onTap: enabled ? onTap : null,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
        leading: Container(
          width: 35,
          height: 35,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(11),
            color: AppColors.soft(context),
          ),
          child: Icon(
            icon,
            size: 18,
            color: Theme.of(context).colorScheme.primary,
          ),
        ),
        title: Text(
          title,
          style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15),
        ),
        subtitle: subtitle == null
            ? null
            : Text(
                subtitle!,
                style: TextStyle(
                  color: AppColors.muted(context),
                  fontSize: 11,
                  height: 1.5,
                ),
              ),
        trailing: Icon(
          Icons.chevron_right_rounded,
          size: 20,
          color: AppColors.muted(context),
        ),
      ),
    );
  }
}
