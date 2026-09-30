import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'screens/lock_screen.dart';
import 'screens/main_shell.dart';
import 'state/app_state.dart';
import 'state/app_state_scope.dart';
import 'theme/app_theme.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  final state = AppState();
  runApp(JournalApp(state: state));
  unawaited(state.initialize());
}

class JournalApp extends StatelessWidget {
  const JournalApp({super.key, required this.state});

  final AppState state;

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: state,
      builder: (context, _) => AppStateScope(
        state: state,
        child: MaterialApp(
          title: '星海日记',
          debugShowCheckedModeBanner: false,
          theme: AppTheme.light,
          darkTheme: AppTheme.dark,
          themeMode: state.isDark ? ThemeMode.dark : ThemeMode.light,
          home: !state.initialized
              ? _StartupScreen(
                  failed: state.initializationError != null,
                  onRetry: state.initialize,
                )
              : state.locked
              ? const LockScreen()
              : const MainShell(),
          builder: (context, child) => AnnotatedRegion<SystemUiOverlayStyle>(
            value: Theme.of(context).brightness == Brightness.dark
                ? SystemUiOverlayStyle.light.copyWith(
                    statusBarColor: Colors.transparent,
                  )
                : SystemUiOverlayStyle.dark.copyWith(
                    statusBarColor: Colors.transparent,
                  ),
            child: child!,
          ),
        ),
      ),
    );
  }
}

class _StartupScreen extends StatelessWidget {
  const _StartupScreen({required this.failed, required this.onRetry});

  final bool failed;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xff0d0b18),
      body: DecoratedBox(
        decoration: const BoxDecoration(
          gradient: RadialGradient(
            center: Alignment(.35, -.35),
            radius: 1.05,
            colors: [Color(0xff29204d), Color(0xff0d0b18)],
          ),
        ),
        child: Center(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 112,
                height: 112,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(28),
                  boxShadow: [
                    BoxShadow(
                      color: const Color(0xff8a70d6).withValues(alpha: .38),
                      blurRadius: 30,
                      spreadRadius: 2,
                    ),
                  ],
                ),
                clipBehavior: Clip.antiAlias,
                child: Image.asset(
                  '../mobile/assets/icon.png',
                  fit: BoxFit.cover,
                ),
              ),
              const SizedBox(height: 18),
              const Text(
                '星海日记',
                style: TextStyle(
                  color: Color(0xffe9ecef),
                  fontSize: 20,
                  fontWeight: FontWeight.w600,
                  letterSpacing: 1.2,
                ),
              ),
              const SizedBox(height: 16),
              if (failed)
                TextButton.icon(
                  onPressed: onRetry,
                  icon: const Icon(Icons.refresh_rounded),
                  label: const Text('加载失败，点击重试'),
                )
              else
                const SizedBox(
                  width: 18,
                  height: 18,
                  child: CircularProgressIndicator(
                    strokeWidth: 1.6,
                    color: Color(0xffffeaa7),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}
