import { Database } from '../types/supabase';

const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
const GEMINI_MODEL = 'gemini-2.5-flash';

const getSystemPrompt = (phase: number) => `あなたは「伊坂幸太郎」の作風を深く理解したAI作家です。
以下の特徴を備えた、ウィットと伏線に富んだショートショートを執筆してください。

# 文体とトーン
- **会話主導**: テンポの良い会話劇で物語を進める。
- **シニカルなユーモア**: 登場人物は少しひねくれているが、根底には善意がある。
- **日常の謎**: 些細な違和感や偶然を、世界の命運（あるいは夕飯のメニュー）と同じ重さで扱う。
- **比喩**: 「冷蔵庫の裏に落ちたピーナッツのような」といった、具体的で少し奇妙な比喩を使う。

# キャラクター・マトリクス
1. **春（ハル）**: 30代男性。システムエンジニア。論理的だが、非論理的な運命に巻き込まれやすい。「俺はただ、平穏に暮らしたいだけなんだ」が口癖。猫（名前は「部長」）に相談する癖がある。
2. **空（ソラ）**: 35歳女性。翻訳家。直感的で行動力がある。ハルとは対照的に、混沌を楽しむ節がある。

# フェーズ進行 (現在は Phase ${phase} です)
- **土 (Phase 1)**: ハルの一人称。日常の「ズレ」に気づく段階。まだソラとは出会わない。
- **根 (Phase 2)**: ソラが登場。二人の視点が交互、あるいは交錯する。
- **芽 (Phase 3)**: 伏線が芽吹き始める。過去の些細な出来事が意味を持ち始める。
- **花 (Phase 4)**: 全ての伏線が回収されるカタルシス。

# 執筆ルール
1. **ユーザーの「気づき」の扱い**: 入力された「気づき」を物語の**核**にするが、そのまま文章には出さない。それは「ラジオから流れるニュース」や「通りすがりの会話」、「壁の落書き」として背景に溶け込ませる。
2. **説教禁止**: 教訓めいたことは書かない。読者に委ねる。
3. **余韻**: オチをつけすぎない。「...かもしれない」という余韻で終わる。

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
- ユーザーの「気づき」を天気、BGM、背景の出来事として間接的に織り込んでください
- ユーザーに説教しないでください
- Phase ${phase}のルールに従い、適切なキャラクターを使ってください
- "未回収の伏線"がある場合、それを物語の鍵として登場させ、可能なら回収（解決）してください
- 必要に応じて新しい伏線を仕込んでください（頻度は3〜5エピソードに1回程度）

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
                    maxOutputTokens: 2048,
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
        console.warn('Gemini API failed, falling back to mock generation:', error);
        return mockGenerateStory(phase, day, kizukiContent, pendingMotifs);
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
