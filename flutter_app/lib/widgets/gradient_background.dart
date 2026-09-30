import 'dart:ui';

import 'package:flutter/material.dart';

import '../theme/app_theme.dart';

class GradientBackground extends StatelessWidget {
  const GradientBackground({super.key, required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    final dark = Theme.of(context).brightness == Brightness.dark;
    return Stack(
      fit: StackFit.expand,
      children: [
        DecoratedBox(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: dark
                  ? const [Color(0xff0d0b18), Color(0xff151226)]
                  : const [Color(0xfffaf7f2), Color(0xfff5efeb)],
            ),
          ),
        ),
        Positioned.fill(
          child: DecoratedBox(
            decoration: BoxDecoration(
              gradient: RadialGradient(
                center: dark
                    ? const Alignment(.72, -.82)
                    : const Alignment(.76, -.9),
                radius: dark ? 1.05 : .95,
                colors: dark
                    ? const [Color(0x524c3f8f), Color(0x00151226)]
                    : const [Color(0x52ffd9bd), Color(0x00faf7f2)],
              ),
            ),
          ),
        ),
        if (dark)
          const Positioned.fill(
            child: DecoratedBox(
              decoration: BoxDecoration(
                gradient: RadialGradient(
                  center: Alignment(-.9, .72),
                  radius: .9,
                  colors: [Color(0x36306978), Color(0x000d0b18)],
                ),
              ),
            ),
          ),
        IgnorePointer(child: CustomPaint(painter: _StarFieldPainter(dark))),
        child,
      ],
    );
  }
}

class _StarFieldPainter extends CustomPainter {
  const _StarFieldPainter(this.dark);

  final bool dark;

  static const _stars = <Offset>[
    Offset(.08, .09),
    Offset(.23, .17),
    Offset(.42, .08),
    Offset(.69, .12),
    Offset(.88, .06),
    Offset(.95, .27),
    Offset(.73, .34),
    Offset(.14, .38),
    Offset(.34, .48),
    Offset(.84, .55),
    Offset(.56, .66),
    Offset(.11, .72),
    Offset(.29, .83),
    Offset(.76, .88),
    Offset(.93, .76),
  ];

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = (dark ? AppColors.darkAccent : AppColors.lightAccent)
          .withValues(alpha: dark ? .3 : .09);
    for (var i = 0; i < _stars.length; i++) {
      final star = _stars[i];
      canvas.drawCircle(
        Offset(star.dx * size.width, star.dy * size.height),
        i % 4 == 0 ? 1.4 : .7,
        paint,
      );
    }
  }

  @override
  bool shouldRepaint(_StarFieldPainter oldDelegate) => oldDelegate.dark != dark;
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
  });

  final Widget child;
  final EdgeInsetsGeometry padding;
  final EdgeInsetsGeometry? margin;
  final VoidCallback? onTap;
  final double radius;
  final Color? tint;

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
              color: AppColors.darkPrimary.withValues(alpha: .1),
              blurRadius: 18,
              spreadRadius: -5,
            ),
          BoxShadow(
            color: (dark ? Colors.black : const Color(0xffb49682)).withValues(
              alpha: dark ? .2 : .08,
            ),
            blurRadius: 24,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: borderRadius,
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 12, sigmaY: 12),
          child: Material(
            color: Colors.transparent,
            child: Ink(
              decoration: BoxDecoration(
                borderRadius: borderRadius,
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: dark
                      ? [
                          (tint ?? const Color(0xff2d244a)).withValues(
                            alpha: .6,
                          ),
                          const Color(0xff16122a).withValues(alpha: .7),
                        ]
                      : [
                          Colors.white.withValues(alpha: .9),
                          const Color(0xfffffbf7).withValues(alpha: .84),
                        ],
                ),
                border: Border.all(
                  color: dark
                      ? Colors.white.withValues(alpha: .12)
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
                color: Theme.of(
                  context,
                ).textTheme.bodySmall?.color?.withValues(alpha: .72),
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
          gradient: LinearGradient(
            colors: dark
                ? const [Color(0xff7c3aed), Color(0xffa855f7)]
                : const [Color(0xffe07a5f), Color(0xffe9a66e)],
          ),
          boxShadow: [
            BoxShadow(
              color: (dark ? const Color(0xffa78bfa) : AppColors.lightPrimary)
                  .withValues(alpha: .35),
              blurRadius: 12,
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
