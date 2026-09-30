import { useState } from 'react';
import { Alert, Image, Modal, Pressable, ScrollView, Text, useWindowDimensions, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen, Title } from '../../components/Screen';
import { api, moodEmoji, moodLabels, photoSource, typeLabels } from '../../lib/api';
import { detailDate } from '../../lib/date';
import { useApp } from '../../lib/state';

export default function EntryDetail() {
  const params = useLocalSearchParams<{ id: string }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const { entries, baseUrl, token, colors, theme, refresh } = useApp();
  const { width, height } = useWindowDimensions();
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const entry = entries.find(item => item.id === id);

  function remove() {
    if (!entry) return;
    const entryId = entry.id;
    Alert.alert('删除这段记录？', '删除后无法找回。', [
      { text: '取消', style: 'cancel' },
      { text: '删除', style: 'destructive', onPress: async () => {
        try { await api(baseUrl, token, '/api/entries/' + entryId, 'DELETE'); await refresh(); router.replace('/'); }
        catch (error) { Alert.alert('删除失败', error instanceof Error ? error.message : '请重试'); }
      } }
    ]);
  }
  if (!entry) return <Screen><Title title="找不到记录" back /></Screen>;

  const selectedPhoto = previewIndex === null ? undefined : entry.photos[previewIndex];
  const galleryWidth = width - 40;
  const date = new Date(entry.occurredAt);
  return <Screen>
    <Title title="记录详情" back />
    <Text style={{ color: colors.muted, fontSize: 13, fontWeight: '600', letterSpacing: 0.5, marginBottom: 9 }}>
      {detailDate(date)}
    </Text>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 21 }}>
      <Text style={{ color: colors.primary, backgroundColor: colors.soft, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 12, overflow: 'hidden', fontSize: 13, fontWeight: '700' }}>
        {typeLabels[entry.type] || '生活'}
      </Text>
      {!!entry.mood && <Text style={{ color: colors.text, backgroundColor: colors.soft, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 12, overflow: 'hidden', fontSize: 13 }}>
        {moodEmoji[entry.mood]} {moodLabels[entry.mood]}
      </Text>}
    </View>

    {entry.photos.length > 0 && <View style={{ marginBottom: 21 }}>
      <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} style={{ width: galleryWidth, flexGrow: 0 }}>
        {entry.photos.map((photo, index) => <Pressable key={photo.id} onPress={() => setPreviewIndex(index)}
          accessibilityRole="button" accessibilityLabel={'放大查看第 ' + (index + 1) + ' 张照片'}
          style={{ width: galleryWidth, height: Math.min(galleryWidth * 0.78, 315), borderRadius: 22, overflow: 'hidden', backgroundColor: colors.soft }}>
          <Image source={photoSource(baseUrl, token, photo.id)} resizeMode="cover" style={{ width: '100%', height: '100%' }} />
          <View style={{ position: 'absolute', right: 12, bottom: 12, backgroundColor: '#10182dcc', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6 }}>
            <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>{index + 1} / {entry.photos.length}  ·  点击放大</Text>
          </View>
        </Pressable>)}
      </ScrollView>
      {entry.photos.length > 1 && <Text style={{ color: colors.muted, textAlign: 'center', fontSize: 12, marginTop: 9 }}>左右滑动，翻看照片</Text>}
    </View>}

    <View style={{ backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: 22, padding: 21 }}>
      <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '800', letterSpacing: 1, marginBottom: 13 }}>这一刻</Text>
      {entry.text.trim() ? <Text selectable style={{ color: colors.text, fontSize: 17, lineHeight: 30 }}>{entry.text}</Text>
        : <Text style={{ color: colors.muted, fontSize: 15, lineHeight: 24 }}>这一刻留在照片里。</Text>}
    </View>

    {entry.tags.length > 0 && <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 18 }}>
      {entry.tags.map(tag => <Text key={tag} style={{ color: colors.muted, backgroundColor: colors.soft, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 11, overflow: 'hidden', fontSize: 12 }}># {tag}</Text>)}
    </View>}

    <Pressable onPress={() => router.push({ pathname: '/entry/compose', params: { id: entry.id } })}
      style={{ backgroundColor: colors.primary, borderRadius: 16, padding: 16, alignItems: 'center', marginTop: 31 }}>
      <Text style={{ color: theme === 'dark' ? '#151b35' : '#fff', fontSize: 16, fontWeight: '800' }}>编辑这段记录</Text>
    </Pressable>
    <Pressable onPress={remove} style={{ padding: 16, alignItems: 'center', marginTop: 6 }}><Text style={{ color: '#e9829e', fontWeight: '600' }}>删除记录</Text></Pressable>

    <Modal visible={!!selectedPhoto} transparent animationType="fade" onRequestClose={() => setPreviewIndex(null)} statusBarTranslucent>
      <View style={{ flex: 1, backgroundColor: '#0b1020f5', paddingTop: 45, paddingBottom: 28 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20 }}>
          <Text style={{ color: '#fff', fontSize: 14 }}>{previewIndex === null ? 0 : previewIndex + 1} / {entry.photos.length}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="关闭照片预览" onPress={() => setPreviewIndex(null)} style={{ padding: 10 }}>
            <Text style={{ color: '#fff', fontSize: 17 }}>关闭 ×</Text>
          </Pressable>
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          {selectedPhoto && <Image source={photoSource(baseUrl, token, selectedPhoto.id)} resizeMode="contain" style={{ width, height: Math.min(height - 170, height * 0.72) }} />}
        </View>
        {entry.photos.length > 1 && <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20 }}>
          <Pressable disabled={previewIndex === 0} onPress={() => setPreviewIndex(current => Math.max(0, (current || 0) - 1))} style={{ padding: 12, opacity: previewIndex === 0 ? 0.35 : 1 }}>
            <Text style={{ color: '#fff', fontSize: 15 }}>‹ 上一张</Text>
          </Pressable>
          <Pressable disabled={previewIndex === entry.photos.length - 1} onPress={() => setPreviewIndex(current => Math.min(entry.photos.length - 1, (current || 0) + 1))} style={{ padding: 12, opacity: previewIndex === entry.photos.length - 1 ? 0.35 : 1 }}>
            <Text style={{ color: '#fff', fontSize: 15 }}>下一张 ›</Text>
          </Pressable>
        </View>}
      </View>
    </Modal>
  </Screen>;
}
