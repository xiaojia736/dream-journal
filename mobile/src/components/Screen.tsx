import { ReactNode } from 'react';
import { Pressable, ScrollView, StyleProp, Text, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '../lib/state';

export function Screen({ children, scroll = true, style }: { children: ReactNode; scroll?: boolean; style?: StyleProp<ViewStyle> }) {
  const { theme, colors } = useApp();
  const insets = useSafeAreaInsets();
  const content = scroll ? <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={[{ padding: 20, paddingBottom: insets.bottom + 108 }, style]}>{children}</ScrollView>
    : <View style={[{ flex: 1, padding: 20, paddingBottom: insets.bottom + 20 }, style]}>{children}</View>;
  return <LinearGradient colors={theme === 'dark' ? ['#10162e', '#182343', '#222849'] : ['#f8f8fc', '#f0effa', '#fbf5f3']}
    style={{ flex: 1, paddingTop: insets.top, backgroundColor: colors.bg }}>
    <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
    {content}
  </LinearGradient>;
}

export function Title({ title, subtitle, back = false }: { title: string; subtitle?: string; back?: boolean }) {
  const { colors } = useApp();
  return <View style={{ marginBottom: 24 }}>
    {back && <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="返回" style={{ paddingVertical: 7, marginBottom: 13, alignSelf: 'flex-start' }}><Text style={{ color: colors.primary, fontSize: 15, fontWeight: '700' }}>‹  返回</Text></Pressable>}
    <Text style={{ color: colors.text, fontSize: 30, fontWeight: '900', letterSpacing: 0.7 }}>{title}</Text>
    {!!subtitle && <Text style={{ color: colors.muted, fontSize: 14, marginTop: 7, lineHeight: 22 }}>{subtitle}</Text>}
  </View>;
}

export function PrimaryButton({ label, onPress, disabled = false }: { label: string; onPress: () => void; disabled?: boolean }) {
  const { colors, theme } = useApp();
  return <Pressable disabled={disabled} onPress={onPress} accessibilityRole="button" style={{ backgroundColor: disabled ? colors.muted : colors.primary, paddingVertical: 16, borderRadius: 16, alignItems: 'center', marginTop: 12 }}>
    <Text style={{ color: theme === 'dark' && !disabled ? '#151b35' : '#fff', fontWeight: '800', fontSize: 16 }}>{label}</Text>
  </Pressable>;
}

export function BottomNav({ active }: { active: 'home' | 'stats' | 'settings' }) {
  const { colors } = useApp();
  const insets = useSafeAreaInsets();
  return <View style={{ flexDirection: 'row', borderTopWidth: 1, borderColor: colors.border, backgroundColor: colors.card, paddingBottom: Math.max(insets.bottom, 10), paddingTop: 10 }}>
    {([['home', '✦', '记录', '/'], ['stats', '▦', '图鉴', '/stats'], ['settings', '☷', '设置', '/settings']] as const).map(([key, icon, label, path]) =>
      <Pressable key={key} onPress={() => router.replace(path)} accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ selected: active === key }} style={{ flex: 1, alignItems: 'center', gap: 2 }}>
        <View style={{ backgroundColor: active === key ? colors.soft : 'transparent', width: 46, height: 31, borderRadius: 13, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: active === key ? colors.primary : colors.muted, fontSize: 21, lineHeight: 26 }}>{icon}</Text>
        </View>
        <Text style={{ color: active === key ? colors.primary : colors.muted, fontSize: 11, fontWeight: active === key ? '800' : '500' }}>{label}</Text>
      </Pressable>)}
  </View>;
}
