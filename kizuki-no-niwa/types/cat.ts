// 猫キャラクターのリアクション型定義

export type CatReactionType =
  | 'happy'      // 尻尾を振る
  | 'curious'    // 頭をかしげる
  | 'sleeping'   // 寝る
  | 'staring'    // 睨む
  | 'stretching' // 伸びをする
  | 'grooming'   // 身だしなみ
  | 'watching';  // 見ている

export type CatTrigger =
  | 'positive_kizuki'    // ポジティブな気づき
  | 'negative_kizuki'    // ネガティブな気づき
  | 'questioning'        // 疑問を含む気づき
  | 'story_created'      // 物語生成時
  | 'foreshadowing_resolved' // 伏線回収時
  | 'phase_change'       // フェーズ変更時
  | 'idle';               // アイドル状態

export interface CatReaction {
  type: CatReactionType;
  trigger: CatTrigger;
  duration?: number; // ミリ秒
}
