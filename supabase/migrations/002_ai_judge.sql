-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 002: AI Judge Support
-- ─────────────────────────────────────────────────────────────────────────────

-- Add AI judge flag + config to judges table
alter table judges
  add column if not exists is_ai_judge boolean not null default false,
  add column if not exists ai_persona jsonb;

-- Add AI judge enabled flag + name to events
alter table events
  add column if not exists ai_judge_enabled boolean not null default false,
  add column if not exists ai_judge_name text not null default 'Aria';

-- Allow multiple AI judges per event (relaxed unique on invite_token handled by gen)
-- invite_token already unique, AI judge gets a deterministic token: 'ai-judge-{event_id}'
