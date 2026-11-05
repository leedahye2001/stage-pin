import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { getTicketOpenings } from '@/api/concerts';
import { TicketingCarousel } from '@/components/TicketingCarousel';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { marketStyles as m } from '@/components/GoodsDemo';
import { upcomingOpenings } from '@/lib/home-discovery';

export function HomeTicketOpenings() {
  const [type, setType] = useState<'FAN_PRESALE' | 'GENERAL_SALE'>('FAN_PRESALE');
  const [now] = useState(Date.now);
  const query = useQuery({ queryKey: ['ticket-openings'], queryFn: getTicketOpenings, retry: false });
  const items = upcomingOpenings(query.data ?? [], now);
  if (query.isPending) return <LoadingSkeleton kind="schedule" label="예매 오픈 일정 불러오는 중" />;
  if (query.isError) return <Pressable accessibilityRole="button" onPress={() => void query.refetch()}><Text style={m.subtitle}>예매 일정을 불러오지 못했어요. 다시 시도</Text></Pressable>;
  if (!items.length) return null;
  const available = items.some(item => item.type === type) ? type : items[0].type as typeof type;
  return <View style={m.section}>
    <Text style={m.sectionTitle}>곧 티켓 오픈</Text>
    <View style={m.row}>{([{ id: 'FAN_PRESALE', label: '선예매' }, { id: 'GENERAL_SALE', label: '일반예매' }] as const)
      .filter(tab => items.some(item => item.type === tab.id)).map(tab => <Pressable key={tab.id} accessibilityRole="button"
        accessibilityLabel={`${tab.label} 오픈 일정`} accessibilityState={{ selected: available === tab.id }} onPress={() => setType(tab.id)}
        style={[m.chip, available === tab.id && m.chipSelected]}><Text style={[m.chipText, available === tab.id && m.chipSelectedText]}>{tab.label}</Text></Pressable>)}</View>
    <TicketingCarousel openings={items} scheduleType={available} title="곧 티켓 오픈" compact />
  </View>;
}
