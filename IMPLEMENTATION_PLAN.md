# 気づきの庭 (Kizuki no Niwa) - 実装計画書 (マスタープラン)

## 0. AIエージェントへのメタ指示
**役割:** あなたは「気づきの庭」のリードアーキテクト兼シニアフルスタックエンジニアである。
**目的:** 以下の要件に基づき、高品質で本番運用可能なMVP（Minimum Viable Product）を構築すること。
**トーン:** コードはクリーンでモジュール化され、厳密に型定義されていること。UIはミニマルで、「日本の現代的な美意識（和紙・墨）」を感じさせ、パフォーマンスが高いこと。

---

## 1. コンセプト: 3つの物語線と交差

このアプリは、以下の3つの物語が交差する体験である。

1.  **物語線A (ハル):** 30代会社員。皮肉屋だが優しい。
2.  **物語線B (ソラ):** 35歳シングルマザー翻訳家。強いが脆い。
3.  **物語線C (あなた):** ユーザー自身。日々の「気づき」を通して、AとBの世界に影響を与える。

### 物語の交差パターン
物語は以下の4パターンで交差する。
1.  **モチーフの共鳴 (Phase 1):** ユーザーの気づきに含まれる「雨」や「色」が、翌日のハル・ソラの物語に環境音として現れる。
2.  **因果の連鎖 (Phase 2):** ユーザーの内省が、巡り巡ってハルの世界に小さな変化を起こす。
3.  **伏線の越境 (All):** Aの物語のアイテムが、Bの物語に登場する。
4.  **視点の融合 (Phase 3-4):** 同じシーンをAとBの視点で描く。最終的に3つの視点が一箇所に集まる。

---

## 2. 技術スタックとアーキテクチャ

### フロントエンド
- **フレームワーク:** React Native (Expo SDK 50+)
- **ルーター:** Expo Router (ファイルベースルーティング)
- **言語:** TypeScript (Strict mode)
- **スタイリング:** NativeWind (Tailwind CSS)
- **状態管理:** Zustand (シンプルなグローバル状態) + TanStack Query (サーバー状態)
- **フォント:** Noto Serif JP (物語本文), Noto Sans JP (UI)

### バックエンド / インフラ
- **BaaS:** Supabase
- **データベース:** PostgreSQL
- **認証:** Supabase Auth (初期は匿名ログイン、後にEmailへアップグレード可能)
- **ロジック:** Supabase Edge Functions (Deno/TypeScript)

### AIコア
- **モデル:** Google Gemini 2.5 Flash (Supabase Edge Functionsまたはクライアント直接呼び出し)
- **役割:** 物語生成、感情分析、伏線管理。

---

## 2. データベース・スキーマ (Supabase)

以下のSQL定義を実行し、基盤を構築する。

```sql
-- UUID拡張の有効化
create extension if not exists "uuid-ossp";

-- 1. ユーザー (Profiles)
create table public.profiles (
  id uuid references auth.users not null primary key,
  current_phase int default 1, -- 1:土(Soil), 2:根(Root), 3:芽(Sprout), 4:花(Flower)
  current_day int default 1,
  phase_started_at timestamptz default now(),
  created_at timestamptz default now()
);

-- 2. 物語 (Stories)
create table public.stories (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) not null,
  character text check (character in ('haru', 'sora')),
  phase int not null,
  day int not null,
  content text not null, -- 物語本文 (400-800文字)
  summary text, -- 次回生成用の圧縮コンテキスト
  mood_tags text[], -- ['melancholy', 'hope', etc.]
  created_at timestamptz default now()
);

-- 3. 気づき (Kizuki - ユーザー入力)
create table public.kizuki (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) not null,
  content text not null,
  analysis_result jsonb, -- AIによる分析結果
  question_prompt text, -- ユーザーへの問いかけ
  created_at timestamptz default now()
);

-- 4. 伏線 (Foreshadowing - プロットデバイス)
create table public.foreshadowing (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) not null,
  motif text not null, -- 例: "雨の音"
  status text default 'planted' check (status in ('planted', 'resolved')),
  planted_story_id uuid references public.stories(id),
  resolved_story_id uuid references public.stories(id),
  created_at timestamptz default now()
);

-- 5. 対話 (Dialogues - ハル・ソラとの直接対話)
create table public.dialogues (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) not null,
  character text check (character in ('haru', 'sora')),
  messages jsonb, -- チャット履歴
  triggered_by_story_id uuid references public.stories(id),
  created_at timestamptz default now()
);

-- RLS (Row Level Security) の有効化
alter table profiles enable row level security;
alter table stories enable row level security;
alter table kizuki enable row level security;
alter table foreshadowing enable row level security;
alter table dialogues enable row level security;

-- RLSポリシー (所有者のみアクセス可能)
create policy "Users can only access their own data" on profiles for all using (auth.uid() = id);
create policy "Users can only access their own stories" on stories for all using (auth.uid() = user_id);
create policy "Users can only access their own kizuki" on kizuki for all using (auth.uid() = user_id);
create policy "Users can only access their own foreshadowing" on foreshadowing for all using (auth.uid() = user_id);
create policy "Users can only access their own dialogues" on dialogues for all using (auth.uid() = user_id);
```

---

## 3. バックエンドロジック (Edge Functions)

**関数名:** `generate-story`

**トリガー:** ユーザーが「気づき (Kizuki)」を送信した後に呼び出される。

**ロジックフロー:**

1.  **コンテキスト取得:** ユーザーの過去3件の「気づき」、前回の物語の「要約」、未回収の「伏線」を取得。
2.  **フェーズ判定:** 以下の基準で自動遷移を判定する。
    *   **Phase 1 -> 2:** 気づきの蓄積20日以上 ＆ 自己認識の深まり。
    *   **Phase 2 -> 3:** 因果の連鎖の発生回数。
3.  **Gemini 2.5 Flash へのプロンプト構築:**
    *   **ペルソナ:** 「伊坂幸太郎に似た作風の小説家（ウィットに富み、少しシニカルだが温かみがあり、伏線が絡み合う）。」
    *   **キャラクター:**
        *   **ハル (Haru):** 30代男性。会社員。猫に話しかける癖がある。ややシニカル。
        *   **ソラ (Sora):** 35歳女性。翻訳家。シングルマザー。強いが脆さもある。
        *   **あなた (User):** 物語Cの主人公。日々の「気づき」を通して、上記2人の運命に密かに介入する観測者。
    *   **指示:** ユーザーの「気づき」を天気、環境音、些細な出来事として間接的に織り込んだショートショート（400-800文字）を書くこと。**説教は禁止。**
3.  **出力形式 (JSON):**
    ```json
    {
      "story_text": "...",
      "summary_for_next": "...",
      "new_foreshadowing": "null または 文字列",
      "resolved_foreshadowing_id": "null または uuid"
    }
    ```
4.  **保存:** 生成された物語を `stories` テーブルに保存し、必要に応じて `foreshadowing` テーブルを更新する。

---

## 4. フロントエンド実装ステップ

### Phase 1: セットアップ & 足場作り
- [x] TypeScript と Expo Router で Expo アプリを初期化。
- [x] NativeWind をセットアップ。
- [x] Supabase Client を設定 (`lib/supabase.ts`)。
- [x] 厳密に型定義された Database 型を作成 (`types/supabase.ts`)。

### Phase 2: コアコンポーネント & デザインシステム
- **テーマ:** `constants/theme.ts` を作成。
    - Background: `#F5F5F0` (和紙/Paper)
    - Text: `#2D2D2D` (墨/Sumi Ink)
    - Accent: `#8E8E93` (石/Stone)
- **コンポーネント:**
    - `Button.tsx`: ミニマルな枠線付き、セリフ体フォント。
    - `TextArea.tsx`: クリーンで集中できる入力欄。
    - `StoryViewer.tsx`: 可能なら縦書き、または行間の広い横書き。フェードインアニメーションは必須。

### Phase 3: 機能実装
- **認証画面:** シンプルな「物語を始める」ボタン（匿名認証）。
- **ホーム画面 (`/index`):**
    - 現在の日付とフェーズを表示（例：「土フェーズ - Day 3」）。
    - 「気づきを書く」ボタン（メインCTA）。
    - 過去の物語リスト（タイトル + 日付）。
- **入力画面 (`/write`):**
    - 今日の問いを表示（例：「今日の感情は何色でしたか？」）。
    - 大きなテキストエリア。
    - 送信で `generate-story` をトリガー（落ち着いたアニメーションでローディングを演出）。
- **物語画面 (`/story/[id]`):**
    - 生成された物語を表示。
    - タイポグラフィと可読性を重視。

---

## 5. 開発ガイドライン & 設計思想

1.  **ジャッジしない:** 「書けなかった日」も物語の一部。罰則やストリーク切れの概念を持たない。
2.  **競争しない:** ランキングや他者比較を一切排除する。
3.  **押しつけない:** 通知は最小限。
4.  **物語で伝える:** 説教やアドバイスを直接表示しない。すべてはハルとソラの物語を通じて間接的に伝える。
5.  **過剰設計の禁止:** 要件に従い、シンプルに保つこと。
6.  **型安全性:** 最優先事項。
7.  **伊坂スタイル:** UI文言ひとつにも「ウィット」と「余韻」を。

---

## 6. 実行コマンドシーケンス

順次、以下のステップを実行する。

1.  `npx create-expo-app@latest -t default`
2.  依存関係のインストール (`@supabase/supabase-js`, `nativewind`, `zustand`, `@tanstack/react-query`)
3.  ファイル構造の作成 (`app`, `components`, `lib`, `types`)
4.  Supabase Client & Auth Context の実装
5.  UIコンポーネントの実装
6.  ビジネスロジック & APIコールの実装