import Ionicons from '@expo/vector-icons/Ionicons';
import { NativeTabs } from 'expo-router/native-tabs';
import { useEffect, useState } from 'react';

import { colors } from '@/theme/tokens';
import { loadTabIconImages } from '@/lib/tab-icons';

/** UIKit owns the selection lens, touch tracking, Liquid Glass, and item insets. */
export default function AppTabs() {
  const [icons, setIcons] = useState<Awaited<ReturnType<typeof loadTabIconImages>> | null>(null);
  useEffect(() => {
    let mounted = true;
    // Publish both states together: RNScreens crashes if only selectedIcon has resolved.
    loadTabIconImages((name, size) => Ionicons.getImageSource(name, size, 'white'))
      .then((images) => { if (mounted) setIcons(images); })
      .catch(() => { /* Keep synchronous system symbols if font/image loading fails. */ });
    return () => { mounted = false; };
  }, []);
  return <NativeTabs tintColor={colors.primary} minimizeBehavior="never" sidebarAdaptable={false}
    iconColor={{ default: colors.textMuted, selected: colors.primary }}
    labelStyle={{ default: { fontSize: 10, fontWeight: '600', color: colors.textMuted }, selected: { fontSize: 10, fontWeight: '700', color: colors.primary } }}>
    <NativeTabs.Trigger name="index" contentStyle={{ backgroundColor: colors.background }}>
      {icons ? <NativeTabs.Trigger.Icon src={icons[0]} renderingMode="template" /> : <NativeTabs.Trigger.Icon sf={{ default: 'house', selected: 'house.fill' }} />}
      <NativeTabs.Trigger.Label>홈</NativeTabs.Trigger.Label>
    </NativeTabs.Trigger>
    <NativeTabs.Trigger name="schedule" contentStyle={{ backgroundColor: colors.background }}>
      {icons ? <NativeTabs.Trigger.Icon src={icons[1]} renderingMode="template" /> : <NativeTabs.Trigger.Icon sf="calendar" />}
      <NativeTabs.Trigger.Label>일정</NativeTabs.Trigger.Label>
    </NativeTabs.Trigger>
    <NativeTabs.Trigger name="goods" contentStyle={{ backgroundColor: colors.background }}>
      {icons ? <NativeTabs.Trigger.Icon src={icons[2]} renderingMode="template" /> : <NativeTabs.Trigger.Icon sf={{ default: 'bag', selected: 'bag.fill' }} />}
      <NativeTabs.Trigger.Label>굿즈</NativeTabs.Trigger.Label>
    </NativeTabs.Trigger>
    <NativeTabs.Trigger name="my" contentStyle={{ backgroundColor: colors.background }}>
      {icons ? <NativeTabs.Trigger.Icon src={icons[3]} renderingMode="template" /> : <NativeTabs.Trigger.Icon sf={{ default: 'person.crop.circle', selected: 'person.crop.circle.fill' }} />}
      <NativeTabs.Trigger.Label>MY</NativeTabs.Trigger.Label>
    </NativeTabs.Trigger>
  </NativeTabs>;
}
