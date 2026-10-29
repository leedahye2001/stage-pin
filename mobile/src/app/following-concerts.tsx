import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HomeStageSchedule } from '@/components/HomeStageSchedule';
import { marketStyles } from '@/components/GoodsDemo';
import { responsiveStyles, useResponsiveLayout } from '@/lib/use-responsive-layout';

export default function FollowingConcertsScreen() {
  const { isWide } = useResponsiveLayout();
  return <SafeAreaView edges={['bottom']} style={marketStyles.safe}>
    <ScrollView contentContainerStyle={[marketStyles.content, isWide && responsiveStyles.content]}>
      <HomeStageSchedule showAll />
    </ScrollView>
  </SafeAreaView>;
}
