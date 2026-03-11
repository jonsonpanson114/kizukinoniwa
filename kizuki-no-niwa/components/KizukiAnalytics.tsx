// 気づきの可視化コンポーネント

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { LocalKizukiStore } from '../lib/localKizukiStore';
import { AnalyticsService } from '../lib/analyticsService';
import type { KizukiAnalytics as KizukiAnalyticsType } from '../lib/analyticsService';

const COLORS = {
  washi: '#F5F5F0',
  sumi: '#2D2D2D',
  stone: '#8E8E93',
};

const { width } = Dimensions.get('window');

type TabType = 'words' | 'trend' | 'sentiment' | 'tags';

export const KizukiAnalyticsView: React.FC = () => {
  const [analytics, setAnalytics] = useState<KizukiAnalyticsType | null>(null);
  const [selectedTab, setSelectedTab] = useState<TabType>('words');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        const kizukis = await LocalKizukiStore.getKizukiLogs();
        setAnalytics(AnalyticsService.generateAnalytics(kizukis));
      } catch (e) {
        console.error('Failed to load analytics:', e);
      } finally {
        setLoading(false);
      }
    };
    loadAnalytics();
  }, []);

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>言葉の庭</Text>
        <View style={styles.centerContainer}>
          <Text style={styles.loadingText}>読み込み中...</Text>
        </View>
      </View>
    );
  }

  if (!analytics || analytics.totalKizuki === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>言葉の庭</Text>
        <View style={styles.centerContainer}>
          <Text style={styles.emptyIcon}>🌱</Text>
          <Text style={styles.emptyText}>まだ気づきがありません</Text>
          <Text style={styles.emptySubtext}>気づきを綴ると、言葉の庭が育ちます</Text>
        </View>
      </View>
    );
  }

  const tabs: { id: TabType; label: string }[] = [
    { id: 'words', label: '言葉の種' },
    { id: 'trend', label: '時の流れ' },
    { id: 'sentiment', label: '心の動き' },
    { id: 'tags', label: 'タグ' },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>言葉の庭</Text>
      <Text style={styles.subtitle}>{analytics.totalKizuki}個の気づき</Text>

      {/* タブ切り替え */}
      <View style={styles.tabs}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, selectedTab === tab.id && styles.activeTab]}
            onPress={() => setSelectedTab(tab.id)}
          >
            <Text
              style={[
                styles.tabText,
                selectedTab === tab.id && styles.activeTabText,
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 内容 */}
      <ScrollView style={styles.content}>
        {selectedTab === 'words' && (
          <View style={styles.wordCloud}>
            {analytics.wordCloud.map((word, i) => {
              const fontSize = Math.max(14, 32 - i * 0.5);
              const opacity = Math.max(0.4, 1 - i * 0.015);
              return (
                <View key={i} style={styles.wordItem}>
                  <Text
                    style={[
                      styles.word,
                      { fontSize, opacity },
                    ]}
                  >
                    {word.word}
                  </Text>
                  <Text style={styles.wordCount}>{word.count}回</Text>
                </View>
              );
            })}
          </View>
        )}

        {selectedTab === 'trend' && (
          <View style={styles.trendList}>
            {analytics.monthlyTrend.length === 0 ? (
              <Text style={styles.noData}>まだデータがありません</Text>
            ) : (
              analytics.monthlyTrend.map((trend) => {
                const maxCount = Math.max(...analytics.monthlyTrend.map(t => t.count));
                const barWidth = (trend.count / maxCount) * 100;

                return (
                  <View key={trend.month} style={styles.trendItem}>
                    <Text style={styles.trendMonth}>{trend.month}</Text>
                    <View style={styles.trendBarContainer}>
                      <View style={[styles.trendBar, { width: `${barWidth}%` }]} />
                    </View>
                    <Text style={styles.trendCount}>{trend.count}件</Text>
                  </View>
                );
              })
            )}
          </View>
        )}

        {selectedTab === 'sentiment' && (
          <View style={styles.sentimentContainer}>
            <Text style={styles.sentimentTitle}>感情の推移</Text>
            {analytics.sentimentHistory.length === 0 ? (
              <Text style={styles.noData}>まだデータがありません</Text>
            ) : (
              <View style={styles.sentimentChart}>
                <View style={styles.sentimentLegend}>
                  <Text style={styles.positiveText}>😊 ポジティブ</Text>
                  <Text style={styles.neutralText}>😐 ニュートラル</Text>
                  <Text style={styles.negativeText}>😢 ネガティブ</Text>
                </View>
                <ScrollView horizontal style={styles.sentimentScroll}>
                  <View style={styles.sentimentBars}>
                    {analytics.sentimentHistory.map((item, i) => {
                      const sentiment = item.sentiment;
                      const backgroundColor =
                        sentiment > 0 ? '#90EE90' : sentiment < 0 ? '#FFB6C1' : '#E0E0E0';
                      const height = sentiment !== 0 ? 60 : 20;

                      return (
                        <View key={i} style={styles.sentimentBarItem}>
                          <View
                            style={[
                              styles.sentimentBar,
                              { backgroundColor, height },
                            ]}
                          />
                          <Text style={styles.sentimentDate}>
                            {item.date.slice(5).replace('-', '/')}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                </ScrollView>
              </View>
            )}
          </View>
        )}

        {selectedTab === 'tags' && (
          <View style={styles.tagsContainer}>
            {analytics.topTags.length === 0 ? (
              <Text style={styles.noData}>タグがありません</Text>
            ) : (
              analytics.topTags.map((tag, i) => (
                <View key={i} style={styles.tagItem}>
                  <Text style={styles.tag}>{tag}</Text>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: COLORS.washi,
  },
  title: {
    fontSize: 24,
    fontFamily: 'serif',
    color: COLORS.sumi,
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.stone,
    textAlign: 'center',
    marginBottom: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  loadingText: {
    textAlign: 'center',
    color: COLORS.stone,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    textAlign: 'center',
    color: COLORS.sumi,
    fontSize: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    textAlign: 'center',
    color: COLORS.stone,
    fontSize: 12,
  },
  tabs: {
    flexDirection: 'row',
    marginBottom: 16,
    backgroundColor: '#FFF',
    borderRadius: 8,
    overflow: 'hidden',
    flexWrap: 'wrap',
  },
  tab: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    minWidth: width / 4 - 4,
  },
  activeTab: {
    backgroundColor: COLORS.sumi,
  },
  tabText: {
    color: COLORS.sumi,
    fontFamily: 'serif',
    fontSize: 12,
  },
  activeTabText: {
    color: '#FFF',
  },
  content: {
    flex: 1,
  },
  wordCloud: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  wordItem: {
    alignItems: 'center',
  },
  word: {
    fontFamily: 'serif',
    color: COLORS.sumi,
  },
  wordCount: {
    fontSize: 10,
    color: COLORS.stone,
  },
  trendList: {
    gap: 8,
  },
  noData: {
    textAlign: 'center',
    color: COLORS.stone,
    paddingVertical: 32,
  },
  trendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#FFF',
    borderRadius: 8,
  },
  trendMonth: {
    fontSize: 14,
    fontFamily: 'serif',
    color: COLORS.sumi,
    width: 70,
  },
  trendBarContainer: {
    flex: 1,
    height: 20,
    backgroundColor: '#F0F0F0',
    borderRadius: 10,
    marginHorizontal: 12,
    overflow: 'hidden',
  },
  trendBar: {
    height: '100%',
    backgroundColor: '#FFB7C5',
    borderRadius: 10,
  },
  trendCount: {
    fontSize: 14,
    color: COLORS.stone,
    width: 40,
    textAlign: 'right',
  },
  sentimentContainer: {
    padding: 16,
    backgroundColor: '#FFF',
    borderRadius: 12,
  },
  sentimentTitle: {
    fontSize: 16,
    fontFamily: 'serif',
    color: COLORS.sumi,
    marginBottom: 12,
    textAlign: 'center',
  },
  sentimentLegend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  positiveText: {
    fontSize: 12,
    color: '#228B22',
  },
  neutralText: {
    fontSize: 12,
    color: COLORS.stone,
  },
  negativeText: {
    fontSize: 12,
    color: '#DC143C',
  },
  sentimentChart: {
    minHeight: 100,
  },
  sentimentScroll: {
    flexDirection: 'row',
  },
  sentimentBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  sentimentBarItem: {
    alignItems: 'center',
  },
  sentimentBar: {
    width: 16,
    borderRadius: 8,
  },
  sentimentDate: {
    fontSize: 10,
    color: COLORS.stone,
    marginTop: 4,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagItem: {
    backgroundColor: '#FFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E5E0',
  },
  tag: {
    fontSize: 13,
    fontFamily: 'serif',
    color: COLORS.sumi,
  },
});
