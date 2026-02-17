import { View, Text, FlatList, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useState, useCallback } from 'react';
import { WashiBackground } from '../../components/WashiBackground';
import { IsakaButton } from '../../components/IsakaButton';
import { LocalKizukiStore } from '../../lib/localKizukiStore';
import { supabase } from '../../lib/supabase';
import { Database } from '../../types/supabase';
import { COLORS } from '../../constants/theme';

type Kizuki = Database['public']['Tables']['kizuki']['Row'];

export default function KizukiHistoryScreen() {
    const router = useRouter();
    const [kizukiLogs, setKizukiLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchKizuki = useCallback(async () => {
        setLoading(true);
        try {
            // 1. Fetch Remote (if possible)
            const { data: remoteData } = await supabase
                .from('kizuki')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(20);

            // 2. Fetch Local
            const localData = await LocalKizukiStore.getKizukiLogs();

            // 3. Merge & Dedupe (by ID or content+date string)
            const combined = [...(remoteData || []), ...localData];
            const unique = Array.from(new Map(combined.map(item => [item.id, item])).values());

            // 4. Sort
            unique.sort((a, b) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime());

            setKizukiLogs(unique);
        } catch (e) {
            console.error('Failed to fetch kizuki logs:', e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchKizuki();
    }, [fetchKizuki]);

    const renderItem = ({ item }: { item: any }) => (
        <View className="mb-6 p-4 border border-stone/20 bg-white/40 rounded-sm">
            <Text className="text-stone text-xs font-serif mb-2">
                {new Date(item.created_at).toLocaleString('ja-JP')}
            </Text>
            {item.question_prompt && (
                <Text className="text-sumi/60 text-xs font-serif italic mb-2">
                    Q: {item.question_prompt}
                </Text>
            )}
            <Text className="text-sumi font-serif text-base leading-relaxed">
                {item.content}
            </Text>
        </View>
    );

    return (
        <WashiBackground className="pt-12 px-6">
            <View className="mb-8">
                <Text className="text-sumi font-serif text-2xl text-center tracking-widest">
                    気づきの記憶
                </Text>
                <Text className="text-stone font-serif text-xs text-center mt-2">
                    言葉の種は、ここに残っています。
                </Text>
            </View>

            {loading ? (
                <ActivityIndicator color={COLORS.sumi} size="large" className="mt-12" />
            ) : (
                <FlatList
                    data={kizukiLogs}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id}
                    contentContainerClassName="pb-24"
                    ListEmptyComponent={
                        <View className="mt-20 items-center">
                            <Text className="text-stone font-serif italic">まだ言葉の欠片がありません。</Text>
                        </View>
                    }
                />
            )}

            <View className="absolute bottom-8 left-6 right-6">
                <IsakaButton title="戻る" onPress={() => router.back()} />
            </View>
        </WashiBackground>
    );
}
