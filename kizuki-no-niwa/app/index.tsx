import { View, Text, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import { WashiBackground } from '../components/WashiBackground';
import { IsakaButton } from '../components/IsakaButton';
import { useStore } from '../stores/useStore';
import { COLORS } from '../constants/theme';
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Database } from '../types/supabase';
import { ForeshadowingList } from '../components/ForeshadowingList';

type Story = Database['public']['Tables']['stories']['Row'];

export default function HomeScreen() {
    const router = useRouter();
    const navigation = useNavigation();
    const profile = useStore((state) => state.profile);
    const setProfile = useStore((state) => state.setProfile);
    const [recentStories, setRecentStories] = useState<Story[]>([]);
    const [randomFragment, setRandomFragment] = useState<Story | null>(null);

    const fetchStories = useCallback(async () => {
        const { data } = await supabase
            .from('stories')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(5);

        if (data) {
            setRecentStories(data);
            if (data.length > 0) {
                const randomIdx = Math.floor(Math.random() * data.length);
                setRandomFragment(data[randomIdx]);
            }
        }
    }, []);

    const refreshProfile = useCallback(async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        if (data) setProfile(data);
    }, [setProfile]);

    // Refresh on screen focus
    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', () => {
            fetchStories();
            refreshProfile();
        });
        return unsubscribe;
    }, [navigation, fetchStories, refreshProfile]);

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
                    {getPhaseName(profile?.current_phase || 1)}
                </Text>
                <Text className="text-stone font-sans text-xs text-center tracking-widest uppercase">
                    Phase {profile?.current_phase || 1} - Day {profile?.current_day || 1}
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
                    title="Write Kizuki"
                    onPress={() => router.push('/write')}
                    className="w-full max-w-xs"
                />
                <View className="h-4" />
                <IsakaButton
                    title="Talk to Haru"
                    variant="secondary"
                    onPress={() => router.push({ pathname: '/dialogue/[id]', params: { id: 'haru' } })}
                    className="w-full max-w-xs"
                />

                {/* Jinnai: "Locks are just decorations." Unlocked for user. */}
                {(profile?.current_phase || 2) >= 2 && (
                    <>
                        <View className="h-4" />
                        <IsakaButton
                            title="Talk to Sora"
                            variant="secondary"
                            onPress={() => router.push({ pathname: '/dialogue/[id]', params: { id: 'sora' } })}
                            className="w-full max-w-xs border-indigo-300 bg-indigo-50"
                        />
                    </>
                )}
            </View>

            <ForeshadowingList />

            <View className="flex-1 mt-8">
                <Text className="text-sumi font-serif text-lg mb-4 border-b border-stone/30 pb-2">
                    Your Stories
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
                        <Text className="text-stone text-center mt-4 italic">No stories yet. Plant a seed.</Text>
                    }
                />
            </View>
        </WashiBackground>
    );
}
