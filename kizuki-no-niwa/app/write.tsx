import { View, Text, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useMemo } from 'react';
import * as Haptics from 'expo-haptics';
import { WashiBackground } from '../components/WashiBackground';
import { IsakaButton } from '../components/IsakaButton';
import { TextArea } from '../components/TextArea';
import { supabase } from '../lib/supabase';
import { useStore } from '../stores/useStore';
import { getRandomPrompt, getNextPhase } from '../constants/prompts';
import { generateStory } from '../lib/gemini';
import { Database } from '../types/supabase';
import { ForeshadowingService } from '../lib/services/foreshadowing';
import { LocalStoryStore } from '../lib/localStoryStore';
import { LocalKizukiStore } from '../lib/localKizukiStore';

type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];
type KizukiInsert = Database['public']['Tables']['kizuki']['Insert'];

export default function WriteScreen() {
    const router = useRouter();
    const [content, setContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [statusMessage, setStatusMessage] = useState('');
    const profile = useStore(state => state.profile);
    const setProfile = useStore(state => state.setProfile);

    const dailyPrompt = useMemo(
        () => getRandomPrompt(profile?.current_phase ?? 1),
        [profile?.current_phase],
    );

    const handleSubmit = async () => {
        if (!content.trim()) return;
        setIsSubmitting(true);
        setStatusMessage('種を植えています...');
        if (Platform.OS !== 'web') {
            try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch (e) { }
        }

        // TEMPORARY: Commented out to bypass AuthRetryableFetchError
        // let user = null;
        // try {
        //     const { data } = await supabase.auth.getUser();
        //     user = data.user;
        // } catch (e) {
        //     console.log('Auth check failed (offline mode):', e);
        // }

        let user: any = { id: 'mock-user-id', email: 'mock@example.com' };

        // Force mock user if offline/null (Verify Phase)
        if (!user) {
            console.log('Using Mock User for Offline Verification');
            user = { id: 'mock-user-id', email: 'mock@example.com' } as any;

            // Allow saving kizuki even for mock user (local only)
            // The previous logic skipped block 1 if user was null initially, 
            // but now we force user, so block 1 will run. 
            // We just need to ensure the local fallback inside block 1 triggers.
        }

        try {
            let storyId = '';
            let generatedStory;

            // 1. Save Kizuki (if user exists and connected)
            if (user) {
                try {
                    const insertPayload: KizukiInsert = {
                        user_id: user.id,
                        content: content,
                        question_prompt: dailyPrompt,
                    };

                    await supabase.from('kizuki').insert(insertPayload);

                    // Update Profile Logic
                    const currentDay = profile?.current_day ?? 1;
                    const newDay = currentDay + 1;
                    const newPhase = getNextPhase(newDay);
                    const phaseChanged = newPhase !== (profile?.current_phase ?? 1);

                    const updateData: ProfileUpdate = { current_day: newDay };
                    if (phaseChanged) {
                        updateData.current_phase = newPhase;
                        updateData.phase_started_at = new Date().toISOString();
                    }
                    await supabase.from('profiles').update(updateData).eq('id', user.id);

                    if (profile) {
                        setProfile({
                            ...profile,
                            current_day: newDay,
                            current_phase: phaseChanged ? newPhase : profile.current_phase,
                            phase_started_at: phaseChanged ? new Date().toISOString() : profile.phase_started_at,
                        });
                    }
                } catch (e) {
                    console.log('Failed to save Kizuki/Profile (Offline mode):', e);
                    // Fallback: Save Kizuki Locally
                    await LocalKizukiStore.saveKizuki({
                        user_id: user.id,
                        content: content,
                        question_prompt: dailyPrompt,
                        created_at: new Date().toISOString()
                    });
                }
            }

            // 2. Generate Story (Real AI)
            setStatusMessage('物語が芽吹いています...');
            let pendingSeeds: { id: string, motif: string }[] = [];

            if (user) {
                try {
                    // Harvest pending seeds
                    pendingSeeds = await ForeshadowingService.getPendingSeeds(user.id);
                    if (pendingSeeds.length > 0) {
                        console.log('[Foreshadowing] Harvesting seeds:', pendingSeeds);
                    }
                } catch (e) {
                    console.log('Failed to harvest seeds:', e);
                }
            }

            try {
                generatedStory = await generateStory(
                    profile?.current_phase ?? 1,
                    profile?.current_day ?? 1,
                    content,
                    pendingSeeds
                );
            } catch (e) {
                console.error("AI Generation failed:", e);
                // Fallback
                const errorMessage = (e as Error).message || 'Unknown Error';
                console.error("AI Generation failed:", errorMessage);

                // GENERATE MOCK BUT SHOW ERROR FOR DEBUGGING
                generatedStory = {
                    story_text: `（※エラー発生: ${errorMessage}）\n\n（以下はモック生成です）\n\n「${content}」\n\nその言葉が、ふと風に乗って聞こえた気がした。Phase ${profile?.current_phase ?? 1}の空は高く、Day ${profile?.current_day ?? 1}の光が差している。\n\nハルは珈琲を飲みながら、「また変なのが聞こえたな」と呟く。\n\n世界は相変わらず、少しだけズレているようだ。`,
                    summary_for_next: "生成失敗",
                    mood_tags: ["Error: " + errorMessage.substring(0, 10)],
                    motifs: ["雨の音"],
                    character: "haru",
                    new_foreshadowing: null,
                    resolved_foreshadowing_id: null
                } as any;
            }

            // 3. Save Story (if user exists)
            const mockStoryId = 'story-' + Date.now();
            if (user && generatedStory.mood_tags) {
                try {
                    const { data: storyData } = await supabase
                        .from('stories')
                        .insert({
                            user_id: user.id,
                            content: generatedStory.story_text,
                            summary: generatedStory.summary_for_next,
                            mood_tags: generatedStory.mood_tags,
                            character: generatedStory.character,
                            phase: profile?.current_phase ?? 1,
                            day: profile?.current_day ?? 1,
                        })
                        .select()
                        .single();

                    if (storyData) {
                        storyId = storyData.id;
                    }
                } catch (e) {
                    console.warn("Failed to save story DB", e);
                }
            }

            // FALLBACK / MOCK PERSISTENCE
            if (!storyId) {
                storyId = mockStoryId;
                // Save locally for offline/mock mode
                await LocalStoryStore.saveStory({
                    id: storyId,
                    user_id: user.id,
                    content: generatedStory.story_text,
                    summary: generatedStory.summary_for_next,
                    mood_tags: generatedStory.mood_tags,
                    character: generatedStory.character,
                    phase: profile?.current_phase ?? 1,
                    day: profile?.current_day ?? 1,
                    created_at: new Date().toISOString()
                });
            }

            // 4. Plant Seeds (Foreshadowing)
            if (user && generatedStory.motifs && generatedStory.motifs.length > 0) {
                // Non-blocking call
                ForeshadowingService.plantSeeds(user.id, storyId, generatedStory.motifs)
                    .catch(e => console.error("Failed to plant seeds:", e));
            }

            // 5. Resolve Sprouted Seed (if any)
            if (user && generatedStory.resolved_foreshadowing_id) {
                ForeshadowingService.markAsResolvedById(
                    user.id,
                    generatedStory.resolved_foreshadowing_id,
                    storyId
                ).catch(e => console.error("Failed to resolve seed:", e));
            }

            if (Platform.OS !== 'web') {
                try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch (e) { }
            }

            // 6. Check for Phase Progression (Unlock Sora)
            // Condition: 3 stories written & currently Phase 1
            if (user && (profile?.current_phase || 1) === 1) {
                const { count } = await supabase
                    .from('stories')
                    .select('*', { count: 'exact', head: true })
                    .eq('user_id', user.id);

                if (count !== null && count >= 3) {
                    // Upgrade to Phase 2 (Root)
                    const { error: phaseError } = await supabase
                        .from('profiles')
                        .update({ current_phase: 2 })
                        .eq('id', user.id);

                    if (!phaseError) {
                        alert("庭の気配が変わりました...\n(Phase 2: Root へ移行しました)");
                        // Profile refresh will happen on Home screen focus
                    }
                }
            }

            // Navigation
            router.replace(`/story/${storyId}?content=${encodeURIComponent(generatedStory.story_text)}&tags=${encodeURIComponent(JSON.stringify(generatedStory.mood_tags))}&character=${generatedStory.character}`);

        } catch (e) {
            console.error(e);
            alert("エラーが発生しました: " + (e as Error).message);
        } finally {
            setIsSubmitting(false);
            setStatusMessage('');
        }
    };

    return (
        <WashiBackground className="px-6 pt-12">
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
                <View className="mb-8">
                    <Text className="text-sumi font-serif text-xl text-center mb-4 tracking-widest">
                        今日の問い
                    </Text>
                    <Text className="text-sumi/80 font-serif text-lg text-center leading-relaxed">
                        {dailyPrompt}
                    </Text>
                </View>

                <View className="flex-1 justify-center">
                    <TextArea
                        placeholder="ここに気づきを書いてください..."
                        value={content}
                        onChangeText={setContent}
                        className="min-h-[200px]"
                    />
                </View>

                {statusMessage ? (
                    <View className="pb-4">
                        <Text className="text-stone font-serif text-sm text-center italic">
                            {statusMessage}
                        </Text>
                    </View>
                ) : null}

                <View className="pb-12">
                    <IsakaButton
                        title={isSubmitting ? "種まき中..." : "種をまく"}
                        onPress={handleSubmit}
                        isLoading={isSubmitting}
                    />
                    <IsakaButton
                        title="やめる"
                        variant="secondary"
                        onPress={() => router.back()}
                        className="mt-4 border-transparent opacity-60"
                    />
                </View>
            </KeyboardAvoidingView>
        </WashiBackground>
    );
}
