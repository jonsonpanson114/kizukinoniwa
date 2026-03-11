// 筆跡アニメーションテキストコンポーネント

import React, { useState, useEffect } from 'react';
import { Text, StyleSheet, Animated } from 'react-native';

interface HandwritingTextProps {
  text: string;
  speed?: number; // 文字ごとのミリ秒
  onComplete?: () => void;
  className?: string;
  style?: any;
}

export const HandwritingText: React.FC<HandwritingTextProps> = ({
  text,
  speed = 50,
  onComplete,
  className = '',
  style,
}) => {
  const [displayText, setDisplayText] = useState('');
  const [cursorOpacity] = useState(new Animated.Value(1));

  useEffect(() => {
    setDisplayText('');
    let index = 0;
    const interval = setInterval(() => {
      if (index < text.length) {
        setDisplayText(text.slice(0, index + 1));
        index++;
      } else {
        clearInterval(interval);
        onComplete?.();
      }
    }, speed);

    // カーソル点滅アニメーション
    const cursorAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(cursorOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(cursorOpacity, { toValue: 0.3, duration: 500, useNativeDriver: true }),
      ])
    );
    cursorAnimation.start();

    return () => {
      clearInterval(interval);
      cursorAnimation.stop();
    };
  }, [text, speed]);

  return (
    <Text className={`font-serif text-[#2D2D2D] ${className}`} style={style}>
      {displayText}
      <Animated.Text style={[styles.cursor, { opacity: cursorOpacity }]}>|</Animated.Text>
    </Text>
  );
};

const styles = StyleSheet.create({
  cursor: {
    color: '#2D2D2D',
  },
});
