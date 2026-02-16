import { View, Text, ScrollView, TextInput, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useRef, useEffect } from 'react';
import * as Haptics from 'expo-haptics';
import { WashiBackground } from '../../components/WashiBackground';
import { ChatBubble } from '../../components/ChatBubble';
import { IsakaButton } from '../../components/IsakaButton';
import { generateReply } from '../../lib/gemini';

export default function DialogueScreen() {
    const { character = 'haru', initialMessage } = useLocalSearchParams();
    const router = useRouter();
    const [messages, setMessages] = useState<{ role: 'user' | 'model', text: string }[]>([]);
    const [inputText, setInputText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const scrollViewRef = useRef<ScrollView>(null);

    const charName = character === 'haru' ? 'ハル' : 'ソラ';

    useEffect(() => {
        if (initialMessage) {
            setMessages([{ role: 'model', text: decodeURIComponent(initialMessage as string) }]);
        } else {
            // Default greeting if none provided
            const greeting = character === 'haru'
                ? '...なんだ？人の顔をじっと見て。俺の顔に何かついてるか？'
                : 'あら、こんにちは。今日はいい天気ね。';
            setMessages([{ role: 'model', text: greeting }]);
        }
    }, [character]);

    const handleSend = async () => {
        if (!inputText.trim() || isTyping) return;

        const userMsg = inputText.trim();
        setInputText('');
        setMessages(prev => [...prev, { role: 'user', text: userMsg }]);

        setIsTyping(true);
        if (Platform.OS !== 'web') {
            try { Haptics.selectionAsync(); } catch (e) { }
        }

        try {
            const reply = await generateReply(
                character as 'haru' | 'sora',
                messages,
                userMsg
            );

            setMessages(prev => [...prev, { role: 'model', text: reply }]);
            if (Platform.OS !== 'web') {
                try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch (e) { }
            }
        } catch (e) {
            console.error(e);
            alert("会話が途切れてしまったようだ...");
        } finally {
            setIsTyping(false);
        }
    };

    const isSora = character === 'sora';
    const headerBg = isSora ? 'bg-indigo-50/80' : 'bg-white/50';
    const headerText = isSora ? 'text-indigo-900' : 'text-sumi';

    return (
        <WashiBackground className="flex-1">
            <View className={`pt-12 px-6 pb-4 border-b border-stone/10 ${headerBg}`}>
                <Text className={`${headerText} font-serif text-xl text-center`}>
                    {charName}との対話
                </Text>
            </View>

            <ScrollView
                ref={scrollViewRef}
                className="flex-1 px-4 pt-4"
                onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
            >
                {messages.map((msg, index) => (
                    <ChatBubble
                        key={index}
                        message={msg.text}
                        isUser={msg.role === 'user'}
                        character={character as 'haru' | 'sora'}
                    />
                ))}
                {isTyping && (
                    <Text className="text-stone/50 font-serif text-sm ml-4 mb-4 italic">
                        {charName}が入力中...
                    </Text>
                )}
                <View className="h-4" />
            </ScrollView>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="p-4 bg-white/80 border-t border-stone/10"
            >
                <View className="flex-row items-center gap-2">
                    <TextInput
                        className="flex-1 bg-white border border-stone/20 rounded-xl p-3 font-serif text-sumi"
                        placeholder="話しかける..."
                        value={inputText}
                        onChangeText={setInputText}
                        onSubmitEditing={handleSend}
                    />
                    <TouchableOpacity
                        onPress={handleSend}
                        disabled={isTyping || !inputText.trim()}
                        className={`p-3 rounded-xl ${!inputText.trim() ? 'bg-stone/20' : 'bg-sumi'}`}
                    >
                        <Text className="text-white font-serif font-bold">送信</Text>
                    </TouchableOpacity>
                </View>
                <TouchableOpacity onPress={() => router.back()} className="mt-2 self-center">
                    <Text className="text-stone/50 text-sm">対話を終える</Text>
                </TouchableOpacity>
            </KeyboardAvoidingView>
        </WashiBackground>
    );
}
