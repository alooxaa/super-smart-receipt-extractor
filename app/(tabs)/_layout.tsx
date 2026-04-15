import { HapticTab } from '@/components/haptic-tab';
import { useLocale } from '@/context/LocaleContext';
import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, useColorScheme } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

const D = { tabBar: '#0F1828', tabBorder: '#1F3050', active: '#3B82F6', inactive: '#3D5A7A' };
const L = { tabBar: '#FFFFFF', tabBorder: '#DDE4EF', active: '#2563EB', inactive: '#9DB3C8' };

export default function TabLayout() {
  const scheme = useColorScheme() ?? 'dark';
  const tab = scheme === 'dark' ? D : L;
  const { t } = useLocale();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarActiveTintColor: tab.active,
        tabBarInactiveTintColor: tab.inactive,
        tabBarStyle: {
          backgroundColor: tab.tabBar,
          borderTopColor: tab.tabBorder,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 84 : 64,
          paddingBottom: Platform.OS === 'ios' ? 28 : 10,
          paddingTop: 8,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t.tabScanner,
          tabBarIcon: ({ color }) => <MaterialIcons name="document-scanner" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t.tabSettings,
          tabBarIcon: ({ color }) => <MaterialIcons name="settings" size={24} color={color} />,
        }}
      />
      <Tabs.Screen name="explore" options={{ href: null }} />
    </Tabs>
  );
}
