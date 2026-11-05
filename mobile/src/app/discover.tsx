import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HomeSearch } from '@/components/HomeSearch';
import { HomeConcertDiscovery } from '@/components/HomeConcertDiscovery';
import { marketStyles as m } from '@/components/GoodsDemo';
import { responsiveStyles, useResponsiveLayout } from '@/lib/use-responsive-layout';

export default function DiscoverScreen() {
  const { isWide } = useResponsiveLayout();
  return <SafeAreaView edges={['bottom']} style={m.safe}><ScrollView keyboardShouldPersistTaps="handled"
    contentContainerStyle={[m.content, isWide && responsiveStyles.content]}><HomeSearch /><HomeConcertDiscovery expanded /></ScrollView></SafeAreaView>;
}
