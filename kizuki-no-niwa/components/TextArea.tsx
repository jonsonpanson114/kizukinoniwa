import { TextInput, TextInputProps, View, Text } from 'react-native';
import { COLORS } from '../constants/theme';

interface TextAreaProps extends TextInputProps {
    label?: string;
}

export function TextArea({ label, className, ...props }: TextAreaProps) {
    return (
        <View className="w-full">
            {label && (
                <Text className="text-sumi font-sans text-sm mb-2 opacity-60">
                    {label}
                </Text>
            )}
            <TextInput
                className={`border-b border-stone/30 text-sumi font-serif text-base p-2 min-h-[120px] leading-relaxed ${className}`}
                multiline
                textAlignVertical="top"
                placeholderTextColor={COLORS.stone}
                {...props}
            />
        </View>
    );
}
