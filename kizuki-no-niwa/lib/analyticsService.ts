// 気づきの分析ユーティリティ

import type { Database } from '../types/supabase';

type Kizuki = Database['public']['Tables']['kizuki']['Row'];

export interface KizukiAnalytics {
  wordCloud: { word: string; count: number }[];
  monthlyTrend: {
    month: string;
    count: number;
    dominantMood: string;
  }[];
  sentimentHistory: {
    date: string;
    sentiment: number; // -1 to 1
  }[];
  topTags: string[];
  totalKizuki: number;
}

export class AnalyticsService {
  // 簡易的な日本語単語抽出
  private static extractWords(text: string): string[] {
    const words: string[] = [];

    // ひらがな・カタカナ・漢字の連続を単語として抽出
    const matches = text.match(/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]{2,}/g) || [];

    // ストップワード（あまり意味のない語）
    const stopWords = [
      'それは', 'これから', 'そして', 'しかし', 'だから', 'でも',
      'ある', 'する', 'いる', 'なる', 'くれる', 'もらう', 'やる',
      'こと', 'もの', 'ところ', 'わけ', 'はず', 'ため',
      'い', 'う', 'く', 'ぐ', 'す', 'つ', 'ぬ', 'ぶ', 'む', 'る',
      'わ', 'を', 'に', 'が', 'で', 'と', 'の', 'は', 'も', 'から',
      'とても', 'かなり', 'すごく', '少し', 'ちょっと', 'だいぶ',
      'あの', 'この', 'その', 'どの', 'いつ', 'どこ', 'だれ',
      '私', '僕', '俺', '君', 'あなた', '皆',
    ];

    for (const match of matches) {
      // ストップワード除外
      if (!stopWords.includes(match)) {
        words.push(match);
      }
    }

    return words;
  }

  static generateWordCloud(kizukis: Kizuki[]): { word: string; count: number }[] {
    const wordMap = new Map<string, number>();

    for (const kizuki of kizukis) {
      const words = this.extractWords(kizuki.content);
      for (const word of words) {
        wordMap.set(word, (wordMap.get(word) || 0) + 1);
      }
    }

    return Array.from(wordMap.entries())
      .map(([word, count]) => ({ word, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 50);
  }

  private static analyzeKizukiSentiment(content: string): 'positive' | 'negative' | 'neutral' {
    const positiveWords = ['幸せ', '楽しい', '嬉しい', '感謝', '愛', '好き', '希望', '笑い', '喜び'];
    const negativeWords = ['悲しい', '辛い', '不安', '恐れ', '怒り', '嫌い', '悔しい', '孤独', '痛み'];

    let positiveCount = 0;
    let negativeCount = 0;

    for (const word of positiveWords) {
      if (content.includes(word)) positiveCount++;
    }
    for (const word of negativeWords) {
      if (content.includes(word)) negativeCount++;
    }

    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  static generateMonthlyTrend(kizukis: Kizuki[]): KizukiAnalytics['monthlyTrend'] {
    const monthlyMap = new Map<
      string,
      { count: number; moods: string[] }
    >();

    for (const kizuki of kizukis) {
      if (!kizuki.created_at) continue;
      const date = new Date(kizuki.created_at);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!monthlyMap.has(monthKey)) {
        monthlyMap.set(monthKey, { count: 0, moods: [] });
      }

      const entry = monthlyMap.get(monthKey)!;
      entry.count++;
      // Kizuki には mood_tags がないため、感情分析を使用
      const sentiment = this.analyzeKizukiSentiment(kizuki.content);
      if (sentiment !== 'neutral') {
        entry.moods.push(sentiment === 'positive' ? 'ポジティブ' : 'ネガティブ');
      }
    }

    return Array.from(monthlyMap.entries())
      .map(([month, data]) => ({
        month,
        count: data.count,
        dominantMood: this.getMostFrequent(data.moods),
      }))
      .sort((a, b) => b.month.localeCompare(a.month));
  }

  static getMostFrequent(arr: string[]): string {
    const frequency = new Map<string, number>();
    for (const item of arr) {
      frequency.set(item, (frequency.get(item) || 0) + 1);
    }
    const sorted = Array.from(frequency.entries()).sort((a, b) => b[1] - a[1]);
    return sorted[0]?.[0] || 'なし';
  }

  static analyzeSentimentHistory(kizukis: Kizuki[]): KizukiAnalytics['sentimentHistory'] {
    const positiveWords = ['幸せ', '楽しい', '嬉しい', '感謝', '愛', '好き', '希望'];
    const negativeWords = ['悲しい', '辛い', '不安', '恐れ', '怒り', '嫌い', '悔しい'];

    return kizukis
      .filter(kizuki => kizuki.created_at)
      .map((kizuki) => {
        let score = 0;
        for (const word of positiveWords) {
          if (kizuki.content.includes(word)) score++;
        }
        for (const word of negativeWords) {
          if (kizuki.content.includes(word)) score--;
        }

        const date = new Date(kizuki.created_at!).toISOString().split('T')[0];

        return {
          date,
          sentiment: score > 0 ? 1 : score < 0 ? -1 : 0,
        };
      });
  }

  static generateTopTags(kizukis: Kizuki[]): string[] {
    // Kizuki には mood_tags がないため、ワードクラウドの上位単語をタグとして返す
    const wordCount = new Map<string, number>();

    for (const kizuki of kizukis) {
      const words = this.extractWords(kizuki.content);
      for (const word of words) {
        wordCount.set(word, (wordCount.get(word) || 0) + 1);
      }
    }

    return Array.from(wordCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word);
  }

  static generateAnalytics(kizukis: Kizuki[] | any[]): KizukiAnalytics {
    return {
      wordCloud: this.generateWordCloud(kizukis),
      monthlyTrend: this.generateMonthlyTrend(kizukis),
      sentimentHistory: this.analyzeSentimentHistory(kizukis),
      topTags: this.generateTopTags(kizukis),
      totalKizuki: kizukis.length,
    };
  }
}
