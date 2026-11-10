import { router } from "expo-router";
import { useQuery } from '@tanstack/react-query';
import { useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { GoodsCard, marketStyles as m } from "@/components/GoodsDemo";
import { HomeSearch } from "@/components/HomeSearch";
import { HomeHeroCarousel } from "@/components/HomeHeroCarousel";
import { HomeConcertDiscovery } from '@/components/HomeConcertDiscovery';
import { HomeTicketOpenings } from '@/components/HomeTicketOpenings';
import { HomeStageSchedule } from "@/components/HomeStageSchedule";
import { useGoods } from "@/lib/goods-state";
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { colors } from "@/theme/tokens";
import { getHomeConcerts } from '@/api/concerts';
import { getCurrentMember } from '@/api/auth';
import { discoveryConcerts, homeConcertAudience } from '@/lib/home-discovery';
import { useFavorites } from '@/lib/favorites';
import { useResponsiveLayout, responsiveStyles } from "@/lib/use-responsive-layout";

export default function FanHomeScreen() {
  const layout = useResponsiveLayout();
  const [kind, setKind] = useState("전체");
  const [now] = useState(Date.now);
  const { items, loading, error, refresh } = useGoods();
  const { artists, ready } = useFavorites();
  const member = useQuery({ queryKey: ['current-member'], queryFn: getCurrentMember, retry: false });
  const audience = homeConcertAudience(member.data?.id, ready, artists.length);
  const publicConcerts = useQuery({ queryKey: ['home-discovery'], queryFn: getHomeConcerts, staleTime: 300000, retry: false });
  const shows = discoveryConcerts(publicConcerts.data ?? [], now);
  const goods = items
    .filter((item) => kind === "전체" || item.kind === kind)
    .slice(0, layout.isDesktop ? 8 : 6);
  const exchanges = items.filter(
    (item) =>
      item.kind === "교환" && item.event && item.methods.includes("현장"),
  );
  const openGoods = (
    artistFilter = "전체",
    kindFilter = "전체",
    onsite = false,
  ) =>
    router.push({
      pathname: "/goods",
      params: {
        artist: artistFilter,
        kind: kindFilter,
        method: onsite ? "현장" : "",
      },
    });
  return (
    <SafeAreaView edges={["top"]} style={m.safe}>
      <ScrollView
        contentContainerStyle={[m.content, layout.isWide && responsiveStyles.content]}
        stickyHeaderIndices={layout.isWide ? [] : [1]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[m.between, layout.isWide && { display: 'none' }]}>
          <View style={m.row}>
            <Image
              source={require("../../../assets/stagepin-pin.png")}
              accessibilityLabel="스테이지핀 로고"
              style={s.brandMark}
            />
            <Text style={s.brand}>
              stagepin
            </Text>
          </View>
        </View>
        {!layout.isWide ? <HomeSearch /> : null}
        <HomeHeroCarousel concerts={shows} pending={publicConcerts.isPending} />
        <HomeTicketOpenings />
        {audience === 'following' ? <HomeStageSchedule compact /> : <HomeConcertDiscovery />}
        <View style={m.section}>
          <View style={m.between}>
            <Text style={m.sectionTitle}>새로 올라온 굿즈</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="굿즈 전체 보기"
              onPress={() => openGoods("전체", kind)}
            >
              <Text style={m.sectionLink}>{'전체 보기 >'}</Text>
            </Pressable>
          </View>
          <View style={m.row}>
            {["전체", "판매", "교환"].map((value) => (
              <Pressable
                key={value}
                accessibilityRole="button"
                accessibilityLabel={`홈 ${value} 굿즈 보기`}
                accessibilityState={{ selected: kind === value }}
                onPress={() => setKind(value)}
                style={[m.chip, kind === value && m.chipSelected]}
              >
                <Text
                  style={[m.chipText, kind === value && m.chipSelectedText]}
                >
                  {value}
                </Text>
              </Pressable>
            ))}
          </View>
          <View style={m.grid}>
            {loading ? <LoadingSkeleton label="굿즈 불러오는 중" /> : null}
            {error ? <Pressable accessibilityRole="button" onPress={refresh}><Text style={m.subtitle}>{error} 다시 시도</Text></Pressable> : null}
            {!loading && !error && !goods.length ? <View style={s.goodsEmpty}><Text style={m.subtitle}>아직 등록된 굿즈가 없어요.</Text><Pressable accessibilityRole="button" onPress={() => router.push('/goods/create')} style={s.register}><Text style={m.chipText}>굿즈 등록하기</Text></Pressable></View> : null}
            {goods.map((item) => (
              <View key={item.id} style={[m.gridItem, layout.isWide && { width: layout.cardWidth, maxWidth: layout.cardWidth, flexGrow: 0 }]}>
                <GoodsCard item={item} />
              </View>
            ))}
          </View>
        </View>
        {exchanges.length > 0 ? <View style={s.onsite}>
          <View style={m.between}>
            <Text style={m.sectionTitle}>현장 교환</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="현장 교환 전체 보기"
              onPress={() => openGoods("전체", "교환", true)}
            >
              <Text style={m.sectionLink}>{'전체 보기 >'}</Text>
            </Pressable>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 14 }}
          >
            {exchanges.map((item) => (
              <View key={item.id} style={{ width: 174 }}>
                <GoodsCard item={item} />
                <Text style={s.event}>
                  {item.event}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  brandMark: {
    width: 31,
    height: 34,
  },
  brand: {
    color: colors.text,
    fontSize: 25,
    fontWeight: "900",
    letterSpacing: -1,
  },
  onsite: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 24,
    padding: 17,
    gap: 17,
  },
  event: { fontSize: 9, color: colors.primary, paddingTop: 8, lineHeight: 15 },
  goodsEmpty: { gap: 14, padding: 22, backgroundColor: colors.surfaceMuted, borderRadius: 16, width: '100%', alignItems: 'flex-start' },
  register: { backgroundColor: colors.white, borderRadius: 999, paddingVertical: 12, paddingHorizontal: 18 },
});
