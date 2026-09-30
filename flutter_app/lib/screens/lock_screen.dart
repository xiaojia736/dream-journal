import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../state/app_state_scope.dart';
import '../widgets/gradient_background.dart';

class LockScreen extends StatefulWidget {
  const LockScreen({super.key});

  @override
  State<LockScreen> createState() => _LockScreenState();
}

class _LockScreenState extends State<LockScreen> {
  final _controller = TextEditingController();
  String _error = '';

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _unlock() {
    if (AppStateScope.of(context).unlock(_controller.text)) return;
    setState(() {
      _controller.clear();
      _error = '密码不正确';
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: GradientBackground(
        child: SafeArea(
          child: ListView(
            padding: const EdgeInsets.symmetric(horizontal: 26, vertical: 80),
            children: [
              const Icon(Icons.lock_rounded, size: 58),
              const SizedBox(height: 18),
              Text(
                '星海暂时上锁',
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.w800,
                ),
              ),
              const SizedBox(height: 8),
              const Text('输入 4 位隐私密码', textAlign: TextAlign.center),
              const SizedBox(height: 36),
              TextField(
                controller: _controller,
                autofocus: true,
                obscureText: true,
                textAlign: TextAlign.center,
                keyboardType: TextInputType.number,
                inputFormatters: [
                  FilteringTextInputFormatter.digitsOnly,
                  LengthLimitingTextInputFormatter(4),
                ],
                style: const TextStyle(fontSize: 25, letterSpacing: 12),
                onChanged: (_) => setState(() => _error = ''),
                onSubmitted: (_) => _unlock(),
              ),
              if (_error.isNotEmpty) ...[
                const SizedBox(height: 12),
                Text(
                  _error,
                  textAlign: TextAlign.center,
                  style: TextStyle(color: Theme.of(context).colorScheme.error),
                ),
              ],
              const SizedBox(height: 16),
              PrimaryAction(label: '解锁', onPressed: _unlock),
            ],
          ),
        ),
      ),
    );
  }
}
