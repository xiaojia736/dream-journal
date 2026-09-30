import 'package:flutter/material.dart';

abstract final class AppColors {
  static const darkBackground = Color(0xff10152e);
  static const darkCard = Color(0xff1d2748);
  static const darkText = Color(0xfff7f4ff);
  static const darkMuted = Color(0xffabb6d5);
  static const darkPrimary = Color(0xffbeb6ff);
  static const darkAccent = Color(0xffffd6ad);
  static const darkBorder = Color(0xff384467);
  static const darkSoft = Color(0xff27345c);

  static const lightBackground = Color(0xfff6f5ff);
  static const lightCard = Color(0xffffffff);
  static const lightText = Color(0xff252740);
  static const lightMuted = Color(0xff6d7291);
  static const lightPrimary = Color(0xff665fa6);
  static const lightAccent = Color(0xffb87752);
  static const lightBorder = Color(0xffe5e1f1);
  static const lightSoft = Color(0xffefedfa);

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
    final scheme = ColorScheme.fromSeed(
      seedColor: primary,
      brightness: brightness,
      surface: card,
    ).copyWith(primary: primary, onSurface: text, surface: card);
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
          borderRadius: BorderRadius.circular(22),
          side: BorderSide(
            color: brightness == Brightness.dark
                ? AppColors.darkBorder
                : AppColors.lightBorder,
          ),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: card,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(15),
          borderSide: BorderSide.none,
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(15),
          borderSide: BorderSide(
            color: brightness == Brightness.dark
                ? AppColors.darkBorder
                : AppColors.lightBorder,
          ),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(15),
          borderSide: BorderSide(color: primary, width: 1.5),
        ),
      ),
    );
  }
}
