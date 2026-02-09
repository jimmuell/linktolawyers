import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useThemeContext } from '@/contexts/theme-context';
import { useUnreadStore } from '@/stores/unread-store';

export default function AttorneyTabLayout() {
  const { effectiveTheme } = useThemeContext();
  const totalUnread = useUnreadStore((s) => s.totalUnread);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[effectiveTheme].tint,
        headerShown: false,
        tabBarButton: HapticTab,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="browse"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="quotes"
        options={{
          title: 'Quotes',
          tabBarIcon: ({ color }) => <Ionicons name="pricetag" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Messages',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="bubble.left.and.bubble.right.fill" color={color} />
          ),
          tabBarBadge: totalUnread > 0 ? (totalUnread > 99 ? '99+' : totalUnread) : undefined,
        }}
      />
      <Tabs.Screen
        name="cases"
        options={{
          title: 'Cases',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="briefcase.fill" color={color} />,
        }}
      />
    </Tabs>
  );
}
