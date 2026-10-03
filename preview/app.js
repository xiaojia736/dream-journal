/* A build-free, isolated preview of flutter_app. Design tokens live in styles.css. */
(() => {
  'use strict';
  const STORAGE_KEY = 'star-sea-preview-v1';
  const BACKUP_FORMAT = 'star-sea-journal-web-preview-v1';
  const MAX_PHOTOS = 9;
  const TYPES = { moment: '生活', dream: '梦境', diary: '日记', os: '内心 OS' };
  const MOODS = { happy: ['sun', '开心'], calm: ['moon', '平静'], sad: ['droplet', '难过'], anxious: ['wind', '焦虑'], excited: ['starlight', '兴奋'], confused: ['cloud', '困惑'], scared: ['shield', '恐惧'] };
  const paths = {
    sparkle: '<path d="m12 3 2.2 6.8L21 12l-6.8 2.2L12 21l-2.2-6.8L3 12l6.8-2.2L12 3Z"/><path d="m20 2 .5 1.5L22 4l-1.5.5L20 6l-.5-1.5L18 4l1.5-.5L20 2Z"/>',
    search: '<circle cx="10.7" cy="10.7" r="6.7"/><path d="m16 16 4.5 4.5"/>',
    grid: '<rect x="3" y="3" width="7" height="7" rx="1.7"/><rect x="14" y="3" width="7" height="7" rx="1.7"/><rect x="3" y="14" width="7" height="7" rx="1.7"/><rect x="14" y="14" width="7" height="7" rx="1.7"/>',
    settings: '<path d="M4 7h5m5 0h6M4 17h11m4 0h1"/><circle cx="11.5" cy="7" r="2.5"/><circle cx="16.5" cy="17" r="2.5"/>',
    calendar: '<rect x="4" y="5" width="16" height="16" rx="3"/><path d="M8 3v4m8-4v4M4 11h16m-12 4h2m4 0h2"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    photo: '<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8" cy="8" r="1.5"/><path d="m3 16 5-5 4 4 3-3 6 6"/>',
    camera: '<path d="m8 5 1-2h6l1 2h3a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z"/><circle cx="12" cy="12" r="4"/>',
    close: '<path d="m6 6 12 12M6 18 18 6"/>',
    back: '<path d="m14 5-7 7 7 7"/>',
    forward: '<path d="m9 5 7 7-7 7"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    edit: '<path d="m16 3 5 5-12 12-6 1 1-6L16 3Zm-3 3 5 5"/>',
    phone: '<rect x="6" y="2" width="12" height="20" rx="3"/><path d="M10 18h4"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/>',
    moon: '<path d="M20.5 14A9 9 0 0 1 10 3.5 9 9 0 1 0 20.5 14Z"/>',
    lock: '<rect x="5" y="10" width="14" height="11" rx="2.5"/><path d="M8 10V7a4 4 0 0 1 8 0v3m-4 4v3"/>',
    download: '<path d="M12 3v12m-4-4 4 4 4-4M4 15v5h16v-5"/>',
    upload: '<path d="M12 16V4m-4 4 4-4 4 4M4 15v5h16v-5"/>',
    flame: '<path d="M13 3s1 4-3 7c0-3-2-4-2-4s-5 5-4 10a8 8 0 0 0 16 0c0-5-3-9-3-9s0 4-3 5c2-4-1-9-1-9Z"/>',
    book: '<path d="M4 3h14a2 2 0 0 1 2 2v16H5a3 3 0 0 1-3-3V6a3 3 0 0 1 2-3Zm-2 15c0-2 2-3 4-3h14M8 7h8"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
    droplet: '<path d="M12 3c-2 4-6.5 7.5-6.5 11.5a6.5 6.5 0 0 0 13 0C18.5 10.5 14 7 12 3Z"/><path d="M8.5 14.5a3.5 3.5 0 0 0 3.5 3.5"/>',
    wind: '<path d="M3 7h11a2.5 2.5 0 1 0-2.5-2.5M3 12h15a3 3 0 1 1-3 3M3 17h6a2 2 0 1 1-2 2"/>',
    starlight: '<path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3Z"/>',
    cloud: '<path d="M7 18h10a4 4 0 0 0 .6-8 5.5 5.5 0 0 0-10.4-2A5 5 0 0 0 7 18Z"/>',
    shield: '<path d="m12 3 8 3v6c0 4-4.5 7.5-8 9-3.5-1.5-8-5-8-9V6l8-3Z"/><path d="M12 8v5m0 3v.1"/>',
    heart: '<path d="M12 20S3 14.5 3 8.7A4.7 4.7 0 0 1 12 7a4.7 4.7 0 0 1 9 1.7C21 14.5 12 20 12 20Z"/>',
    shuffle: '<path d="M3 6h3c5 0 6 12 11 12h4m-4-4 4 4-4 4M3 18h3c2.4 0 3.8-2.8 5-6m2-3c1.2-2 2.5-3 4-3h4m-4-4 4 4-4 4"/>',
    backup: '<path d="M7 19H6a4 4 0 0 1-.5-8A6.5 6.5 0 0 1 18 9a5 5 0 0 1 0 10h-1M12 21V12m-3 3 3-3 3 3"/>',
  };
  const icon = name => `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">${paths[name] || paths.sparkle}</svg>`;
  const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const customMood = entry => typeof entry.customMood === 'string' ? entry.customMood.trim() : '';
  const moodInfo = entry => customMood(entry) ? { key: `custom:${customMood(entry)}`, symbol: 'heart', label: customMood(entry), tone: 'custom' } : MOODS[entry.mood] ? { key: entry.mood, symbol: MOODS[entry.mood][0], label: MOODS[entry.mood][1], tone: entry.mood } : null;
  const moodSymbol = (symbol, tone) => `<span class="mood-symbol mood-${tone}">${icon(symbol)}</span>`;
  const moodBadge = mood => mood ? `<span class="mood-badge">${moodSymbol(mood.symbol, mood.tone)}<span>${escape(mood.label)}</span></span>` : '';
  const byId = id => document.getElementById(id);
  const localDate = date => [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
  const localTime = date => `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  const shortDate = value => { const date = new Date(value); return `${date.getMonth() + 1}月${date.getDate()}日`; };
  const headingDate = () => new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' }).format(new Date());
  const detailDate = value => new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long', hour: '2-digit', minute: '2-digit' }).format(new Date(value));

  // Calendar dates use local civil days, never UTC parsing of YYYY-MM-DD.
  const calendarDate = key => { const [year, month, day] = key.split('-').map(Number); return new Date(year, month - 1, day, 12); };
  const calendarMonthLength = (year, month) => new Date(year, month, 0, 12).getDate();
  function calendarShift(monthKey, dayKey, delta) {
    const [year, month] = monthKey.split('-').map(Number);
    const index = year * 12 + month - 1 + delta;
    if (index < 1900 * 12 || index > 2100 * 12 + 11) return { month: monthKey, day: dayKey };
    const nextYear = Math.floor(index / 12); const nextMonth = index % 12 + 1;
    const day = Math.min(Number(dayKey.split('-')[2]), calendarMonthLength(nextYear, nextMonth));
    const nextDay = localDate(new Date(nextYear, nextMonth - 1, day, 12));
    return { month: nextDay.slice(0, 7), day: nextDay };
  }
  function calendarCells(monthKey) {
    const [year, month] = monthKey.split('-').map(Number);
    const offset = (new Date(year, month - 1, 1, 12).getDay() + 6) % 7;
    const count = calendarMonthLength(year, month);
    return Array.from({ length: Math.ceil((offset + count) / 7) * 7 }, (_, index) => index < offset || index >= offset + count ? null : `${monthKey}-${String(index - offset + 1).padStart(2, '0')}`);
  }
  function calendarBuckets(list) {
    const days = new Map();
    const timestamp = value => { const time = new Date(value ?? '').getTime(); return Number.isFinite(time) ? time : 0; };
    const compare = (a, b) => {
      const timeOrder = timestamp(b.occurredAt) - timestamp(a.occurredAt) || timestamp(b.updatedAt) - timestamp(a.updatedAt);
      if (timeOrder) return timeOrder;
      const firstId = String(a.id ?? ''); const secondId = String(b.id ?? '');
      return firstId < secondId ? -1 : firstId > secondId ? 1 : 0;
    };
    for (const entry of list.slice().sort(compare)) {
      const date = new Date(entry.occurredAt); if (Number.isNaN(date.getTime())) continue;
      const day = localDate(date); if (!days.has(day)) days.set(day, []); days.get(day).push(entry);
    }
    return days;
  }
  function calendarMoods(list) {
    const seen = new Set(); const moods = [];
    for (const entry of list) { const mood = moodInfo(entry); if (mood && !seen.has(mood.key)) { seen.add(mood.key); moods.push(mood); } }
    return moods;
  }

  // Small illustrations are sample photo content, never page wallpapers.
  const samplePhoto = (background, shapes) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="500" height="400" viewBox="0 0 500 400"><rect width="500" height="400" fill="${background}"/>${shapes}</svg>`)}`;
  const illustrations = [
    samplePhoto('#CAC5B0', '<rect x="280" y="0" width="220" height="290" fill="#E0D9BE"/><path d="M280 90h220M280 180h220M370 0v290" fill="none" stroke="#B5AD92" stroke-width="8"/><path d="M0 310 500 265v135H0" fill="#9F8061"/><ellipse cx="165" cy="315" rx="93" ry="17" fill="#6F5948" opacity=".3"/><path d="M130 290c-10-38-5-90 33-106s68 14 67 80l-15 44Z" fill="#718267"/><path d="m143 277 37-53 30 58" fill="none" stroke="#9BA78B" stroke-width="2"/><rect x="66" y="308" width="154" height="27" rx="4" fill="#DDD0AE" transform="rotate(-8 66 308)"/><rect x="74" y="290" width="140" height="22" rx="3" fill="#6E7B78" transform="rotate(-8 74 290)"/><ellipse cx="339" cy="308" rx="48" ry="13" fill="#E2D8BB"/><path d="M303 251h64v39c0 33-64 33-64 0Z" fill="#E7DABE"/><ellipse cx="335" cy="250" rx="32" ry="8" fill="#72543D"/><path d="M367 262c38-4 36 33-2 34" fill="none" stroke="#E7DABE" stroke-width="10"/>'),
    samplePhoto('#B5B7A5', '<rect x="0" y="0" width="210" height="400" fill="#CFCCB8"/><path d="M0 306 500 288v112H0" fill="#A18C72"/><path d="M286 262c-65-85-57-161-30-179m30 179c40-79 83-96 111-83m-111 83c-32-60-82-76-110-61" fill="none" stroke="#66705A" stroke-width="7"/><ellipse cx="255" cy="104" rx="27" ry="42" fill="#78876E" transform="rotate(-35 255 104)"/><ellipse cx="326" cy="166" rx="25" ry="42" fill="#8E9B7C" transform="rotate(30 326 166)"/><ellipse cx="201" cy="204" rx="24" ry="45" fill="#697A65" transform="rotate(-55 201 204)"/><path d="M253 252h66l16 70c0 29-98 29-98 0Z" fill="#E3DACC"/><ellipse cx="286" cy="252" rx="33" ry="8" fill="#ABA18E"/><rect x="73" y="297" width="83" height="27" rx="2" fill="#C5B592"/><rect x="85" y="277" width="82" height="23" rx="2" fill="#73827F"/>'),
    samplePhoto('#D5B7AB', '<rect x="0" y="0" width="230" height="400" fill="#C5ADA0"/><path d="M0 345 500 288v112H0" fill="#A18772"/><path d="M312 290c-24-81-40-146-95-169m99 169c29-91 61-135 105-140m-107 140c-8-68 3-118 37-148" fill="none" stroke="#697E68" stroke-width="5"/><g fill="#EBDFCB"><circle cx="218" cy="111" r="29"/><circle cx="189" cy="120" r="21"/><circle cx="226" cy="138" r="20"/></g><g fill="#E8C2AA"><circle cx="422" cy="140" r="28"/><circle cx="393" cy="150" r="23"/><circle cx="430" cy="165" r="19"/></g><g fill="#E6DED0"><circle cx="350" cy="135" r="27"/><circle cx="330" cy="151" r="21"/></g><path d="M287 273h62l10 65c0 25-83 25-83 0Z" fill="#D5C8B2"/><ellipse cx="318" cy="273" rx="31" ry="7" fill="#9F927D"/>'),
  ];
  const makeDemo = () => {
    const stamp = (days, hour) => { const date = new Date(); date.setDate(date.getDate() - days); date.setHours(hour, 30, 0, 0); return date.toISOString(); };
    return [
      { id: 'demo-1', type: 'moment', mood: 'calm', occurredAt: stamp(0, 16), text: '周末的慢时光\n在喜欢的小店坐了一下午。阳光落在书页上，咖啡慢慢变凉，好像时间也愿意等等我。', tags: ['日常', '小确幸'], photos: illustrations },
      { id: 'demo-2', type: 'dream', mood: 'happy', occurredAt: stamp(1, 7), text: '梦里有一片会发光的海\n踩着柔软的沙滩，浪花变成一颗颗漂浮的星星。远处有人叫我的名字，醒来时还记得那份温柔。', tags: ['梦境', '海'], photos: [] },
      { id: 'demo-3', type: 'os', mood: 'calm', occurredAt: stamp(2, 22), text: '允许自己，慢一点\n不必每一天都闪闪发光。认真吃饭，好好睡觉，也是在向前走。', tags: ['自我对话'], photos: [] },
      { id: 'demo-4', type: 'diary', mood: 'excited', occurredAt: stamp(3, 20), text: '久别重逢的晚餐\n和老朋友聊到很晚，很多话不用解释就能被懂得。这种熟悉的感觉真好。', tags: ['朋友'], photos: [] },
    ];
  };
  let personal = [];
  try { const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); if (Array.isArray(stored)) personal = stored.map(entry => ({ ...entry, customMood: customMood(entry) })); } catch (_) { /* Private modes may disable browser storage. */ }
  const quoteForDate = date => window.StarSeaDailyQuotes?.forDate(date) || '每一个认真生活的日子，都值得被温柔收藏。';
  const state = { mode: 'demo', tab: 'home', view: 'main', filter: '', search: '', dark: true, detailId: null, detailOrigin: 'main', photoIndex: 0, draft: null, photoLoading: false, demo: makeDemo(), pinEnabled: false, reviewDate: null, reviewOrigin: 'random', lastReviewDate: null, reviewScroll: 0, galleryItems: null, galleryVersion: -1, galleryScroll: 0, dataVersion: 0, calendarMonth: localDate(new Date()).slice(0, 7), calendarDay: localDate(new Date()), calendarScroll: 0, quoteDay: localDate(new Date()), dailyQuote: quoteForDate(new Date()) };
  const entries = () => (state.mode === 'demo' ? state.demo : state.mode === 'empty' ? [] : personal).slice().sort((a, b) => new Date(b.occurredAt) - new Date(a.occurredAt));
  const findEntry = id => entries().find(entry => entry.id === id);
  let toastTimer;
  function toast(message) { byId('toast').textContent = message; byId('toast').classList.add('visible'); clearTimeout(toastTimer); toastTimer = setTimeout(() => byId('toast').classList.remove('visible'), 3000); }
  function persist(next) { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); personal = next; state.dataVersion++; return true; } catch (_) { toast('浏览器空间不足，请减少照片或先导出试用备份。'); return false; } }
  function modeControls() {
    document.querySelectorAll('[data-mode]').forEach(button => button.classList.toggle('selected', button.dataset.mode === state.mode));
    byId('mode-note').textContent = state.mode === 'demo' ? '示例记录仅供查看设计，不会加入你的试用记录。' : state.mode === 'empty' ? '空白界面预览。写下第一条记录后，将进入我的试用。' : '你添加的试用记录保存在当前浏览器，与示例及手机数据独立。';
  }
  function render({ keepScroll = false } = {}) {
    refreshDailyQuote();
    const scroll = byId('app-content').scrollTop;
    modeControls();
    byId('phone-canvas').classList.toggle('light', !state.dark);
    byId('app-content').classList.toggle('full-height', state.view !== 'main');
    byId('app-content').classList.toggle('editor-content', state.view === 'editor');
    byId('editor-action').innerHTML = state.view === 'editor' ? `<div class="editor-footer"><button type="button" class="primary-button" data-action="save" ${state.photoLoading ? 'disabled' : ''}>${icon('check')} ${state.photoLoading ? '正在读取照片…' : '保存记录'}</button></div>` : '';
    byId('bottom-nav').hidden = state.view !== 'main';
    byId('bottom-nav').style.display = state.view === 'main' ? '' : 'none';
    byId('bottom-nav').innerHTML = [['home', 'sparkle', '记录'], ['stats', 'grid', '我的星海'], ['settings', 'moon', '片刻']].map(([tab, symbol, label]) => `<button type="button" data-action="tab" data-tab="${tab}" class="${state.tab === tab ? 'active' : ''}" aria-current="${state.tab === tab ? 'page' : 'false'}">${icon(symbol)}<span>${label}</span></button>`).join('');
    byId('floating-action').innerHTML = state.view === 'main' && state.tab === 'home' ? `<button type="button" class="write-fab" data-action="compose" aria-label="记录此刻">${icon(state.dark ? 'sparkle' : 'edit')}</button>` : '';
    byId('app-content').innerHTML = state.view === 'editor' ? editorView() : state.view === 'detail' ? detailView() : state.view === 'review' ? reviewView() : state.tab === 'stats' ? statsView() : state.tab === 'settings' ? settingsView() : homeView();
    byId('app-content').scrollTop = keepScroll ? scroll : 0;
  }
  function homeView() {
    return `<section class="page home-page"><header><p class="date-eyebrow" id="home-date">${headingDate()}</p><div class="title-row"><h1>星海日记</h1><button type="button" class="sparkle-button" data-action="review" aria-label="随机回顾" title="随机回顾">${icon('sparkle')}</button></div><p class="subtitle">佳佳，收藏生活中每一颗<em>微光</em></p></header><label class="search">${icon('search')}<input id="search-field" type="search" value="${escape(state.search)}" placeholder="搜索文字、标签或日期" aria-label="搜索记录"><button type="button" data-action="clear-search" aria-label="清除搜索">${state.search ? icon('close') : ''}</button></label><div class="filter-row" aria-label="记录类型筛选">${[['', '全部'], ...Object.entries(TYPES)].map(([type, label]) => `<button type="button" class="chip ${state.filter === type ? 'selected' : ''}" data-action="filter" data-type="${type}" aria-pressed="${state.filter === type}">${label}</button>`).join('')}</div><div id="record-results">${recordResults()}</div></section>`;
  }
  function recordResults() {
    const query = state.search.trim().toLowerCase();
    const filtered = entries().filter(entry => (!state.filter || entry.type === state.filter) && `${entry.text} ${entry.tags.join(' ')} ${moodInfo(entry)?.label || ''} ${TYPES[entry.type]} ${shortDate(entry.occurredAt)} ${localDate(new Date(entry.occurredAt))}`.toLowerCase().includes(query));
    if (!filtered.length) return `<div class="empty-state"><div class="empty-symbol">${icon('book')}</div><h2>${entries().length ? '没有找到这段记忆' : '让第一颗微光，留在这里'}</h2><p>${entries().length ? '换个关键词，或看看其他类型的记录。' : '一张照片，一点心情，一个未醒的梦。<br>每一个平凡的此刻，都值得被收藏。'}</p><button type="button" class="${entries().length ? 'text-button' : 'primary-button'}" data-action="${entries().length ? 'reset-filter' : 'compose'}">${entries().length ? '查看全部记录' : `${icon('edit')} 写下第一条记录`}</button></div>`;
    return `<div class="section-heading"><h2>${state.filter ? TYPES[state.filter] : '我的记录'}</h2><span>${filtered.length} 条记录</span></div>${filtered.map(entry => entryCard(entry)).join('')}`;
  }
  function entryCard(entry, { fullContent = false } = {}) {
    const text = entry.text.trim().replace(/\r\n?/g, '\n');
    const separator = text.indexOf('\n');
    const title = (separator < 0 ? text : text.slice(0, separator)) || (entry.photos.length ? '照片记录' : '一段生活记录');
    const body = separator < 0 ? '' : text.slice(separator + 1);
    const photos = fullContent ? entry.photos : entry.photos.slice(0, 3);
    return `<button type="button" class="entry-card glass${fullContent ? ' entry-card-full' : ''}" data-action="detail" data-id="${escape(entry.id)}">
      <div class="card-meta"><span class="date-badge">${icon('calendar')} ${shortDate(entry.occurredAt)}</span><span class="type-badge" data-type="${escape(entry.type)}">${TYPES[entry.type]}</span></div>
      <h3 class="entry-title">${escape(title)}</h3>
      ${body ? `<p class="entry-summary">${escape(fullContent ? body : body.split(/\n+/).join(' '))}</p>` : ''}
      ${photos.length ? `<div class="${fullContent ? 'recall-photos' : 'photo-strip'}">${photos.map((photo, index) => `<img src="${escape(photo)}" alt="记录照片 ${index + 1}" loading="lazy">`).join('')}</div>` : ''}
    </button>`;
  }
  function resetReview() {
    state.reviewDate = null; state.lastReviewDate = null; state.reviewScroll = 0; state.reviewOrigin = 'random'; state.detailOrigin = 'main';
  }
  function openRandomReview() {
    const today = localDate(new Date());
    // Sample calendar days uniformly; a day with many entries gets one place in the pool.
    const days = [...new Set(entries().map(entry => new Date(entry.occurredAt)).filter(date => !Number.isNaN(date.getTime())).map(localDate).filter(day => day < today))].sort();
    if (!days.length) {
      modal('等待一段值得回望的时光', '过去的记录会在这里与你重逢。先收藏今天的微光，明天就能回来看它。', '<button class="confirm" data-action="close-modal">知道了</button>');
      return;
    }
    const candidates = days.length > 1 ? days.filter(day => day !== state.lastReviewDate) : days;
    state.reviewDate = candidates[Math.floor(Math.random() * candidates.length)];
    state.lastReviewDate = state.reviewDate; state.reviewScroll = 0; state.reviewOrigin = 'random'; state.view = 'review'; state.detailOrigin = 'main';
    render();
  }
  function reviewView() {
    const day = state.reviewDate;
    const list = entries().filter(entry => localDate(new Date(entry.occurredAt)) === day).sort((a, b) => new Date(a.occurredAt) - new Date(b.occurredAt));
    return `<div class="review-return"><button type="button" class="icon-button" data-action="back" aria-label="${state.reviewOrigin === 'calendar' ? '返回片刻' : '返回记录'}">${icon('back')}</button></div><section class="page review-page">${list.length ? list.map(entry => entryCard(entry, { fullContent: true })).join('') : '<p class="calendar-empty-review">这一天，还留着一页空白。</p>'}</section>`;
  }
  function refreshDailyQuote(force = false) {
    const now = new Date(); const day = localDate(now);
    if (force || day !== state.quoteDay) {
      const previousDay = state.quoteDay;
      if (day !== previousDay && state.calendarDay === previousDay) {
        state.calendarDay = day; state.calendarMonth = day.slice(0, 7);
      }
      state.quoteDay = day; state.dailyQuote = quoteForDate(now);
      if (byId('daily-quote')) byId('daily-quote').textContent = state.dailyQuote;
      if (byId('home-date')) byId('home-date').textContent = headingDate();
      if (byId('mood-calendar')) byId('mood-calendar').innerHTML = calendarView();
    }
  }
  function scheduleDailyRefresh() {
    const midnight = new Date(); midnight.setHours(24, 0, 0, 0);
    setTimeout(() => { refreshDailyQuote(); scheduleDailyRefresh(); }, Math.max(1000, midnight.getTime() - Date.now() + 50));
  }
  function resetGallery() {
    state.galleryItems = null; state.galleryVersion = -1; state.galleryScroll = 0;
  }
  function restoreDetailScroll() {
    if (state.view === 'review') byId('app-content').scrollTop = state.reviewScroll;
    else if (state.view === 'main' && state.tab === 'stats' && state.detailOrigin === 'gallery') byId('app-content').scrollTop = state.galleryScroll;
    else if (state.view === 'main' && state.tab === 'settings' && state.reviewOrigin === 'calendar') byId('app-content').scrollTop = state.calendarScroll;
  }
  function galleryPool() {
    return entries().flatMap(entry => {
      const copies = new Map();
      return entry.photos.map((photo, photoIndex) => {
        const photoOrdinal = copies.get(photo) || 0; copies.set(photo, photoOrdinal + 1);
        return { photo, photoIndex, photoOrdinal, entryId: entry.id, occurredAt: entry.occurredAt };
      });
    });
  }
  function shuffleGallery() {
    const previousHero = state.galleryItems?.[0];
    const pool = galleryPool();
    for (let index = pool.length - 1; index > 0; index--) {
      const other = Math.floor(Math.random() * (index + 1));
      [pool[index], pool[other]] = [pool[other], pool[index]];
    }
    if (pool.length > 1 && previousHero && pool[0].entryId === previousHero.entryId && pool[0].photo === previousHero.photo && pool[0].photoOrdinal === previousHero.photoOrdinal) {
      const other = 1 + Math.floor(Math.random() * (pool.length - 1));
      [pool[0], pool[other]] = [pool[other], pool[0]];
    }
    state.galleryItems = pool; state.galleryVersion = state.dataVersion;
  }
  function syncGallery() {
    const pool = galleryPool(); const byEntry = new Map();
    for (const item of pool) {
      if (!byEntry.has(item.entryId)) byEntry.set(item.entryId, new Map());
      const byPhoto = byEntry.get(item.entryId);
      if (!byPhoto.has(item.photo)) byPhoto.set(item.photo, []);
      byPhoto.get(item.photo).push(item);
    }
    const used = new Set(); const ordered = [];
    for (const previous of state.galleryItems || []) {
      const current = byEntry.get(previous.entryId)?.get(previous.photo)?.[previous.photoOrdinal];
      if (current) { ordered.push(current); used.add(current); }
    }
    state.galleryItems = [...ordered, ...pool.filter(item => !used.has(item))];
    state.galleryVersion = state.dataVersion;
  }
  function galleryTile(item, hero = false) {
    return `<button type="button" class="gallery-photo${hero ? ' gallery-hero' : ''}" data-action="gallery-detail" data-id="${escape(item.entryId)}" data-index="${item.photoIndex}" aria-label="${escape(shortDate(item.occurredAt))}的记录照片 ${item.photoIndex + 1}"><img src="${escape(item.photo)}" alt="记录照片" loading="${hero ? 'eager' : 'lazy'}"><span class="gallery-date">${shortDate(item.occurredAt)}</span></button>`;
  }
  function statsView() {
    if (state.galleryItems === null) shuffleGallery();
    else if (state.galleryVersion !== state.dataVersion) syncGallery();
    const [hero, ...remaining] = state.galleryItems;
    return `<section class="page gallery-page"><header class="gallery-header"><div class="page-title"><h1>我的星海</h1><p>让照片，替你拾起那些微光</p></div><button type="button" class="icon-button gallery-shuffle" data-action="shuffle-gallery" aria-label="换一组照片" title="换一组照片">${icon('shuffle')}</button></header>${hero ? `<div class="photo-wall">${galleryTile(hero, true)}${remaining.length ? `<div class="gallery-grid">${remaining.map(item => galleryTile(item)).join('')}</div>` : ''}</div>` : `<div class="gallery-empty">${icon('photo')}<h2>这里，等待你的第一张照片</h2><p>把喜欢的瞬间放进记录里，<br>让照片替你珍藏生活的微光。</p></div>`}</section>`;
  }
  function settingsView() {
    const tool = (symbol, label, action) => `<button type="button" class="icon-button settings-tool" data-action="${action}" aria-label="${label}" title="${label}">${icon(symbol)}</button>`;
    return `<section class="page settings-page"><div class="settings-tools" aria-label="片刻工具">${tool(state.dark ? 'sun' : 'moon', state.dark ? '切换浅色外观' : '切换深色外观', 'theme')}${tool('lock', '隐私锁', 'pin')}${tool('backup', '备份', 'backup')}</div><div class="glass daily-quote-card"><div class="quote-constellation" aria-hidden="true"><span class="quote-moon">${icon('moon')}</span><span class="quote-star quote-star-one">${icon('starlight')}</span><span class="quote-star quote-star-two">${icon('starlight')}</span></div><p id="daily-quote">${escape(state.dailyQuote)}</p></div><div id="mood-calendar">${calendarView()}</div></section>`;
  }
  function resetCalendar() {
    state.calendarDay = localDate(new Date()); state.calendarMonth = state.calendarDay.slice(0, 7); state.calendarScroll = 0;
  }
  function calendarView() {
    const buckets = calendarBuckets(entries()); const today = localDate(new Date());
    const [year, month] = state.calendarMonth.split('-').map(Number);
    const selected = buckets.get(state.calendarDay) || []; const moods = calendarMoods(selected);
    const cells = calendarCells(state.calendarMonth).map(day => {
      if (!day) return '<span class="calendar-spacer" aria-hidden="true"></span>';
      const list = buckets.get(day) || []; const mood = calendarMoods(list)[0];
      const label = `${year}年${month}月${Number(day.slice(-2))}日${day === today ? '，今天' : ''}${list.length ? '，有记录' : ''}${mood ? `，${mood.label}` : ''}`;
      return `<button type="button" class="calendar-cell${day === today ? ' today' : ''}${day === state.calendarDay ? ' selected' : ''}" data-action="calendar-day" data-day="${day}" aria-pressed="${day === state.calendarDay}" aria-label="${escape(label)}"><span class="calendar-number">${Number(day.slice(-2))}</span><span class="calendar-indicator">${mood ? moodSymbol(mood.symbol, mood.tone) : list.length ? '<i class="calendar-record-dot"></i>' : ''}</span></button>`;
    }).join('');
    return `<section class="glass mood-calendar" aria-label="心情月历"><header class="calendar-header"><button type="button" class="icon-button calendar-month-button" data-action="calendar-prev" aria-label="上一个月" ${state.calendarMonth === '1900-01' ? 'disabled' : ''}>${icon('back')}</button><h2>${year}年${month}月</h2><button type="button" class="icon-button calendar-month-button" data-action="calendar-next" aria-label="下一个月" ${state.calendarMonth === '2100-12' ? 'disabled' : ''}>${icon('forward')}</button></header><div class="calendar-weekdays" aria-hidden="true">${['一', '二', '三', '四', '五', '六', '日'].map(day => `<span>${day}</span>`).join('')}</div><div class="calendar-days">${cells}</div><div class="calendar-selection"><p class="calendar-day-label">${shortDate(calendarDate(state.calendarDay))}</p>${moods.length ? `<div class="calendar-moods">${moods.map(moodBadge).join('')}</div>` : `<p class="calendar-note">${selected.length ? '这一天的片刻，已经悄悄留下。' : '这一天，还留着一页空白。'}</p>`}${selected.length ? `<button type="button" class="calendar-review-button" data-action="calendar-review">查看当天记录 ${icon('forward')}</button>` : ''}</div></section>`;
  }
  function changeCalendarMonth(delta) {
    const next = calendarShift(state.calendarMonth, state.calendarDay, delta);
    state.calendarMonth = next.month; state.calendarDay = next.day; render({ keepScroll: true });
  }
  function openCalendarReview() {
    if (!(calendarBuckets(entries()).get(state.calendarDay) || []).length) return;
    state.calendarScroll = byId('app-content').scrollTop; state.reviewDate = state.calendarDay;
    state.reviewOrigin = 'calendar'; state.reviewScroll = 0; state.detailOrigin = 'main'; state.view = 'review'; render();
  }
  function backupSheet() {
    byId('modal-root').innerHTML = `<div class="modal-backdrop backup-backdrop"><section class="backup-sheet" role="dialog" aria-modal="true" aria-label="预览备份"><div class="backup-sheet-header"><h2>预览备份</h2><button type="button" class="icon-button" data-action="close-modal" aria-label="关闭备份操作">${icon('close')}</button></div><button type="button" class="backup-option" data-action="import"><span class="backup-icon">${icon('download')}</span><span><strong>导入预览备份</strong><small>恢复当前浏览器中的试用记录</small></span>${icon('forward')}</button><button type="button" class="backup-option" data-action="export"><span class="backup-icon">${icon('upload')}</span><span><strong>导出预览备份</strong><small>包含文字、心情、标签和照片</small></span>${icon('forward')}</button><p class="backup-note">网页预览备份与手机版备份独立。</p></section></div>`;
    byId('modal-root').querySelector('button')?.focus({ preventScroll: true });
  }
  function viewHeader(title, action = 'back') { return `<header class="view-header"><button type="button" class="icon-button" data-action="${action}" aria-label="返回">${icon('back')}</button><h1>${title}</h1></header>`; }
  function beginEditor(id) {
    const entry = id ? findEntry(id) : null; const date = entry ? new Date(entry.occurredAt) : new Date();
    if (!entry) state.detailOrigin = 'main';
    state.draft = { id: entry?.id || null, source: state.mode, type: entry?.type || 'moment', mood: entry?.mood || '', customMood: entry ? customMood(entry) : '', customActive: !!(entry && customMood(entry)), date: localDate(date), time: localTime(date), text: entry?.text || '', tags: entry?.tags.join('，') || '', photos: entry ? [...entry.photos] : [] };
    state.view = 'editor'; render();
  }
  function editorView() {
    const draft = state.draft;
    return `${viewHeader(draft.id ? '编辑记录' : '记录此刻')}<section class="page editor-page"><p class="editor-intro">${draft.id ? '把这段记忆补充得更完整' : '生活、梦境和心情，都值得留在星海里'}</p><div class="field-group"><p class="field-label">记录类型</p><div class="editor-types">${Object.entries(TYPES).map(([type, label]) => `<button type="button" class="chip ${type === draft.type ? 'selected' : ''}" data-action="draft-type" data-type="${type}">${label}</button>`).join('')}</div></div><div class="field-group"><p class="field-label">发生时间</p><div class="date-fields"><label class="date-field">${icon('calendar')}<input type="date" value="${draft.date}" data-field="date" aria-label="发生日期" min="1900-01-01" max="2100-12-31"></label><label class="date-field time">${icon('clock')}<input type="time" value="${draft.time}" data-field="time" aria-label="发生时间"></label></div></div><div class="field-group"><label class="field-label" for="entry-text">想记下什么？</label><textarea id="entry-text" class="text-field" data-field="text" maxlength="50000" placeholder="今天发生了什么？\n写下地点、人物和心情……">${escape(draft.text)}</textarea><p class="char-counter" id="char-counter">${draft.text.length} 字</p></div><div class="field-group"><p class="field-label">情绪 <small>可选</small></p><div class="mood-options">${Object.entries(MOODS).map(([key, [symbol, label]]) => `<button type="button" class="mood-chip ${!draft.customActive && draft.mood === key ? 'selected' : ''}" data-action="draft-mood" data-mood="${key}" aria-pressed="${!draft.customActive && draft.mood === key}">${moodSymbol(symbol, key)}<span>${label}</span></button>`).join('')}<button type="button" class="mood-chip ${draft.customActive ? 'selected' : ''}" data-action="draft-custom" aria-pressed="${draft.customActive}">${moodSymbol('heart', 'custom')}<span>自定义</span></button></div>${draft.customActive ? `<div class="custom-mood-box"><label class="field-label" for="custom-mood-field">此刻的心情，只由你定义</label><input id="custom-mood-field" class="text-field" data-field="customMood" maxlength="20" value="${escape(draft.customMood)}" placeholder="例如：松弛、想念、被治愈"><p class="custom-mood-count">最多 20 个字</p></div>` : ''}</div><div class="field-group"><label class="field-label" for="entry-tags">标签 <small>可选</small></label><input id="entry-tags" class="text-field" data-field="tags" value="${escape(draft.tags)}" maxlength="500" placeholder="用逗号或空格分隔，如：旅行，家人"></div><div class="field-group"><p class="field-label">照片 <small>最多 ${MAX_PHOTOS} 张 · ${draft.photos.length}/${MAX_PHOTOS}</small></p><div class="photo-editor">${draft.photos.map((photo, index) => `<div class="editor-photo"><img src="${escape(photo)}" alt="已选照片 ${index + 1}"><button type="button" data-action="remove-photo" data-index="${index}" aria-label="移除照片 ${index + 1}" ${state.photoLoading ? 'disabled' : ''}>${icon('close')}</button></div>`).join('')}${draft.photos.length < MAX_PHOTOS ? `<button type="button" class="add-photo-tile" data-action="gallery" ${state.photoLoading ? 'disabled' : ''}>${icon('plus')}<span>添加照片</span></button>` : ''}</div><div class="photo-actions"><button type="button" class="secondary-button" data-action="gallery" ${state.photoLoading || draft.photos.length >= MAX_PHOTOS ? 'disabled' : ''}>${icon('photo')} 相册</button><button type="button" class="secondary-button" data-action="camera" ${state.photoLoading || draft.photos.length >= MAX_PHOTOS ? 'disabled' : ''}>${icon('camera')} 拍照</button></div><p class="photo-tip">可以只留一张照片，也可以写下长长的故事。</p></div></section>`;
  }
  function detailView() {
    const entry = findEntry(state.detailId); if (!entry) { state.view = 'main'; return homeView(); }
    const [title, ...body] = entry.text.trim().split(/\n+/); const mood = moodInfo(entry);
    return `${viewHeader('记录详情')}<section class="page detail-page"><p class="detail-date">${detailDate(entry.occurredAt)}</p><div class="detail-badges"><span class="type-badge" data-type="${entry.type}">${TYPES[entry.type]}</span>${moodBadge(mood)}</div>${entry.photos.length ? `<div class="detail-gallery"><button type="button" class="photo-open" data-action="zoom"><img class="detail-photo" src="${escape(entry.photos[state.photoIndex])}" alt="记录照片 ${state.photoIndex + 1}"><span class="photo-counter">${state.photoIndex + 1} / ${entry.photos.length} · 点击放大</span></button>${entry.photos.length > 1 ? `<div class="gallery-thumbs">${entry.photos.map((photo, index) => `<button class="${state.photoIndex === index ? 'active' : ''}" data-action="photo-index" data-index="${index}" aria-label="查看照片 ${index + 1}"><img src="${escape(photo)}" alt=""></button>`).join('')}</div>` : ''}</div>` : ''}<div class="glass detail-text"><h2>${escape(title || '照片记录')}</h2>${escape(body.join('\n\n'))}</div>${entry.tags.length ? `<div class="detail-tags">${entry.tags.map(tag => `<span class="tag"># ${escape(tag)}</span>`).join('')}</div>` : ''}<button class="primary-button detail-edit" data-action="edit">${icon('edit')} 编辑这段记录</button><button class="delete-button" data-action="delete">删除记录</button></section>`;
  }
  function saveDraft() {
    const draft = state.draft;
    if (!draft) return;
    if (state.photoLoading) return toast('照片还在读取，请稍等片刻再保存。');
    if (draft.photos.length > MAX_PHOTOS) return toast(`每条记录最多添加 ${MAX_PHOTOS} 张照片。`);
    if (!draft.text.trim() && !draft.photos.length) return toast('写一点文字，或添加一张照片，再收藏这份记忆。');
    if (draft.customActive && !draft.customMood.trim()) { toast('写下你的自定义心情，或选择一种已有心情。'); byId('custom-mood-field')?.focus(); return; }
    if (draft.customActive && draft.customMood.trim().length > 20) return toast('自定义心情最多 20 个字。');
    const date = new Date(`${draft.date}T${draft.time || '00:00'}`); if (Number.isNaN(date.getTime())) return toast('请选择有效的日期和时间。');
    const now = new Date().toISOString(); const id = draft.id || (globalThis.crypto?.randomUUID?.() || `preview-${Date.now()}-${Math.random().toString(16).slice(2)}`);
    const entry = { id, text: draft.text.trim(), type: draft.type, mood: draft.customActive ? '' : draft.mood, customMood: draft.customActive ? draft.customMood.trim() : '', tags: [...new Set(draft.tags.split(/[,，、\s]+/).map(tag => tag.replace(/^#/, '').trim()).filter(Boolean))].slice(0, 20), occurredAt: date.toISOString(), photos: [...draft.photos], createdAt: now, updatedAt: now };
    if (draft.id && draft.source === 'demo') { state.demo = state.demo.map(item => item.id === id ? entry : item); state.dataVersion++; toast('示例记录已更新，仅用于本次预览。'); }
    else { const next = personal.filter(item => item.id !== id); next.push(entry); if (!persist(next)) return; if (state.mode !== 'personal') { resetGallery(); resetCalendar(); resetReview(); } state.mode = 'personal'; toast('已收藏这份记忆。'); }
    state.detailId = id; state.photoIndex = 0; state.view = 'detail'; state.draft = null; render();
  }
  function closeModal() { byId('modal-root').innerHTML = ''; }
  function modal(title, text, actions, extra = '') { byId('modal-root').innerHTML = `<div class="modal-backdrop"><section class="modal" role="dialog" aria-modal="true" aria-label="${escape(title)}"><h2>${escape(title)}</h2><p>${escape(text)}</p>${extra}<div class="modal-actions">${actions}</div></section></div>`; byId('modal-root').querySelector('input,button')?.focus(); }
  function photoViewer() { const entry = findEntry(state.detailId); byId('modal-root').innerHTML = `<div class="photo-viewer" role="dialog" aria-label="照片查看">${viewHeader(`${state.photoIndex + 1} / ${entry.photos.length}`, 'close-modal')}<img src="${escape(entry.photos[state.photoIndex])}" alt="放大的记录照片"><div class="viewer-nav"><button data-action="viewer-previous" ${state.photoIndex === 0 ? 'disabled' : ''}>${icon('back')} 上一张</button><button data-action="viewer-next" ${state.photoIndex >= entry.photos.length - 1 ? 'disabled' : ''}>下一张 ${icon('forward')}</button></div></div>`; }
  async function addPhotos(files) {
    if (!state.draft || state.photoLoading) return;
    const draft = state.draft; const validFiles = [...files].filter(file => file.type.startsWith('image/'));
    if (draft.photos.length >= MAX_PHOTOS) return toast(`每条记录最多添加 ${MAX_PHOTOS} 张照片。`);
    const selected = validFiles.slice(0, MAX_PHOTOS - draft.photos.length);
    if (!selected.length) return toast('请选择照片文件。');
    if (validFiles.length > selected.length) toast(`每条记录最多添加 ${MAX_PHOTOS} 张照片。`);
    state.photoLoading = true; render({ keepScroll: true });
    try {
      for (const file of selected) {
        if (state.draft !== draft) break;
        if (file.size > 25 * 1024 * 1024) throw new Error('照片较大，请选择小于 25 MB 的图片。');
        const url = await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(file); });
        if (state.draft !== draft) break;
        const compressed = await new Promise((resolve, reject) => { const image = new Image(); image.onload = () => { const scale = Math.min(1, 1280 / Math.max(image.width, image.height)); const canvas = document.createElement('canvas'); canvas.width = Math.round(image.width * scale); canvas.height = Math.round(image.height * scale); canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height); resolve(canvas.toDataURL('image/jpeg', .82)); }; image.onerror = () => reject(new Error('这张照片无法读取，请换一种图片格式。')); image.src = url; });
        if (state.draft === draft && draft.photos.length < MAX_PHOTOS) draft.photos.push(compressed);
      }
    } catch (error) { toast(error.message || '照片读取失败，请重新选择。'); }
    finally { state.photoLoading = false; if (state.view === 'editor') render({ keepScroll: true }); }
  }
  function exportBackup() {
    const blob = new Blob([JSON.stringify({ format: BACKUP_FORMAT, exportedAt: new Date().toISOString(), entries: personal }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = `星海日记-网页预览备份-${localDate(new Date())}.json`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); toast(`已导出 ${personal.length} 条试用记录。`);
  }
  async function importBackup(file) {
    if (!file) return;
    try {
      if (file.size > 30 * 1024 * 1024) throw new Error('预览备份过大，请选择小于 30 MB 的文件。');
      const data = JSON.parse(await file.text());
      if (data.format !== BACKUP_FORMAT || !Array.isArray(data.entries) || data.entries.length > 1000) throw new Error('请选择星海日记导出的网页预览备份，手机版备份请在手机上导入。');
      const ids = new Set(personal.map(entry => entry.id)); const next = [...personal]; let count = 0;
      for (const raw of data.entries) {
        if (typeof raw.id !== 'string' || !raw.id || typeof raw.text !== 'string' || raw.text.length > 50000 || !TYPES[raw.type] || Number.isNaN(new Date(raw.occurredAt).getTime()) || !Array.isArray(raw.tags) || raw.tags.length > 20 || !raw.tags.every(tag => typeof tag === 'string') || !Array.isArray(raw.photos) || raw.photos.length > MAX_PHOTOS || !raw.photos.every(photo => typeof photo === 'string' && /^data:image\/(jpeg|png|webp);base64,/.test(photo))) throw new Error('备份中的记录或照片格式不正确。');
        if (raw.customMood !== undefined && (typeof raw.customMood !== 'string' || raw.customMood.trim().length > 20)) throw new Error('备份中的自定义心情格式不正确，最多 20 个字。');
        if (!ids.has(raw.id)) { next.push({ id: raw.id, text: raw.text, type: raw.type, mood: customMood(raw) ? '' : MOODS[raw.mood] ? raw.mood : '', customMood: customMood(raw), occurredAt: raw.occurredAt, tags: raw.tags, photos: raw.photos }); ids.add(raw.id); count++; }
      }
      if (persist(next)) { state.mode = 'personal'; state.tab = 'home'; resetReview(); resetGallery(); resetCalendar(); render(); toast(`已导入 ${count} 条试用记录，相同编号已跳过。`); }
    } catch (error) { toast(error.message || '文件读取失败，请重新选择。'); }
  }
  document.addEventListener('click', event => {
    const button = event.target.closest('[data-action]'); if (!button || button.disabled) return;
    const action = button.dataset.action;
    switch (action) {
      case 'tab': if (button.dataset.tab === 'stats' && state.tab !== 'stats') shuffleGallery(); state.tab = button.dataset.tab; state.view = 'main'; state.detailOrigin = 'main'; state.reviewOrigin = 'random'; render(); break;
      case 'compose': beginEditor(); break;
      case 'review': openRandomReview(); break;
      case 'calendar-prev': changeCalendarMonth(-1); break;
      case 'calendar-next': changeCalendarMonth(1); break;
      case 'calendar-day': state.calendarDay = button.dataset.day; render({ keepScroll: true }); break;
      case 'calendar-review': openCalendarReview(); break;
      case 'shuffle-gallery': shuffleGallery(); render(); break;
      case 'gallery-detail': state.detailOrigin = 'gallery'; state.galleryScroll = byId('app-content').scrollTop; state.detailId = button.dataset.id; state.photoIndex = Number(button.dataset.index); state.view = 'detail'; render(); break;
      case 'filter': state.filter = button.dataset.type; render({ keepScroll: true }); break;
      case 'clear-search': state.search = ''; render({ keepScroll: true }); byId('search-field')?.focus(); break;
      case 'reset-filter': state.filter = ''; state.search = ''; render(); break;
      case 'detail': state.detailOrigin = state.view === 'review' ? 'review' : 'main'; if (state.detailOrigin === 'review') state.reviewScroll = byId('app-content').scrollTop; state.detailId = button.dataset.id; state.photoIndex = 0; state.view = 'detail'; render(); break;
      case 'back': if (state.view === 'editor' && state.draft?.id) { state.view = 'detail'; } else if (state.view === 'detail' && state.detailOrigin === 'review') state.view = 'review'; else state.view = 'main'; state.draft = null; render(); restoreDetailScroll(); break;
      case 'draft-type': state.draft.type = button.dataset.type; render({ keepScroll: true }); break;
      case 'draft-mood': state.draft.mood = state.draft.mood === button.dataset.mood && !state.draft.customActive ? '' : button.dataset.mood; state.draft.customActive = false; state.draft.customMood = ''; render({ keepScroll: true }); break;
      case 'draft-custom': state.draft.customActive = !state.draft.customActive; state.draft.mood = ''; if (!state.draft.customActive) state.draft.customMood = ''; render({ keepScroll: true }); if (state.draft.customActive) byId('custom-mood-field')?.focus({ preventScroll: true }); break;
      case 'remove-photo': state.draft.photos.splice(Number(button.dataset.index), 1); render({ keepScroll: true }); break;
      case 'gallery': byId('gallery-input').click(); break;
      case 'camera': byId('camera-input').click(); break;
      case 'save': saveDraft(); break;
      case 'edit': beginEditor(state.detailId); break;
      case 'delete': modal('删除这段记录？', '删除后无法找回。', '<button data-action="close-modal">取消</button><button class="danger" data-action="confirm-delete">删除</button>'); break;
      case 'confirm-delete': if (state.mode === 'demo') { state.demo = state.demo.filter(entry => entry.id !== state.detailId); state.dataVersion++; } else if (!persist(personal.filter(entry => entry.id !== state.detailId))) break; closeModal(); state.view = state.detailOrigin === 'review' ? 'review' : 'main'; render(); restoreDetailScroll(); toast('记录已删除。'); break;
      case 'theme': state.dark = !state.dark; render({ keepScroll: true }); break;
      case 'photo-index': state.photoIndex = Number(button.dataset.index); render({ keepScroll: true }); break;
      case 'zoom': photoViewer(); break;
      case 'viewer-previous': state.photoIndex--; photoViewer(); break;
      case 'viewer-next': state.photoIndex++; photoViewer(); break;
      case 'close-modal': closeModal(); if (state.view === 'detail') render({ keepScroll: true }); break;
      case 'pin': modal('隐私锁', '手机上可以使用 4 位密码，守护你的私人记录。本页只演示开关状态。', '<button data-action="close-modal">取消</button><button class="confirm" data-action="toggle-pin">'+(state.pinEnabled ? '关闭演示' : '开启演示')+'</button>'); break;
      case 'backup': backupSheet(); break;
      case 'toggle-pin': state.pinEnabled = !state.pinEnabled; closeModal(); render({ keepScroll: true }); toast(state.pinEnabled ? '已开启隐私锁界面演示。' : '已关闭隐私锁界面演示。'); break;
      case 'export': closeModal(); exportBackup(); break;
      case 'import': closeModal(); byId('backup-input').click(); break;
    }
  });
  document.addEventListener('input', event => {
    if (event.target.id === 'search-field') { state.search = event.target.value; byId('record-results').innerHTML = recordResults(); const clear = document.querySelector('[data-action="clear-search"]'); clear.innerHTML = state.search ? icon('close') : ''; }
    if (event.target.dataset.field && state.draft) { state.draft[event.target.dataset.field] = event.target.value; if (event.target.dataset.field === 'text') byId('char-counter').textContent = `${event.target.value.length} 字`; }
  });
  document.querySelectorAll('[data-mode]').forEach(button => button.addEventListener('click', () => { state.mode = button.dataset.mode; state.view = 'main'; state.tab = 'home'; state.filter = ''; state.search = ''; state.draft = null; resetReview(); resetGallery(); resetCalendar(); closeModal(); render(); }));
  byId('show-empty').addEventListener('click', () => { state.mode = 'empty'; state.view = 'main'; state.tab = 'home'; state.filter = ''; state.search = ''; state.draft = null; resetReview(); resetGallery(); resetCalendar(); closeModal(); render(); });
  byId('device-width').addEventListener('input', event => { document.documentElement.style.setProperty('--phone-width', `${event.target.value}px`); byId('width-value').textContent = `${event.target.value} px`; });
  byId('gallery-input').addEventListener('change', event => { addPhotos(event.target.files); event.target.value = ''; });
  byId('camera-input').addEventListener('change', event => { addPhotos(event.target.files); event.target.value = ''; });
  byId('backup-input').addEventListener('change', event => { importBackup(event.target.files[0]); event.target.value = ''; });
  document.addEventListener('keydown', event => { if (event.key === 'Escape') closeModal(); });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) refreshDailyQuote(true); });
  window.addEventListener('pageshow', () => refreshDailyQuote(true));
  window.addEventListener('focus', () => refreshDailyQuote(true));
  scheduleDailyRefresh();
  render();
})();
