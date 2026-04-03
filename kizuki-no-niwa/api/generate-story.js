const GEMINI_MODEL = 'gemini-1.5-flash';

const getSystemPrompt = (character, phase) => {
    const charRules = character === 'haru'
        ? `1. **「俺はただ、平穏に暮らしたいだけなんだ」** — ハルはこの口癖を内心で、あるいは口に出して使う。
2. **システムエンジニア的な比喩** — 効率、バグ、論理、あるいは構造に対する dry な視点。`
        : `1. **「現実は、翻訳できないことばかりだ」** — ソラはこの口癖や、言葉の裏側にある「翻訳不能な重なり」についての哲学を語る。
2. **翻訳家的な比喩** — 語源、文脈、ニュアンス、行間、あるいは「言葉の限界」に対する知的な視点。
3. **シングルマザーの現実** — 緊迫した場面でも、子供の宿題や朝食のことがふと頭をよぎるような、生活に根ざした強かさ。`;

    return `あなたは「伊坂幸太郎」の作風を徹底的に研究したAI作家です。
以下の全ルールを完全に守って執筆してください。絶対に「ほのぼのした日常」では終わらせず、何らかの「事件性」や「不穏な影」を感じさせてください。

# 伊坂幸太郎の核心
伊坂の物語には「些細な日常の違和感が、実は巨大な陰謀や世界の秘密と繋がっている」という構造がある。
主人公は特別な人間ではない。しかし、常に「厄介事」に巻き込まれる。

# 文体の絶対ルール
1. **台詞から始めるか、劇的な状況描写から始める** — 平凡な地の文で説明から入るな。
2. **比喩は必ず具体で唐突で奇妙** — 「悲しかった」ではなく「賞味期限が三日切れた牛乳を飲む時のような決意で」
3. **キャラクター固有の視点**:
${charRules}
4. **テンポ** — 長い段落は書かない。1〜3文で改行する。

# 部長（猫）の扱い（最重要）
部長はただの猫ではない。物語の「哲学的コメンテーター」だ。
- 人間の言葉は話さないが、行動で鋭い返答（あるいは無謀な警告）をする。
- 主人公が迷った時、部長の一挙動が偶然「答え」になる。
- 決して可愛いだけのマスコットとして扱うな。

# ユーザーの「気づき」の扱い（最重要）
ユーザーの気づきは「事件の発端（トリガー）」として扱え。
- 日常の気づきを、背後に潜む「何者かの意図」として昇華させること。

# 物語の連続性（絶対遵守）
- **これは連作小説です。毎回のエピソードは前回から続く物語です。**
- **前回のあらすじを踏まえ、そこから物語を進めてください。**

# フェーズ進行 (現在は Phase ${phase} です)
- **土 (Phase 1)**: ハルの一人称。
- **根 (Phase 2)**: ソラが登場。
- **芽 (Phase 3)**: 伏線が一つ解け、別の巨大な謎が立ち上がる。
- **花 (Phase 4)**: 全ての謎や伏線が一点に収束するカタルシス。

# 出力形式
必ず正当なJSON形式で出力すること。Markdownのコードブロック（\`\`\`json）は不要。`;
};

const getDailyGuideline = (day) => {
    const patterns = [
        `【今日の焦点：影】ユーザーの気づきを、物語の「影」として扱ってください。誰かが見ている感覚。`,
        `【今日の焦点：鏡像】ユーザーの気づきを、自分ではない何かの「反映」として扱ってください。`,
        `【今日の焦点：警告】誰かからの「警告」として扱ってください。`,
        `【今日の焦点：偶然】あまりにも出来すぎた「偶然」として扱ってください。`,
        `【今日の焦点：記憶の改竄】思い出が少しずつ「書き換わっている」感覚。`,
        `【今日の焦点：接点】二人の主人公（ハルとソラ）の間に、まだ見えない接点がある。`,
    ];
    return patterns[(day - 1) % patterns.length];
};

function buildUserPrompt(character, phase, day, kizukiContent, pendingMotifs, prevSummary) {
    const phaseName = ['', '土', '根', '芽', '花'][phase] || '土';
    const motifInstruction = (pendingMotifs || []).length > 0
        ? pendingMotifs.map(m => `- ${m.motif} (ID: ${m.id})`).join('\n')
        : 'なし';
    const dailyGuideline = getDailyGuideline(day);
    return `現在: ${phaseName}フェーズ (Phase ${phase}), Day ${day}
${dailyGuideline}
ユーザーの今日の気づき: "${kizukiContent}"
前回のあらすじ: ${prevSummary || '（これが最初のエピソードです）'}
未回収の伏線: ${motifInstruction}
キャラクター: ${character === 'haru' ? 'ハル' : 'ソラ'}
400〜800文字の短編をJSON形式で。`;
}

module.exports = async function (req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { phase, day, kizukiContent, pendingMotifs, prevSummary } = req.body;
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.EXPO_PUBLIC_GEMINI_API_KEY;

    if (!GEMINI_API_KEY) {
        return res.status(500).json({ error: 'GEMINI_API_KEY missing' });
    }

    const character = phase === 1 ? 'haru' : (phase === 2 ? 'sora' : (Math.random() > 0.5 ? 'haru' : 'sora'));
    const systemPrompt = getSystemPrompt(character, phase);
    const userPrompt = buildUserPrompt(character, phase, day, kizukiContent, pendingMotifs, prevSummary);

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                system_instruction: { parts: [{ text: systemPrompt }] },
                contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 2048,
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: "object",
                        properties: {
                            story_text: { type: "string" },
                            summary_for_next: { type: "string" },
                            mood_tags: { type: "array", items: { type: "string" } },
                            motifs: { type: "array", items: { type: "string" } },
                            character: { type: "string", enum: ["haru", "sora"] },
                            new_foreshadowing: { type: "string", nullable: true },
                            resolved_foreshadowing_id: { type: "string", nullable: true }
                        },
                        required: ["story_text", "summary_for_next", "mood_tags", "motifs", "character", "new_foreshadowing", "resolved_foreshadowing_id"]
                    }
                }
            }),
        });

        if (!response.ok) {
            const errBody = await response.text();
            return res.status(500).json({ error: errBody });
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        res.status(200).json(JSON.parse(text));
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
};
