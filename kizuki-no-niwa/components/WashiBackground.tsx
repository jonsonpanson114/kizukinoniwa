import { View, ViewProps } from 'react-native';
import { COLORS } from '../constants/theme';

interface WashiBackgroundProps extends ViewProps {
    children: React.ReactNode;
}

export function WashiBackground({ children, style, ...props }: WashiBackgroundProps) {
    return (
        <View
            style={[{ flex: 1, backgroundColor: COLORS.washi }, style]}
            {...props}
        >
            {/* TODO: Add actual noise texture image here if available later */}
            {children}
        </View>
    );
}
