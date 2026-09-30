const _weekdays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

String twoDigits(int value) => value.toString().padLeft(2, '0');

String homeDate(DateTime date) =>
    '${date.year} 年 ${twoDigits(date.month)} 月 ${twoDigits(date.day)} 日 · ${_weekdays[date.weekday - 1]}';

String shortDate(DateTime date) =>
    '${date.year} 年 ${date.month} 月 ${date.day} 日';

String detailDate(DateTime date) =>
    '${shortDate(date)} · ${_weekdays[date.weekday - 1]} ${twoDigits(date.hour)}:${twoDigits(date.minute)}';

String dayKey(DateTime date) =>
    '${date.year}-${twoDigits(date.month)}-${twoDigits(date.day)}';
