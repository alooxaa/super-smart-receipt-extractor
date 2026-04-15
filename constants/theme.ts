import { Platform } from 'react-native';

export const Colors = {
  light: {
    background: '#F8FAFC',
    surface: '#FFFFFF',
    surfaceSecondary: '#F1F5F9',
    border: '#E2E8F0',
    borderFocus: '#38BDF8',
    text: '#0F172A',
    textSecondary: '#64748B',
    textMuted: '#94A3B8',
    tint: '#0EA5E9',
    accent: '#38BDF8',
    success: '#22C55E',
    error: '#EF4444',
    warning: '#F59E0B',
    icon: '#64748B',
    tabIconDefault: '#94A3B8',
    tabIconSelected: '#0EA5E9',
    tabBar: '#FFFFFF',
    tabBarBorder: '#E2E8F0',
    scanArea: '#EFF6FF',
    scanBorder: '#BFDBFE',
    overlay: 'rgba(15, 23, 42, 0.5)',
  },
  dark: {
    background: '#0F172A',
    surface: '#1E293B',
    surfaceSecondary: '#0F172A',
    border: '#334155',
    borderFocus: '#38BDF8',
    text: '#F1F5F9',
    textSecondary: '#94A3B8',
    textMuted: '#64748B',
    tint: '#38BDF8',
    accent: '#38BDF8',
    success: '#22C55E',
    error: '#EF4444',
    warning: '#F59E0B',
    icon: '#94A3B8',
    tabIconDefault: '#64748B',
    tabIconSelected: '#38BDF8',
    tabBar: '#1E293B',
    tabBarBorder: '#334155',
    scanArea: '#1E293B',
    scanBorder: '#334155',
    overlay: 'rgba(0, 0, 0, 0.6)',
  },
};

export type ColorScheme = 'light' | 'dark';
export type ThemeColors = typeof Colors.light;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
