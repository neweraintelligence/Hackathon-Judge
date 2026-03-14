-- ─────────────────────────────────────────────────────────────────────────────
-- Cursor Judging — Initial Schema
-- Run this in the Supabase SQL Editor
-- ─────────────────────────────────────────────────────────────────────────────

-- Events
create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  date date not null,
  criteria_config jsonb not null default '[]',
  judging_mode text not null default 'rubric' check (judging_mode in ('rubric', 'pairwise', 'hybrid')),
  created_at timestamptz default now()
);

-- Submissions
create table if not exists submissions (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  github_url text not null,
  devpost_url text,
  team_name text not null,
  pitch_text text,
  status text not null default 'pending' check (status in ('pending', 'analyzing', 'ready', 'error')),
  created_at timestamptz default now()
);

-- Submission media (screenshots + video)
create table if not exists submission_media (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references submissions(id) on delete cascade,
  type text not null check (type in ('screenshot', 'video')),
  storage_url text not null,
  sort_order int not null default 0
);

-- Judges
create table if not exists judges (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  display_name text,
  event_id uuid not null references events(id) on delete cascade,
  invite_token text not null unique,
  user_id uuid references auth.users(id),
  joined_at timestamptz,
  created_at timestamptz default now()
);

-- AI Analyses (one row per pass per submission)
create table if not exists ai_analyses (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references submissions(id) on delete cascade,
  pass_name text not null,
  model_used text not null default '',
  thinking_tokens int,
  result jsonb,
  status text not null default 'pending' check (status in ('pending', 'running', 'complete', 'error')),
  error text,
  created_at timestamptz default now(),
  unique (submission_id, pass_name)
);

-- AI Scores (per criterion, from Pass 6 synthesis)
create table if not exists ai_scores (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references submissions(id) on delete cascade,
  criteria_key text not null,
  score numeric not null,
  reasoning text not null default '',
  confidence text not null default 'medium' check (confidence in ('low', 'medium', 'high')),
  unique (submission_id, criteria_key)
);

-- Judge Scores
create table if not exists judge_scores (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references submissions(id) on delete cascade,
  judge_id uuid not null references judges(id) on delete cascade,
  criteria_key text not null,
  score numeric not null check (score >= 0 and score <= 10),
  comment text,
  created_at timestamptz default now(),
  unique (submission_id, judge_id, criteria_key)
);

-- Pairwise Comparisons
create table if not exists pairwise_comparisons (
  id uuid primary key default gen_random_uuid(),
  judge_id uuid not null references judges(id) on delete cascade,
  event_id uuid not null references events(id) on delete cascade,
  submission_a_id uuid not null references submissions(id) on delete cascade,
  submission_b_id uuid not null references submissions(id) on delete cascade,
  winner_id uuid not null references submissions(id),
  criteria_key text not null,
  created_at timestamptz default now()
);

-- Pool Scores (computed after all passes)
create table if not exists pool_scores (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references submissions(id) on delete cascade unique,
  event_id uuid not null references events(id) on delete cascade,
  overall_score numeric not null,
  pool_rank int not null,
  percentile numeric not null,
  computed_at timestamptz default now()
);

-- ─── Indexes ──────────────────────────────────────────────────────────────────

create index if not exists idx_submissions_event_id on submissions(event_id);
create index if not exists idx_ai_analyses_submission_id on ai_analyses(submission_id);
create index if not exists idx_ai_scores_submission_id on ai_scores(submission_id);
create index if not exists idx_judge_scores_submission_id on judge_scores(submission_id);
create index if not exists idx_pool_scores_event_id on pool_scores(event_id);

-- ─── Row Level Security ───────────────────────────────────────────────────────

alter table events enable row level security;
alter table submissions enable row level security;
alter table submission_media enable row level security;
alter table judges enable row level security;
alter table ai_analyses enable row level security;
alter table ai_scores enable row level security;
alter table judge_scores enable row level security;
alter table pairwise_comparisons enable row level security;
alter table pool_scores enable row level security;

-- Open read policies for now (tighten for production)
create policy "Public read events" on events for select using (true);
create policy "Public read submissions" on submissions for select using (true);
create policy "Public read submission_media" on submission_media for select using (true);
create policy "Public read judges" on judges for select using (true);
create policy "Public read ai_analyses" on ai_analyses for select using (true);
create policy "Public read ai_scores" on ai_scores for select using (true);
create policy "Public read judge_scores" on judge_scores for select using (true);
create policy "Public read pairwise_comparisons" on pairwise_comparisons for select using (true);
create policy "Public read pool_scores" on pool_scores for select using (true);

-- Service role can write everything (API routes use service role key)
create policy "Service role write events" on events for all using (auth.role() = 'service_role');
create policy "Service role write submissions" on submissions for all using (auth.role() = 'service_role');
create policy "Service role write submission_media" on submission_media for all using (auth.role() = 'service_role');
create policy "Service role write judges" on judges for all using (auth.role() = 'service_role');
create policy "Service role write ai_analyses" on ai_analyses for all using (auth.role() = 'service_role');
create policy "Service role write ai_scores" on ai_scores for all using (auth.role() = 'service_role');
create policy "Service role write judge_scores" on judge_scores for all using (auth.role() = 'service_role');
create policy "Service role write pairwise_comparisons" on pairwise_comparisons for all using (auth.role() = 'service_role');
create policy "Service role write pool_scores" on pool_scores for all using (auth.role() = 'service_role');

-- ─── Storage Bucket ───────────────────────────────────────────────────────────
-- Run this separately in the Storage section of your Supabase dashboard,
-- or uncomment if your Supabase project has storage API enabled:
-- insert into storage.buckets (id, name, public) values ('submission-media', 'submission-media', true);
