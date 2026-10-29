import { NativeTabs } from 'expo-router/native-tabs';

import { colors } from '@/theme/tokens';

/** UIKit owns the selection lens, touch tracking, Liquid Glass, and item insets. */
export default function AppTabs() {
  return <NativeTabs tintColor={colors.primary} minimizeBehavior="never" sidebarAdaptable={false}
    iconColor={{ default: colors.textMuted, selected: colors.primary }}
    labelStyle={{ default: { fontSize: 10, fontWeight: '600', color: colors.textMuted }, selected: { fontSize: 10, fontWeight: '700', color: colors.primary } }}>
    <NativeTabs.Trigger name="index" contentStyle={{ backgroundColor: colors.background }}>
      <NativeTabs.Trigger.Icon sf={{ default: 'house', selected: 'house.fill' }} />
      <NativeTabs.Trigger.Label>홈</NativeTabs.Trigger.Label>
    </NativeTabs.Trigger>
    <NativeTabs.Trigger name="schedule" contentStyle={{ backgroundColor: colors.background }}>
      <NativeTabs.Trigger.Icon sf="calendar" />
      <NativeTabs.Trigger.Label>일정</NativeTabs.Trigger.Label>
    </NativeTabs.Trigger>
    <NativeTabs.Trigger name="goods" contentStyle={{ backgroundColor: colors.background }}>
      <NativeTabs.Trigger.Icon sf={{ default: 'bag', selected: 'bag.fill' }} />
      <NativeTabs.Trigger.Label>굿즈</NativeTabs.Trigger.Label>
    </NativeTabs.Trigger>
    <NativeTabs.Trigger name="my" contentStyle={{ backgroundColor: colors.background }}>
      <NativeTabs.Trigger.Icon sf={{ default: 'person.crop.circle', selected: 'person.crop.circle.fill' }} />
      <NativeTabs.Trigger.Label>MY</NativeTabs.Trigger.Label>
    </NativeTabs.Trigger>
  </NativeTabs>;
}
