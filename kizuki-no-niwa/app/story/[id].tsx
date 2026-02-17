import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, ActivityIndicator, Share, Alert } from 'react-native';
import { WashiBackground } from '../../components/WashiBackground';
import { StoryViewer } from '../../components/StoryViewer';
import { IsakaButton } from '../../components/IsakaButton';
import { supabase } from '../../lib/supabase';
import { Database } from '../../types/supabase';
import { COLORS } from '../../constants/theme';
import { LocalStoryStore } from '../../lib/localStoryStore';

type Story = Database['public']['Tables']['stories']['Row'];

export default function StoryScreen() {
    const { id, content, tags, character, phase, day } = useLocalSearchParams();
    const router = useRouter();
    const [story, setStory] = useState<Story | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (content) {
            // Reconstruct from params
            setStory({
                id: Array.isArray(id) ? id[0] : id,
                user_id: 'current-user', // Mock or real, doesn't matter for display
                character: (character as 'haru' | 'sora') || 'haru',
                phase: Number(phase || 1),
                day: Number(day || 1),
                content: decodeURIComponent(content as string),
                summary: null,
                mood_tags: tags ? JSON.parse(decodeURIComponent(tags as string)) : [],
                created_at: new Date().toISOString()
            });
            setLoading(false);
        } else if (id) {
            fetchStory();
        }
    }, [id, content]);

    const fetchStory = async () => {
        const storyId = Array.isArray(id) ? id[0] : id;

        // 1. Try Supabase
        const { data } = await supabase
            .from('stories')
            .select('*')
            .eq('id', storyId)
            .single();

        if (data) {
            setStory(data);
            setLoading(false);
            return;
        }

        // 2. Try Local Store (Fallback)
        const localStories = await LocalStoryStore.getStories();
        const localStory = localStories.find((s: Story) => s.id === storyId);

        if (localStory) {
            setStory(localStory);
        }

        setLoading(false);
    };

    const handleShare = async () => {
        if (!story) return;
        try {
            await Share.share({
                message: `Kizuki no Niwa - Phase ${story.phase}, Day ${story.day}\n\n${story.content.substring(0, 100)}...\n\n#KizukiNoNiwa`,
            });
        } catch (error: any) {
            alert(error.message);
        }
    };

    if (loading) {
        return (
            <WashiBackground className="justify-center items-center">
                <ActivityIndicator color={COLORS.sumi} size="large" />
            </WashiBackground>
        );
    }

    if (!story) {
        return (
            <WashiBackground className="justify-center items-center">
                <StoryViewer content="The story seems to have drifted away..." />
                <IsakaButton title="Return" onPress={() => router.back()} className="mt-8" />
            </WashiBackground>
        )
    }

    return (
        <WashiBackground className="pt-12">
            <StoryViewer
                title={`Phase ${story.phase} - Day ${story.day}`}
                content={story.content}
            />
            <View className="p-6 pb-12">
                <IsakaButton title="Close" onPress={() => router.back()} />
                <IsakaButton
                    title="Share Fragment"
                    variant="secondary"
                    className="mt-4 border-stone text-stone"
                    onPress={handleShare}
                />
            </View>
        </WashiBackground>
    );
}
