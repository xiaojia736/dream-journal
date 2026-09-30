import { useState } from 'react';
import { Alert, Image, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { PrimaryButton, Screen, Title } from '../../components/Screen';
import { api, Entry, EntryInput, EntryType, Mood, moodEmoji, moodLabels, photoSource, typeLabels } from '../../lib/api';
import { useApp } from '../../lib/state';

function dateLabel(value: Date) {
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return `${value.getFullYear()} 年 ${value.getMonth() + 1} 月 ${value.getDate()} 日 · ${weekdays[value.getDay()]}`;
}

function timeLabel(value: Date) {
  return `${String(value.getHours()).padStart(2, '0')}:${String(value.getMinutes()).padStart(2, '0')}`;
}

export default function Compose() {
  const params = useLocalSearchParams<{ id?: string }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const { entries } = useApp();
  const existing = entries.find(entry => entry.id === id);
  if (id && !existing) return <Screen><Title title="找不到记录" back /></Screen>;
  return <ComposeForm key={id || 'new'} existing={existing} />;
}

function ComposeForm({ existing }: { existing?: Entry }) {
  const { baseUrl, token, colors, theme, refresh } = useApp();
  const [text, setText] = useState(existing?.text ?? '');
  const [type, setType] = useState<EntryType>(existing?.type ?? 'moment');
  const [mood, setMood] = useState<Mood>(existing?.mood ?? '');
  const [tags, setTags] = useState(existing?.tags.join('，') ?? '');
  const [date, setDate] = useState(() => new Date(existing?.occurredAt ?? Date.now()));
  const [pendingPhotos, setPendingPhotos] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [removedPhotos, setRemovedPhotos] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const visiblePhotos = existing?.photos.filter(photo => !removedPhotos.includes(photo.id)) || [];
  const field = { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: 15, color: colors.text, padding: 14, fontSize: 16 } as const;

  function pickDate() {
    DateTimePickerAndroid.open({
      value: date,
      mode: 'date',
      onValueChange: (_event, selected) => {
        if (selected) setDate(current => new Date(selected.getFullYear(), selected.getMonth(), selected.getDate(), current.getHours(), current.getMinutes()));
      }
    });
  }

  function pickTime() {
    DateTimePickerAndroid.open({
      value: date,
      mode: 'time',
      is24Hour: true,
      onValueChange: (_event, selected) => {
        if (selected) setDate(current => new Date(current.getFullYear(), current.getMonth(), current.getDate(), selected.getHours(), selected.getMinutes()));
      }
    });
  }

  async function pick(fromCamera: boolean) {
    if (visiblePhotos.length + pendingPhotos.length >= 5) return Alert.alert('照片已满', '每条记录最多可以添加 5 张照片。');
    try {
      if (fromCamera) {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) return Alert.alert('需要相机权限', '请在系统设置中允许星海日记使用相机。');
      }
      const result = fromCamera
        ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.7, base64: true })
        : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsMultipleSelection: true, selectionLimit: 5 - visiblePhotos.length - pendingPhotos.length, quality: 0.7, base64: true });
      if (!result.canceled) setPendingPhotos(current => [...current, ...result.assets].slice(0, 5 - visiblePhotos.length));
    } catch (error) { Alert.alert('无法获取照片', error instanceof Error ? error.message : '请重试'); }
  }

  async function save() {
    if (!text.trim() && visiblePhotos.length + pendingPhotos.length === 0) return Alert.alert('还没有内容', '写下一点文字，或添加一张照片再保存吧。');
    const input: EntryInput = { text: text.trim(), type, mood, tags: [...new Set(tags.split(/[，,\s]+/).map(tag => tag.trim()).filter(Boolean))].slice(0, 20), occurredAt: date.toISOString() };
    setBusy(true);
    let savedId: string | undefined;
    try {
      const result = await api<{ entry: Entry }>(baseUrl, token, existing ? `/api/entries/${existing.id}` : '/api/entries', existing ? 'PUT' : 'POST', input);
      savedId = result.entry.id;
      const failures: string[] = [];
      for (const photoId of removedPhotos) {
        try { await api(baseUrl, token, `/api/photos/${photoId}`, 'DELETE'); }
        catch { failures.push('删除照片'); }
      }
      for (const photo of pendingPhotos) {
        try {
          if (!photo.base64) throw new Error('无法读取照片');
          await api(baseUrl, token, `/api/entries/${savedId}/photos`, 'POST', { base64: photo.base64 });
        } catch { failures.push('保存照片'); }
      }
      await refresh();
      router.replace(`/entry/${savedId}`);
      if (failures.length) Alert.alert('记录已保存', '部分照片操作失败，请返回记录检查后重试。');
    } catch (error) {
      if (savedId) {
        await refresh().catch(() => {});
        router.replace(`/entry/${savedId}`);
      }
      Alert.alert(savedId ? '记录已保存' : '保存失败', error instanceof Error ? error.message : '请重试');
    } finally { setBusy(false); }
  }

  return <Screen>
    <Title title={existing ? '编辑记录' : '记录此刻'} subtitle={existing ? '把这段记忆补充得更完整' : '生活、梦境和心情，都值得留在星海里'} back />
    <Text style={{ color: colors.muted, marginBottom: 9 }}>记录类型</Text>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 22 }}>
      {(Object.keys(typeLabels) as EntryType[]).map(value => <Pressable key={value} onPress={() => setType(value)} style={{ backgroundColor: type === value ? colors.primary : colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 14 }}>
        <Text style={{ color: type === value ? (theme === 'dark' ? '#151b35' : '#fff') : colors.text, fontWeight: '700' }}>{typeLabels[value]}</Text>
      </Pressable>)}
    </View>
    <Text style={{ color: colors.muted, marginBottom: 9 }}>发生时间</Text>
    <View style={{ flexDirection: 'row', gap: 10, marginBottom: 22 }}>
      <Pressable accessibilityRole="button" accessibilityLabel="选择记录日期" onPress={pickDate} style={[field, { flex: 1, justifyContent: 'center' }]}>
        <Text style={{ color: colors.text, fontSize: 14 }}>{dateLabel(date)}</Text>
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel="选择记录时间" onPress={pickTime} style={[field, { justifyContent: 'center' }]}>
        <Text style={{ color: colors.text, fontSize: 14 }}>{timeLabel(date)}</Text>
      </Pressable>
    </View>
    <Text style={{ color: colors.muted, marginBottom: 9 }}>想记下什么？</Text>
    <TextInput multiline textAlignVertical="top" value={text} onChangeText={setText} placeholder="今天发生了什么？写下地点、人物和心情……" placeholderTextColor={colors.muted}
      style={[field, { minHeight: 185, lineHeight: 25, marginBottom: 22 }]} />
    <Text style={{ color: colors.muted, marginBottom: 10 }}>情绪</Text>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginBottom: 22 }}>
      {(Object.keys(moodLabels) as Exclude<Mood, ''>[]).map(value => <Pressable key={value} onPress={() => setMood(mood === value ? '' : value)} style={{ backgroundColor: mood === value ? colors.soft : colors.card, borderWidth: 1, borderColor: mood === value ? colors.primary : colors.border, borderRadius: 18, paddingHorizontal: 12, paddingVertical: 9 }}>
        <Text style={{ color: colors.text }}>{moodEmoji[value]} {moodLabels[value]}</Text>
      </Pressable>)}
    </View>
    <Text style={{ color: colors.muted, marginBottom: 9 }}>标签</Text>
    <TextInput value={tags} onChangeText={setTags} placeholder="用逗号或空格分隔，如：旅行，家人" placeholderTextColor={colors.muted} style={[field, { marginBottom: 22 }]} />
    <Text style={{ color: colors.muted, marginBottom: 10 }}>照片 · 最多 5 张</Text>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
      {visiblePhotos.map(photo => <View key={photo.id} style={{ marginRight: 10 }}>
        <Image source={photoSource(baseUrl, token, photo.id)} style={{ width: 86, height: 86, borderRadius: 12 }} />
        <Pressable onPress={() => setRemovedPhotos(current => [...current, photo.id])} style={{ position: 'absolute', right: 3, top: 3, backgroundColor: '#211c39cc', borderRadius: 12, width: 24, height: 24, alignItems: 'center' }}><Text style={{ color: '#fff' }}>×</Text></Pressable>
      </View>)}
      {pendingPhotos.map((photo, index) => <View key={`${photo.uri}-${index}`} style={{ marginRight: 10 }}>
        <Image source={{ uri: photo.uri }} style={{ width: 86, height: 86, borderRadius: 12 }} />
        <Pressable onPress={() => setPendingPhotos(current => current.filter((_, i) => i !== index))} style={{ position: 'absolute', right: 3, top: 3, backgroundColor: '#211c39cc', borderRadius: 12, width: 24, height: 24, alignItems: 'center' }}><Text style={{ color: '#fff' }}>×</Text></Pressable>
      </View>)}
    </ScrollView>
    <View style={{ flexDirection: 'row', gap: 10, marginBottom: 25 }}>
      <Pressable onPress={() => pick(false)} style={{ backgroundColor: colors.soft, borderRadius: 13, padding: 12 }}><Text style={{ color: colors.primary, fontWeight: '700' }}>＋ 相册</Text></Pressable>
      <Pressable onPress={() => pick(true)} style={{ backgroundColor: colors.soft, borderRadius: 13, padding: 12 }}><Text style={{ color: colors.primary, fontWeight: '700' }}>◉ 拍照</Text></Pressable>
    </View>
    <PrimaryButton label={busy ? '正在保存...' : '保存记录'} onPress={save} disabled={busy} />
  </Screen>;
}
