import { useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { File, Paths } from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import { router } from 'expo-router';
import { BottomNav, Screen, Title } from '../components/Screen';
import { api } from '../lib/api';
import { useApp } from '../lib/state';

export default function Settings() {
  const { baseUrl, token, theme, setTheme, hasPin, colors, refresh } = useApp();
  const [busy, setBusy] = useState(false);
  const card = { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: 18, padding: 18, marginBottom: 12 } as const;

  async function exportBackup() {
    setBusy(true);
    try {
      const backup = await api<object>(baseUrl, token, '/api/backup');
      const stamp = new Date().toISOString().slice(0, 10);
      const file = new File(Paths.cache, `星海日记备份-${stamp}-${Date.now()}.json`);
      file.create(); file.write(JSON.stringify(backup, null, 2));
      await Sharing.shareAsync(file.uri, { mimeType: 'application/json', dialogTitle: '保存星海日记备份' });
    } catch (error) { Alert.alert('导出失败', error instanceof Error ? error.message : '请重试'); }
    finally { setBusy(false); }
  }

  async function importBackup() {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
      if (result.canceled) return;
      const raw = await new File(result.assets[0].uri).text();
      const data = JSON.parse(raw);
      Alert.alert('导入记录', '会合并旧记录；已有相同编号的记录会跳过。', [
        { text: '取消', style: 'cancel' },
        { text: '导入', onPress: async () => {
          setBusy(true);
          try {
            const summary = await api<{ imported: number; skipped: number }>(baseUrl, token, '/api/import', 'POST', data);
            await refresh();
            Alert.alert('导入完成', `新增 ${summary.imported} 条，跳过 ${summary.skipped} 条。`);
          } catch (error) { Alert.alert('导入失败', error instanceof Error ? error.message : '请重试'); }
          finally { setBusy(false); }
        } }
      ]);
    } catch (error) { Alert.alert('无法读取文件', error instanceof Error ? error.message : '请选择 JSON 备份文件'); }
  }

  return <View style={{ flex: 1 }}><Screen>
    <Title title="设置" subtitle="管理你的记录与私人空间" />
    <View style={card}><Text style={{ color: colors.muted, fontSize: 13 }}>保存位置</Text><Text style={{ color: colors.text, fontSize: 17, fontWeight: '800', marginTop: 5 }}>这部手机</Text><Text style={{ color: colors.muted, fontSize: 12, marginTop: 5 }}>无需网络即可记录。换手机前请先导出完整备份。</Text></View>
    <Pressable onPress={() => setTheme(theme === 'dark' ? 'light' : 'dark')} style={card}>
      <Text style={{ color: colors.text, fontSize: 16, fontWeight: '700' }}>{theme === 'dark' ? '☀ 切换浅色外观' : '☾ 切换深色外观'}</Text>
    </Pressable>
    <Pressable onPress={() => router.push('/pin')} style={card}><Text style={{ color: colors.text, fontSize: 16, fontWeight: '700' }}>🔒 隐私锁</Text><Text style={{ color: colors.muted, fontSize: 12, marginTop: 6 }}>{hasPin ? '已开启' : '未开启'}</Text></Pressable>
    <Pressable disabled={busy} onPress={importBackup} style={card}><Text style={{ color: colors.text, fontSize: 16, fontWeight: '700' }}>↥ 导入备份</Text><Text style={{ color: colors.muted, fontSize: 12, marginTop: 6 }}>支持旧网页版导出的 JSON 和星海日记备份</Text></Pressable>
    <Pressable disabled={busy} onPress={exportBackup} style={card}><Text style={{ color: colors.text, fontSize: 16, fontWeight: '700' }}>↧ 导出完整备份</Text><Text style={{ color: colors.muted, fontSize: 12, marginTop: 6 }}>包含文字、情绪、标签和照片</Text></Pressable>
    <Text style={{ color: colors.muted, textAlign: 'center', fontSize: 12, marginTop: 15 }}>星海日记 · 你的生活收藏夹</Text>
  </Screen><BottomNav active="settings" /></View>;
}
