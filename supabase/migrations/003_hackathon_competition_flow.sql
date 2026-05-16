-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 003: Hackathon Competition Flow
-- ─────────────────────────────────────────────────────────────────────────────

alter table events
  drop constraint if exists events_judging_mode_check;

alter table events
  add constraint events_judging_mode_check
  check (judging_mode in ('rubric', 'pairwise', 'hybrid', 'hackathon'));

alter table submissions
  add column if not exists is_finalist boolean not null default false,
  add column if not exists finalist_rank int,
  add column if not exists finalist_selected_at timestamptz;

alter table submissions
  drop constraint if exists submissions_finalist_rank_check;

alter table submissions
  add constraint submissions_finalist_rank_check
  check (finalist_rank is null or finalist_rank between 1 and 8);

create unique index if not exists idx_submissions_event_finalist_rank
  on submissions(event_id, finalist_rank)
  where finalist_rank is not null;
