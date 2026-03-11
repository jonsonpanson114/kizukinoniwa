// 部長（猫）キャラクターコンポーネント

import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Svg, Circle, Ellipse, Path, Line } from 'react-native-svg';
import { useCatStore } from '../stores/catStore';

export const CatCharacter: React.FC<{ size?: number }> = ({ size = 120 }) => {
  const { currentReaction, isAnimating, setReaction } = useCatStore();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isAnimating) {
      const animations: Record<string, Animated.CompositeAnimation> = {
        happy: Animated.sequence([
          Animated.spring(scaleAnim, { toValue: 1.1, friction: 3, useNativeDriver: true }),
          Animated.spring(scaleAnim, { toValue: 1, friction: 3, useNativeDriver: true }),
        ]),
        curious: Animated.timing(rotateAnim, { toValue: 0.1, duration: 300, useNativeDriver: true }),
        sleeping: Animated.spring(scaleAnim, { toValue: 0.95, friction: 2, useNativeDriver: true }),
        staring: Animated.sequence([
          Animated.spring(scaleAnim, { toValue: 1.05, friction: 2, useNativeDriver: true }),
          Animated.spring(scaleAnim, { toValue: 1, friction: 3, useNativeDriver: true }),
        ]),
        stretching: Animated.sequence([
          Animated.spring(scaleAnim, { toValue: 1.15, friction: 3, useNativeDriver: true }),
          Animated.spring(scaleAnim, { toValue: 1, friction: 3, useNativeDriver: true }),
        ]),
        grooming: Animated.sequence([
          Animated.spring(scaleAnim, { toValue: { x: 0.95, y: 1.05 }, friction: 2, useNativeDriver: true }),
          Animated.spring(scaleAnim, { toValue: 1, friction: 3, useNativeDriver: true }),
        ]),
        watching: Animated.timing(scaleAnim, { toValue: 1.02, duration: 300, useNativeDriver: true }),
      };

      const anim = animations[currentReaction];
      if (anim) {
        anim.start(() => {
          setTimeout(() => setReaction('sleeping'), 2000);
        });
      }
    }
  }, [currentReaction, isAnimating]);

  const rotation = rotateAnim.interpolate({
    inputRange: [-0.1, 0.1],
    outputRange: ['-5deg', '5deg'],
  });

  // リアクションごとの尻尾のパス
  const tailPaths: Record<string, string> = {
    happy: 'M95 85 Q115 60 100 75 Q120 55 105 65',
    curious: 'M95 85 Q105 70 95 80',
    sleeping: 'M95 85 Q98 88 95 85',
    staring: 'M95 85 L110 70',
    stretching: 'M90 90 Q85 100 90 95',
    grooming: 'M95 85 Q90 78 95 85 Q88 70 93 75',
    watching: 'M95 85 Q103 78 95 85',
  };

  // 目の状態
  const renderEyes = () => {
    const eyeY = 45;
    const leftX = 48;
    const rightX = 72;
    const pupilY = currentReaction === 'curious' ? 43 : eyeY;

    if (currentReaction === 'sleeping') {
      return (
        <>
          <Path d={`M${leftX - 5} ${eyeY} L${leftX + 5} ${eyeY}`} stroke="#333" strokeWidth={2} strokeLinecap="round" />
          <Path d={`M${rightX - 5} ${eyeY} L${rightX + 5} ${eyeY}`} stroke="#333" strokeWidth={2} strokeLinecap="round" />
        </>
      );
    }

    return (
      <>
        <Circle cx={leftX} cy={eyeY} r={5} fill="#FFD700" />
        <Circle cx={rightX} cy={eyeY} r={5} fill="#FFD700" />
        <Circle cx={leftX - 1} cy={pupilY - 1} r={2} fill="#333" />
        <Circle cx={rightX - 1} cy={pupilY - 1} r={2} fill="#333" />
        {currentReaction === 'staring' && (
          <>
            <Circle cx={leftX - 1} cy={pupilY - 1} r={4} stroke="#333" strokeWidth={1} fill="none" />
            <Circle cx={rightX - 1} cy={pupilY - 1} r={4} stroke="#333" strokeWidth={1} fill="none" />
          </>
        )}
      </>
    );
  };

  // 口の状態
  const renderMouth = () => {
    if (currentReaction === 'happy') {
      return <Path d="M53 60 Q60 66 67 60" stroke="#333" strokeWidth={2} fill="none" strokeLinecap="round" />;
    }
    if (currentReaction === 'sleeping') {
      return <Path d="M58 62 L62 62" stroke="#333" strokeWidth={1.5} strokeLinecap="round" />;
    }
    // 通常の口
    return <Path d="M58 62 L62 62" stroke="#333" strokeWidth={1.5} strokeLinecap="round" />;
  };

  return (
    <View style={styles.container}>
      <Animated.View style={{ transform: [{ scale: scaleAnim }, { rotate: rotateAnim }] }}>
        <Svg width={size} height={size} viewBox="0 0 120 120">
          {/* 尻尾 */}
          <Path
            d={tailPaths[currentReaction] || tailPaths.watching}
            stroke="#6B4E3D"
            strokeWidth={4}
            fill="none"
            strokeLinecap="round"
          />

          {/* 体 */}
          <Ellipse cx={60} cy={85} rx={42} ry={32} fill="#6B4E3D" />

          {/* 体の模様（白い斑点） */}
          <Ellipse cx={45} cy={80} rx={8} ry={6} fill="#FFF5E0" opacity={0.7} />
          <Ellipse cx={75} cy="92" rx={6} ry={4} fill="#FFF5E0" opacity={0.5} />

          {/* 頭 */}
          <Ellipse cx={60} cy={45} rx={28} ry={25} fill="#6B4E3D" />

          {/* 頭の白い模様 */}
          <Ellipse cx={60} cy={52} rx={12} ry={8} fill="#FFF5E0" opacity={0.6} />

          {/* 耳（外側） */}
          <Path d="M32 25 L38 8 L55 25 Z" fill="#6B4E3D" />
          <Path d="M62 25 L82 8 L88 25 Z" fill="#6B4E3D" />

          {/* 耳（内側） */}
          <Path d="M35 25 L40 15 L50 25 Z" fill="#FFB6C1" />
          <Path d="M65 25 L78 15 L83 25 Z" fill="#FFB6C1" />

          {/* 目 */}
          {renderEyes()}

          {/* 鼻 */}
          <Path d="M60 52 L57 55 L63 55 Z" fill="#FFB6C1" />

          {/* 口 */}
          {renderMouth()}

          {/* 髭（左） */}
          <Line x1={30} y1={52} x2={18} y2={48} stroke="#333" strokeWidth={1} />
          <Line x1={30} y1={55} x2={18} y2={55} stroke="#333" strokeWidth={1} />
          <Line x1={30} y1={58} x2={20} y2={60} stroke="#333" strokeWidth={1} />

          {/* 髭（右） */}
          <Line x1={90} y1={52} x2={102} y2={48} stroke="#333" strokeWidth={1} />
          <Line x1={90} y1={55} x2={102} y2={55} stroke="#333" strokeWidth={1} />
          <Line x1={90} y1={58} x2={100} y2={60} stroke="#333" strokeWidth={1} />
        </Svg>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: 8,
  },
});
