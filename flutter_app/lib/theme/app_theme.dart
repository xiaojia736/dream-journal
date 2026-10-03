import 'package:flutter/material.dart';

abstract final class AppColors {
  static const darkBackground = Color(0xff131127);
  static const darkCanvasMiddle = Color(0xff1a1635);
  static const darkCanvasBottom = Color(0xff0f0d20);
  static const darkCard = Color.fromRGBO(255, 255, 255, .07);
  static const darkDiaryCard = Color.fromRGBO(255, 255, 255, .06);
  static const darkText = Color(0xfff8f9fe);
  static const darkBody = Color(0xffdcd9ee);
  static const darkMuted = Color(0xff8e8aa8);
  static const darkCapsuleMuted = Color(0xffa29db8);
  static const darkSelected = Color.fromRGBO(255, 255, 255, .9);
  static const darkSelectedText = Color(0xff2d2353);
  static const darkPrimary = Color(0xffad9cff);
  static const darkBlue = Color(0xff48dbfb);
  static const darkAccent = Color(0xffffe082);
  static const darkBorder = Color.fromRGBO(255, 255, 255, .15);
  static const darkDiaryBorder = Color.fromRGBO(255, 255, 255, .12);
  static const darkSoft = Color(0xff251d3e);
  static const auroraCyan = Color.fromRGBO(72, 219, 251, .22);
  static const dreamyViolet = Color.fromRGBO(217, 128, 250, .22);
  static const writeViolet = Color(0xff7c5cfc);
  static const writeBlue = Color(0xff4facfe);
  static const writeGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [writeViolet, writeBlue],
  );

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
  static Color body(BuildContext context) =>
      Theme.of(context).brightness == Brightness.dark ? darkBody : lightText;
  static Color heading(BuildContext context) =>
      Theme.of(context).brightness == Brightness.dark ? darkText : lightText;
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
          onSurface: brightness == Brightness.dark ? AppColors.darkBody : text,
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
            ? AppColors.darkCard
            : card.withValues(alpha: .82),
        isDense: true,
        hintStyle: TextStyle(
          color: brightness == Brightness.dark
              ? AppColors.darkMuted
              : AppColors.lightMuted,
        ),
        labelStyle: TextStyle(
          color: brightness == Brightness.dark
              ? AppColors.darkMuted
              : AppColors.lightMuted,
        ),
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
      ).textTheme.apply(
        bodyColor: brightness == Brightness.dark ? AppColors.darkBody : text,
        displayColor: text,
      ),
      dividerTheme: DividerThemeData(
        color: brightness == Brightness.dark
            ? Colors.white.withValues(alpha: .08)
            : AppColors.lightBorder,
        thickness: 1,
        space: 1,
      ),
      chipTheme: ChipThemeData(
        backgroundColor: brightness == Brightness.dark
            ? Colors.transparent
            : AppColors.lightSoft,
        selectedColor: brightness == Brightness.dark
            ? AppColors.darkSelected
            : AppColors.lightPrimary.withValues(alpha: .16),
        side: brightness == Brightness.dark
            ? BorderSide.none
            : const BorderSide(color: AppColors.lightBorder),
        shape: const StadiumBorder(),
        checkmarkColor: brightness == Brightness.dark
            ? AppColors.darkSelectedText
            : AppColors.lightText,
        labelStyle: WidgetStateTextStyle.resolveWith(
          (states) => TextStyle(
            color: brightness == Brightness.dark
                ? states.contains(WidgetState.selected)
                      ? AppColors.darkSelectedText
                      : AppColors.darkCapsuleMuted
                : AppColors.lightMuted,
          ),
        ),
      ),
    );
  }
}
