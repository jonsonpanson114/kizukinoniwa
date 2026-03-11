// 感情分析ユーティリティ

import type { CatReactionType, CatTrigger } from '../types/cat';

export interface SentimentAnalysis {
  sentiment: 'positive' | 'negative' | 'neutral';
  hasQuestion: boolean;
  confidence: number;
}

export interface CatReactionResult {
  type: CatReactionType;
  trigger: CatTrigger;
}

export class SentimentAnalyzer {
  private static positiveWords = [
    '幸せ', '楽しい', '嬉しい', '感謝', '愛', '好き', '希望', '笑い', '喜び', 'ありがとう',
    '楽', '喜', '幸', '愛し', '笑', '感謝', '嬉', '晴', '明', '温', '優', '和', '安',
    'よかった', '良かった', 'すごい', '素晴らしい', '最高', '嬉しい', '楽しい', '幸せ',
  ];
  private static negativeWords = [
    '悲しい', '辛い', '不安', '恐れ', '怒り', '嫌い', '悔しい', '孤独', '痛み', '涙',
    '悲', '辛', '怖', '憎', '悔', '痛', '苦', '焦', '疲', '悩', '迷', '寂',
    '辛かった', '悲しい', '怖い', '不安', '悔しい', '嫌だ',
  ];
  private static questionWords = ['?', '？', 'なぜ', 'どうして', 'どう', '何', 'どうすれば'];

  static analyze(kizukiContent: string): SentimentAnalysis {
    let positiveCount = 0;
    let negativeCount = 0;

    for (const word of this.positiveWords) {
      if (kizukiContent.includes(word)) positiveCount++;
    }

    for (const word of this.negativeWords) {
      if (kizukiContent.includes(word)) negativeCount++;
    }

    const hasQuestion = this.questionWords.some((w) => kizukiContent.includes(w));

    if (positiveCount > negativeCount) {
      return { sentiment: 'positive', hasQuestion, confidence: positiveCount / (positiveCount + negativeCount) };
    } else if (negativeCount > positiveCount) {
      return { sentiment: 'negative', hasQuestion, confidence: negativeCount / (positiveCount + negativeCount) };
    }

    return { sentiment: 'neutral', hasQuestion, confidence: 0.5 };
  }

  static getReactionType(analysis: SentimentAnalysis): CatReactionResult {
    const reactionMap: Record<string, CatReactionType> = {
      positive: 'happy',
      negative: 'staring',
      neutral: 'watching',
    };

    const triggerMap: Record<string, CatTrigger> = {
      'true-positive': 'positive_kizuki',
      'true-negative': 'negative_kizuki',
      'false-positive': 'questioning',
      'false-negative': 'questioning',
      'true-neutral': 'story_created',
      'false-neutral': 'story_created',
    };

    return {
      type: reactionMap[analysis.sentiment] || 'watching',
      trigger: triggerMap[`${analysis.hasQuestion}-${analysis.sentiment}`] || 'story_created',
    };
  }

  static getCatReaction(kizukiContent: string): CatReactionResult {
    const analysis = this.analyze(kizukiContent);
    return this.getReactionType(analysis);
  }
}
