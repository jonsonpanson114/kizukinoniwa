import { config } from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load .env from project root
config({ path: path.join(__dirname, '..', '.env') });

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.EXPO_PUBLIC_GEMINI_API_KEY;
const GEMINI_MODEL = 'gemini-2.5-flash';

if (!GEMINI_API_KEY) {
    console.error("❌ GEMINI_API_KEY is not set in .env");
    process.exit(1);
}

// Copy of the function from index.ts to ensure we test the same logic
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
- 「何も起きない日常」は禁止。必ず何らかの「奇妙な出来事」「謎」「事件の気配」を描写すること
- 台詞を軸にテンポよく展開する（無駄な状況説明は省く）
- ユーザーの気づきを「誰かが仕組んだ謎」や「奇妙な偶然」として変換して物語の核にする
- 部長（猫）に哲学的な一幕を必ず入れる
- Phase ${phase}のルールに従い、適切なキャラクターを使ってください
- 必要に応じて新しい伏線を仕込んでください（頻度は3〜5エピソードに1回程度）
- 未回収の伏線がある場合、自然に回収できるタイミングなら回収してください
- 余韻で終わること（完全な解決はしない）

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
                    maxOutputTokens: 4096,
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
