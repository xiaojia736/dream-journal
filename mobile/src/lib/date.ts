const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];

export function chineseDate(date: Date) {
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
}

export function homeDate(date: Date) {
  return `${date.getMonth() + 1}月${date.getDate()}日 · ${weekdays[date.getDay()]}`;
}

export function detailDate(date: Date) {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${chineseDate(date)} · ${weekdays[date.getDay()]} · ${hours}:${minutes}`;
}
