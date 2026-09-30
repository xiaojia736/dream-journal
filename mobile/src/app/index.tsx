import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { BottomNav, Screen } from '../components/Screen';
import { Entry, EntryType, moodEmoji, moodLabels, photoSource, typeLabels } from '../lib/api';
import { chineseDate, homeDate } from '../lib/date';
import { useApp } from '../lib/state';

type Filter = 'all' | EntryType;
const filters: { value: Filter; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'moment', label: '生活' },
  { value: 'diary', label: '日记' },
  { value: 'dream', label: '梦境' },
  { value: 'os', label: '心声' },
];

function EntryCard({ entry }: { entry: Entry }) {
  const { baseUrl, token, colors } = useApp();
  const [rawFirstLine, ...otherLines] = entry.text.trim().split(/\n+/);
  const firstLine = rawFirstLine || (entry.photos.length ? '照片记录' : '一段生活记录');
  const summary = otherLines.join(' ').trim();
  const date = new Date(entry.occurredAt);
  const photo = entry.photos[0];

  return <Pressable
    accessibilityRole="button"
    accessibilityLabel={'查看' + (typeLabels[entry.type] || '生活') + '记录，' + firstLine}
    onPress={() => router.push('/entry/' + entry.id)}
    style={{ backgroundColor: colors.card, borderRadius: 23, borderColor: colors.border, borderWidth: 1, padding: 17, marginBottom: 12, overflow: 'hidden' }}
  >
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: colors.primary }} />
        <Text style={{ color: colors.muted, fontSize: 12, fontWeight: '600' }}>
          {chineseDate(date)}
        </Text>
      </View>
      <Text style={{ color: colors.primary, backgroundColor: colors.soft, borderRadius: 10, overflow: 'hidden', paddingHorizontal: 9, paddingVertical: 5, fontSize: 11, fontWeight: '700' }}>
        {typeLabels[entry.type] || '生活'}
      </Text>
    </View>
    <View style={{ flexDirection: 'row', gap: 13, alignItems: 'stretch' }}>
      <View style={{ flex: 1, minHeight: photo ? 94 : undefined, justifyContent: 'center' }}>
        <Text numberOfLines={photo ? 2 : 3} style={{ color: colors.text, fontSize: 17, fontWeight: '700', lineHeight: 25 }}>
          {firstLine}
        </Text>
        {!!summary && <Text numberOfLines={photo ? 2 : 3} style={{ color: colors.muted, fontSize: 13, lineHeight: 20, marginTop: 5 }}>{summary}</Text>}
        {!entry.text.trim() && photo && <Text style={{ color: colors.muted, fontSize: 12, marginTop: 6 }}>{entry.photos.length} 张照片 · 点开看看</Text>}
      </View>
      {photo && <View style={{ width: 100, height: 100, borderRadius: 15, overflow: 'hidden', backgroundColor: colors.soft }}>
        <Image source={photoSource(baseUrl, token, photo.id)} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
        {entry.photos.length > 1 && <View style={{ position: 'absolute', right: 5, bottom: 5, backgroundColor: '#141a37cc', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 7 }}>
          <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>▣ {entry.photos.length}</Text>
        </View>}
      </View>}
    </View>
    {(!!entry.mood || entry.tags.length > 0) && <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 9, marginTop: 12 }}>
      {!!entry.mood && <Text style={{ color: colors.accent, fontSize: 12 }}>{moodEmoji[entry.mood]} {moodLabels[entry.mood]}</Text>}
      {entry.tags.slice(0, 3).map(tag => <Text key={tag} style={{ color: colors.muted, fontSize: 12 }}># {tag}</Text>)}
    </View>}
  </Pressable>;
}

export default function Home() {
  const { loading, entries, username, colors, theme, error, refresh } = useApp();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [refreshing, setRefreshing] = useState(false);
  const filtered = useMemo(() => entries.filter(entry =>
    (filter === 'all' || entry.type === filter) &&
    (entry.text + ' ' + entry.tags.join(' ') + ' ' + entry.occurredAt + ' ' + (typeLabels[entry.type] || '')).toLowerCase().includes(query.trim().toLowerCase())
  ), [entries, query, filter]);
  const memory = entries.length > 3 ? entries[entries.length - 1] : undefined;
  const reload = async () => { setRefreshing(true); try { await refresh(); } catch { /* The visible error message handles this. */ } finally { setRefreshing(false); } };

  if (loading) return <Screen><ActivityIndicator style={{ marginTop: 100 }} color={colors.primary} /></Screen>;

  return <View style={{ flex: 1 }}>
    <Screen scroll={false} style={{ paddingTop: 13, paddingBottom: 0 }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <View>
          <Text style={{ color: colors.muted, fontSize: 12, fontWeight: '700', letterSpacing: 1.5 }}>
            {homeDate(new Date())}
          </Text>
          <Text style={{ color: colors.text, fontSize: 32, fontWeight: '900', letterSpacing: 1.5, marginTop: 7 }}>星海日记</Text>
          <Text style={{ color: colors.muted, fontSize: 13, marginTop: 4, marginBottom: 19 }}>
            {username ? username + '，' : ''}收藏生活中每一颗微光
          </Text>
        </View>
        <View style={{ width: 43, height: 43, borderRadius: 16, backgroundColor: colors.soft, justifyContent: 'center', alignItems: 'center', marginTop: 15 }}>
          <Text style={{ color: colors.primary, fontSize: 24 }}>✦</Text>
        </View>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: 16, paddingHorizontal: 15, marginBottom: 14 }}>
        <Text style={{ color: colors.muted, fontSize: 19, marginRight: 10 }}>⌕</Text>
        <TextInput value={query} onChangeText={setQuery} placeholder="搜索文字、标签或日期" placeholderTextColor={colors.muted}
          autoCorrect={false} returnKeyType="search" style={{ flex: 1, color: colors.text, paddingVertical: 12, fontSize: 14 }} />
        {!!query && <Pressable onPress={() => setQuery('')} accessibilityLabel="清除搜索" style={{ padding: 5 }}><Text style={{ color: colors.muted, fontSize: 18 }}>×</Text></Pressable>}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingRight: 20, paddingBottom: 2 }} style={{ flexGrow: 0, marginBottom: 18 }}>
        {filters.map(({ value, label }) => <Pressable key={value} onPress={() => setFilter(value)}
          accessibilityRole="button" accessibilityState={{ selected: filter === value }}
          style={{ backgroundColor: filter === value ? colors.primary : colors.card, borderColor: filter === value ? colors.primary : colors.border, borderWidth: 1, borderRadius: 13, paddingHorizontal: 15, paddingVertical: 9 }}>
          <Text style={{ color: filter === value ? (theme === 'dark' ? '#151b35' : '#fff') : colors.muted, fontSize: 13, fontWeight: '700' }}>{label}</Text>
        </Pressable>)}
      </ScrollView>

      {!!error && <Pressable onPress={reload} style={{ padding: 13, backgroundColor: colors.soft, borderRadius: 12, marginBottom: 12 }}><Text style={{ color: colors.accent }}>{error} · 点击重试</Text></Pressable>}
      <FlatList data={filtered} keyExtractor={entry => entry.id} refreshing={refreshing} onRefresh={reload} showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 105, flexGrow: 1 }}
        ListHeaderComponent={<View>
          {memory && !query && filter === 'all' && <Pressable onPress={() => router.push('/entry/' + memory.id)} style={{ backgroundColor: colors.soft, borderColor: colors.border, borderWidth: 1, borderRadius: 19, padding: 15, marginBottom: 18 }}>
            <Text style={{ color: colors.accent, fontSize: 12, fontWeight: '800', letterSpacing: 0.5 }}>✦ 时光回望</Text>
            <Text numberOfLines={1} style={{ color: colors.text, fontSize: 14, fontWeight: '600', marginTop: 7 }}>{memory.text.trim() || '翻开一组旧照片'}</Text>
          </Pressable>}
          {filtered.length > 0 && <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 }}>
            <Text style={{ color: colors.text, fontSize: 18, fontWeight: '800' }}>{filter === 'all' ? '我的记录' : filters.find(item => item.value === filter)?.label}</Text>
            <Text style={{ color: colors.muted, fontSize: 12 }}>{filtered.length} 条记录</Text>
          </View>}
        </View>}
        ListEmptyComponent={<View style={{ flex: 1, justifyContent: 'center', paddingBottom: 55 }}>
          {entries.length === 0 && !query && filter === 'all' ? <LinearGradient
            colors={theme === 'dark' ? ['#344376', '#615897'] : ['#7475bd', '#b582a6']}
            style={{ borderRadius: 25, padding: 26, minHeight: 220, overflow: 'hidden' }}>
            <View style={{ position: 'absolute', width: 125, height: 125, borderRadius: 70, backgroundColor: '#ffffff15', right: -20, top: -25 }} />
            <Text style={{ color: '#fff', fontSize: 32 }}>✦</Text>
            <Text style={{ color: '#fff', fontSize: 23, fontWeight: '800', marginTop: 10 }}>从此刻开始记录</Text>
            <Text style={{ color: '#f1edff', fontSize: 14, lineHeight: 23, marginTop: 8 }}>一张照片、一段日常、一个梦。{ '\n' }把值得珍藏的瞬间留在这里。</Text>
            <Pressable onPress={() => router.push('/entry/compose')} style={{ backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 17, paddingVertical: 10, alignSelf: 'flex-start', marginTop: 18 }}>
              <Text style={{ color: '#55518f', fontWeight: '800' }}>写下第一条  →</Text>
            </Pressable>
          </LinearGradient> : <View style={{ alignItems: 'center', paddingTop: 60 }}>
            <Text style={{ fontSize: 42, color: colors.primary }}>✦</Text>
            <Text style={{ color: colors.text, fontSize: 17, fontWeight: '700', marginTop: 12 }}>暂时没有找到记录</Text>
            <Text style={{ color: colors.muted, fontSize: 13, marginTop: 6 }}>试试其他文字或分类</Text>
            <Pressable onPress={() => { setQuery(''); setFilter('all'); }} style={{ padding: 11, marginTop: 13 }}><Text style={{ color: colors.primary, fontWeight: '700' }}>查看全部记录</Text></Pressable>
          </View>}
        </View>}
        renderItem={({ item }) => <EntryCard entry={item} />}
      />
      {entries.length > 0 && <Pressable onPress={() => router.push('/entry/compose')} accessibilityRole="button" accessibilityLabel="新建记录"
        style={{ position: 'absolute', right: 22, bottom: 22, backgroundColor: colors.primary, borderRadius: 19, paddingHorizontal: 18, height: 52, flexDirection: 'row', alignItems: 'center', elevation: 7, shadowColor: '#141a37', shadowOpacity: 0.25, shadowRadius: 9, shadowOffset: { width: 0, height: 5 } }}>
        <Text style={{ color: theme === 'dark' ? '#151b35' : '#fff', fontSize: 24, marginRight: 5, lineHeight: 28 }}>＋</Text>
        <Text style={{ color: theme === 'dark' ? '#151b35' : '#fff', fontSize: 14, fontWeight: '800' }}>写记录</Text>
      </Pressable>}
    </Screen>
    <BottomNav active="home" />
  </View>;
}
