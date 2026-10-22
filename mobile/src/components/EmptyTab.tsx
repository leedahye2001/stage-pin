import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, radius, spacing, typography } from '@/theme/tokens';

type EmptyTabProps = {
  icon: ComponentProps<typeof Ionicons>['name'];
  title: string;
  description: string;
};

export function EmptyTab({ icon, title, description }: EmptyTabProps) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.iconBox}>
        <Ionicons color={colors.primary} name={icon} size={28} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    alignItems: 'center',
    backgroundColor: colors.background,
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  iconBox: {
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
    height: 56,
    justifyContent: 'center',
    width: 56,
  },
  title: {
    color: colors.text,
    fontSize: typography.title,
    fontWeight: '900',
    marginTop: spacing.md,
  },
  description: {
    color: colors.textMuted,
    lineHeight: 21,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
});
