import { View, Text } from 'react-native';

interface ChatBubbleProps {
    message: string;
    isUser: boolean;
    character?: 'haru' | 'sora';
}

export function ChatBubble({ message, isUser, character }: ChatBubbleProps) {
    // Haru: Blue-ish / Sora: Orange-ish / User: Green-ish
    const bubbleColor = isUser
        ? 'bg-stone/10 border-stone/20'
        : character === 'sora'
            ? 'bg-orange-50 border-orange-200'
            : 'bg-blue-50 border-blue-200';

    const alignment = isUser ? 'self-end' : 'self-start';
    const textColor = isUser ? 'text-sumi' : 'text-sumi';

    return (
        <View className={`max-w-[80%] mb-4 p-4 rounded-2xl ${bubbleColor} border ${alignment}`}>
            <Text className={`${textColor} font-serif text-base leading-relaxed`}>
                {message}
            </Text>
        </View>
    );
}
