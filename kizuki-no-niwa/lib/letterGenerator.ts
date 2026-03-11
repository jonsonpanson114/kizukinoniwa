// フェーズ終了の手紙生成ユーティリティ

import type { Database } from '../types/supabase';

type Kizuki = Database['public']['Tables']['kizuki']['Row'];
type Story = Database['public']['Tables']['stories']['Row'];

export interface PhaseLetter {
  id: string;
  phase: number;
  title: string;
  content: string;
  created_at: string;
  delivered: boolean;
  read_at?: string;
}

export class LetterGenerator {
  static extractTopMotifs(stories: Story[], limit: number = 5): string[] {
    const motifCount = new Map<string, number>();

    for (const story of stories) {
      if (story.mood_tags) {
        for (const motif of story.mood_tags) {
          motifCount.set(motif, (motifCount.get(motif) || 0) + 1);
        }
      }
    }

    return Array.from(motifCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([motif]) => motif);
  }

  static analyzeOverallSentiment(kizukis: Kizuki[]): 'positive' | 'neutral' | 'negative' {
    const positiveWords = ['幸せ', '楽しい', '嬉しい', '感謝', '愛', '好き', '希望', '笑い', '喜び'];
    const negativeWords = ['悲しい', '辛い', '不安', '恐れ', '怒り', '嫌い', '悔しい', '孤独', '痛み'];

    let positiveCount = 0;
    let negativeCount = 0;

    for (const kizuki of kizukis) {
      for (const word of positiveWords) {
        if (kizuki.content.includes(word)) positiveCount++;
      }
      for (const word of negativeWords) {
        if (kizuki.content.includes(word)) negativeCount++;
      }
    }

    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  static generatePhaseLetter(
    phase: number,
    kizukis: Kizuki[],
    stories: Story[]
  ): PhaseLetter {
    const topMotifs = this.extractTopMotifs(stories, 5);
    const sentiment = this.analyzeOverallSentiment(kizukis);
    const date = new Date().toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const phaseNames = ['土', '根', '芽', '花'];
    const phaseName = phaseNames[phase - 1] || `Phase ${phase}`;

    const sentimentMessage: Record<string, string> = {
      positive: 'ポジティブな気づきが多くありましたね。その光は、きっと未来を照らしてくれるはずです。',
      negative: '多くの問いがありました。深く考える時間は、成長の糧になります。',
      neutral: '穏やかで、静かな日々でした。その静寂の中に、大切なものが隠れているのかもしれません。',
    };

    const templates: Record<number, string> = {
      1: `親愛なる私へ

${date}、フェーズ「${phaseName}」を終えました。

この${kizukis.length}日間、あなたは${topMotifs[0] || '何か'}について考えました。
${sentimentMessage[sentiment]}

次のフェーズ「根」では、もっと深く掘り下げてみましょう。
見えていなかったものが、きっとあるはずです。

部長も、あなたの変化を感じているようです。
いつも庭で、あなたを待っています。

あなた自身より`,

      2: `親愛なる私へ

${date}、フェーズ「${phaseName}」を終えました。

${kizukis.length}日間の気づきから、${topMotifs.length}つのテーマが見つかりました。
特に「${topMotifs[0] || ''}」と「${topMotifs[1] || ''}」が繰り返し現れています。

部長も、あなたの成長を感じているようです。
時折、庭を見上げて、何かを語りかけるような目をしています。

フェーズ「芽」では、これらのテーマがどう花開くか見守りましょう。
伏線の中には、もうすぐ芽吹くものがあるかもしれません。

あなた自身より`,

      3: `親愛なる私へ

${date}、フェーズ「${phaseName}」を終えました。

気づきの庭に、少しずつ芽が見え始めています。
${topMotifs.slice(0, 3).join('、')}...これらは、あなたが大切にしているものです。

伏線の中には、もうすぐ回収されるものがあるかもしれません。
植えた種は、いつか必ず花を咲かせる。部長がそう言った気がします。

次のフェーズ「花」では、全てが咲き乱れるでしょう。
その花々が、あなたの物語を彩ります。

あなた自身より`,

      4: `親愛なる私へ

${date}、全てのフェーズを終えました。

庭は美しい花で満たされています。
${kizukis.length}個の気づき。その一つ一つが、あなたを形作っています。

部長も、庭の隅で、満足そうに目を細めています。
あなたが綴ってきた物語を、一緒に見てきたからでしょう。

物語はここで終わりではありません。
あなたが気づきを綴る限り、庭は生き続けます。
新しい種は、すぐにでも植えられます。

いつまでも、あなたと共に。

あなた自身より`,
    };

    return {
      id: `letter-${Date.now()}`,
      phase,
      title: `フェーズ${phase}終了の手紙`,
      content: templates[phase as keyof typeof templates] || templates[1],
      created_at: new Date().toISOString(),
      delivered: false,
    };
  }

  static shouldGenerateLetter(currentPhase: number, lastLetterPhase: number | null): boolean {
    // フェーズが進行した場合、前のフェーズの手紙を生成
    if (lastLetterPhase === null) return false;
    return currentPhase > lastLetterPhase && currentPhase <= 4;
  }
}
