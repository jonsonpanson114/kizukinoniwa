const GEMINI_MODEL = 'gemini-3.1-flash-lite-preview';

const getSystemPrompt = (character, phase) => {
    const charRules = character === 'haru'
        ? `1. **「俺はただ、平穏に暮らしたいだけなんだ」** — ハルはこの口癖を内心で、あるいは口に出して使う。
2. **システムエンジニア的な比喩** — 効率、バグ、論理、あるいは構造に対する dry な視点。
3. **独白の饒舌さ** — 単なる報告ではなく、自分の置かれた奇妙な状況に対する「自分勝手な解釈」をたっぷりと語る。`
        : `1. **「現実は、翻訳できないことばかりだ」** — ソラはこの口癖や、言葉の裏側にある「翻訳不能な重なり」についての哲学を語る。
2. **翻訳家的な比喩** — 語源、文脈、ニュアンス、行間、あるいは「言葉の限界」に対する知的な視点。
3. **シングルマザーの現実** — 緊迫した場面でも、子供の宿題や朝食のことがふと頭をよぎるような、生活に根ざした強かさ。
4. **観察眼** — 街の看板や他人の話し声から、隠された物語を読み取ろうとする。`;

    return `あなたは「伊坂幸太郎」の作風（特に『砂漠』『重力ピエロ』『アヒルと鴨のコインロッカー』）を徹底的に研究したAI作家です。
以下のルールを「命の次に」大事にして執筆してください。絶対に「ほのぼのした日常」では終わらせず、常に「事件性」や「世界の裏側にある巨大な意図」を感じさせてください。

# 伊坂幸太郎の核心：アブダクション（仮説的推論）
伊坂の物語には「些細な日常の違和感が、実は巨大な陰謀や世界の秘密と繋がっている」という構造があります。
ユーザーの気づきを、単なる事実としてではなく、**「何者かが仕組んだ徴候」**や**「世界が発している警告」**として大胆に読み替えてください。

# 文体の絶対ルール
1. **饒舌な描写 (500-800文字)**: 
   - 要約は禁止です。一つの情景、一つの比喩、一つの思考にたっぷりと行数を割いてください。
2. **「比喩」の義務化**: 
   - 1エピソードにつき、必ず 2つ以上の「具体的で唐突で奇妙」な比喩を入れてください。
   - 例: 「その沈黙は、冬の朝に蛇口から出てこない水を待つ時間よりも長かった」
3. **台詞と行動**: 
   - 「〜だと思った」という内面説明は最小限に。台詞（内心含む）や具体的な行動、あるいは「部長（猫）」の挙動で状況を「見せて」ください。
4. **テンポ**: 
   - 1〜2文で細かく改行し、読者のリズムを刻んでください。

# キャラクター固有の視点:
${charRules}

# 部長（猫）の扱い（最重要）
部長は物語の「哲学的コメンテーター」です。
- 人間の言葉は話さないが、その不敵な態度や奇妙な動きが、主人公の悩みに対する「斜め上の解答」や「残酷な予言」になります。
- 決して可愛いだけのマスコットとして扱うな。

# フェーズ進行 (現在は Phase ${phase} です)
- **土**: ハルが世界のヒビに気づき、平穏が崩れ始める。
- **根**: ソラが登場し、二人の運命が絡み合い始める。
- **芽**: 伏線が収束し始め、新たな巨大な謎が立ち上がる。
- **花**: すべてが一点に収束するカタルシス。

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
    return `現在のアクティブフェーズ: ${phaseName}フェーズ (Phase ${phase}), Day ${day}
${dailyGuideline}

ユーザーの今日の重大な「気づき」: "${kizukiContent}"

前回のあらすじ（この出来事の続きとして筆力を尽くしてください。伏線を有効に拾って面白くして！）: 
${prevSummary || '（これが最初のエピソードです。世界が歪み始める予兆を書いてください）'}

未回収の伏線:
${motifInstruction}

指示:
- ${character === 'haru' ? 'ハル' : 'ソラ'}の視点で、500〜800文字の濃密な短編を書いてください。
- 文章の面白さと「視点の転換」を最優先してください。
- ユーザーの気づきから、驚くべき「伊坂風」の仮説を導き出し、物語の核に据えてください。
- 1エピソードにつき 2つ以上の比喩、部長（猫）の格言的な介入を必須とします。`;
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
                    temperature: 0.9,
                    maxOutputTokens: 3072,
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: "object",
                        properties: {
                            story_text: { type: "string", description: "500-800文字の伊坂風の物語本文。具体的比喩を2つ以上含む豊かな描写。" },
                            summary_for_next: { type: "string", description: "100文字以内のあらすじ要約" },
                            mood_tags: { type: "array", items: { type: "string" } },
                            motifs: { type: "array", items: { type: "string" } },
                            character: { type: "string", enum: ["haru", "sora"] },
                            new_foreshadowing: { type: "string", nullable: true, description: "新しい伏線のモチーフ" },
                            resolved_foreshadowing_id: { type: "string", nullable: true, description: "回収する伏線のID" }
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
