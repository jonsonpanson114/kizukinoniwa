import { useEffect } from 'react';
import { View, Text, ScrollView } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { COLORS } from '../constants/theme';

interface StoryViewerProps {
    content: string;
    title?: string;
    subtitle?: string;
}

export function StoryViewer({ content, title, subtitle }: StoryViewerProps) {
    // Split content by paragraphs or lines for staggered animation in the future.
    // For now, just fade in the whole text.

    return (
        <ScrollView
            className="flex-1 px-6 py-8"
            contentContainerStyle={{ paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
        >
            <Animated.View entering={FadeIn.duration(1000).delay(300)}>
                {title && (
                    <Text className="text-sumi font-serif text-2xl mb-2 text-center tracking-widest font-bold">
                        {title}
                    </Text>
                )}
                {subtitle && (
                    <Text className="text-sumi/60 font-serif text-sm mb-8 text-center italic leading-relaxed">
                        Q: {subtitle}
                    </Text>
                )}
                <Text
                    className="text-sumi font-serif text-lg leading-loose tracking-wider"
                    style={{ lineHeight: 32 }} // Custom line height for better readability
                >
                    {content}
                </Text>
            </Animated.View>
        </ScrollView>
    );
}
