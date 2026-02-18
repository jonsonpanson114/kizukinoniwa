import { useState, useEffect } from 'react';
import { View, Text, Platform, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export function PWAGuide() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (Platform.OS === 'web') {
            // Check if already in standalone mode
            // @ts-ignore
            const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;

            if (!isStandalone) {
                // Show after a slight delay
                const timer = setTimeout(() => setIsVisible(true), 3000);
                return () => clearTimeout(timer);
            }
        }
    }, []);

    if (!isVisible) return null;

    return (
        <View className="absolute bottom-8 left-6 right-6 bg-sumi/95 border border-stone/20 p-5 rounded-lg shadow-xl z-50">
            <View className="flex-row justify-between items-start">
                <View className="flex-1 mr-4">
                    <Text className="text-white font-serif font-bold text-base mb-2">
                        庭を持ち歩く
                    </Text>
                    <Text className="text-stone-300 font-serif text-xs leading-relaxed">
                        「ホーム画面に追加」を選ぶと、{'\n'}
                        アプリとしてこの庭に繋がることができます。
                    </Text>
                </View>
                <Pressable
                    onPress={() => setIsVisible(false)}
                    className="p-1 -mt-1 -mr-1"
                >
                    <Ionicons name="close" size={20} color="#A8A29E" />
                </Pressable>
            </View>
        </View>
    );
}
