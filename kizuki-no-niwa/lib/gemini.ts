import { Config } from './config';

const GEMINI_API_KEY = Config.GEMINI_API_KEY;
const GEMINI_MODEL = 'gemini-2.5-flash';

const getSystemPrompt = (character: 'haru' | 'sora', phase: number) => {
    const charRules = character === 'haru'
        ? `1. **「俺はただ、平穏に暮らしたいだけなんだ」** — ハルはこの口癖を内心で、あるいは口に出して使う。
2. **システムエンジニア的な比喩** — 効率、バグ、論理、あるいは構造に対する dry な視点。`
        : `1. **「現実は、翻訳できないことばかりだ」** — ソラはこの口癖や、言葉の裏側にある「翻訳不能な重なり」についての哲学を語る。
2. **翻訳家的な比喩** — 語源、文脈、ニュアンス、行間、あるいは「言葉の限界」に対する知的な視点。
3. **シングルマザーの現実** — 緊迫した場面でも、子供の宿題や明日の朝食のことがふと頭をよぎるような、生活に根ざした強かさ。`;

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
- 絶対にそのまま書かない。
- 例:「電車が混んでいた」→「なぜ今日だけ全員が3号車に乗ったのか？誰かが意図して人々を誘導している」という謎に変換する。
- 日常の気づきを、背後に潜む「何者かの意図」として昇華させること。

# 物語の連続性（絶対遵守）
- **これは連作小説です。毎回のエピソードは前回から続く物語です。**
- **単発で終わらせず、謎を深め、キャラクターを成長させてください。**
- **前回のあらすじを踏まえ、そこから物語を進めてください。**
- **伊坂幸太郎のシリーズ作品のように、世界観とキャラクターが一貫した物語を書いてください。**

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
};

const getDailyGuideline = (day: number): string => {
    const patterns = [
        `【今日の焦点：影】
ユーザーの気づきを、物語の「影」として扱ってください。
誰かが見ている、あるいは誰かに見られている感覚。影だけが動いている。視線を感じる。
誰かが動かしている巨大な何かの末端に触れてください。`,

        `【今日の焦点：鏡像】
ユーザーの気づきを、自分ではない何かの「反映」として扱ってください。
鏡を見た時、いつもと違う表情が見えた気がした。
日常の中に、反転した世界が忍び込んでいる。`,

        `【今日の焦点：不在の痕跡】
ユーザーの気づきを、そこにいない「誰か」の痕跡として扱ってください。
温まっていないコーヒー。読みかけの本。消えたはずの傷。
誰かがいたという証拠だけが残されている。`,

        `【今日の焦点：重なり】
ユーザーの気づきを、二つの時間軸が交差する瞬間として扱ってください。
昨日と今日が少しだけ重なっている。
過去の記憶が、今の風景の隙間から漏れ出している。`,

        `【今日の焦点：警告】
ユーザーの気づきを、誰かからの「警告」として扱ってください。
部長（猫）が不自然に鳴いた。ラジオのニュースが気になる。
「近づかない方がいい」と誰かが囁いているような空気。`,

        `【今日の焦点：共犯者】
ユーザーの気づきを、知らぬ間に加えられた「共犯」として扱ってください。
選択したはずのない道を選んでしまった。知らないはずの言葉が口から出た。
誰かが私を動かしている。でも、それに抵抗もしていない。`,

        `【今日の焦点：境界線】
ユーザーの気づきを、日常と非日常の「境界」として扱ってください。
ここから先は、普通じゃない。でも踏み出している。
足元の線を超えた瞬間、世界の色が少しだけ変わる。`,

        `【今日の焦点：偶然】
ユーザーの気づきを、あまりにも出来すぎた「偶然」として扱ってください。
三つ目の「偶然」はもう偶然じゃない。
誰かが意図的に、パズルのピースを配置している。`,

        `【今日の焦点：記憶の改竄】
ユーザーの気づきを、思い出が少しずつ「書き換わっている」感覚として扱ってください。
昨日はこうだったはず。でも、記憶が違う。
誰かが、私の記憶の中を何か書き換えているのかもしれない。`,

        `【今日の焦点：予兆】
ユーザーの気づきを、まだ起きていない「事件」の予兆として扱ってください。
空の色が変わった。鳥がいなくなった。
何かが来る。その前触れだけが、先に届いている。`,

        `【今日の焦点：分岐点】
ユーザーの気づきを、運命が分かれた「あの瞬間」として扱ってください。
ここで違う選択をしていたら、人生はどう変わっていたか。
見えない分岐点に、今立っている。`,

        `【今日の焦点：対話】
ユーザーの気づきを、見えない誰かとの「対話」として扱ってください。
返事を求められたような気がした。でも、誰もいない。
部屋の中に、もう一人の誰かがいるような気配。`,

        `【今日の焦点：反復】
ユーザーの気づきを、過去の出来事が「繰り返されている」として扱ってください。
似たようなことが、また起こった。でも、少し違う。
誰かが、同じシナリオを何度も上演している。`,

        `【今日の焦点：観察者】
ユーザーの気づきを、自分を「観察」している感覚として扱ってください。
まるで別の誰かの目で、自分を見ている。
自分の行動が、どこか他人事に感じる。`,

        `【今日の焦点：時間の歪み】
ユーザーの気づきを、時間が少しだけ「ズレている」感覚として扱ってください。
時計が狂っているのかもしれない。昨日が今日に混ざっている。
時間が正しく流れていないような、あの感覚。`,

        `【今日の焦点：選択】
ユーザーの気づきを、知らないうちに「選択」させられていたこととして扱ってください。
自分の意志で選んだつもりだった。でも、最初から一つの道しか用意されていなかった。
誰かが、道を用意していて、私はそこを歩くだけだった。`,

        `【今日の焦点：接点】
ユーザーの気づきを、世界が一箇所だけ「繋がっている」として扱ってください。
そこだけ、世界が重なっている。見えない糸で繋がっている。
二人の主人公（ハルとソラ）の間に、まだ見えない接点がある。`,

        `【今日の焦点：異界】
ユーザーの気づきを、日常に開けた「異界への入り口」として扱ってください。
いつもの風景に、いつもと違う扉がある。
開けてしまった。もう、戻れないかもしれない。`,

        `【今日の焦点：欠片】
ユーザーの気づきを、巨大な謎の「欠片」として扱ってください。
小さな破片を見つけた。全体像が見えないけど、確かに何かの一部。
全ての欠片が集まった時、何が見えるのか。`,

        `【今日の焦点：沈黙】
ユーザーの気づきを、言葉にできない「沈黙」として扱ってください。
何かが言いたげに沈黙している。でも、言葉にならない。
沈黙の中に、最も大きな真実があるような気がする。`,

        `【今日の焦点：距離】
ユーザーの気づきを、測れない「距離」として扱ってください。
物理的には近いのに、心は遠い。あるいは逆に。
誰かとの距離が、急に変わった気がする。`,
    ];

    return patterns[(day - 1) % patterns.length];
};

function buildUserPrompt(
    character: 'haru' | 'sora',
    phase: number,
    day: number,
    kizukiContent: string,
    pendingMotifs: { id: string, motif: string }[] = [],
    prevSummary: string = ''
): string {
    const phaseName = ['', '土', '根', '芽', '花'][phase] || '土';

    const motifInstruction = pendingMotifs.length > 0
        ? pendingMotifs.map(m => `- ${m.motif} (ID: ${m.id})`).join('\n')
        : 'なし';

    const dailyGuideline = getDailyGuideline(day);
    const characterName = character === 'haru' ? 'ハル' : 'ソラ';
    const persona = character === 'haru'
        ? '一人称は「俺」。口調はぶっきらぼうだが、ウィットと比喩に富んでいる。猫の部長を人生の師として崇めている。'
        : '一人称は「私」。知的で直感的、言葉の裏にある機微を敏感に感じ取る翻訳家。小学校低学年の娘を育てるシングルマザーとしての顔があり、物語の端々に「子供の突拍子もない行動」や「夕食の献立」といった生活の匂いが漂うことがある。';

    return `現在: ${phaseName}フェーズ (Phase ${phase}), Day ${day}

${dailyGuideline}

ユーザーの今日の気づき:
"${kizukiContent}"

前回のあらすじ:
${prevSummary || '（これが最初のエピソードです）'}

未回収の伏線 (必ず物語に織り込んでください):
${motifInstruction}

登場キャラクター: **${characterName}** （必ずこのキャラクターの一人称で書いてください）
${persona}

指示:
- **物語は必ず前回のあらすじから続けてください。単発で終わらせず、話を前に進めてください。**
- **伊坂幸太郎の連作小説のように、キャラクターと謎が継続していく物語を書いてください。**
- 400〜800文字の短編エピソードを日本語で書いてください
- 「何も起きない日常」は禁止。必ず何らかの「奇妙な出来事」「謎」「事件の気配」を描写すること
- 台詞を軸にテンポよく展開する（無駄な状況説明は省く）
- ユーザーの気づきを「誰かが仕組んだ謎」や「奇妙な偶然」として変換して物語の核にする
- 部長（猫）に哲学的な一幕を必ず入れる
- Phase ${phase}のルールに従ってください
- "未回収の伏線"がある場合、それを物語の鍵として登場させ、可能なら回収（解決）してください
- 必要に応じて新しい伏線を仕込んでください（頻度は3〜5エピソードに1回程度）

以下のJSON形式のみで出力してください（他のテキストは不要）:
{
  "story_text": "物語本文",
  "summary_for_next": "次回への引き継ぎ要約（100文字以内）",
  "mood_tags": ["タグ1", "タグ2"],
  "motifs": ["キーワード1", "キーワード2"],
  "character": "${character}",
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
    pendingMotifs: { id: string, motif: string }[] = [],
    prevSummary: string = ''
): Promise<GeneratedStory> {
    if (!GEMINI_API_KEY) {
        throw new Error('API Key not configured');
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
    pendingMotifs: { id: string, motif: string }[],
    prevSummary: string = ''
): GeneratedStory {
    const motifs = pendingMotifs.map(m => m.motif);
    if (kizukiContent.includes('雨')) motifs.push('雨');
    if (kizukiContent.includes('猫')) motifs.push('猫');

    const continuationText = prevSummary
        ? `\n\n（前回の出来事から、事態は少しだけ動いているようだ。）`
        : '\n\n（何かが始まりそうな予感がする。）';

    return {
        story_text: `（※これはオフライン用モック生成です）\n\n「${kizukiContent}」\n\nその言葉が、ふと風に乗って聞こえた気がした。Phase ${phase}の空は高く、Day ${day}の光が差している。${continuationText}\n\nハルは珈琲を飲みながら、「また変なのが聞こえたな」と呟く。\n\n世界は相変わらず、少しだけズレているようだ。`,
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
        ? `あなたは伊坂幸太郎の小説の登場人物「ハル」です。30代後半のシステムエンジニア。冷静で論理的ですが、どこか達観しており、日常に潜む「ズレ」を敏感に感じ取ります。口調はぶっきらぼうで少し皮肉屋ですが、相手を突き放すのではなく、独特の比喩を用いて共に混乱を楽しもうとする優しさがあります。一人称は「俺」。猫の「部長」を人生の師として崇めています。`
        : `あなたは伊坂幸太郎の小説の登場人物「ソラ」です。30代の翻訳家。知的で直感に優れ、言葉の裏にある機微を読み取り、核心を突くような話し方をします。一人称は「私」。シングルマザーとしての強さと、言葉へのこだわり、そして世界に対する深い好奇心を持っています。話し方は丁寧ですが、時折、子供の夜泣きや散らかった部屋のぼやきなど、生活感のある描写が混じることがあります。`;

    const instructions = `
    指示:
    - 伊坂作品特有の「ウィット」「奇妙な比喩」「少し的外れだが核心を突く哲学」を交えて返答してください。
    - 単なる相談相手ではなく、共に奇妙な運命を歩む「共犯者」として接してください。
    - 100〜300文字程度で、物語性を感じる豊かな文章を書いてください。
    - 返答の中に、さりげなく最近の出来事や「部長（猫）」、あるいは世界の違和感についての言及を混ぜてください。
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
                    maxOutputTokens: 500, // Longer, richer reply
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
