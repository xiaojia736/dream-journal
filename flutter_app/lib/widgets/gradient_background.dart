import 'dart:ui';

import 'package:flutter/material.dart';

import '../theme/app_theme.dart';

class GradientBackground extends StatelessWidget {
  const GradientBackground({super.key, required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    final dark = Theme.of(context).brightness == Brightness.dark;
    return LayoutBuilder(
      builder: (context, constraints) => Stack(
        fit: StackFit.expand,
        children: [
          DecoratedBox(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                stops: const [0, .5, 1],
                colors: dark
                    ? const [
                        AppColors.darkBackground,
                        AppColors.darkCanvasMiddle,
                        AppColors.darkCanvasBottom,
                      ]
                    : const [
                        AppColors.lightBackground,
                        AppColors.lightCanvasMiddle,
                        AppColors.lightCanvasBottom,
                      ],
              ),
            ),
          ),
          RepaintBoundary(
            child: Stack(
              children: [
                Positioned(
                  left: -70,
                  top: -20,
                  child: _SoftGlow(
                    size: 320,
                    color: dark
                        ? AppColors.auroraCyan
                        : const Color.fromRGBO(178, 238, 233, .48),
                  ),
                ),
                Positioned(
                  right: -100,
                  top: constraints.maxHeight * .30,
                  child: _SoftGlow(
                    size: 360,
                    color: dark
                        ? AppColors.dreamyViolet
                        : const Color.fromRGBO(240, 184, 222, .38),
                  ),
                ),
                Positioned(
                  left: -35,
                  bottom: -90,
                  child: _SoftGlow(
                    size: 300,
                    color: dark
                        ? AppColors.dreamyLilac
                        : const Color.fromRGBO(191, 167, 245, .24),
                  ),
                ),
              ],
            ),
          ),
          child,
        ],
      ),
    );
  }
}

// These fixed colour clouds are isolated from scrolling UI and never animate.
// A single blur on a solid tint keeps the glow visible without double blurring.
class _SoftGlow extends StatelessWidget {
  const _SoftGlow({required this.size, required this.color});

  final double size;
  final Color color;

  @override
  Widget build(BuildContext context) => IgnorePointer(
    child: ImageFiltered(
      imageFilter: ImageFilter.blur(sigmaX: 48, sigmaY: 48),
      child: Container(
        width: size,
        height: size,
        decoration: BoxDecoration(shape: BoxShape.circle, color: color),
      ),
    ),
  );
}

class GlassCard extends StatelessWidget {
  const GlassCard({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(18),
    this.margin,
    this.onTap,
    this.radius = 22,
    this.tint,
    this.gradient,
    this.diary = false,
  });

  final Widget child;
  final EdgeInsetsGeometry padding;
  final EdgeInsetsGeometry? margin;
  final VoidCallback? onTap;
  final double radius;
  final Color? tint;
  final Gradient? gradient;
  final bool diary;

  @override
  Widget build(BuildContext context) {
    final dark = Theme.of(context).brightness == Brightness.dark;
    final borderRadius = BorderRadius.circular(radius);
    return Container(
      margin: margin,
      decoration: BoxDecoration(
        borderRadius: borderRadius,
        boxShadow: [
          BoxShadow(
            color: const Color(0xff251b4e)
                .withValues(alpha: dark ? .12 : .06),
            blurRadius: 28,
            spreadRadius: -5,
            offset: const Offset(0, 12),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: borderRadius,
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 16, sigmaY: 16),
          child: Material(
            color: Colors.transparent,
            child: Ink(
              decoration: BoxDecoration(
                borderRadius: borderRadius,
                gradient: gradient ??
                    LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: dark
                          ? [
                              (tint ?? const Color(0xffe9e6ff))
                                  .withValues(alpha: diary ? .14 : .16),
                              const Color(0xffe9e6ff)
                                  .withValues(alpha: diary ? .07 : .09),
                            ]
                          : [
                              Colors.white.withValues(alpha: .76),
                              const Color(0xfff9f5ff).withValues(alpha: .52),
                            ],
                    ),
                border: Border.all(
                  color: dark
                      ? diary
                            ? AppColors.darkDiaryBorder
                            : AppColors.darkBorder
                      : Colors.white.withValues(alpha: .78),
                ),
              ),
              child: InkWell(
                onTap: onTap,
                child: Padding(padding: padding, child: child),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class PageTitle extends StatelessWidget {
  const PageTitle(this.title, {super.key, this.subtitle});

  final String title;
  final String? subtitle;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: Theme.of(context).textTheme.headlineMedium?.copyWith(
              fontWeight: FontWeight.w700,
              letterSpacing: -.5,
            ),
          ),
          if (subtitle != null) ...[
            const SizedBox(height: 7),
            Text(
              subtitle!,
              style: TextStyle(
                color: AppColors.muted(context),
                height: 1.5,
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class PrimaryAction extends StatelessWidget {
  const PrimaryAction({
    super.key,
    required this.label,
    required this.onPressed,
    this.busy = false,
  });

  final String label;
  final VoidCallback? onPressed;
  final bool busy;

  @override
  Widget build(BuildContext context) {
    final dark = Theme.of(context).brightness == Brightness.dark;
    final enabled = !busy && onPressed != null;
    return Opacity(
      opacity: enabled || busy ? 1 : .5,
      child: Container(
        width: double.infinity,
        height: 54,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(16),
          gradient: AppColors.writeGradient,
          boxShadow: [
            BoxShadow(
              color: (dark ? AppColors.writeViolet : AppColors.lightPrimary)
                  .withValues(alpha: .28),
              blurRadius: 18,
              spreadRadius: -2,
            ),
          ],
        ),
        child: Material(
          color: Colors.transparent,
          borderRadius: BorderRadius.circular(16),
          clipBehavior: Clip.antiAlias,
          child: InkWell(
            onTap: enabled ? onPressed : null,
            child: Center(
              child: busy
                  ? const SizedBox(
                      width: 22,
                      height: 22,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: Colors.white,
                      ),
                    )
                  : Text(
                      label,
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w600,
                        fontSize: 16,
                      ),
                    ),
            ),
          ),
        ),
      ),
    );
  }
}

void showError(BuildContext context, Object error, {String title = '操作失败'}) {
  final message = switch (error) {
    StateError() => error.message,
    FormatException() => error.message,
    _ => error.toString(),
  };
  showDialog<void>(
    context: context,
    builder: (context) => AlertDialog(
      title: Text(title),
      content: Text(message),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: const Text('知道了'),
        ),
      ],
    ),
  );
}
