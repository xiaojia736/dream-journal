import { Stack } from 'expo-router';
import { useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PrimaryButton, Screen } from '../components/Screen';
import { AppProvider, useApp } from '../lib/state';

function AppRoutes() {
  const { loading, locked, colors, unlock } = useApp();
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  if (!loading && locked) return <Screen>
    <View style={{ alignItems: 'center', marginTop: 115 }}>
      <Text style={{ fontSize: 55 }}>🔒</Text>
      <Text style={{ color: colors.text, fontSize: 28, fontWeight: '800', marginTop: 18 }}>星海暂时上锁</Text>
      <Text style={{ color: colors.muted, marginTop: 8 }}>输入 4 位隐私密码</Text>
    </View>
    <TextInput value={value} onChangeText={text => { setValue(text.replace(/\D/g, '').slice(0, 4)); setError(''); }}
      keyboardType="number-pad" secureTextEntry maxLength={4} placeholder="••••" placeholderTextColor={colors.muted}
      style={{ color: colors.text, backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: 16, padding: 15, textAlign: 'center', fontSize: 25, letterSpacing: 12, marginTop: 36 }} />
    {!!error && <Text style={{ color: '#e9829e', marginTop: 12, textAlign: 'center' }}>{error}</Text>}
    <PrimaryButton label="解锁" onPress={() => { if (unlock(value)) { setValue(''); setError(''); } else { setValue(''); setError('密码不正确'); } }} />
  </Screen>;
  return <Stack screenOptions={{ headerShown: false }} />;
}

export default function RootLayout() {
  return <SafeAreaProvider><AppProvider><AppRoutes /></AppProvider></SafeAreaProvider>;
}
