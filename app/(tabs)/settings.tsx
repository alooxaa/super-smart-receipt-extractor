import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, useColorScheme, Alert, StatusBar, Pressable, Animated, Easing,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useApiConfig } from '@/hooks/useApiConfig';
import { useLocale } from '@/context/LocaleContext';
import type { Locale } from '@/i18n';

// ─── Theme (same tokens as Scanner screen) ────────────────────────────────────
const D = {
  bg: '#080F1C', surface: '#0F1828', card: '#152033', elevated: '#1C2D43',
  border: '#1F3050', accent: '#3B82F6', accentDim: '#1E3A6E',
  success: '#10B981', successDim: '#0A3D2B',
  text: '#F0F6FF', textSub: '#7A9CC0', textMuted: '#3D5A7A', white: '#FFFFFF',
};
const L = {
  bg: '#F0F4FA', surface: '#FFFFFF', card: '#FFFFFF', elevated: '#F8FAFD',
  border: '#DDE4EF', accent: '#2563EB', accentDim: '#DBEAFE',
  success: '#059669', successDim: '#D1FAE5',
  text: '#0B1729', textSub: '#4B6A8A', textMuted: '#9DB3C8', white: '#FFFFFF',
};
type Theme = typeof D;

// Language options
const LANGS: { key: Locale; flag: string; native: string }[] = [
  { key: 'ru', flag: '🇷🇺', native: 'Русский' },
  { key: 'en', flag: '🇺🇸', native: 'English' },
  { key: 'kk', flag: '🇰🇿', native: 'Қазақша' },
];

function SettingRow({ icon, iconColor, label, sub, right, c, onPress }: {
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
  iconColor: string;
  label: string;
  sub?: string;
  right?: React.ReactNode;
  c: Theme;
  onPress?: () => void;
}) {
  const Wrap = onPress ? TouchableOpacity : View;
  return (
    <Wrap onPress={onPress} style={[rowStyles.row, { borderColor: c.border }]} activeOpacity={0.7}>
      <View style={[rowStyles.iconBox, { backgroundColor: iconColor + '20' }]}>
        <MaterialIcons name={icon} size={17} color={iconColor} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={[rowStyles.label, { color: c.text }]}>{label}</Text>
        {sub ? <Text style={[rowStyles.sub, { color: c.textMuted }]}>{sub}</Text> : null}
      </View>
      {right}
    </Wrap>
  );
}

const rowStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  iconBox: { width: 34, height: 34, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 15, fontWeight: '500' },
  sub: { fontSize: 12 },
});

export default function SettingsScreen() {
  const scheme = useColorScheme() ?? 'dark';
  const c: Theme = scheme === 'dark' ? D : L;
  const insets = useSafeAreaInsets();
  const { apiUrl, setApiUrl } = useApiConfig();
  const { t, locale, setLocale } = useLocale();

  const [inputUrl, setInputUrl] = useState(apiUrl);
  const [saved, setSaved] = useState(false);
  const [focused, setFocused] = useState(false);
  const saveScale = useState(new Animated.Value(1))[0];

  useEffect(() => { setInputUrl(apiUrl); }, [apiUrl]);

  const handleSave = () => {
    const trimmed = inputUrl.trim();
    if (!trimmed) { Alert.alert(t.invalidUrl, t.invalidUrlMsg); return; }
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      Alert.alert(t.invalidUrl, t.invalidUrlHttp); return;
    }
    setApiUrl(trimmed);
    setSaved(true);
    Animated.sequence([
      Animated.timing(saveScale, { toValue: 0.94, duration: 80, useNativeDriver: true, easing: Easing.out(Easing.ease) }),
      Animated.timing(saveScale, { toValue: 1, duration: 200, useNativeDriver: true, easing: Easing.out(Easing.ease) }),
    ]).start();
    setTimeout(() => setSaved(false), 2200);
  };

  return (
    <View style={[styles.root, { backgroundColor: c.bg, paddingTop: insets.top }]}>
      <StatusBar barStyle={scheme === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={c.bg} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: c.surface, borderBottomColor: c.border }]}>
        <View style={styles.headerLeft}>
          <View style={[styles.logoBox, { backgroundColor: c.elevated, borderColor: c.border }]}>
            <MaterialIcons name="settings" size={17} color={c.textSub} />
          </View>
          <Text style={[styles.headerTitle, { color: c.text }]}>{t.settingsTitle}</Text>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={[styles.scroll, { paddingBottom: 48 }]} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* ── Language ── */}
        <Text style={[styles.sectionLabel, { color: c.textMuted }]}>{t.sectionLanguage}</Text>
        <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
          <View style={styles.langGrid}>
            {LANGS.map(({ key, flag, native }) => {
              const active = locale === key;
              return (
                <Pressable key={key} onPress={() => setLocale(key)} style={({ pressed }) => [
                  styles.langBtn,
                  { backgroundColor: active ? c.accentDim : c.elevated, borderColor: active ? c.accent : c.border, opacity: pressed ? 0.75 : 1 },
                ]}>
                  <Text style={styles.langFlag}>{flag}</Text>
                  <Text style={[styles.langNative, { color: active ? c.accent : c.text }]}>{native}</Text>
                  {active && <View style={[styles.langDot, { backgroundColor: c.accent }]} />}
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* ── API Connection ── */}
        <Text style={[styles.sectionLabel, { color: c.textMuted }]}>{t.sectionConnection}</Text>
        <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
          <SettingRow icon="cloud" iconColor={c.accent} label={t.apiEndpointLabel} sub={t.apiEndpointHint} c={c} />
          <View style={[styles.divider, { backgroundColor: c.border }]} />

          {/* Input */}
          <View style={styles.inputWrap}>
            <View style={[styles.inputBox, { backgroundColor: c.elevated, borderColor: focused ? c.accent : c.border }]}>
              <MaterialIcons name="link" size={17} color={focused ? c.accent : c.textMuted} />
              <TextInput
                style={[styles.input, { color: c.text }]}
                value={inputUrl}
                onChangeText={setInputUrl}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                placeholder="https://your-backend.com"
                placeholderTextColor={c.textMuted}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
                returnKeyType="done"
                onSubmitEditing={handleSave}
              />
            </View>
          </View>

          <View style={styles.inputWrap}>
            <Animated.View style={{ transform: [{ scale: saveScale }] }}>
              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: saved ? c.success : c.accent }]}
                onPress={handleSave}
                activeOpacity={0.85}
              >
                <MaterialIcons name={saved ? 'check' : 'save'} size={17} color="#fff" />
                <Text style={styles.saveBtnText}>{saved ? t.btnSaved : t.btnSave}</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </View>

        {/* ── About ── */}
        <Text style={[styles.sectionLabel, { color: c.textMuted }]}>{t.sectionAbout}</Text>
        <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
          <SettingRow icon="receipt-long" iconColor="#8B5CF6" label={t.appName}
            right={<Text style={{ fontSize: 13, color: c.textMuted }}>v1.0</Text>} c={c} />
          <View style={[styles.divider, { backgroundColor: c.border }]} />
          <SettingRow icon="document-scanner" iconColor={c.success} label={t.aboutEngine}
            right={<Text style={{ fontSize: 13, color: c.textSub }}>PaddleOCR + VLM</Text>} c={c} />
          <View style={[styles.divider, { backgroundColor: c.border }]} />
          <SettingRow icon="dataset" iconColor="#F59E0B" label={t.aboutDataset}
            right={<Text style={{ fontSize: 13, color: c.textSub }}>SROIE</Text>} c={c} />
        </View>

        {/* ── How it works ── */}
        <Text style={[styles.sectionLabel, { color: c.textMuted }]}>{t.sectionHowItWorks}</Text>
        <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
          {[t.step1, t.step2, t.step3, t.step4].map((step, i) => (
            <React.Fragment key={i}>
              {i > 0 && <View style={[styles.divider, { backgroundColor: c.border, marginLeft: 62 }]} />}
              <View style={[rowStyles.row]}>
                <View style={[styles.stepBadge, { backgroundColor: c.accentDim }]}>
                  <Text style={[styles.stepNum, { color: c.accent }]}>{i + 1}</Text>
                </View>
                <Text style={[styles.stepText, { color: c.text }]}>{step}</Text>
              </View>
            </React.Fragment>
          ))}
        </View>

        <Text style={[styles.footer, { color: c.textMuted }]}>{t.footerText}</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 13, borderBottomWidth: 1 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoBox: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  headerTitle: { fontSize: 18, fontWeight: '700', letterSpacing: -0.4 },
  scroll: { paddingHorizontal: 20, paddingTop: 24 },
  sectionLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, marginLeft: 4 },
  card: { borderRadius: 18, borderWidth: 1, overflow: 'hidden', marginBottom: 24 },
  divider: { height: 1 },
  // Language
  langGrid: { flexDirection: 'row', padding: 12, gap: 10 },
  langBtn: { flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 14, borderWidth: 1.5, gap: 6, position: 'relative' },
  langFlag: { fontSize: 22 },
  langNative: { fontSize: 12, fontWeight: '600' },
  langDot: { position: 'absolute', top: 8, right: 8, width: 6, height: 6, borderRadius: 3 },
  // Input
  inputWrap: { paddingHorizontal: 14, paddingBottom: 14 },
  inputBox: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 13, borderWidth: 1.5, paddingHorizontal: 13, height: 46 },
  input: { flex: 1, fontSize: 14, height: '100%' },
  saveBtn: { borderRadius: 13, height: 46, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  saveBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  // Steps
  stepBadge: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  stepNum: { fontSize: 13, fontWeight: '800' },
  stepText: { flex: 1, fontSize: 14, lineHeight: 20 },
  footer: { fontSize: 12, textAlign: 'center', marginTop: 4 },
});
