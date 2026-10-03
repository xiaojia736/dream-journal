import 'dart:ui';

import 'package:flutter/material.dart';

import '../theme/app_theme.dart';
import 'entry_detail_screen.dart';
import 'entry_editor_screen.dart';
import 'home_screen.dart';
import 'settings_screen.dart';
import 'stats_screen.dart';

class MainShell extends StatefulWidget {
  const MainShell({super.key});

  @override
  State<MainShell> createState() => _MainShellState();
}

class _MainShellState extends State<MainShell> {
  int _index = 0;
  bool _editorOpen = false;

  Future<void> _openEditor() async {
    if (_editorOpen) return;
    _editorOpen = true;
    FocusManager.instance.primaryFocus?.unfocus();
    try {
      final id = await Navigator.of(context).push<String>(
        MaterialPageRoute(builder: (_) => const EntryEditorScreen()),
      );
      if (!mounted || id == null) return;
      await Navigator.of(context).push<void>(
        MaterialPageRoute(builder: (_) => EntryDetailScreen(entryId: id)),
      );
    } finally {
      _editorOpen = false;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      extendBody: true,
      resizeToAvoidBottomInset: true,
      // The shell positions this above its navigation and system insets.
      floatingActionButtonLocation: FloatingActionButtonLocation.endFloat,
      floatingActionButton: _index == 0 ? _WriteFab(onTap: _openEditor) : null,
      body: IndexedStack(
        index: _index,
        children: [
          HomeScreen(onCreate: _openEditor),
          StatsScreen(active: _index == 1),
          SettingsScreen(active: _index == 2),
        ],
      ),
      bottomNavigationBar: _StarlightNavigation(
        selectedIndex: _index,
        onSelected: (value) {
          FocusManager.instance.primaryFocus?.unfocus();
          setState(() => _index = value);
        },
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
    final glow = AppColors.writeViolet;
    return Tooltip(
      message: '记录此刻',
      excludeFromSemantics: true,
      child: Semantics(
        button: true,
        label: '记录此刻',
        child: Container(
          width: 58,
          height: 58,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            boxShadow: [
              BoxShadow(
                color: glow.withValues(alpha: dark ? .26 : .20),
                blurRadius: 22,
                spreadRadius: 1,
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
                gradient: AppColors.writeGradient,
              ),
              child: InkWell(
                customBorder: const CircleBorder(),
                splashColor: (dark ? AppColors.darkAccent : Colors.white)
                    .withValues(alpha: .38),
                onTap: onTap,
                child: Icon(
                  dark ? Icons.auto_awesome : Icons.edit_rounded,
                  color: Colors.white,
                  size: 24,
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _StarlightNavigation extends StatelessWidget {
  const _StarlightNavigation({
    required this.selectedIndex,
    required this.onSelected,
  });

  final int selectedIndex;
  final ValueChanged<int> onSelected;

  static const _items = [
    (Icons.auto_awesome_outlined, Icons.auto_awesome, '记录'),
    (Icons.grid_view_outlined, Icons.grid_view_rounded, '我的星海'),
    (Icons.dark_mode_outlined, Icons.dark_mode_rounded, '片刻'),
  ];

  @override
  Widget build(BuildContext context) {
    final dark = Theme.of(context).brightness == Brightness.dark;
    return ClipRect(
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 16, sigmaY: 16),
        child: DecoratedBox(
          decoration: BoxDecoration(
            color: dark
                ? const Color(0xff322e51).withValues(alpha: .70)
                : const Color(0xfff5f0fc).withValues(alpha: .76),
            border: Border(
              top: BorderSide(color: AppColors.border(context)),
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: dark ? .08 : .05),
                blurRadius: 24,
                offset: const Offset(0, -6),
              ),
            ],
          ),
          child: SafeArea(
            top: false,
            child: SizedBox(
              height: 64,
              child: Row(
                children: List.generate(_items.length, (index) {
                  final selected = index == selectedIndex;
                  final item = _items[index];
                  return Expanded(
                    child: InkWell(
                      onTap: () => onSelected(index),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            selected ? item.$2 : item.$1,
                            size: 22,
                            color: selected
                                ? dark
                                      ? const Color(0xffc4b5fd)
                                      : Theme.of(context).colorScheme.primary
                                : AppColors.muted(context),
                            shadows: selected && dark
                                ? [
                                    Shadow(
                                      color: AppColors.writeViolet.withValues(
                                        alpha: .3,
                                      ),
                                      blurRadius: 8,
                                    ),
                                  ]
                                : null,
                          ),
                          const SizedBox(height: 3),
                          Text(
                            item.$3,
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: selected
                                  ? FontWeight.w600
                                  : FontWeight.w400,
                              color: selected
                                  ? dark
                                        ? const Color(0xffc4b5fd)
                                        : Theme.of(context).colorScheme.primary
                                  : AppColors.muted(context),
                            ),
                          ),
                          const SizedBox(height: 3),
                          AnimatedContainer(
                            duration: const Duration(milliseconds: 220),
                            width: selected ? 4 : 0,
                            height: selected ? 4 : 0,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: dark
                                  ? AppColors.darkAccent
                                  : AppColors.lightAccent,
                              boxShadow: selected
                                  ? [
                                      BoxShadow(
                                        color:
                                            (dark
                                                    ? AppColors.darkAccent
                                                    : AppColors.lightAccent)
                                                .withValues(alpha: .8),
                                        blurRadius: 9,
                                        spreadRadius: 1,
                                      ),
                                    ]
                                  : null,
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                }),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
