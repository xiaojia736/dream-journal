import 'package:flutter/material.dart';

abstract final class AppColors {
  static const darkBackground = Color(0xff0d0b18);
  static const darkCard = Color(0xff1f1a35);
  static const darkText = Color(0xfff8fafc);
  static const darkMuted = Color(0xffa5a1b8);
  static const darkPrimary = Color(0xffa78bfa);
  static const darkBlue = Color(0xff70c1b3);
  static const darkAccent = Color(0xffffe082);
  static const darkBorder = Color(0xff51456f);
  static const darkSoft = Color(0xff352c55);

  static const lightBackground = Color(0xfffaf7f2);
  static const lightCard = Color(0xffffffff);
  static const lightText = Color(0xff2d2624);
  static const lightMuted = Color(0xff8c827a);
  static const lightPrimary = Color(0xffe07a5f);
  static const lightAccent = Color(0xffe9c46a);
  static const lightBorder = Color(0xffe8ddd5);
  static const lightSoft = Color(0xfff7e7dd);

  static Color muted(BuildContext context) =>
      Theme.of(context).brightness == Brightness.dark ? darkMuted : lightMuted;
  static Color accent(BuildContext context) =>
      Theme.of(context).brightness == Brightness.dark
      ? darkAccent
      : lightAccent;
  static Color soft(BuildContext context) =>
      Theme.of(context).brightness == Brightness.dark ? darkSoft : lightSoft;
  static Color border(BuildContext context) =>
      Theme.of(context).brightness == Brightness.dark
      ? darkBorder
      : lightBorder;
}

abstract final class AppTheme {
  static ThemeData get dark => _theme(
    brightness: Brightness.dark,
    background: AppColors.darkBackground,
    card: AppColors.darkCard,
    text: AppColors.darkText,
    primary: AppColors.darkPrimary,
  );

  static ThemeData get light => _theme(
    brightness: Brightness.light,
    background: AppColors.lightBackground,
    card: AppColors.lightCard,
    text: AppColors.lightText,
    primary: AppColors.lightPrimary,
  );

  static ThemeData _theme({
    required Brightness brightness,
    required Color background,
    required Color card,
    required Color text,
    required Color primary,
  }) {
    final scheme =
        ColorScheme.fromSeed(
          seedColor: primary,
          brightness: brightness,
          surface: card,
        ).copyWith(
          primary: primary,
          secondary: brightness == Brightness.dark
              ? AppColors.darkAccent
              : AppColors.lightAccent,
          onSurface: text,
          surface: card,
        );
    return ThemeData(
      useMaterial3: true,
      brightness: brightness,
      colorScheme: scheme,
      scaffoldBackgroundColor: background,
      fontFamilyFallback: const ['PingFang SC', 'Noto Sans CJK SC'],
      appBarTheme: AppBarTheme(
        elevation: 0,
        scrolledUnderElevation: 0,
        backgroundColor: Colors.transparent,
        foregroundColor: text,
      ),
      cardTheme: CardThemeData(
        color: card,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(18),
          side: BorderSide(
            color: brightness == Brightness.dark
                ? AppColors.darkBorder
                : AppColors.lightBorder,
          ),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: brightness == Brightness.dark
            ? const Color(0xff2d244a).withValues(alpha: .5)
            : card.withValues(alpha: .82),
        isDense: true,
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 14,
          vertical: 12,
        ),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(15),
          borderSide: BorderSide.none,
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(15),
          borderSide: BorderSide(
            color: brightness == Brightness.dark
                ? Colors.white.withValues(alpha: .1)
                : AppColors.lightBorder,
          ),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(15),
          borderSide: BorderSide(color: primary, width: 1.5),
        ),
      ),
      textTheme: ThemeData(
        brightness: brightness,
      ).textTheme.apply(bodyColor: text, displayColor: text),
      dividerTheme: DividerThemeData(
        color: brightness == Brightness.dark
            ? AppColors.darkBorder.withValues(alpha: .52)
            : AppColors.lightBorder,
        thickness: 1,
        space: 1,
      ),
      chipTheme: ChipThemeData(
        backgroundColor: brightness == Brightness.dark
            ? const Color(0xff2d244a).withValues(alpha: .34)
            : AppColors.lightSoft,
        selectedColor: brightness == Brightness.dark
            ? AppColors.darkPrimary.withValues(alpha: .25)
            : AppColors.lightPrimary.withValues(alpha: .16),
        side: BorderSide(
          color: brightness == Brightness.dark
              ? Colors.white.withValues(alpha: .08)
              : AppColors.lightBorder,
        ),
        shape: const StadiumBorder(),
        labelStyle: TextStyle(
          color: brightness == Brightness.dark
              ? AppColors.darkMuted
              : AppColors.lightMuted,
        ),
      ),
    );
  }
}
