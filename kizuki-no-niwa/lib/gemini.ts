import { Config } from './config';

const GEMINI_API_KEY = Config.GEMINI_API_KEY;
const GEMINI_MODEL = 'gemini-2.5-flash';

const getSystemPrompt = (phase: number) => `あなたは「伊坂幸太郎」の作風を徹底的に研究したAI作家です。
以下の全ルールを完全に守って執筆してください。絶対に「ほのぼのした日常」では終わらせず、何らかの「事件性」や「不穏な影」を感じさせてください。

# 伊坂幸太郎の核心
伊坂の物語には「些細な日常の違和感が、実は巨大な陰謀や世界の秘密と繋がっている」という構造がある。
主人公は特別な人間ではない。しかし、常に「厄介事」に巻き込まれる。

# 文体の絶対ルール
1. **台詞から始めるか、劇的な状況描写から始める** — 平凡な地の文で説明から入るな。
2. **比喩は必ず具体的で唐突で奇妙** — 「悲しかった」ではなく「賞味期限が三日切れた牛乳を飲む時のような決意で」
3. **「俺はただ、平穏に暮らしたいだけなんだ」** — ハルはこの口癖を内心で、あるいは口に出して使う。
4. **テンポ** — 長い段落は書かない。1〜3文で改行する。

# 部長（猫）の扱い（最重要）
部長はただの猫ではない。物語の「哲学的コメンテーター」だ。
- 人間の言葉は話さないが、行動で鋭い返答（あるいは無謀な警告）をする。
- ハルが迷った時、部長の一挙動が偶然「答え」になる。
- 決して可愛いだけのマスコットとして扱うな。

# ユーザーの「気づき」の扱い（最重要）
ユーザーの気づきは「事件の発端（トリガー）」として扱え。
- 絶対にそのまま書かない。
- 例:「電車が混んでいた」→「なぜ今日だけ全員が3号車に乗ったのか？誰かが意図して人々を誘導している」という謎に変換する。
- 日常の気づきを、背後に潜む「何者かの意図」として昇華させること。

# フェーズ進行 (現在は Phase ${phase} です)
- **土 (Phase 1)**: ハルの一人称。ありふれた日常に、取り返しのつかないヒビが入る瞬間。ソラはまだ登場しない。
- **根 (Phase 2)**: ソラが登場。二人は別々の角度から同じ「謎」や「事件」に巻き込まれている。
- **芽 (Phase 3)**: 伏線が一つ解け、別の巨大な謎が立ち上がる。
- **花 (Phase 4)**: 全ての謎や伏線が一点に収束するカタルシス。

# 絶対禁止
- 教訓・説教・「大切なこと」の直接表現
- 「〜だと思った」の多用（内面を説明するな、行動や台詞で状況を見せろ）
- ハッピーエンドにしすぎること
- 出来事が何も起きないただのモノローグ

# 出力形式
必ず正当なJSON形式で出力すること。Markdownのコードブロック（\`\`\`json）は不要。`;

function buildUserPrompt(
    phase: number,
    day: number,
    kizukiContent: string,
    pendingMotifs: { id: string, motif: string }[] = []
): string {
    const phaseName = ['', '土', '根', '芽', '花'][phase] || '土';

    const motifInstruction = pendingMotifs.length > 0
        ? pendingMotifs.map(m => `- ${m.motif} (ID: ${m.id})`).join('\n')
        : 'なし';

    return `現在: ${phaseName}フェーズ (Phase ${phase}), Day ${day}

ユーザーの今日の気づき:
"${kizukiContent}"

直近の気づき:
なし

前回のあらすじ:
（これが最初のエピソードです）

未回収の伏線 (必ず物語に織り込んでください):
${motifInstruction}

指示:
- 400〜800文字の短編エピソードを日本語で書いてください
- 「何も起きない日常」は禁止。必ず何らかの「奇妙な出来事」「謎」「事件の気配」を描写すること
- 台詞を軸にテンポよく展開する（無駄な状況説明は省く）
- ユーザーの気づきを「誰かが仕組んだ謎」や「奇妙な偶然」として変換して物語の核にする
- 部長（猫）に哲学的な一幕を必ず入れる
- Phase ${phase}のルールに従い、適切なキャラクターを使ってください
- "未回収の伏線"がある場合、それを物語の鍵として登場させ、可能なら回収（解決）してください
- 必要に応じて新しい伏線を仕込んでください（頻度は3〜5エピソードに1回程度）
- 余韻で終わること（完全な解決はしない）

以下のJSON形式のみで出力してください（他のテキストは不要）:
{
  "story_text": "物語本文",
  "summary_for_next": "次回への引き継ぎ要約（100文字以内）",
  "mood_tags": ["タグ1", "タグ2"],
  "character": "haru" または "sora",
  "new_foreshadowing": null または "伏線モチーフの文字列",
  "resolved_foreshadowing_id": null または "伏線のuuid" (今回回収した伏線があれば)
}`;
}

export interface GeneratedStory {
    story_text: string;
    summary_for_next: string;
    mood_tags: string[];
    motifs: string[]; // [NEW] Extracted motifs like "rain", "coffee", "cat"
    character: 'haru' | 'sora';
    new_foreshadowing: string | null;
    resolved_foreshadowing_id: string | null;
}

export async function generateStory(
    phase: number,
    day: number,
    kizukiContent: string,
    pendingMotifs: { id: string, motif: string }[] = []
): Promise<GeneratedStory> {
    if (!GEMINI_API_KEY) {
        throw new Error('API Key not configured');
    }

    const systemPrompt = getSystemPrompt(phase);
    const userPrompt = buildUserPrompt(phase, day, kizukiContent, pendingMotifs);

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                system_instruction: { parts: [{ text: systemPrompt }] },
                contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
                generationConfig: {
                    temperature: 0.9,
                    maxOutputTokens: 4096,
                    responseMimeType: 'application/json',
                },
            }),
        });

        if (!response.ok) {
            throw new Error(`Gemini API Error: ${response.status}`);
        }

        const data = await response.json();
        let text = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!text) throw new Error('No content generated');

        // Clean JSON
        let cleanText = text.replace(/```json\n?|```/g, '').trim();
        const firstBrace = cleanText.indexOf('{');
        const lastBrace = cleanText.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1) {
            cleanText = cleanText.substring(firstBrace, lastBrace + 1);
        }

        return JSON.parse(cleanText);

    } catch (error) {
        const errMsg = error instanceof Error ? error.message : String(error);
        console.error('Gemini API failed:', errMsg);
        throw new Error(`Gemini API failed: ${errMsg}`);
    }
}

function mockGenerateStory(
    phase: number,
    day: number,
    kizukiContent: string,
    pendingMotifs: { id: string, motif: string }[]
): GeneratedStory {
    const motifs = pendingMotifs.map(m => m.motif);
    if (kizukiContent.includes('雨')) motifs.push('雨');
    if (kizukiContent.includes('猫')) motifs.push('猫');

    return {
        story_text: `（※これはオフライン用モック生成です）\n\n「${kizukiContent}」\n\nその言葉が、ふと風に乗って聞こえた気がした。Phase ${phase}の空は高く、Day ${day}の光が差している。\n\nハルは珈琲を飲みながら、「また変なのが聞こえたな」と呟く。\n\n世界は相変わらず、少しだけズレているようだ。`,
        summary_for_next: `Day ${day}の記録。${kizukiContent}についての考察。`,
        mood_tags: ["Offline", "Mock", "Mystery"],
        motifs: motifs.length > 0 ? motifs : ["予感"],
        character: phase >= 2 && Math.random() > 0.5 ? 'sora' : 'haru',
        new_foreshadowing: Math.random() > 0.7 ? "謎の鍵" : null,
        resolved_foreshadowing_id: pendingMotifs.length > 0 ? pendingMotifs[0].id : null
    };
}

export async function generateReply(
    character: 'haru' | 'sora',
    history: { role: 'user' | 'model', text: string }[],
    userMessage: string
): Promise<string> {
    if (!GEMINI_API_KEY) throw new Error('API Key not configured');

    const persona = character === 'haru'
        ? `あなたは「ハル」という30代の男性会社員です。少し皮肉屋ですが、根は優しい性格です。猫の「部長」とよく話します。口調は少しぶっきらぼうですが、ウィットがあります。「俺は〜だ」という口調です。`
        : `あなたは「ソラ」という35歳のシングルマザーで翻訳家です。強い芯がありますが、脆さも隠し持っています。口調は理知的ですが、感情豊かです。「私は〜」という口調です。`;

    const instructions = `
    指示:
    - ユーザー（物語の主人公C）の言葉に対して、あなたのキャラクターとして返答してください。
    - 短く（100文字以内）、会話がつながるようにしてください。
    - 説教はしないでください。共感するか、少し違う視点を提示してください。
    `;

    const chatHistory = history.map(h => ({
        role: h.role,
        parts: [{ text: h.text }]
    }));

    // Add new user message
    chatHistory.push({ role: 'user', parts: [{ text: userMessage }] });

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                system_instruction: { parts: [{ text: persona + instructions }] },
                contents: chatHistory,
                generationConfig: {
                    temperature: 0.8,
                    maxOutputTokens: 150, // Short reply
                },
            }),
        });

        if (!response.ok) throw new Error(`Gemini API Error: ${response.status}`);
        const data = await response.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || "...";
    } catch (e) {
        console.error("Chat Generation Failed", e);
        return "...（言葉を探しているようだ）";
    }
}
