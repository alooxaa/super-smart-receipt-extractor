import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
  useColorScheme,
  StatusBar,
  Animated,
  Easing,
  Pressable,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useApiConfig } from '@/hooks/useApiConfig';
import { useLocale } from '@/context/LocaleContext';

// ─── Theme ───────────────────────────────────────────────────────────────────
const D = {
  bg: '#080F1C',
  surface: '#0F1828',
  card: '#152033',
  elevated: '#1C2D43',
  border: '#1F3050',
  accent: '#3B82F6',
  accentDim: '#1E3A6E',
  success: '#10B981',
  successDim: '#0A3D2B',
  error: '#EF4444',
  errorDim: '#3D1414',
  text: '#F0F6FF',
  textSub: '#7A9CC0',
  textMuted: '#3D5A7A',
  white: '#FFFFFF',
};
const L = {
  bg: '#F0F4FA',
  surface: '#FFFFFF',
  card: '#FFFFFF',
  elevated: '#F8FAFD',
  border: '#DDE4EF',
  accent: '#2563EB',
  accentDim: '#DBEAFE',
  success: '#059669',
  successDim: '#D1FAE5',
  error: '#DC2626',
  errorDim: '#FEE2E2',
  text: '#0B1729',
  textSub: '#4B6A8A',
  textMuted: '#9DB3C8',
  white: '#FFFFFF',
};

type Theme = typeof D;

// ─── Types ────────────────────────────────────────────────────────────────────
type ScanState = 'idle' | 'preview' | 'loading' | 'result' | 'error';

interface ScanResult {
  doc_id: string;
  status: string;
  full_text: string;
  fields: { company: string; date: string; total: string; address: string };
  metadata: { method: string; duration_ms: number };
}

// ─── Animated Press ───────────────────────────────────────────────────────────
function PressBtn({
  onPress,
  style,
  children,
}: {
  onPress: () => void;
  style?: object;
  children: React.ReactNode;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const press = () => {
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.96, duration: 80, useNativeDriver: true, easing: Easing.out(Easing.ease) }),
      Animated.timing(scale, { toValue: 1, duration: 150, useNativeDriver: true, easing: Easing.out(Easing.ease) }),
    ]).start();
    onPress();
  };
  return (
    <Pressable onPress={press}>
      <Animated.View style={[style, { transform: [{ scale }] }]}>{children}</Animated.View>
    </Pressable>
  );
}

// ─── Scan Line Animation ──────────────────────────────────────────────────────
function ScanLine({ c }: { c: Theme }) {
  const y = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(y, { toValue: 1, duration: 2400, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
        Animated.timing(y, { toValue: 0, duration: 2400, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
      ])
    ).start();
  }, []);
  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: 16,
        right: 16,
        height: 2,
        borderRadius: 1,
        backgroundColor: c.accent,
        opacity: 0.7,
        shadowColor: c.accent,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.9,
        shadowRadius: 6,
        transform: [{ translateY: y.interpolate({ inputRange: [0, 1], outputRange: [0, 260] }) }],
      }}
    />
  );
}

// ─── Field Row ────────────────────────────────────────────────────────────────
function FieldRow({
  icon,
  label,
  value,
  highlight,
  c,
}: {
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
  label: string;
  value: string;
  highlight?: boolean;
  c: Theme;
}) {
  const empty = !value;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12 }}>
      <View style={{
        width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
        backgroundColor: highlight ? c.successDim : c.elevated,
      }}>
        <MaterialIcons name={icon} size={18} color={highlight ? c.success : c.textSub} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 11, fontWeight: '600', color: c.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 3 }}>
          {label}
        </Text>
        <Text style={{ fontSize: 15, fontWeight: highlight ? '700' : '500', color: empty ? c.textMuted : highlight ? c.success : c.text }} numberOfLines={2}>
          {empty ? '—' : value}
        </Text>
      </View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function ScannerScreen() {
  const scheme = useColorScheme() ?? 'dark';
  const c: Theme = scheme === 'dark' ? D : L;
  const insets = useSafeAreaInsets();
  const { apiUrl } = useApiConfig();
  const { t } = useLocale();

  const [scanState, setScanState] = useState<ScanState>('idle');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [showFullText, setShowFullText] = useState(false);

  // Fade animation between states
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const fadeIn = useCallback(() => {
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, { toValue: 1, duration: 320, useNativeDriver: true, easing: Easing.out(Easing.ease) }).start();
  }, [fadeAnim]);

  const transition = useCallback((next: ScanState) => {
    Animated.timing(fadeAnim, { toValue: 0, duration: 160, useNativeDriver: true }).start(() => {
      setScanState(next);
      fadeIn();
    });
  }, [fadeAnim, fadeIn]);

  const requestPerm = async (type: 'camera' | 'library') => {
    if (Platform.OS === 'web') return true;
    if (type === 'camera') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      return status === 'granted';
    }
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    return status === 'granted';
  };

  const pickCamera = useCallback(async () => {
    if (!await requestPerm('camera')) { Alert.alert('', 'Camera permission required'); return; }
    const res = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.7, allowsEditing: true });
    if (!res.canceled && res.assets[0]) {
      setImageUri(res.assets[0].uri); setResult(null); setShowFullText(false); transition('preview');
    }
  }, [transition]);

  const pickGallery = useCallback(async () => {
    if (!await requestPerm('library')) { Alert.alert('', 'Gallery permission required'); return; }
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7, allowsEditing: true });
    if (!res.canceled && res.assets[0]) {
      setImageUri(res.assets[0].uri); setResult(null); setShowFullText(false); transition('preview');
    }
  }, [transition]);

  const scan = useCallback(async () => {
    if (!imageUri) return;
    transition('loading');
    try {
      const formData = new FormData();
      const filename = imageUri.split('/').pop() ?? 'receipt.jpg';
      const ext = filename.split('.').pop()?.toLowerCase() ?? 'jpg';
      formData.append('files', { uri: imageUri, name: filename, type: ext === 'png' ? 'image/png' : 'image/jpeg' } as unknown as Blob);

      const response = await fetch(apiUrl.replace(/\/$/, '') + '/scan_receipts', {
        method: 'POST', body: formData, headers: { Accept: 'application/json' },
      });

      if (!response.ok) {
        const raw = await response.text().catch(() => '');
        let detail = raw;
        try { const p = JSON.parse(raw); detail = p?.detail ?? p?.error ?? raw; } catch {}
        throw new Error(`Server error ${response.status}${detail ? '\n' + detail.slice(0, 100) : ''}`);
      }

      const json = await response.json();
      const results: ScanResult[] = Array.isArray(json) ? json : json.results ?? [];
      if (!results[0]) throw new Error('No result returned from server');
      setResult(results[0]);
      transition('result');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unknown error');
      transition('error');
    }
  }, [imageUri, apiUrl, transition]);

  const reset = useCallback(() => {
    setImageUri(null); setResult(null); setErrorMsg(''); setShowFullText(false); transition('idle');
  }, [transition]);

  return (
    <View style={[styles.root, { backgroundColor: c.bg, paddingTop: insets.top }]}>
      <StatusBar barStyle={scheme === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={c.bg} />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: c.border, backgroundColor: c.surface }]}>
        <View style={styles.headerLeft}>
          <View style={[styles.logoBox, { backgroundColor: c.accent }]}>
            <MaterialIcons name="receipt-long" size={18} color="#fff" />
          </View>
          <Text style={[styles.headerTitle, { color: c.text }]}>{t.appName}</Text>
        </View>
        {(scanState === 'result' || scanState === 'error' || scanState === 'preview') && (
          <PressBtn onPress={reset}>
            <View style={[styles.headerBtn, { backgroundColor: c.elevated, borderColor: c.border }]}>
              <MaterialIcons name="close" size={18} color={c.textSub} />
            </View>
          </PressBtn>
        )}
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={[styles.scroll, { paddingBottom: 40 }]} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Animated.View style={{ opacity: fadeAnim, flex: 1 }}>

          {/* ── IDLE ── */}
          {scanState === 'idle' && (
            <View style={styles.idleWrap}>
              <View style={styles.heroText}>
                <Text style={[styles.heroTitle, { color: c.text }]}>{t.scanTitle}</Text>
                <Text style={[styles.heroSub, { color: c.textSub }]}>{t.scanSubtitle}</Text>
              </View>

              {/* Scan area */}
              <View style={[styles.scanArea, { backgroundColor: c.surface, borderColor: c.border }]}>
                <ScanLine c={c} />
                <View style={[styles.corner, styles.cTL, { borderColor: c.accent }]} />
                <View style={[styles.corner, styles.cTR, { borderColor: c.accent }]} />
                <View style={[styles.corner, styles.cBL, { borderColor: c.accent }]} />
                <View style={[styles.corner, styles.cBR, { borderColor: c.accent }]} />
                <View style={[styles.scanIconWrap, { backgroundColor: c.accentDim }]}>
                  <MaterialIcons name="receipt-long" size={40} color={c.accent} />
                </View>
              </View>

              {/* Buttons */}
              <View style={styles.btnCol}>
                <PressBtn onPress={pickCamera} style={[styles.btn, styles.btnPrimary, { backgroundColor: c.accent }]}>
                  <MaterialIcons name="camera-alt" size={20} color="#fff" />
                  <Text style={styles.btnPrimaryText}>{t.btnCamera}</Text>
                </PressBtn>
                <PressBtn onPress={pickGallery} style={[styles.btn, styles.btnSecondary, { backgroundColor: c.elevated, borderColor: c.border }]}>
                  <MaterialIcons name="photo-library" size={20} color={c.accent} />
                  <Text style={[styles.btnSecondaryText, { color: c.accent }]}>{t.btnGallery}</Text>
                </PressBtn>
              </View>
            </View>
          )}

          {/* ── PREVIEW ── */}
          {scanState === 'preview' && imageUri && (
            <View style={styles.previewWrap}>
              <View style={[styles.imgCard, { backgroundColor: c.surface, borderColor: c.border }]}>
                <Image source={{ uri: imageUri }} style={styles.previewImg} resizeMode="contain" />
              </View>
              <Text style={[styles.hintText, { color: c.textSub }]}>{t.previewHint}</Text>
              <View style={styles.btnCol}>
                <PressBtn onPress={scan} style={[styles.btn, styles.btnPrimary, { backgroundColor: c.accent }]}>
                  <MaterialIcons name="document-scanner" size={20} color="#fff" />
                  <Text style={styles.btnPrimaryText}>{t.btnScan}</Text>
                </PressBtn>
                <TouchableOpacity onPress={reset} style={styles.ghostBtn}>
                  <Text style={[styles.ghostBtnText, { color: c.textSub }]}>{t.btnChooseAnother}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* ── LOADING ── */}
          {scanState === 'loading' && imageUri && (
            <View style={styles.previewWrap}>
              <View style={[styles.imgCard, { backgroundColor: c.surface, borderColor: c.border }]}>
                <Image source={{ uri: imageUri }} style={[styles.previewImg, { opacity: 0.35 }]} resizeMode="contain" />
                <View style={StyleSheet.absoluteFill}>
                  <View style={[styles.loadingOverlay, { backgroundColor: c.bg + 'AA' }]}>
                    <View style={[styles.loadingCard, { backgroundColor: c.surface, borderColor: c.border }]}>
                      <ActivityIndicator size="large" color={c.accent} />
                      <Text style={[styles.loadingTitle, { color: c.text }]}>{t.loadingTitle}</Text>
                      <Text style={[styles.loadingSub, { color: c.textSub }]}>{t.loadingSubtitle}</Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* ── RESULT ── */}
          {scanState === 'result' && result && (
            <View style={styles.resultWrap}>

              {/* Thumbnail + badge row */}
              <View style={styles.resultTopRow}>
                {imageUri && (
                  <Image source={{ uri: imageUri }} style={[styles.thumb, { borderColor: c.border }]} />
                )}
                <View style={styles.resultMeta}>
                  <View style={[styles.statusBadge, { backgroundColor: result.status === 'ok' ? c.successDim : c.errorDim }]}>
                    <MaterialIcons name={result.status === 'ok' ? 'check-circle' : 'error'} size={13} color={result.status === 'ok' ? c.success : c.error} />
                    <Text style={[styles.statusText, { color: result.status === 'ok' ? c.success : c.error }]}>{t.resultSuccess}</Text>
                  </View>
                  <Text style={[styles.metaLine, { color: c.textMuted }]}>
                    {result.metadata.duration_ms}{t.durationMs} · {result.metadata.method}
                  </Text>
                </View>
              </View>

              {/* Total — hero number */}
              <View style={[styles.totalCard, { backgroundColor: c.successDim, borderColor: c.success + '40' }]}>
                <Text style={[styles.totalLabel, { color: c.success }]}>{t.fieldTotal}</Text>
                <Text style={[styles.totalAmount, { color: result.fields.total ? c.success : c.textMuted }]}>
                  {result.fields.total || '—'}
                </Text>
              </View>

              {/* Other fields */}
              <View style={[styles.fieldsCard, { backgroundColor: c.card, borderColor: c.border }]}>
                <FieldRow icon="store" label={t.fieldCompany} value={result.fields.company} c={c} />
                <View style={[styles.div, { backgroundColor: c.border }]} />
                <FieldRow icon="location-on" label={t.fieldAddress} value={result.fields.address} c={c} />
                <View style={[styles.div, { backgroundColor: c.border }]} />
                <FieldRow icon="calendar-today" label={t.fieldDate} value={result.fields.date} c={c} />
              </View>

              {/* Full text */}
              {result.full_text ? (
                <View style={[styles.fieldsCard, { backgroundColor: c.card, borderColor: c.border }]}>
                  <TouchableOpacity style={styles.fullTextHeader} onPress={() => setShowFullText(v => !v)}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <MaterialIcons name="article" size={16} color={c.textSub} />
                      <Text style={[styles.fullTextLabel, { color: c.textSub }]}>{t.fullText}</Text>
                    </View>
                    <MaterialIcons name={showFullText ? 'expand-less' : 'expand-more'} size={20} color={c.textMuted} />
                  </TouchableOpacity>
                  {showFullText && (
                    <>
                      <View style={[styles.div, { backgroundColor: c.border }]} />
                      <Text style={[styles.fullTextBody, { color: c.textSub }]}>{result.full_text}</Text>
                    </>
                  )}
                </View>
              ) : null}

              <PressBtn onPress={reset} style={[styles.btn, styles.btnPrimary, { backgroundColor: c.accent, marginTop: 4 }]}>
                <MaterialIcons name="add-a-photo" size={20} color="#fff" />
                <Text style={styles.btnPrimaryText}>{t.btnScanAnother}</Text>
              </PressBtn>
            </View>
          )}

          {/* ── ERROR ── */}
          {scanState === 'error' && (
            <View style={styles.errorWrap}>
              <View style={[styles.errorIconWrap, { backgroundColor: c.errorDim }]}>
                <MaterialIcons name="error-outline" size={44} color={c.error} />
              </View>
              <Text style={[styles.errorTitle, { color: c.text }]}>{t.errorTitle}</Text>
              <Text style={[styles.errorMsg, { color: c.textSub }]}>{errorMsg}</Text>
              <View style={styles.btnCol}>
                <PressBtn onPress={() => transition('preview')} style={[styles.btn, styles.btnPrimary, { backgroundColor: c.accent }]}>
                  <MaterialIcons name="refresh" size={20} color="#fff" />
                  <Text style={styles.btnPrimaryText}>{t.btnTryAgain}</Text>
                </PressBtn>
                <TouchableOpacity onPress={reset} style={styles.ghostBtn}>
                  <Text style={[styles.ghostBtnText, { color: c.textSub }]}>{t.btnChooseAnother}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

        </Animated.View>
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 13, borderBottomWidth: 1,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoBox: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', letterSpacing: -0.4 },
  headerBtn: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },

  scroll: { paddingHorizontal: 20, paddingTop: 24 },

  // Idle
  idleWrap: { gap: 24 },
  heroText: { gap: 6 },
  heroTitle: { fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
  heroSub: { fontSize: 15, lineHeight: 22 },
  scanArea: {
    width: '100%', height: 300, borderRadius: 20, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  corner: { position: 'absolute', width: 24, height: 24, borderWidth: 2.5 },
  cTL: { top: 14, left: 14, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 8 },
  cTR: { top: 14, right: 14, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 8 },
  cBL: { bottom: 14, left: 14, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 8 },
  cBR: { bottom: 14, right: 14, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 8 },
  scanIconWrap: { width: 80, height: 80, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },

  // Preview / Loading
  previewWrap: { gap: 20 },
  imgCard: { borderRadius: 20, borderWidth: 1, overflow: 'hidden', height: 320 },
  previewImg: { width: '100%', height: '100%' },
  hintText: { fontSize: 14, textAlign: 'center' },
  loadingOverlay: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingCard: {
    borderRadius: 20, borderWidth: 1, paddingHorizontal: 28, paddingVertical: 24,
    alignItems: 'center', gap: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 10,
  },
  loadingTitle: { fontSize: 16, fontWeight: '700' },
  loadingSub: { fontSize: 13 },

  // Result
  resultWrap: { gap: 14 },
  resultTopRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  thumb: { width: 72, height: 72, borderRadius: 14, borderWidth: 1 },
  resultMeta: { flex: 1, gap: 6 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, alignSelf: 'flex-start' },
  statusText: { fontSize: 12, fontWeight: '700' },
  metaLine: { fontSize: 12 },
  totalCard: {
    borderRadius: 18, borderWidth: 1, paddingHorizontal: 20, paddingVertical: 18, gap: 4,
  },
  totalLabel: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  totalAmount: { fontSize: 36, fontWeight: '800', letterSpacing: -1 },
  fieldsCard: { borderRadius: 18, borderWidth: 1, overflow: 'hidden' },
  div: { height: 1, marginLeft: 64 },
  fullTextHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 },
  fullTextLabel: { fontSize: 14, fontWeight: '600' },
  fullTextBody: { fontSize: 13, lineHeight: 20, paddingHorizontal: 16, paddingBottom: 16, fontFamily: Platform.select({ ios: 'Courier', android: 'monospace', default: 'monospace' }) },

  // Error
  errorWrap: { alignItems: 'center', paddingTop: 48, gap: 12 },
  errorIconWrap: { width: 88, height: 88, borderRadius: 44, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  errorTitle: { fontSize: 22, fontWeight: '800' },
  errorMsg: { fontSize: 14, textAlign: 'center', paddingHorizontal: 24, lineHeight: 20 },

  // Buttons
  btnCol: { gap: 12 },
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, borderRadius: 16, paddingVertical: 16 },
  btnPrimary: { shadowColor: '#3B82F6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 6 },
  btnPrimaryText: { fontSize: 16, fontWeight: '700', color: '#fff', letterSpacing: 0.2 },
  btnSecondary: { borderWidth: 1.5 },
  btnSecondaryText: { fontSize: 16, fontWeight: '600' },
  ghostBtn: { alignItems: 'center', paddingVertical: 10 },
  ghostBtnText: { fontSize: 15, fontWeight: '500' },
});
