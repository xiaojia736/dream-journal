import { useState } from 'react';
import { Alert, Text, TextInput } from 'react-native';
import { router } from 'expo-router';
import { PrimaryButton, Screen, Title } from '../components/Screen';
import { useApp } from '../lib/state';

export default function PrivacyPin() {
  const { hasPin, setPin, colors } = useApp();
  const [old, setOld] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const field = { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, color: colors.text, borderRadius: 14, padding: 14, fontSize: 18, letterSpacing: 7, marginBottom: 20 } as const;
  async function save(value: string, disable = false) {
    if (!disable && !/^\d{4}$/.test(value)) return Alert.alert('密码格式不正确', '请输入 4 位数字密码。');
    if (!disable && next !== confirm) return Alert.alert('密码不一致', '请重新确认新密码。');
    setBusy(true);
    try { await setPin(value, old); router.back(); }
    catch (error) { Alert.alert('设置失败', error instanceof Error ? error.message : '请重试'); }
    finally { setBusy(false); }
  }
  return <Screen>
    <Title title="隐私锁" subtitle="打开应用时，需要输入 4 位数字密码。" back />
    {hasPin && <><Text style={{ color: colors.muted, marginBottom: 8 }}>当前密码</Text><TextInput value={old} onChangeText={setOld} style={field} keyboardType="number-pad" secureTextEntry maxLength={4} /></>}
    <Text style={{ color: colors.muted, marginBottom: 8 }}>{hasPin ? '新密码' : '设置密码'}</Text>
    <TextInput value={next} onChangeText={setNext} style={field} keyboardType="number-pad" secureTextEntry maxLength={4} />
    <Text style={{ color: colors.muted, marginBottom: 8 }}>再次输入</Text>
    <TextInput value={confirm} onChangeText={setConfirm} style={field} keyboardType="number-pad" secureTextEntry maxLength={4} />
    <PrimaryButton label={busy ? '保存中...' : '保存隐私锁'} disabled={busy} onPress={() => save(next)} />
    {hasPin && <Text onPress={() => save('', true)} style={{ color: '#e9829e', marginTop: 28, textAlign: 'center' }}>关闭隐私锁</Text>}
  </Screen>;
}
