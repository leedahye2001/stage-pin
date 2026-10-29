import Ionicons from '@expo/vector-icons/Ionicons';
import { NativeTabs } from 'expo-router/native-tabs';
import type { ColorValue } from 'react-native';

import { colors } from '@/theme/tokens';

type IconName = keyof typeof Ionicons.glyphMap;
// Native SF Symbols have no public size prop; supply 21pt template images instead.
const smallIcons = { getImageSource: (name: IconName, _size: number, color: ColorValue) => Ionicons.getImageSource(name, 21, color) };
const tabIcon = (normal: IconName, selected: IconName) => ({
  default: <NativeTabs.Trigger.VectorIcon family={smallIcons} name={normal} />,
  selected: <NativeTabs.Trigger.VectorIcon family={smallIcons} name={selected} />,
});

/** UIKit owns the selection lens, touch tracking, Liquid Glass, and item insets. */
export default function AppTabs() {
  return <NativeTabs tintColor={colors.primary} minimizeBehavior="never" sidebarAdaptable={false}
    iconColor={{ default: colors.textMuted, selected: colors.primary }}
    labelStyle={{ default: { fontSize: 10, fontWeight: '600', color: colors.textMuted }, selected: { fontSize: 10, fontWeight: '700', color: colors.primary } }}>
    <NativeTabs.Trigger name="index" contentStyle={{ backgroundColor: colors.background }}>
      <NativeTabs.Trigger.Icon src={tabIcon('home-outline', 'home')} renderingMode="template" />
      <NativeTabs.Trigger.Label>홈</NativeTabs.Trigger.Label>
    </NativeTabs.Trigger>
    <NativeTabs.Trigger name="schedule" contentStyle={{ backgroundColor: colors.background }}>
      <NativeTabs.Trigger.Icon src={tabIcon('calendar-outline', 'calendar')} renderingMode="template" />
      <NativeTabs.Trigger.Label>일정</NativeTabs.Trigger.Label>
    </NativeTabs.Trigger>
    <NativeTabs.Trigger name="goods" contentStyle={{ backgroundColor: colors.background }}>
      <NativeTabs.Trigger.Icon src={tabIcon('bag-handle-outline', 'bag-handle')} renderingMode="template" />
      <NativeTabs.Trigger.Label>굿즈</NativeTabs.Trigger.Label>
    </NativeTabs.Trigger>
    <NativeTabs.Trigger name="my" contentStyle={{ backgroundColor: colors.background }}>
      <NativeTabs.Trigger.Icon src={tabIcon('person-outline', 'person')} renderingMode="template" />
      <NativeTabs.Trigger.Label>MY</NativeTabs.Trigger.Label>
    </NativeTabs.Trigger>
  </NativeTabs>;
}
