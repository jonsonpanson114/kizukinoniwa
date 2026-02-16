export const DAILY_PROMPTS: Record<number, string[]> = {
    1: [
        '今日の感情に色をつけるなら、何色でしたか？',
        '今日、ふと立ち止まった瞬間はありましたか？',
        '最後に空を見上げたのはいつですか？',
        '今日、耳に残っている音は何ですか？',
        '今日の自分を天気で表すと？',
        '誰かに言いそびれた言葉はありますか？',
        '今日、手に触れたもので印象的だったものは？',
    ],
    2: [
        '最近、誰かの言葉が心に引っかかりましたか？',
        '自分の中の矛盾に気づいた瞬間はありましたか？',
        '誰かと「すれ違った」と感じた瞬間は？',
        '最近、自分と似ていると感じた人はいますか？',
        '言葉にできなかった感情はありますか？',
        '「わかってほしい」と思った瞬間はありましたか？',
        '最近、沈黙が心地よかった瞬間は？',
    ],
    3: [
        '変わりたいと思った瞬間はありましたか？',
        '小さな勇気を出した場面はありましたか？',
        '誰かのために何かをした瞬間は？',
        '「前の自分なら」と思ったことはありますか？',
        '新しく始めたこと、または始めたいことは？',
        '最近、予想外だった出来事は？',
        '自分を許せた瞬間はありましたか？',
    ],
    4: [
        '今の自分から過去の自分に伝えたいことは？',
        'ここまでの旅で、一番大切だった気づきは？',
        '誰かに「ありがとう」を伝えたい人はいますか？',
        '自分にとっての「花」とは何ですか？',
        '手放せたものはありますか？',
        'この先、大切にしたいものは何ですか？',
        '今日の自分を一言で表すなら？',
    ],
};

export function getRandomPrompt(phase: number): string {
    const prompts = DAILY_PROMPTS[phase] || DAILY_PROMPTS[1];
    return prompts[Math.floor(Math.random() * prompts.length)];
}

/** Phase transition thresholds */
export const PHASE_THRESHOLDS: Record<number, number> = {
    2: 8,   // Day 8 -> Phase 2
    3: 22,  // Day 22 -> Phase 3
    4: 43,  // Day 43 -> Phase 4
};

export function getNextPhase(currentDay: number): number {
    if (currentDay >= PHASE_THRESHOLDS[4]) return 4;
    if (currentDay >= PHASE_THRESHOLDS[3]) return 3;
    if (currentDay >= PHASE_THRESHOLDS[2]) return 2;
    return 1;
}
