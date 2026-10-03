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
                stops: dark ? const [0, .5, 1] : null,
                colors: dark
                    ? const [
                        AppColors.darkBackground,
                        AppColors.darkCanvasMiddle,
                        AppColors.darkCanvasBottom,
                      ]
                    : const [Color(0xfffaf7f2), Color(0xfff5efeb)],
              ),
            ),
          ),
          if (dark) ...[
            Positioned(
              left: -constraints.maxWidth * .1,
              top: constraints.maxHeight * .05,
              child: IgnorePointer(
                child: ImageFiltered(
                  imageFilter: ImageFilter.blur(sigmaX: 60, sigmaY: 60),
                  child: Container(
                    width: 260,
                    height: 260,
                    decoration: const BoxDecoration(
                      shape: BoxShape.circle,
                      color: AppColors.auroraCyan,
                    ),
                  ),
                ),
              ),
            ),
            Positioned(
              right: -constraints.maxWidth * .15,
              bottom: constraints.maxHeight * .15,
              child: IgnorePointer(
                child: ImageFiltered(
                  imageFilter: ImageFilter.blur(sigmaX: 60, sigmaY: 60),
                  child: Container(
                    width: 320,
                    height: 320,
                    decoration: const BoxDecoration(
                      shape: BoxShape.circle,
                      color: AppColors.dreamyViolet,
                    ),
                  ),
                ),
              ),
            ),
          ] else
            const Positioned.fill(
              child: DecoratedBox(
                decoration: BoxDecoration(
                  gradient: RadialGradient(
                    center: Alignment(.76, -.9),
                    radius: .95,
                    colors: [Color(0x52ffd9bd), Color(0x00faf7f2)],
                  ),
                ),
              ),
            ),
          child,
        ],
      ),
    );
  }
}

class GlassCard extends StatelessWidget {
  const GlassCard({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(18),
    this.margin,
    this.onTap,
    this.radius = 18,
    this.tint,
    this.diary = false,
  });

  final Widget child;
  final EdgeInsetsGeometry padding;
  final EdgeInsetsGeometry? margin;
  final VoidCallback? onTap;
  final double radius;
  final Color? tint;
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
          if (dark)
            BoxShadow(
              color: (tint ?? AppColors.writeViolet).withValues(alpha: .04),
              blurRadius: 24,
              spreadRadius: -5,
            ),
          BoxShadow(
            color: (dark ? Colors.black : const Color(0xffb49682)).withValues(
              alpha: dark ? (diary ? .25 : .12) : .08,
            ),
            blurRadius: dark && diary ? 36 : 24,
            offset: Offset(0, dark && diary ? 16 : 10),
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
                color: dark
                    ? diary
                          ? AppColors.darkDiaryCard
                          : AppColors.darkCard
                    : null,
                gradient: dark
                    ? null
                    : LinearGradient(
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                        colors: [
                          Colors.white.withValues(alpha: .9),
                          const Color(0xfffffbf7).withValues(alpha: .84),
                        ],
                      ),
                border: Border.all(
                  color: dark
                      ? diary
                            ? AppColors.darkDiaryBorder
                            : AppColors.darkBorder
                      : const Color(0xfffffdf9),
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
          gradient: dark
              ? AppColors.writeGradient
              : const LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [Color(0xffe07a5f), Color(0xffe9a66e)],
                ),
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
