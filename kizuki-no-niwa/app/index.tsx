import { View, Text, FlatList, Pressable } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { WashiBackground } from '../components/WashiBackground';
import { IsakaButton } from '../components/IsakaButton';
import { GardenView } from '../components/GardenView';
import { useState, useCallback } from 'react';
import { LocalStoryStore } from '../lib/localStoryStore';
import { LocalProfileStore } from '../lib/localProfileStore';
import { supabase } from '../lib/supabase';
import { Database } from '../types/supabase';
import { ForeshadowingList } from '../components/ForeshadowingList';
import { PWAGuide } from '../components/PWAGuide';
import { subscribeToPushNotifications } from '../lib/notificationService';

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
            LocalProfileStore.getProfile().then(p => {
                setCurrentDay(p.current_day);
                setCurrentPhase(p.current_phase);
                fetchStories(); // Fetch stories after we have the profile context
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
        <WashiBackground>
            <FlatList
                data={recentStories}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ paddingBottom: 100 }} // Space for PWA guide
                ListHeaderComponent={
                    <View className="pt-0 pb-6">
                        {/* 庭の表示 */}
                        <GardenView />

                        <View className="px-6 mb-8 mt-4">
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
                            <View className="mx-6 mb-8 p-4 border border-stone/20 bg-white/40 rounded-lg">
                                <Text className="text-stone font-serif text-xs mb-2">Reading Fragment</Text>
                                <Text className="text-sumi/80 font-serif text-sm leading-relaxed" numberOfLines={3}>
                                    {randomFragment.content}
                                </Text>
                            </View>
                        )}

                        <View className="px-6 mb-12 flex-col items-center">
                            <IsakaButton
                                title="気づきを綴る"
                                onPress={() => router.push('/write')}
                                className="w-full max-w-xs mb-4"
                            />

                            <IsakaButton
                                title="これまでの記憶"
                                variant="secondary"
                                onPress={() => router.push('/kizuki')}
                                className="w-full max-w-xs mb-4 border-stone/30"
                            />

                            <IsakaButton
                                title="ハルと話す"
                                variant="secondary"
                                onPress={() => router.push({ pathname: '/dialogue/[id]', params: { id: 'haru' } })}
                                className="w-full max-w-xs mb-4"
                            />

                            {currentPhase >= 2 && (
                                <IsakaButton
                                    title="ソラと話す"
                                    variant="secondary"
                                    onPress={() => router.push({ pathname: '/dialogue/[id]', params: { id: 'sora' } })}
                                    className="w-full max-w-xs border-indigo-200 bg-indigo-50/30 mb-4"
                                />
                            )}
                            
                            <IsakaButton
                                title="通知を許可する"
                                variant="secondary"
                                onPress={async () => {
                                    const result = await subscribeToPushNotifications(currentPhase >= 2 ? 'sora' : 'haru');
                                    if (result instanceof Error) {
                                        alert(`通知設定に失敗しました:\n${result.message}\n(ブラウザ設定や環境変数を確認してください)`);
                                    } else if (result) {
                                        alert('通知設定をオンにしました！\n(Vercelデプロイ後に自動的に届きます)');
                                    } else {
                                        alert('通知設定がスキップされました。');
                                    }
                                }}
                                className="w-full max-w-xs border-stone/30"
                            />
                        </View>

                        <ForeshadowingList />

                        <View className="px-6 mt-8">
                            <Text className="text-sumi font-serif text-lg mb-4 border-b border-stone/30 pb-2">
                                紡がれた物語
                            </Text>
                        </View>
                    </View>
                }
                renderItem={({ item }) => (
                    <View className="px-6 mb-6">
                        <Pressable onPress={() => router.push(`/story/${item.id}`)}>
                            <Text className="text-sumi font-serif text-base underline decoration-stone/30">
                                {new Date(item.created_at!).toLocaleDateString()} - {item.character}
                            </Text>
                            <Text className="text-stone text-xs mt-1" numberOfLines={1}>
                                {item.summary || item.content.substring(0, 30)}...
                            </Text>
                        </Pressable>
                    </View>
                )}
                ListEmptyComponent={
                    <Text className="text-stone text-center mt-4 italic mb-10">
                        まだ物語がありません。種をまきましょう。
                    </Text>
                }
            />
            <PWAGuide />
        </WashiBackground>
    );
}
