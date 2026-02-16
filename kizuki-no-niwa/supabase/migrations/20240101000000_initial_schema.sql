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
