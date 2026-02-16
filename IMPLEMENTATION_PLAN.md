# Kizuki no Niwa (気づきの庭) - Master Implementation Plan

## 0. Meta-Instructions for AI Agent (Claude Code)
**Role:** You are the Lead Architect and Senior Full-Stack Engineer for "Kizuki no Niwa".
**Objective:** Build a high-quality, production-ready MVP based on the specific requirements below.
**Tone:** Code should be clean, modular, and strictly typed. UI should be minimal, aesthetic ("Japanese modern/washi"), and performant.

---

## 1. Tech Stack & Architecture

### Frontend
- **Framework:** React Native (Expo SDK 50+)
- **Router:** Expo Router (File-based routing)
- **Language:** TypeScript (Strict mode)
- **Styling:** NativeWind (Tailwind CSS)
- **State Management:** Zustand (for simple global state) + TanStack Query (for server state)
- **Fonts:** Noto Serif JP (for stories), Noto Sans JP (for UI)

### Backend / Infrastructure
- **BaaS:** Supabase
- **Database:** PostgreSQL
- **Auth:** Supabase Auth (Anonymous Login initially, upgradeable to Email)
- **Logic:** Supabase Edge Functions (Deno/TypeScript)

### AI Core
- **Model:** Anthropic Claude 3.5 Sonnet (via Supabase Edge Functions)
- **Role:** Story generation, sentiment analysis, foreshadowing management.

---

## 2. Database Schema (Supabase)

Execute these SQL definitions to set up the foundation.

```sql
-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Users (Profiles)
create table public.profiles (
  id uuid references auth.users not null primary key,
  current_phase int default 1, -- 1:Soil, 2:Root, 3:Sprout, 4:Flower
  current_day int default 1,
  phase_started_at timestamptz default now(),
  created_at timestamptz default now()
);

-- 2. Stories (The Narrative)
create table public.stories (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) not null,
  character text check (character in ('haru', 'sora')),
  phase int not null,
  day int not null,
  content text not null, -- The story text (400-800 chars)
  summary text, -- Compressed context for the next generation
  mood_tags text[], -- ['melancholy', 'hope', etc.]
  created_at timestamptz default now()
);

-- 3. Kizuki (User Input)
create table public.kizuki (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) not null,
  content text not null,
  analysis_result jsonb, -- AI analysis of the input
  question_prompt text, -- The question asked to the user
  created_at timestamptz default now()
);

-- 4. Foreshadowing (Plot Devices)
create table public.foreshadowing (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) not null,
  motif text not null, -- e.g., "The sound of rain"
  status text default 'planted' check (status in ('planted', 'resolved')),
  planted_story_id uuid references public.stories(id),
  resolved_story_id uuid references public.stories(id),
  created_at timestamptz default now()
);

-- Enable RLS
alter table profiles enable row level security;
alter table stories enable row level security;
alter table kizuki enable row level security;
alter table foreshadowing enable row level security;

-- RLS Policy (Simple owner access)
create policy "Users can only access their own data" on profiles for all using (auth.uid() = id);
create policy "Users can only access their own stories" on stories for all using (auth.uid() = user_id);
create policy "Users can only access their own kizuki" on kizuki for all using (auth.uid() = user_id);
create policy "Users can only access their own foreshadowing" on foreshadowing for all using (auth.uid() = user_id);
3. Backend Logic (Edge Functions)
Function Name: generate-story

Trigger: Called after a user submits a "Kizuki" (Realization).

Logic Flow:

Fetch Context: Retrieve the user's last 3 kizuki entries, the previous story's summary, and any active foreshadowing.

Construct Prompt for Claude 3.5 Sonnet:

Persona: "You are a novelist with a style similar to Kotaro Isaka (witty, slightly cynical but warm, interconnected plotlines)."

Characters:

Haru: 30s male, office worker, talks to cats, mildly cynical.

Sora: 35 female, translator, single mother, strong but vulnerable.

Instruction: Write a short episode (400-800 chars) incorporating the user's "Kizuki" indirectly (as weather, background noise, or a minor event). DO NOT lecture the user.

Output Format (JSON):

JSON
{
  "story_text": "...",
  "summary_for_next": "...",
  "new_foreshadowing": "null or string",
  "resolved_foreshadowing_id": "null or uuid"
}
Save: Insert the generated story into stories table and update foreshadowing table if necessary.

4. Frontend Implementation Steps
Phase 1: Setup & Scaffolding
Initialize Expo app with TypeScript and Expo Router.

Setup NativeWind.

Configure Supabase Client (lib/supabase.ts).

Create strictly typed Database definitions (types/supabase.ts).

Phase 2: Core Components & Design System
Theme: Create constants/theme.ts.

Background: #F5F5F0 (Washi/Paper)

Text: #2D2D2D (Sumi Ink)

Accent: #8E8E93 (Stone)

Components:

Button.tsx: Minimalist, bordered, serif font.

TextArea.tsx: Clean, distraction-free input.

StoryViewer.tsx: Vertical flow (if possible) or wide line-height horizontal text. Fade-in animations are mandatory.

Phase 3: Features Implementation
Auth Screen: Simple "Start Journey" button (Anonymous Auth).

Home Screen (/index):

Display current date and phase (e.g., "Soil Phase - Day 3").

"Write Kizuki" button (Main CTA).

List of past stories (Title + Date).

Input Screen (/write):

Show a daily prompt (e.g., "What color was your emotion today?").

Large text area.

Submit triggers the generate-story function (simulate loading with a calming animation).

Story Screen (/story/[id]):

The generated story appears.

Focus on typography and readability.

5. Development Guidelines (For AI Agent)
Do not over-engineer. Stick to the requirements.

Type Safety is paramount. Use zod for validation if necessary.

Error Handling: Gracefully handle API failures (e.g., "The story is taking a detour...").

Isaka Style: When generating placeholder text or UI copy, use a tone that is "witty, slightly detached, yet warm."

6. Execution Command Sequence
Perform these steps sequentially.

npx create-expo-app@latest -t default

(Install dependencies: @supabase/supabase-js, nativewind, zustand, @tanstack/react-query)

(Create File Structure: app, components, lib, types)

(Implement Supabase Client & Auth Context)

(Implement UI Components)

(Implement Business Logic & API Calls)