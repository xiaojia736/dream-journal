import 'package:flutter/material.dart';

import '../theme/app_theme.dart';
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(
        index: _index,
        children: const [HomeScreen(), StatsScreen(), SettingsScreen()],
      ),
      bottomNavigationBar: _StarlightNavigation(
        selectedIndex: _index,
        onSelected: (value) => setState(() => _index = value),
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
    (Icons.grid_view_outlined, Icons.grid_view_rounded, '图鉴'),
    (Icons.tune_outlined, Icons.tune_rounded, '设置'),
  ];

  @override
  Widget build(BuildContext context) {
    final dark = Theme.of(context).brightness == Brightness.dark;
    return DecoratedBox(
      decoration: BoxDecoration(
        color: (dark ? const Color(0xff2d244a) : Colors.white).withValues(
          alpha: dark ? .86 : .94,
        ),
        border: Border(
          top: BorderSide(
            color: AppColors.border(context).withValues(alpha: .55),
          ),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: dark ? .22 : .06),
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
                                  color: const Color(
                                    0xffa78bfa,
                                  ).withValues(alpha: .5),
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
    );
  }
}
