import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../state/app_state_scope.dart';
import '../theme/app_theme.dart';
import '../widgets/gradient_background.dart';

class PinScreen extends StatefulWidget {
  const PinScreen({super.key});

  @override
  State<PinScreen> createState() => _PinScreenState();
}

class _PinScreenState extends State<PinScreen> {
  final _current = TextEditingController();
  final _next = TextEditingController();
  final _confirm = TextEditingController();
  bool _busy = false;

  @override
  void dispose() {
    _current.dispose();
    _next.dispose();
    _confirm.dispose();
    super.dispose();
  }

  Future<void> _save({bool disable = false}) async {
    if (!disable && _next.text != _confirm.text) {
      showError(context, StateError('两次输入的新密码不一致'), title: '密码不一致');
      return;
    }
    setState(() => _busy = true);
    try {
      await AppStateScope.of(
        context,
      ).setPin(current: _current.text, next: disable ? '' : _next.text);
      if (mounted) Navigator.pop(context);
    } catch (error) {
      if (mounted) showError(context, error, title: '设置失败');
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final hasPin = AppStateScope.of(context).hasPin;
    return Scaffold(
      body: GradientBackground(
        child: SafeArea(
          child: ListView(
            padding: const EdgeInsets.fromLTRB(20, 8, 20, 38),
            children: [
              AppBar(title: const Text('隐私锁')),
              Text(
                '打开应用时，需要输入 4 位数字密码。',
                style: TextStyle(color: AppColors.muted(context)),
              ),
              const SizedBox(height: 28),
              if (hasPin) ...[
                const _PinLabel('当前密码'),
                _PinField(controller: _current),
                const SizedBox(height: 20),
              ],
              _PinLabel(hasPin ? '新密码' : '设置密码'),
              _PinField(controller: _next),
              const SizedBox(height: 20),
              const _PinLabel('再次输入'),
              _PinField(controller: _confirm),
              const SizedBox(height: 24),
              PrimaryAction(label: '保存隐私锁', onPressed: _save, busy: _busy),
              if (hasPin)
                TextButton(
                  onPressed: _busy ? null : () => _save(disable: true),
                  style: TextButton.styleFrom(
                    foregroundColor: Theme.of(context).colorScheme.error,
                  ),
                  child: const Text('关闭隐私锁'),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

class _PinLabel extends StatelessWidget {
  const _PinLabel(this.text);
  final String text;

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(bottom: 8),
    child: Text(text, style: TextStyle(color: AppColors.muted(context))),
  );
}

class _PinField extends StatelessWidget {
  const _PinField({required this.controller});
  final TextEditingController controller;

  @override
  Widget build(BuildContext context) => TextField(
    controller: controller,
    keyboardType: TextInputType.number,
    obscureText: true,
    inputFormatters: [
      FilteringTextInputFormatter.digitsOnly,
      LengthLimitingTextInputFormatter(4),
    ],
    style: const TextStyle(fontSize: 18, letterSpacing: 7),
  );
}
