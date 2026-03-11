// 庭のビジュアル表示コンポーネント

import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Animated, Text } from 'react-native';
import { Svg, Circle, Path, Rect, G } from 'react-native-svg';
import { useGardenStore } from '../stores/gardenStore';
import type { GardenState } from '../types/garden';

const COLORS = {
  washi: '#F5F5F0',
  sumi: '#2D2D2D',
  stone: '#8E8E93',
};

export const GardenView: React.FC = () => {
  const garden = useGardenStore();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const interval = setInterval(() => {
      garden.updateTimeOfDay();
    }, 5 * 60 * 1000);

    const seasonInterval = setInterval(() => {
      garden.updateSeason();
    }, 60 * 60 * 1000);

    Animated.timing(fadeAnim, { toValue: 1, duration: 1000, useNativeDriver: true }).start();

    return () => {
      clearInterval(interval);
      clearInterval(seasonInterval);
    };
  }, []);

  const getGardenColors = () => {
    const colorMap: Record<GardenState['season'], { bg: string; accent: string }> = {
      spring: { bg: '#F5F0E6', accent: '#FFB7C5' },
      summer: { bg: '#F0F5E6', accent: '#90EE90' },
      autumn: { bg: '#F5E6D3', accent: '#FFB347' },
      winter: { bg: '#E8ECF0', accent: '#A5D8DD' },
    };
    return colorMap[garden.season];
  };

  const colors = getGardenColors();
  const timeColors: Record<GardenState['time_of_day'], { overlay: string }> = {
    morning: { overlay: 'rgba(255, 248, 240, 0.3)' },
    afternoon: { overlay: 'rgba(255, 250, 240, 0.1)' },
    evening: { overlay: 'rgba(255, 200, 150, 0.2)' },
    night: { overlay: 'rgba(100, 100, 150, 0.3)' },
  };

  const seasonNames: Record<GardenState['season'], string> = {
    spring: '春',
    summer: '夏',
    autumn: '秋',
    winter: '冬',
  };

  const timeNames: Record<GardenState['time_of_day'], string> = {
    morning: '朝',
    afternoon: '昼',
    evening: '夕',
    night: '夜',
  };

  return (
    <Animated.View style={[styles.container, { backgroundColor: colors.bg, opacity: fadeAnim }]}>
      {/* 時間帯オーバーレイ */}
      <View style={[styles.timeOverlay, { backgroundColor: timeColors[garden.time_of_day].overlay }]} />

      {/* 季節・時間表示 */}
      <View style={styles.infoBar}>
        <Text style={styles.infoText}>
          {seasonNames[garden.season]}・{timeNames[garden.time_of_day]}
        </Text>
      </View>

      <Svg style={styles.svg} viewBox="0 0 400 200">
        {/* 背景の光 */}
        {garden.time_of_day !== 'night' && (
          <Circle cx={350} cy={30} r={25} fill={garden.time_of_day === 'evening' ? '#FFB347' : '#FFF5E0'} opacity={0.4} />
        )}

        {/* 月（夜のみ） */}
        {garden.time_of_day === 'night' && (
          <Circle cx={350} cy={30} r={15} fill="#F5F5DC" opacity={0.8} />
        )}

        {/* 雲（朝・昼） */}
        {(garden.time_of_day === 'morning' || garden.time_of_day === 'afternoon') && (
          <Path d="M50 30 Q70 20 90 30 Q100 25 110 35 Q120 30 130 35 Q140 45 50 45 Z" fill="#FFF" opacity={0.6} />
        )}

        {/* 地面 */}
        <Path d="M0 150 Q200 140 400 150 L400 200 L0 200 Z" fill="#D4C4B0" />

        {/* 遠くの山 */}
        <Path d="M0 130 L80 80 L160 120 L240 70 L320 110 L400 90 L400 150 L0 150 Z" fill="#C9C0A8" opacity={0.5} />

        {/* 木 */}
        {garden.trees.map((tree) => {
          const trunkHeight = tree.growth_stage === 'mature' ? 80 : tree.growth_stage === 'young' ? 60 : 40;
          const crownRadius = tree.growth_stage === 'mature' ? 50 : tree.growth_stage === 'young' ? 35 : 20;
          const trunkX = tree.position.x;
          const trunkY = 150 - trunkHeight;

          const crownColor =
            tree.type === 'maple'
              ? '#FF6B6B'
              : tree.type === 'pine'
                ? '#228B22'
                : tree.type === 'ginkgo'
                  ? '#FFD700'
                  : '#FFB7C5';

          return (
            <G key={tree.id}>
              {/* 幹 */}
              <Rect x={trunkX - 5} y={trunkY} width={10} height={trunkHeight} fill="#8B4513" rx={2} />
              {/* 冠 */}
              <Circle cx={trunkX} cy={trunkY - 10} r={crownRadius} fill={crownColor} opacity={0.8} />
            </G>
          );
        })}

        {/* 花 */}
        {garden.flowers.map((flower) => {
          const sizeMap = { small: 6, medium: 10, large: 14 };
          const radius = sizeMap[flower.size];

          return (
            <G key={flower.id}>
              {/* 茎 */}
              <Path
                d={`M${flower.position.x} ${flower.position.y} Q${flower.position.x} ${flower.position.y + 20} ${flower.position.x + Math.random() * 10 - 5} ${flower.position.y + 30}`}
                stroke="#4CAF50"
                strokeWidth={2}
                fill="none"
              />
              {/* 花 */}
              <Circle cx={flower.position.x} cy={flower.position.y} r={radius} fill={flower.color} opacity={0.9} />
              {/* 花の中心 */}
              <Circle cx={flower.position.x} cy={flower.position.y} r={radius * 0.3} fill="#FFD700" />
            </G>
          );
        })}
      </Svg>

      {/* 成長プログレスバー */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBackground}>
          <View
            style={[styles.progressFill, { width: `${garden.growth_level}%`, backgroundColor: colors.accent }]}
          />
        </View>
        <Text style={styles.progressText}>
          {garden.flowers.length}花・{garden.trees.length}木
        </Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    marginHorizontal: 16,
    marginBottom: 16,
  },
  timeOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
  infoBar: {
    position: 'absolute',
    top: 8,
    left: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  infoText: {
    fontSize: 12,
    fontFamily: 'serif',
    color: '#2D2D2D',
  },
  svg: {
    flex: 1,
  },
  progressContainer: {
    position: 'absolute',
    bottom: 8,
    left: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressBackground: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 11,
    color: '#2D2D2D',
    fontFamily: 'serif',
  },
});
