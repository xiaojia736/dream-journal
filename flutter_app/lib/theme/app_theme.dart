import 'package:flutter/material.dart';

abstract final class AppColors {
  static const darkBackground = Color(0xff242440);
  static const darkCanvasMiddle = Color(0xff40365f);
  static const darkCanvasBottom = Color(0xff293958);
  static const darkCard = Color.fromRGBO(233, 230, 255, .12);
  static const darkDiaryCard = Color.fromRGBO(233, 230, 255, .10);
  static const darkText = Color(0xfffcf8ff);
  static const darkBody = Color(0xffeee9f7);
  static const darkMuted = Color(0xffbeb6d7);
  static const darkCapsuleMuted = Color(0xffc9c1df);
  static const darkSelected = Color.fromRGBO(255, 255, 255, .9);
  static const darkSelectedText = Color(0xff2d2353);
  static const darkPrimary = Color(0xffd1c2fb);
  static const darkBlue = Color(0xffb2eee9);
  static const darkAccent = Color(0xffffdeb9);
  static const darkBorder = Color.fromRGBO(255, 255, 255, .24);
  static const darkDiaryBorder = Color.fromRGBO(255, 255, 255, .22);
  static const darkSoft = Color.fromRGBO(208, 200, 241, .10);
  static const auroraCyan = Color.fromRGBO(178, 238, 233, .35);
  static const dreamyViolet = Color.fromRGBO(240, 184, 222, .35);
  static const dreamyLilac = Color.fromRGBO(191, 167, 245, .30);
  static const writeViolet = Color(0xff9b7df0);
  static const writeBlue = Color(0xff80bced);
  static const writeGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [writeViolet, writeBlue],
  );

  static const lightBackground = Color(0xfff5f0fc);
  static const lightCanvasMiddle = Color(0xffefe7f8);
  static const lightCanvasBottom = Color(0xffe9f4f5);
  static const lightCard = Color.fromRGBO(255, 255, 255, .66);
  static const lightText = Color(0xff352b53);
  static const lightMuted = Color(0xff776c94);
  static const lightPrimary = Color(0xff8b71c7);
  static const lightAccent = Color(0xff9872b6);
  static const lightBorder = Color.fromRGBO(133, 110, 175, .16);
  static const lightSoft = Color.fromRGBO(165, 148, 204, .10);

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
                ? Colors.white.withValues(alpha: .18)
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
