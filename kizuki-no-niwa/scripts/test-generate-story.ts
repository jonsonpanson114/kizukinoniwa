import { config } from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load .env from project root
config({ path: path.join(__dirname, '..', '.env') });

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = 'gemini-2.5-flash';

if (!GEMINI_API_KEY) {
    console.error("❌ GEMINI_API_KEY is not set in .env");
    process.exit(1);
}

// Copy of the function from index.ts to ensure we test the same logic
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
    recentKizuki: string[],
    previousSummary: string | null,
    foreshadowingList: { id: string; motif: string }[],
): string {
    const phaseName = ['', '土', '根', '芽', '花'][phase] || '土';
    const foreshadowingText = foreshadowingList.length > 0
        ? foreshadowingList.map(f => `- ${f.motif} (id: ${f.id})`).join('\n')
        : 'なし';

    const recentText = recentKizuki.length > 0
        ? recentKizuki.map((k, i) => `${i + 1}. ${k}`).join('\n')
        : 'なし';

    return `現在: ${phaseName}フェーズ (Phase ${phase}), Day ${day}

ユーザーの今日の気づき:
"${kizukiContent}"

直近の気づき:
${recentText}

前回のあらすじ:
${previousSummary || '（これが最初のエピソードです）'}

未回収の伏線:
${foreshadowingText}

指示:
- 400〜800文字の短編エピソードを日本語で書いてください
- ユーザーの「気づき」を天気、BGM、背景の出来事として間接的に織り込んでください
- ユーザーに説教しないでください
- Phase ${phase}のルールに従い、適切なキャラクターを使ってください
- 必要に応じて新しい伏線を仕込んでください（頻度は3〜5エピソードに1回程度）
- 未回収の伏線がある場合、自然に回収できるタイミングなら回収してください

以下のJSON形式のみで出力してください（他のテキストは不要）:
{
  "story_text": "物語本文",
  "summary_for_next": "次回への引き継ぎ要約（100文字以内）",
  "mood_tags": ["タグ1", "タグ2"],
  "character": "haru" または "sora",
  "new_foreshadowing": null または "伏線モチーフの文字列",
  "resolved_foreshadowing_id": null または "伏線のuuid"
}`;
}

async function runTest() {
    console.log("🧪 Starting Local Test for Gemini 2.5 Flash Generation...");
    console.log("🧪 Starting Local Test for Gemini 2.5 Flash Generation...");
    // console.log("🔑 API Key found: " + (GEMINI_API_KEY ? "Present" : "Missing")); // Do not log the key itself

    const mockPhase = 1;
    const mockDay = 1;
    const mockKizuki = "信号待ちで、青点滅が妙に長いと感じた。急ぐ必要はないのに、心臓だけが急いでいる。";

    const systemPrompt = getSystemPrompt(mockPhase);
    const userPrompt = buildUserPrompt(mockPhase, mockDay, mockKizuki, [], null, []);

    console.log("\n📝 User Prompt:\n" + userPrompt);
    console.log("\n⏳ Calling Gemini API...");

    try {
        const geminiApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

        const response = await fetch(geminiApiUrl, {
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
            throw new Error(`API Error: ${response.status} ${await response.text()}`);
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

        console.log("\n✨ Raw Response:\n", text);

        if (text) {
            console.log("\n✨ Raw Response:\n", text);
            fs.writeFileSync(path.join(__dirname, 'raw_response.txt'), text);

            let cleanText = text.replace(/```json\n?|```/g, '').trim();
            // Sometimes Gemini adds extra text outside JSON, try to find the first { and last }
            const firstBrace = cleanText.indexOf('{');
            const lastBrace = cleanText.lastIndexOf('}');
            if (firstBrace !== -1 && lastBrace !== -1) {
                cleanText = cleanText.substring(firstBrace, lastBrace + 1);
            }

            try {
                const parsed = JSON.parse(cleanText);
                console.log("\n✅ Parsed JSON:\n", JSON.stringify(parsed, null, 2));
                fs.writeFileSync(path.join(__dirname, 'result.json'), JSON.stringify(parsed, null, 2));
            } catch (e) {
                console.error("❌ JSON Parse Failed:", e);
                console.error("Cleaned text was:", cleanText);
            }
        }
    } catch (error: any) {
        // Sanitize error message to remove API key from URL if present
        let errorMessage = error.message || String(error);
        if (errorMessage.includes('key=')) {
            errorMessage = errorMessage.replace(/key=[^&]+/, 'key=REDACTED');
        }
        console.error("❌ Test Failed:", errorMessage);
    }
}

runTest();
