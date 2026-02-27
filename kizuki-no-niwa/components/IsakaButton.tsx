import { TouchableOpacity, Text, TouchableOpacityProps, ActivityIndicator } from 'react-native';
import { COLORS } from '../constants/theme';

interface IsakaButtonProps extends TouchableOpacityProps {
    title: string;
    isLoading?: boolean;
    variant?: 'primary' | 'secondary';
}

export function IsakaButton({ title, isLoading, variant = 'primary', className, ...props }: IsakaButtonProps) {
    return (
        <TouchableOpacity
            className={`border border-sumi px-6 py-3 items-center justify-center active:bg-stone/10 ${className}`}
            disabled={isLoading}
            {...props}
        >
            {isLoading ? (
                <ActivityIndicator color={COLORS.sumi} />
            ) : (
                <Text className="text-sumi font-serif text-lg tracking-widest">
                    {title}
                </Text>
            )}
        </TouchableOpacity>
    );
}
