import { View, Text, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { WashiBackground } from '../../components/WashiBackground';
import { IsakaButton } from '../../components/IsakaButton';
import { MiniCalendar } from '../../components/MiniCalendar';
import { LocalKizukiStore } from '../../lib/localKizukiStore';
import { LocalStoryStore } from '../../lib/localStoryStore';
import { supabase } from '../../lib/supabase';
import { Database } from '../../types/supabase';
import { COLORS } from '../../constants/theme';

type Kizuki = Database['public']['Tables']['kizuki']['Row'];
type Story = Database['public']['Tables']['stories']['Row'];

type ListItem =
    | { type: 'kizuki'; data: Kizuki }
    | { type: 'story'; data: Story };

function toDateKey(isoString: string): string {
    return isoString.slice(0, 10); // "YYYY-MM-DD"
}

export default function KizukiHistoryScreen() {
    const router = useRouter();
    const [kizukiLogs, setKizukiLogs] = useState<Kizuki[]>([]);
    const [stories, setStories] = useState<Story[]>([]);
    const [loading, setLoading] = useState(true);

    const now = new Date();
    const [calYear, setCalYear] = useState(now.getFullYear());
    const [calMonth, setCalMonth] = useState(now.getMonth());
    const [selectedDate, setSelectedDate] = useState<string | null>(null);

    const fetchAll = useCallback(async () => {
        setLoading(true);
        try {
            // --- Kizuki ---
            const { data: remoteKizuki } = await supabase
                .from('kizuki')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(100);

            const localKizuki = await LocalKizukiStore.getKizukiLogs();
            const combinedK = [...(remoteKizuki || []), ...localKizuki];
            const uniqueK = Array.from(new Map(combinedK.map(item => [item.id, item])).values()) as Kizuki[];
            uniqueK.sort((a, b) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime());
            setKizukiLogs(uniqueK);

            // --- Stories ---
            const { data: remoteStories } = await supabase
                .from('stories')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(100);

            const localStories = await LocalStoryStore.getStories();
            const combinedS = [...(remoteStories || []), ...localStories];
            const uniqueS = Array.from(new Map(combinedS.map(item => [item.id, item])).values()) as Story[];
            uniqueS.sort((a, b) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime());
            setStories(uniqueS);
        } catch (e) {
            console.error('Failed to fetch records:', e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAll();
    }, [fetchAll]);

    // Date sets for calendar dots
    const markedDates = useMemo(
        () => new Set(kizukiLogs.filter(k => k.created_at).map(k => toDateKey(k.created_at!))),
        [kizukiLogs]
    );
    const storyDates = useMemo(
        () => new Set(stories.filter(s => s.created_at).map(s => toDateKey(s.created_at!))),
        [stories]
    );

    // List items: all or filtered by selected date
    const listItems = useMemo<ListItem[]>(() => {
        const kItems: ListItem[] = kizukiLogs
            .filter(k => !selectedDate || toDateKey(k.created_at!) === selectedDate)
            .map(k => ({ type: 'kizuki', data: k }));

        const sItems: ListItem[] = stories
            .filter(s => !selectedDate || toDateKey(s.created_at!) === selectedDate)
            .map(s => ({ type: 'story', data: s }));

        const merged = [...kItems, ...sItems];
        merged.sort((a, b) => {
            const ta = new Date(a.data.created_at!).getTime();
            const tb = new Date(b.data.created_at!).getTime();
            return tb - ta;
        });
        return merged;
    }, [kizukiLogs, stories, selectedDate]);

    const renderItem = ({ item }: { item: ListItem }) => {
        if (item.type === 'kizuki') {
            const k = item.data;
            return (
                <View style={{ marginBottom: 20, padding: 16, borderWidth: 1, borderColor: 'rgba(142,142,147,0.2)', backgroundColor: 'rgba(255,255,255,0.4)' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6, gap: 6 }}>
                        <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: COLORS.sumi }} />
                        <Text style={{ color: COLORS.stone, fontSize: 11, fontFamily: 'NotoSansJP_400Regular' }}>
                            気づき　{new Date(k.created_at!).toLocaleString('ja-JP')}
                        </Text>
                    </View>
                    {k.question_prompt && (
                        <Text style={{ color: 'rgba(45,45,45,0.6)', fontSize: 11, fontFamily: 'NotoSerifJP_400Regular', fontStyle: 'italic', marginBottom: 6 }}>
                            Q: {k.question_prompt}
                        </Text>
                    )}
                    <Text style={{ color: COLORS.sumi, fontSize: 15, fontFamily: 'NotoSerifJP_400Regular', lineHeight: 24 }}>
                        {k.content}
                    </Text>
                </View>
            );
        }

        const s = item.data;
        const charLabel = s.character === 'haru' ? 'ハル' : 'ソラ';
        return (
            <TouchableOpacity
                onPress={() => router.push(`/story/${s.id}`)}
                style={{ marginBottom: 20, padding: 16, borderWidth: 1, borderColor: 'rgba(142,142,147,0.15)', backgroundColor: 'rgba(255,255,255,0.25)' }}
            >
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6, gap: 6 }}>
                    <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: COLORS.stone }} />
                    <Text style={{ color: COLORS.stone, fontSize: 11, fontFamily: 'NotoSansJP_400Regular' }}>
                        物語 ({charLabel})　{new Date(s.created_at!).toLocaleString('ja-JP')}
                    </Text>
                </View>
                <Text style={{ color: COLORS.sumi, fontSize: 13, fontFamily: 'NotoSerifJP_400Regular', lineHeight: 22 }} numberOfLines={2}>
                    {s.summary || s.content.substring(0, 60)}…
                </Text>
            </TouchableOpacity>
        );
    };

    const calendarHeader = (
        <View>
            <View style={{ marginBottom: 24 }}>
                <Text style={{ color: COLORS.sumi, fontFamily: 'NotoSerifJP_400Regular', fontSize: 22, textAlign: 'center', letterSpacing: 4 }}>
                    気づきの記憶
                </Text>
                <Text style={{ color: COLORS.stone, fontFamily: 'NotoSerifJP_400Regular', fontSize: 11, textAlign: 'center', marginTop: 6 }}>
                    言葉の種は、ここに残っています。
                </Text>
            </View>

            <MiniCalendar
                year={calYear}
                month={calMonth}
                markedDates={markedDates}
                storyDates={storyDates}
                selectedDate={selectedDate}
                onSelectDate={setSelectedDate}
                onMonthChange={(y, m) => { setCalYear(y); setCalMonth(m); }}
            />

            {selectedDate && (
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, paddingHorizontal: 2 }}>
                    <Text style={{ color: COLORS.sumi, fontFamily: 'NotoSerifJP_400Regular', fontSize: 13 }}>
                        {selectedDate}
                    </Text>
                    <TouchableOpacity onPress={() => setSelectedDate(null)}>
                        <Text style={{ color: COLORS.stone, fontSize: 12, fontFamily: 'NotoSansJP_400Regular' }}>全て表示 ×</Text>
                    </TouchableOpacity>
                </View>
            )}

            <View style={{ borderTopWidth: 1, borderColor: 'rgba(142,142,147,0.2)', marginBottom: 16 }} />
        </View>
    );

    return (
        <WashiBackground style={{ paddingTop: 48, paddingHorizontal: 24 }}>
            {loading ? (
                <>
                    <View style={{ marginBottom: 24 }}>
                        <Text style={{ color: COLORS.sumi, fontFamily: 'NotoSerifJP_400Regular', fontSize: 22, textAlign: 'center', letterSpacing: 4 }}>
                            気づきの記憶
                        </Text>
                    </View>
                    <ActivityIndicator color={COLORS.sumi} size="large" style={{ marginTop: 40 }} />
                </>
            ) : (
                <FlatList
                    data={listItems}
                    renderItem={renderItem}
                    keyExtractor={(item, i) => `${item.type}-${item.data.id}-${i}`}
                    ListHeaderComponent={calendarHeader}
                    contentContainerStyle={{ paddingBottom: 96 }}
                    ListEmptyComponent={
                        <View style={{ marginTop: 40, alignItems: 'center' }}>
                            <Text style={{ color: COLORS.stone, fontFamily: 'NotoSerifJP_400Regular', fontStyle: 'italic' }}>
                                {selectedDate ? 'この日の記録はありません。' : 'まだ言葉の欠片がありません。'}
                            </Text>
                        </View>
                    }
                />
            )}

            <View style={{ position: 'absolute', bottom: 32, left: 24, right: 24 }}>
                <IsakaButton title="戻る" onPress={() => router.back()} />
            </View>
        </WashiBackground>
    );
}
