import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';
import { Screen, PrimaryButton } from './Screen';
import { useApp } from '../lib/state';

export function Setup() {
  const { baseUrl, connect, colors } = useApp();
  const [url, setUrl] = useState(baseUrl);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [register, setRegister] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const inputStyle = { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, color: colors.text, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 13, fontSize: 16, marginTop: 8 } as const;
  const labelStyle = { color: colors.muted, marginTop: 18, fontSize: 14 } as const;

  async function submit() {
    setBusy(true); setError('');
    try { await connect(url, username, password, register); }
    catch (e) { setError(e instanceof Error ? e.message : '连接失败'); }
    finally { setBusy(false); }
  }

  return <Screen>
    <View style={{ alignItems: 'center', marginTop: 50, marginBottom: 38 }}>
      <Text style={{ fontSize: 55 }}>🌙</Text>
      <Text style={{ color: colors.text, fontSize: 35, fontWeight: '900', letterSpacing: 4, marginTop: 14 }}>星海日记</Text>
      <Text style={{ color: colors.muted, marginTop: 12, textAlign: 'center', lineHeight: 22 }}>把醒来前的宇宙，收藏在这里。</Text>
    </View>
    <View style={{ backgroundColor: colors.card, borderRadius: 24, borderWidth: 1, borderColor: colors.border, padding: 22 }}>
      <View style={{ flexDirection: 'row', backgroundColor: colors.soft, borderRadius: 12, padding: 4, marginBottom: 10 }}>
        {([['创建空间', true], ['已有账号', false]] as const).map(([label, value]) =>
          <Pressable key={label} onPress={() => { setRegister(value); setError(''); }} style={{ flex: 1, borderRadius: 10, padding: 10, backgroundColor: register === value ? colors.primary : 'transparent', alignItems: 'center' }}>
            <Text style={{ color: register === value ? '#fff' : colors.muted, fontWeight: '700' }}>{label}</Text>
          </Pressable>)}
      </View>
      <Text style={labelStyle}>服务端地址</Text>
      <TextInput style={inputStyle} value={url} onChangeText={setUrl} placeholder="http://192.168.1.10:3000" placeholderTextColor={colors.muted} autoCapitalize="none" autoCorrect={false} keyboardType="url" />
      <Text style={{ color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 6 }}>手机和电脑需在同一网络；填写电脑的局域网 IP，不要填 localhost。</Text>
      <Text style={labelStyle}>用户名</Text>
      <TextInput style={inputStyle} value={username} onChangeText={setUsername} placeholder="给自己起个名字" placeholderTextColor={colors.muted} autoCapitalize="none" />
      <Text style={labelStyle}>密码</Text>
      <TextInput style={inputStyle} value={password} onChangeText={setPassword} placeholder="至少 8 位" placeholderTextColor={colors.muted} secureTextEntry autoCapitalize="none" />
      {!!error && <Text style={{ color: '#e9829e', marginTop: 14, lineHeight: 20 }}>{error}</Text>}
      {busy ? <ActivityIndicator color={colors.primary} style={{ marginTop: 25 }} /> : <PrimaryButton label={register ? '创建我的星海' : '进入星海'} onPress={submit} />}
    </View>
  </Screen>;
}
