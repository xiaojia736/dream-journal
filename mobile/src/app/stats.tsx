import { Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BottomNav, Screen, Title } from '../components/Screen';
import { Entry, EntryType, Mood, moodEmoji, moodLabels, typeLabels } from '../lib/api';
import { useApp } from '../lib/state';

function dayKey(date: Date) { return date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate(); }
function streak(entries: Entry[]) {
  const days = new Set(entries.map(entry => dayKey(new Date(entry.occurredAt))));
  const cursor = new Date();
  if (!days.has(dayKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  let count = 0;
  while (count < 366 && days.has(dayKey(cursor))) { count++; cursor.setDate(cursor.getDate() - 1); }
  return count;
}

export default function Stats() {
  const { entries, colors, theme } = useApp();
  const categories: EntryType[] = ['moment', 'diary', 'dream', 'os'];
  const counts: Record<string, number> = { moment: 0, diary: 0, dream: 0, os: 0 };
  const moods: Partial<Record<Exclude<Mood, ''>, number>> = {};
  const days = new Set<string>();
  let photoCount = 0;
  for (const entry of entries) {
    counts[entry.type] = (counts[entry.type] || 0) + 1;
    photoCount += entry.photos.length;
    if (entry.mood) moods[entry.mood] = (moods[entry.mood] || 0) + 1;
    days.add(dayKey(new Date(entry.occurredAt)));
  }
  const peak = Math.max(1, ...Object.values(moods));
  const active28 = Array.from({ length: 28 }, (_, index) => {
    const day = new Date(); day.setHours(12, 0, 0, 0); day.setDate(day.getDate() - 27 + index);
    return { date: day, recorded: days.has(dayKey(day)) };
  });
  const recentCount = active28.filter(day => day.recorded).length;
  const card = { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: 22, padding: 19, marginBottom: 14 } as const;

  return <View style={{ flex: 1 }}><Screen>
    <Title title="星海图鉴" subtitle="回望那些被你认真收藏的日子" />
    <LinearGradient colors={theme === 'dark' ? ['#394a81', '#6b5b9f'] : ['#7475bd', '#a47bb2']}
      style={{ borderRadius: 24, padding: 22, marginBottom: 12, overflow: 'hidden' }}>
      <View style={{ position: 'absolute', width: 150, height: 150, borderRadius: 75, backgroundColor: '#ffffff13', right: -25, top: -35 }} />
      <Text style={{ color: '#efecff', fontSize: 13, letterSpacing: 1 }}>累计记录</Text>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 5 }}>
        <Text style={{ color: '#fff', fontSize: 52, fontWeight: '900' }}>{entries.length}</Text>
        <Text style={{ color: '#f3eeff', fontSize: 16, marginLeft: 6 }}>段珍贵的记忆</Text>
      </View>
      <Text style={{ color: '#ede9ff', fontSize: 13, lineHeight: 20, marginTop: 8 }}>
        {entries.length ? '生活、心情与梦，都在这里留下了痕迹。' : '从今天开始，留住生活里的一点光。'}
      </Text>
    </LinearGradient>

    <View style={{ flexDirection: 'row', gap: 11, marginBottom: 14 }}>
      <View style={[card, { flex: 1, marginBottom: 0 }]}>
        <Text style={{ color: colors.accent, fontSize: 22 }}>✦</Text>
        <Text style={{ color: colors.text, fontSize: 27, fontWeight: '900', marginTop: 7 }}>{streak(entries)}</Text>
        <Text style={{ color: colors.muted, fontSize: 12, marginTop: 4 }}>连续记录天数</Text>
      </View>
      <View style={[card, { flex: 1, marginBottom: 0 }]}>
        <Text style={{ color: colors.accent, fontSize: 22 }}>▣</Text>
        <Text style={{ color: colors.text, fontSize: 27, fontWeight: '900', marginTop: 7 }}>{photoCount}</Text>
        <Text style={{ color: colors.muted, fontSize: 12, marginTop: 4 }}>收藏的照片</Text>
      </View>
    </View>

    <View style={card}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 18 }}>
        <Text style={{ color: colors.text, fontSize: 18, fontWeight: '800' }}>最近 28 天</Text>
        <Text style={{ color: colors.muted, fontSize: 12 }}>点亮 {recentCount} 天</Text>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 9 }}>
        {active28.map(({ date, recorded }, index) => <View key={index} style={{ width: '12.2%', aspectRatio: 1, borderRadius: 11, backgroundColor: recorded ? colors.primary : colors.soft, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: recorded ? (theme === 'dark' ? '#151b35' : '#fff') : colors.muted, fontSize: 11, fontWeight: recorded ? '800' : '500' }}>{date.getDate()}</Text>
        </View>)}
      </View>
      <Text style={{ color: colors.muted, marginTop: 15, fontSize: 12 }}>每一个亮起的日子，都值得记住。</Text>
    </View>

    <View style={card}>
      <Text style={{ color: colors.text, fontSize: 18, fontWeight: '800', marginBottom: 17 }}>心情足迹</Text>
      {Object.keys(moods).length ? (Object.entries(moods) as [Exclude<Mood, ''>, number][]).sort((a, b) => b[1] - a[1]).map(([mood, count]) =>
        <View key={mood} style={{ flexDirection: 'row', alignItems: 'center', gap: 11, marginBottom: 13 }}>
          <Text style={{ color: colors.text, width: 82, fontSize: 13 }}>{moodEmoji[mood]} {moodLabels[mood]}</Text>
          <View style={{ flex: 1, height: 8, backgroundColor: colors.soft, borderRadius: 6, overflow: 'hidden' }}>
            <View style={{ width: (Math.round(count / peak * 100) + '%') as `${number}%`, height: '100%', backgroundColor: colors.primary, borderRadius: 6 }} />
          </View>
          <Text style={{ color: colors.muted, width: 24, textAlign: 'right', fontSize: 12 }}>{count}</Text>
        </View>) : <Text style={{ color: colors.muted, fontSize: 13, lineHeight: 21 }}>记录心情后，这里会慢慢画出你的情绪星图。</Text>}
    </View>

    <View style={card}>
      <Text style={{ color: colors.text, fontSize: 18, fontWeight: '800', marginBottom: 17 }}>记录分类</Text>
      {categories.map(type => <View key={type} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 13 }}>
        <Text style={{ color: colors.muted, fontSize: 14 }}>{typeLabels[type]}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
          <View style={{ width: Math.max(5, Math.min(94, Math.round((counts[type] || 0) / Math.max(1, entries.length) * 94))), height: 6, borderRadius: 4, backgroundColor: colors.primary }} />
          <Text style={{ color: colors.text, fontWeight: '800', minWidth: 20, textAlign: 'right' }}>{counts[type] || 0}</Text>
        </View>
      </View>)}
    </View>
  </Screen><BottomNav active="stats" /></View>;
}
