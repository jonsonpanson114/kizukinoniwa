import { View, Text, FlatList } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { WashiBackground } from '../components/WashiBackground';
import { IsakaButton } from '../components/IsakaButton';
import { useState, useCallback } from 'react';
import { LocalStoryStore } from '../lib/localStoryStore';
import { LocalProfileStore } from '../lib/localProfileStore';
import { supabase } from '../lib/supabase';
import { Database } from '../types/supabase';
import { ForeshadowingList } from '../components/ForeshadowingList';
import { PWAGuide } from '../components/PWAGuide';

type Story = Database['public']['Tables']['stories']['Row'];

export default function HomeScreen() {
    const router = useRouter();
    const [recentStories, setRecentStories] = useState<Story[]>([]);
    const [randomFragment, setRandomFragment] = useState<Story | null>(null);
    // Read day/phase directly from LocalProfileStore — bypasses Zustand entirely
    const [currentDay, setCurrentDay] = useState(1);
    const [currentPhase, setCurrentPhase] = useState(1);

    const fetchStories = useCallback(async () => {
        // 1. Fetch Remote
        const { data: remoteData } = await supabase
            .from('stories')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(5);

        // 2. Fetch Local
        const localData = await LocalStoryStore.getStories();

        // 3. Merge & Dedupe
        const combined = [...(remoteData || []), ...localData];
        const unique = Array.from(new Map(combined.map(item => [item.id, item])).values());

        // 4. Sort
        unique.sort((a, b) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime());

        setRecentStories(unique.slice(0, 10)); // Show top 10

        if (unique.length > 0) {
            const randomIdx = Math.floor(Math.random() * unique.length);
            setRandomFragment(unique[randomIdx]);
        }
    }, []);

    // useFocusEffect fires every time this screen comes into focus (works on web + native)
    useFocusEffect(
        useCallback(() => {
            fetchStories();
            LocalProfileStore.getProfile().then(p => {
                setCurrentDay(p.current_day);
                setCurrentPhase(p.current_phase);
            });
        }, [fetchStories])
    );

    const getPhaseName = (phase: number) => {
        switch (phase) {
            case 1: return 'Soil (土)';
            case 2: return 'Root (根)';
            case 3: return 'Sprout (芽)';
            case 4: return 'Flower (花)';
            default: return 'Soil (土)';
        }
    };

    return (
        <WashiBackground className="px-6 pt-12 pb-6">
            <View className="mb-8">
                <Text className="text-sumi/60 font-serif text-sm text-center mb-2">
                    {new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })}
                </Text>
                <Text className="text-sumi font-serif text-3xl text-center mb-1">
                    {getPhaseName(currentPhase)}
                </Text>
                <Text className="text-stone font-sans text-xs text-center tracking-widest uppercase">
                    Phase {currentPhase} - Day {currentDay}
                </Text>
            </View>

            {randomFragment && (
                <View className="mb-8 p-4 border border-stone/20 bg-white/40">
                    <Text className="text-stone font-serif text-xs mb-2">Reading Fragment</Text>
                    <Text className="text-sumi/80 font-serif text-sm leading-relaxed line-clamp-3" numberOfLines={3}>
                        {randomFragment.content}
                    </Text>
                </View>
            )}

            <View className="flex-1 justify-center items-center py-8">
                <IsakaButton
                    title="気づきを綴る"
                    onPress={() => router.push('/write')}
                    className="w-full max-w-xs mb-4"
                />

                <IsakaButton
                    title="これまでの記憶"
                    variant="secondary"
                    onPress={() => router.push('/kizuki')}
                    className="w-full max-w-xs mb-8 border-stone/30"
                />

                <IsakaButton
                    title="ハルと話す"
                    variant="secondary"
                    onPress={() => router.push({ pathname: '/dialogue/[id]', params: { id: 'haru' } })}
                    className="w-full max-w-xs"
                />

                {currentPhase >= 2 && (
                    <>
                        <View className="h-4" />
                        <IsakaButton
                            title="ソラと話す"
                            variant="secondary"
                            onPress={() => router.push({ pathname: '/dialogue/[id]', params: { id: 'sora' } })}
                            className="w-full max-w-xs border-indigo-200 bg-indigo-50/30"
                        />
                    </>
                )}
            </View>

            <ForeshadowingList />

            <View className="flex-1 mt-8">
                <Text className="text-sumi font-serif text-lg mb-4 border-b border-stone/30 pb-2">
                    紡がれた物語
                </Text>
                <FlatList
                    data={recentStories}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <View className="mb-4">
                            <Text
                                className="text-sumi font-serif text-base underline decoration-stone/30"
                                onPress={() => router.push(`/story/${item.id}`)}
                            >
                                {new Date(item.created_at!).toLocaleDateString()} - {item.character}
                            </Text>
                            <Text className="text-stone text-xs" numberOfLines={1}>{item.summary || item.content.substring(0, 30)}...</Text>
                        </View>
                    )}
                    ListEmptyComponent={
                        <Text className="text-stone text-center mt-4 italic">まだ物語がありません。種をまきましょう。</Text>
                    }
                />
            </View>
            <PWAGuide />
        </WashiBackground>
    );
}
