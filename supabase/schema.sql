-- 2gtr — Supabase/Postgres schema (Fase 1: nuvem).
-- Espelha as coleções do adapter local (js/db.js blank()). IDs legados
-- preservados como TEXT PK: migração sem remapeamento.
-- Convenções: dinheiro NUMERIC(14,2); datas "YYYY-MM-DD" como TEXT (sem
-- deslocamento de timezone — o app compara strings); timestamps TIMESTAMPTZ;
-- objetos schemaless (configs, filtros, metadados) como JSONB.
-- RLS: tudo por casal via members; linhas pessoais por user_id.
-- Pré-req: rodar no SQL Editor do projeto Supabase (auth schema existe).

-- ============ vínculo auth <-> usuário do app ============
create table if not exists public.profiles (
  app_user_id text primary key,
  auth_id uuid unique references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

-- Helper: casais do usuário autenticado (via profiles + members).
create or replace function public.app_couple_ids()
returns setof text language sql security definer set search_path = public as $$
  select m.couple_id
  from public.members m
  join public.profiles p on p.app_user_id = m.user_id
  where p.auth_id = auth.uid()
$$;

create or replace function public.app_user_ids()
returns setof text language sql security definer set search_path = public as $$
  select p.app_user_id from public.profiles p where p.auth_id = auth.uid()
$$;

-- ============ identidade / casal ============
create table if not exists public.users (
  id text primary key,
  nome text not null,
  email text not null,
  avatar text,
  deactivated_at timestamptz,
  session_version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
  -- NUNCA migrar pass/salt locais (hash fraco): redefinir via Supabase Auth.
);

create table if not exists public.couples (
  id text primary key,
  name text not null,
  money_management_mode text not null default 'SEPARATE' check (money_management_mode in ('SEPARATE','JOINT')),
  former_user_ids text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.members (
  id text primary key,
  couple_id text not null references public.couples (id) on delete cascade,
  user_id text not null references public.users (id) on delete cascade,
  role text not null default 'member' check (role in ('owner','member')),
  joined_at timestamptz not null default now(),
  unique (couple_id, user_id)
);

create table if not exists public.invitations (
  id text primary key,
  couple_id text not null references public.couples (id) on delete cascade,
  code text not null unique,
  created_by text,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  expires_at timestamptz
);

create table if not exists public.resets (
  email text not null,
  code text not null,
  exp bigint not null,
  created_at timestamptz not null default now(),
  primary key (email)
);

create table if not exists public.oauth_identities (
  id text primary key,
  user_id text not null references public.users (id) on delete cascade,
  provider text not null check (provider in ('google','facebook','apple')),
  provider_user_id text not null,
  email text,
  email_verified boolean not null default false,
  created_at timestamptz not null default now(),
  unique (provider, provider_user_id)
);

-- ============ finanças ============
create table if not exists public.categories (
  id text primary key,
  couple_id text not null references public.couples (id) on delete cascade,
  name text not null,
  type text not null,
  icon text,
  active boolean not null default true,
  parent_category_id text references public.categories (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.transactions (
  id text primary key,
  couple_id text not null references public.couples (id) on delete cascade,
  created_by text,
  type text not null check (type in ('income','expense')),
  description text not null,
  amount numeric(14,2) not null check (amount > 0),
  date text not null,
  category_id text,
  is_shared boolean not null default false,
  payer_user_id text,
  account_id text,
  credit_card_id text,
  invoice_id text,
  needs_review boolean not null default false,
  notes text,
  idempotency_key text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (couple_id, idempotency_key)
);

create table if not exists public.splits (
  id text primary key,
  transaction_id text not null references public.transactions (id) on delete cascade,
  couple_id text not null references public.couples (id) on delete cascade,
  user_id text not null,
  split_type text not null,
  percentage numeric(7,3),
  fixed_amount numeric(14,2),
  calculated_amount numeric(14,2) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.budgets (
  id text primary key,
  couple_id text not null references public.couples (id) on delete cascade,
  category_id text not null references public.categories (id),
  month integer not null check (month between 1 and 12),
  year integer not null,
  amount numeric(14,2) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (couple_id, category_id, month, year)
);

create table if not exists public.goals (
  id text primary key,
  couple_id text not null references public.couples (id) on delete cascade,
  name text not null,
  description text,
  target_amount numeric(14,2) not null,
  current_amount numeric(14,2) not null default 0,
  deadline text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.goal_events (
  id text primary key,
  couple_id text not null references public.couples (id) on delete cascade,
  goal_id text not null references public.goals (id) on delete cascade,
  user_id text,
  amount numeric(14,2) not null,
  date text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.recurring_transactions (
  id text primary key,
  couple_id text not null references public.couples (id) on delete cascade,
  created_by text,
  description text not null,
  type text not null check (type in ('income','expense')),
  amount numeric(14,2) not null,
  category_id text,
  frequency text not null,
  day_of_month integer,
  start_date text,
  end_date text,
  is_shared boolean not null default false,
  payer_user_id text,
  split_mode text,
  split_entries jsonb,
  active boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.recurring_occurrences (
  id text primary key,
  recurring_transaction_id text not null references public.recurring_transactions (id) on delete cascade,
  couple_id text not null references public.couples (id) on delete cascade,
  due_date text not null,
  amount numeric(14,2) not null,
  status text not null default 'pending',
  transaction_id text references public.transactions (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (recurring_transaction_id, due_date)
);

create table if not exists public.settlements (
  id text primary key,
  couple_id text not null references public.couples (id) on delete cascade,
  from_user_id text not null,
  to_user_id text not null,
  amount numeric(14,2) not null,
  date text not null,
  notes text,
  created_by text,
  created_at timestamptz not null default now()
);

create table if not exists public.accounts (
  id text primary key,
  couple_id text not null references public.couples (id) on delete cascade,
  name text not null,
  type text not null,
  owner_type text not null,
  owner_user_id text,
  initial_balance numeric(14,2) not null default 0,
  active boolean not null default true,
  notes text,
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.transfers (
  id text primary key,
  couple_id text not null references public.couples (id) on delete cascade,
  from_account_id text not null references public.accounts (id),
  to_account_id text not null references public.accounts (id),
  amount numeric(14,2) not null,
  date text not null,
  description text,
  created_by text,
  idempotency_key text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (couple_id, idempotency_key)
);

create table if not exists public.credit_cards (
  id text primary key,
  couple_id text not null references public.couples (id) on delete cascade,
  name text not null,
  brand text,
  last_four_digits text,
  owner_type text not null,
  owner_user_id text,
  credit_limit numeric(14,2) not null,
  closing_day integer not null,
  due_day integer not null,
  payment_account_id text references public.accounts (id),
  active boolean not null default true,
  notes text,
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.installment_purchases (
  id text primary key,
  couple_id text not null references public.couples (id) on delete cascade,
  created_by text,
  credit_card_id text references public.credit_cards (id),
  description text not null,
  total_amount numeric(14,2) not null,
  installment_count integer not null,
  installment_amount numeric(14,2) not null,
  first_installment_date text not null,
  category_id text,
  is_shared boolean not null default false,
  payer_user_id text,
  split_mode text,
  split_entries jsonb,
  notes text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.installments (
  id text primary key,
  couple_id text not null references public.couples (id) on delete cascade,
  installment_purchase_id text not null references public.installment_purchases (id) on delete cascade,
  installment_number integer not null,
  total_installments integer not null,
  amount numeric(14,2) not null,
  due_date text not null,
  status text not null default 'pending',
  credit_card_id text references public.credit_cards (id),
  invoice_id text,
  transaction_id text references public.transactions (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.invoices (
  id text primary key,
  couple_id text not null references public.couples (id) on delete cascade,
  credit_card_id text not null references public.credit_cards (id),
  reference_month integer not null,
  reference_year integer not null,
  billing_period_start text,
  billing_period_end text,
  closing_date text,
  due_date text,
  total_amount numeric(14,2) not null default 0,
  paid_amount numeric(14,2) not null default 0,
  status text not null default 'open',
  payment_account_id text references public.accounts (id),
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  cancelled_at timestamptz,
  unique (couple_id, credit_card_id, reference_month, reference_year)
);

create table if not exists public.invoice_payments (
  id text primary key,
  couple_id text not null references public.couples (id) on delete cascade,
  invoice_id text not null references public.invoices (id) on delete cascade,
  payment_account_id text references public.accounts (id),
  amount numeric(14,2) not null,
  payment_date text not null,
  notes text,
  created_by text,
  idempotency_key text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (couple_id, idempotency_key)
);

-- ============ organização / vida ============
create table if not exists public.agenda_events (
  id text primary key,
  couple_id text not null references public.couples (id) on delete cascade,
  created_by text,
  owner_user_id text,
  title text not null,
  description text,
  event_type text not null,
  visibility text not null default 'COUPLE',
  status text not null default 'active',
  start_at text not null,
  end_at text,
  all_day boolean not null default false,
  location text,
  color text,
  category text,
  recurrence_rule jsonb,
  recurrence_end_at text,
  recurrence_parent_id text,
  recurrence_date text,
  exceptions jsonb not null default '[]',
  timezone text,
  reminder_enabled boolean not null default false,
  reminder_minutes integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.habits (
  id text primary key,
  user_id text not null,
  couple_id text not null references public.couples (id) on delete cascade,
  name text not null,
  description text,
  category text,
  icon text,
  color text,
  frequency_type text not null,
  weekdays jsonb,
  target_count numeric(14,3) not null default 1,
  target_unit text not null default 'BOOLEAN',
  unit_label text,
  start_date text,
  end_date text,
  preferred_time text,
  reminder_enabled boolean not null default false,
  reminder_time text,
  active boolean not null default true,
  status text not null default 'ACTIVE',
  paused_from text,
  paused_until text,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.habit_completions (
  id text primary key,
  habit_id text not null references public.habits (id) on delete cascade,
  user_id text not null,
  completion_date text not null,
  completed_at timestamptz,
  value numeric(14,3),
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (habit_id, user_id, completion_date)
);

create table if not exists public.tasks (
  id text primary key,
  couple_id text not null references public.couples (id) on delete cascade,
  created_by text,
  owner_user_id text,
  assigned_to text,
  title text not null,
  description text,
  visibility text not null default 'PERSONAL',
  status text not null default 'TODO',
  priority text,
  due_date text,
  due_time text,
  recurrence_type text not null default 'NONE',
  recurrence_config jsonb,
  completed_at timestamptz,
  completed_by text,
  source_type text,
  source_id text,
  recurrence_parent_id text,
  recurrence_date text,
  exceptions jsonb not null default '[]',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  deleted_at timestamptz
);

create table if not exists public.lists (
  id text primary key,
  couple_id text not null references public.couples (id) on delete cascade,
  created_by text,
  owner_user_id text,
  name text not null,
  description text,
  list_type text not null,
  visibility text not null default 'PERSONAL',
  status text not null default 'ACTIVE',
  source_type text,
  source_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  deleted_at timestamptz
);

create table if not exists public.list_items (
  id text primary key,
  list_id text not null references public.lists (id) on delete cascade,
  created_by text,
  assigned_to text,
  title text not null,
  description text,
  quantity numeric(14,3),
  unit text,
  checked boolean not null default false,
  checked_at timestamptz,
  checked_by text,
  position integer not null default 0,
  linked_task_id text references public.tasks (id),
  idempotency_key text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.routines (
  id text primary key,
  couple_id text not null references public.couples (id) on delete cascade,
  created_by text,
  owner_user_id text,
  name text not null,
  description text,
  visibility text not null default 'PERSONAL',
  status text not null default 'ACTIVE',
  frequency_type text not null,
  frequency_config jsonb,
  preferred_time text,
  start_date text,
  end_date text,
  source_type text,
  source_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  deleted_at timestamptz
);

create table if not exists public.routine_items (
  id text primary key,
  routine_id text not null references public.routines (id) on delete cascade,
  title text not null,
  description text,
  position integer not null default 0,
  item_type text not null,
  linked_entity_type text,
  linked_entity_id text,
  linked_label_snapshot text,
  assigned_to text,
  required boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.routine_executions (
  id text primary key,
  routine_id text not null references public.routines (id) on delete cascade,
  couple_id text not null references public.couples (id) on delete cascade,
  user_id text,
  scope_key text not null,
  scheduled_date text not null,
  status text not null default 'PENDING',
  routine_name_snapshot text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (routine_id, scope_key, scheduled_date)
);

create table if not exists public.routine_item_executions (
  id text primary key,
  routine_execution_id text not null references public.routine_executions (id) on delete cascade,
  routine_item_id text not null references public.routine_items (id) on delete cascade,
  item_title_snapshot text,
  item_type_snapshot text,
  linked_entity_type_snapshot text,
  linked_entity_id_snapshot text,
  status text not null default 'PENDING',
  completed_by text,
  completed_at timestamptz,
  linked_action_result jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.routine_contexts (
  id text primary key,
  couple_id text not null references public.couples (id) on delete cascade,
  user_id text,
  conversation_id text,
  channel text,
  entity_type text not null,
  entity_id text not null,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.projects (
  id text primary key,
  couple_id text not null references public.couples (id) on delete cascade,
  created_by text,
  owner_user_id text,
  name text not null,
  description text,
  visibility text not null default 'PERSONAL',
  status text not null default 'PLANNING',
  start_date text,
  target_date text,
  icon text,
  color text,
  source_type text,
  source_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz,
  archived_at timestamptz,
  deleted_at timestamptz
);

create table if not exists public.project_links (
  id text primary key,
  project_id text not null references public.projects (id) on delete cascade,
  entity_type text not null,
  entity_id text not null,
  relationship_type text not null default 'RELATED',
  position integer not null default 0,
  created_by text,
  idempotency_key text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (project_id, entity_type, entity_id)
);

create table if not exists public.inbox_items (
  id text primary key,
  user_id text,
  couple_id text not null references public.couples (id) on delete cascade,
  visibility text not null default 'PERSONAL',
  content text not null,
  input_type text not null,
  source text not null,
  status text not null default 'UNPROCESSED',
  suggested_entity_type text,
  confidence numeric(7,3),
  suggested_visibility text,
  processed_entity_type text,
  processed_entity_id text,
  processed_by text,
  processing_metadata jsonb,
  processing_key text,
  last_processing_key text,
  last_processing_at timestamptz,
  idempotency_key text,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  processed_at timestamptz,
  dismissed_at timestamptz,
  archived_at timestamptz,
  deleted_at timestamptz
);

create table if not exists public.capture_sessions (
  id text primary key,
  user_id text,
  couple_id text not null references public.couples (id) on delete cascade,
  channel text not null,
  source text not null,
  status text not null,
  original_input_type text,
  normalized_text text,
  visibility_hint text,
  default_visibility text,
  context_snapshot jsonb,
  provenance jsonb,
  idempotency_key text,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz,
  expires_at timestamptz
);

create table if not exists public.capture_actions (
  id text primary key,
  capture_session_id text not null references public.capture_sessions (id) on delete cascade,
  segment_index integer not null default 0,
  segment_text text,
  destination_candidates jsonb,
  selected_destination text,
  needs_clarification boolean not null default false,
  clarification text,
  draft_payload jsonb not null default '{}',
  missing_fields jsonb not null default '[]',
  status text not null default 'PROPOSED',
  idempotency_key text,
  result_entity_type text,
  result_entity_id text,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  confirmed_at timestamptz,
  executed_at timestamptz
);

create table if not exists public.weekly_plans (
  id text primary key,
  user_id text,
  couple_id text not null references public.couples (id) on delete cascade,
  week_start_date text not null,
  week_end_date text not null,
  visibility text not null default 'PERSONAL',
  status text not null default 'DRAFT',
  notes text,
  plan_reminder_day integer,
  plan_reminder_time text,
  review_reminder_day integer,
  review_reminder_time text,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz,
  archived_at timestamptz,
  deleted_at timestamptz,
  unique (couple_id, week_start_date, visibility, user_id, status)
);

create table if not exists public.weekly_priorities (
  id text primary key,
  weekly_plan_id text not null references public.weekly_plans (id) on delete cascade,
  title text not null,
  linked_entity_type text,
  linked_entity_id text,
  position integer not null default 0,
  completed_manually boolean not null default false,
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.monthly_reviews (
  id text primary key,
  user_id text,
  couple_id text not null references public.couples (id) on delete cascade,
  reference_month integer not null,
  reference_year integer not null,
  visibility text not null default 'PERSONAL',
  money_management_mode_snapshot text,
  status text not null default 'IN_PROGRESS',
  current_step integer not null default 1,
  notes text,
  review_summary_snapshot jsonb,
  version integer not null default 1,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

create table if not exists public.monthly_review_sections (
  id text primary key,
  monthly_review_id text not null references public.monthly_reviews (id) on delete cascade,
  section_type text not null,
  status text not null default 'PENDING',
  completed_at timestamptz,
  skipped_at timestamptz,
  updated_at timestamptz not null default now()
);

-- ============ planejamento / relatórios / insights ============
create table if not exists public.financial_plans (
  id text primary key,
  couple_id text not null references public.couples (id) on delete cascade,
  name text not null,
  description text,
  status text not null default 'draft',
  period_start text not null,
  period_end text not null,
  base_date text,
  currency text not null default 'BRL',
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

create table if not exists public.financial_plan_items (
  id text primary key,
  couple_id text not null references public.couples (id) on delete cascade,
  plan_id text not null references public.financial_plans (id) on delete cascade,
  item_type text not null,
  name text not null,
  amount numeric(14,2) not null,
  frequency text not null default 'once',
  planned_date text,
  source_type text,
  source_id text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.financial_plan_scenarios (
  id text primary key,
  couple_id text not null references public.couples (id) on delete cascade,
  plan_id text not null references public.financial_plans (id) on delete cascade,
  name text not null,
  description text,
  status text not null default 'active',
  scenario_type text not null default 'custom',
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.financial_plan_scenario_items (
  id text primary key,
  couple_id text not null references public.couples (id) on delete cascade,
  scenario_id text not null references public.financial_plan_scenarios (id) on delete cascade,
  source_plan_item_id text,
  item_type text not null,
  name text not null,
  amount numeric(14,2) not null,
  adjustment_type text,
  adjustment_value numeric(14,2),
  planned_date text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.saved_reports (
  id text primary key,
  couple_id text not null references public.couples (id) on delete cascade,
  user_id text,
  name text not null,
  report_type text not null,
  filters jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.financial_insights (
  id text primary key,
  couple_id text not null references public.couples (id) on delete cascade,
  insight_type text not null,
  title text not null,
  summary text,
  severity text not null default 'info',
  status text not null default 'active',
  evidence jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.financial_insight_preferences (
  id text primary key,
  couple_id text not null references public.couples (id) on delete cascade,
  user_id text,
  insight_type text not null,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============ importação / reconciliação ============
create table if not exists public.import_batches (
  id text primary key,
  couple_id text not null references public.couples (id) on delete cascade,
  created_by text,
  file_name text not null,
  file_type text not null,
  file_size integer not null default 0,
  file_hash text,
  account_id text references public.accounts (id),
  import_source_type text not null default 'bank_statement',
  credit_card_id text references public.credit_cards (id),
  invoice_id text references public.invoices (id),
  statement_total numeric(14,2),
  status text not null default 'uploaded',
  total_rows integer not null default 0,
  valid_rows integer not null default 0,
  invalid_rows integer not null default 0,
  duplicate_rows integer not null default 0,
  matched_rows integer not null default 0,
  new_rows integer not null default 0,
  confirmed_rows integer not null default 0,
  imported_rows integer not null default 0,
  ignored_rows integer not null default 0,
  failed_rows integer not null default 0,
  period_start text,
  period_end text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz,
  error_message text
);

create table if not exists public.imported_transactions (
  id text primary key,
  couple_id text not null references public.couples (id) on delete cascade,
  import_batch_id text not null references public.import_batches (id) on delete cascade,
  account_id text references public.accounts (id),
  credit_card_id text references public.credit_cards (id),
  invoice_id text references public.invoices (id),
  card_item_type text,
  installment_number integer,
  total_installments integer,
  purchase_reference text,
  line_number integer,
  external_transaction_id text,
  raw_date text,
  raw_description text,
  raw_amount text,
  raw_type text,
  normalized_date text,
  normalized_description text,
  normalized_amount numeric(14,2),
  normalized_type text,
  debit_credit text,
  currency text not null default 'BRL',
  date_ambiguous boolean not null default false,
  status text not null default 'valid',
  match_status text not null default 'new',
  matched_transaction_id text references public.transactions (id),
  matched_transfer_id text references public.transfers (id),
  matched_installment_id text references public.installments (id),
  confidence_score numeric(7,3),
  match_reason text,
  created_transaction_id text references public.transactions (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.import_mappings (
  id text primary key,
  couple_id text not null references public.couples (id) on delete cascade,
  created_by text,
  account_id text references public.accounts (id),
  credit_card_id text references public.credit_cards (id),
  file_type text not null,
  mapping_name text not null,
  column_mapping jsonb not null default '{}',
  date_format text not null default 'auto',
  decimal_separator text not null default '',
  thousand_separator text not null default '',
  amount_sign_mode text not null default 'auto',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reconciliation_matches (
  id text primary key,
  couple_id text not null references public.couples (id) on delete cascade,
  import_batch_id text references public.import_batches (id),
  imported_transaction_id text references public.imported_transactions (id),
  entity_type text not null,
  entity_id text not null,
  match_type text not null,
  confidence_score numeric(7,3),
  match_reason text,
  status text not null default 'pending',
  source_type text,
  source_record_id text,
  match_method text,
  auto_reconciled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by text
);

-- ============ automação / eventos / auditoria ============
create table if not exists public.automation_rules (
  id text primary key,
  couple_id text not null references public.couples (id) on delete cascade,
  name text not null,
  description text,
  active boolean not null default true,
  priority integer not null default 0,
  trigger_type text not null,
  condition_operator text,
  conditions jsonb not null default '[]',
  actions jsonb not null default '[]',
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_executed_at timestamptz
);

create table if not exists public.automation_jobs (
  id text primary key,
  couple_id text not null references public.couples (id) on delete cascade,
  job_type text not null,
  payload jsonb not null default '{}',
  status text not null default 'pending',
  attempts integer not null default 0,
  max_attempts integer not null default 3,
  idempotency_key text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (couple_id, idempotency_key)
);

create table if not exists public.automation_executions (
  id text primary key,
  couple_id text not null references public.couples (id) on delete cascade,
  rule_id text references public.automation_rules (id),
  event_id text,
  job_id text references public.automation_jobs (id),
  status text not null,
  matched boolean not null default false,
  action text,
  entity_type text,
  entity_id text,
  before_data jsonb,
  after_data jsonb,
  error_message text,
  reason text,
  executed_at timestamptz
);

create table if not exists public.automation_rule_executions (
  id text primary key,
  couple_id text not null references public.couples (id) on delete cascade,
  rule_id text references public.automation_rules (id),
  status text not null,
  executed_at timestamptz
);

create table if not exists public.financial_events (
  id text primary key,
  couple_id text not null references public.couples (id) on delete cascade,
  user_id text,
  event_type text not null,
  entity_type text not null default '',
  entity_id text not null default '',
  occurred_at timestamptz not null default now(),
  metadata jsonb not null default '{}',
  idempotency_key text not null,
  created_at timestamptz not null default now(),
  unique (idempotency_key)
);

create table if not exists public.audit_logs (
  id text primary key,
  couple_id text,
  user_id text,
  entity_type text not null,
  entity_id text,
  action text not null,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.security_audit_logs (
  id text primary key,
  couple_id text,
  user_id text,
  event_type text not null,
  action text not null,
  entity_type text,
  entity_id text,
  result text not null default 'ok',
  ip_hash text,
  user_agent_hash text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.financial_integrity_checks (
  id text primary key,
  couple_id text not null references public.couples (id) on delete cascade,
  check_type text not null,
  severity text not null default 'warning',
  status text not null default 'open',
  entity_type text,
  entity_id text,
  fingerprint text,
  details jsonb,
  detected_at timestamptz not null default now(),
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.category_suggestions (
  id text primary key,
  couple_id text not null references public.couples (id) on delete cascade,
  transaction_id text references public.transactions (id) on delete cascade,
  suggested_category_id text references public.categories (id),
  confidence_score numeric(7,3),
  suggestion_source text,
  reason text,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by text
);

create table if not exists public.category_feedback (
  id text primary key,
  couple_id text not null references public.couples (id) on delete cascade,
  transaction_id text references public.transactions (id) on delete cascade,
  suggestion_id text references public.category_suggestions (id),
  suggested_category_id text,
  final_category_id text not null,
  feedback_type text,
  norm_desc text,
  merchant text,
  user_id text,
  created_at timestamptz not null default now()
);

-- ============ notificações ============
create table if not exists public.notifications (
  id text primary key,
  couple_id text not null references public.couples (id) on delete cascade,
  user_id text,
  type text not null,
  channel text not null default 'multi',
  origin text not null default 'operational',
  title text not null,
  body text not null default '',
  status text not null default 'pending',
  priority text not null default 'info',
  related_entity_type text,
  related_entity_id text,
  event_id text,
  scheduled_for timestamptz,
  sent_at timestamptz,
  read_at timestamptz,
  dismissed_at timestamptz,
  expires_at timestamptz,
  idempotency_key text not null,
  payload jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (couple_id, idempotency_key)
);

create table if not exists public.notification_preferences (
  id text primary key,
  couple_id text not null references public.couples (id) on delete cascade,
  user_id text,
  channel text not null,
  notification_type text not null,
  enabled boolean not null default true,
  quiet_hours_enabled boolean not null default true,
  quiet_hours_start text not null default '22:00',
  quiet_hours_end text not null default '08:00',
  frequency text not null default 'immediate',
  digest_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.notification_deliveries (
  id text primary key,
  notification_id text not null references public.notifications (id) on delete cascade,
  couple_id text not null references public.couples (id) on delete cascade,
  user_id text,
  channel text not null,
  provider text not null,
  status text not null default 'pending',
  attempt_count integer not null default 0,
  last_error text,
  provider_message_id text,
  sent_at timestamptz,
  delivered_at timestamptz,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.notification_decisions (
  id text primary key,
  couple_id text not null references public.couples (id) on delete cascade,
  user_id text,
  rule_key text not null,
  notification_type text not null,
  relevance numeric(7,3),
  urgency text,
  should_notify boolean not null default false,
  mode text,
  reason text,
  priority text,
  channel text,
  group_key text,
  group_id text,
  evidence jsonb not null default '{}',
  created_at timestamptz not null default now(),
  consumed_in_digest timestamptz
);

create table if not exists public.notification_digests (
  id text primary key,
  couple_id text not null references public.couples (id) on delete cascade,
  user_id text,
  digest_type text not null,
  period_start text not null,
  period_end text not null,
  item_ids jsonb not null default '[]',
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  sent_at timestamptz
);

-- ============ IA / WhatsApp / multimodal ============
create table if not exists public.ai_conversations (
  id text primary key,
  couple_id text not null references public.couples (id) on delete cascade,
  user_id text,
  title text not null,
  context jsonb not null default '{}',
  channel text not null default 'web',
  external_conversation_id text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_message_at timestamptz not null default now()
);

create table if not exists public.ai_messages (
  id text primary key,
  conversation_id text not null references public.ai_conversations (id) on delete cascade,
  couple_id text not null references public.couples (id) on delete cascade,
  user_id text,
  role text not null,
  content text not null,
  channel text not null default 'web',
  external_message_id text,
  message_type text not null default 'text',
  audio_message_id text,
  image_message_id text,
  document_message_id text,
  multimodal_context_id text,
  input_ids jsonb,
  attachment_ids jsonb,
  evidence_ids jsonb,
  intent text,
  tool_name text,
  tool_input jsonb,
  tool_output jsonb,
  status text not null default 'ok',
  created_at timestamptz not null default now()
);

create table if not exists public.ai_actions (
  id text primary key,
  couple_id text not null references public.couples (id) on delete cascade,
  user_id text,
  conversation_id text references public.ai_conversations (id),
  message_id text,
  channel text not null default 'web',
  external_message_id text,
  action_type text not null,
  status text not null default 'pending_confirmation',
  confirmation_required boolean not null default true,
  confirmation_expires_at timestamptz,
  confirmed_at timestamptz,
  executed_at timestamptz,
  idempotency_key text not null,
  request_data jsonb not null default '{}',
  result_data jsonb,
  error_message text,
  permission text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (idempotency_key)
);

create table if not exists public.whatsapp_connections (
  id text primary key,
  couple_id text not null references public.couples (id) on delete cascade,
  user_id text,
  phone_masked text,
  phone_hash text not null,
  provider text not null default 'local-sim',
  provider_user_id text,
  status text not null default 'active',
  verified_at timestamptz,
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.whatsapp_link_codes (
  id text primary key,
  couple_id text not null references public.couples (id) on delete cascade,
  user_id text,
  code_hash text not null,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.whatsapp_messages (
  id text primary key,
  couple_id text references public.couples (id) on delete cascade,
  user_id text,
  direction text not null,
  provider text not null,
  phone_hash text,
  phone_masked text,
  external_message_id text,
  text text,
  media_type text,
  mime_type text,
  status text not null default 'received',
  error text,
  created_at timestamptz not null default now(),
  unique (provider, external_message_id, direction)
);

create table if not exists public.whatsapp_preferences (
  id text primary key,
  couple_id text not null references public.couples (id) on delete cascade,
  user_id text,
  enabled boolean not null default true,
  allow_proactive_messages boolean not null default false,
  quiet_hours_start text not null default '22:00',
  quiet_hours_end text not null default '08:00',
  insight_notifications boolean not null default false,
  invoice_notifications boolean not null default false,
  budget_notifications boolean not null default false,
  goal_notifications boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.whatsapp_message_failures (
  id text primary key,
  couple_id text references public.couples (id) on delete cascade,
  user_id text,
  phone_hash text,
  external_message_id text,
  error text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.audio_messages (
  id text primary key,
  couple_id text not null references public.couples (id) on delete cascade,
  user_id text,
  conversation_id text,
  channel text not null,
  source text not null,
  storage_reference text,
  original_filename text,
  mime_type text,
  file_size integer,
  duration_seconds numeric(10,2),
  language text,
  transcript text,
  transcript_status text not null default 'pending',
  processing_status text not null default 'uploaded',
  intent text,
  confidence numeric(7,3),
  error_code text,
  error_message text,
  action_id text references public.ai_actions (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  processed_at timestamptz,
  expires_at timestamptz
);

create table if not exists public.image_messages (
  id text primary key,
  couple_id text not null references public.couples (id) on delete cascade,
  user_id text,
  conversation_id text,
  channel text not null,
  source text not null,
  storage_reference text,
  original_filename text,
  mime_type text,
  file_size integer,
  width integer,
  height integer,
  language text,
  image_type text not null default 'unknown',
  processing_status text not null default 'uploaded',
  extraction_status text not null default 'pending',
  extracted_text text,
  structured_data jsonb,
  confidence numeric(7,3),
  error_code text,
  error_message text,
  action_id text references public.ai_actions (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  processed_at timestamptz,
  expires_at timestamptz
);

create table if not exists public.financial_documents (
  id text primary key,
  couple_id text not null references public.couples (id) on delete cascade,
  user_id text,
  conversation_id text,
  storage_reference text,
  original_filename text,
  mime_type text,
  file_size integer,
  document_type text,
  processing_status text not null default 'uploaded',
  extraction_status text not null default 'pending',
  extracted_text text,
  structured_data jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz
);

create table if not exists public.multimodal_inputs (
  id text primary key,
  couple_id text not null references public.couples (id) on delete cascade,
  user_id text,
  conversation_id text,
  input_type text not null,
  status text not null default 'pending',
  content_hash text,
  idempotency_key text,
  payload jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz,
  unique (couple_id, idempotency_key)
);

create table if not exists public.multimodal_contexts (
  id text primary key,
  couple_id text not null references public.couples (id) on delete cascade,
  user_id text,
  conversation_id text,
  input_ids jsonb not null default '[]',
  status text not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz
);

create table if not exists public.input_evidence (
  id text primary key,
  couple_id text not null references public.couples (id) on delete cascade,
  input_id text not null references public.multimodal_inputs (id) on delete cascade,
  field_name text not null,
  extracted_value text,
  source_type text not null,
  source_reference text,
  page_number integer,
  confidence numeric(7,3),
  evidence_text text,
  created_at timestamptz not null default now()
);

-- ============ Open Finance (desligado no app; schema preservado) ============
create table if not exists public.openfinance_connections (
  id text primary key,
  couple_id text not null references public.couples (id) on delete cascade,
  user_id text,
  provider text not null,
  institution_id text,
  institution_name text,
  status text not null default 'active',
  credentials_ref text,
  last_sync_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.openfinance_bank_accounts (
  id text primary key,
  couple_id text not null references public.couples (id) on delete cascade,
  connection_id text not null references public.openfinance_connections (id) on delete cascade,
  external_account_id text,
  name text not null,
  type text not null default 'checking',
  last4 text,
  balance numeric(14,2) not null default 0,
  currency text not null default 'BRL',
  linked_account_id text references public.accounts (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.openfinance_bank_transactions (
  id text primary key,
  couple_id text not null references public.couples (id) on delete cascade,
  connection_id text not null references public.openfinance_connections (id) on delete cascade,
  bank_account_id text references public.openfinance_bank_accounts (id),
  external_id text,
  date text not null,
  description text not null,
  amount numeric(14,2) not null,
  currency text not null default 'BRL',
  ext_status text,
  status text not null default 'synced',
  canonical_transaction_id text references public.transactions (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.open_finance_sync_runs (
  id text primary key,
  couple_id text not null references public.couples (id) on delete cascade,
  connection_id text not null references public.openfinance_connections (id) on delete cascade,
  status text not null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  stats jsonb not null default '{}'
);

create table if not exists public.open_finance_transaction_versions (
  id text primary key,
  open_finance_transaction_id text not null references public.openfinance_bank_transactions (id) on delete cascade,
  couple_id text not null references public.couples (id) on delete cascade,
  version_number integer not null,
  snapshot jsonb not null,
  change_type text not null,
  changed_fields jsonb not null default '[]',
  detected_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.open_finance_reconciliation_exceptions (
  id text primary key,
  couple_id text not null references public.couples (id) on delete cascade,
  connection_id text not null references public.openfinance_connections (id) on delete cascade,
  open_finance_transaction_id text references public.openfinance_bank_transactions (id),
  transaction_id text references public.transactions (id),
  exception_type text not null,
  severity text not null default 'warning',
  status text not null default 'open',
  description text,
  evidence jsonb,
  detected_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by text,
  resolution_type text,
  resolution_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.open_finance_balance_snapshots (
  id text primary key,
  couple_id text not null references public.couples (id) on delete cascade,
  connection_id text not null references public.openfinance_connections (id) on delete cascade,
  open_finance_account_id text not null references public.openfinance_bank_accounts (id) on delete cascade,
  current_balance numeric(14,2) not null,
  available_balance numeric(14,2),
  currency text not null default 'BRL',
  captured_at timestamptz not null default now(),
  source text not null default 'sync',
  created_at timestamptz not null default now()
);

-- ============ RLS (tudo autenticado; escopo por casal) ============
alter table public.profiles enable row level security;
alter table public.users enable row level security;
alter table public.couples enable row level security;
alter table public.members enable row level security;
alter table public.invitations enable row level security;
alter table public.resets enable row level security;
alter table public.oauth_identities enable row level security;

do $$
declare t text;
begin
  foreach t in array array[
    'categories','transactions','splits','budgets','goals','goal_events',
    'recurring_transactions','recurring_occurrences','settlements','accounts',
    'transfers','credit_cards','installment_purchases','installments','invoices',
    'invoice_payments','agenda_events','habits','habit_completions','tasks',
    'lists','list_items','routines','routine_items','routine_executions',
    'routine_item_executions','routine_contexts','projects','project_links',
    'inbox_items','capture_sessions','capture_actions','weekly_plans',
    'weekly_priorities','monthly_reviews','monthly_review_sections',
    'financial_plans','financial_plan_items','financial_plan_scenarios',
    'financial_plan_scenario_items','saved_reports','financial_insights',
    'financial_insight_preferences','import_batches','imported_transactions',
    'import_mappings','reconciliation_matches','automation_rules',
    'automation_jobs','automation_executions','automation_rule_executions',
    'financial_events','audit_logs','security_audit_logs',
    'financial_integrity_checks','category_suggestions','category_feedback',
    'notifications','notification_preferences','notification_deliveries',
    'notification_decisions','notification_digests','ai_conversations',
    'ai_messages','ai_actions','whatsapp_connections','whatsapp_link_codes',
    'whatsapp_messages','whatsapp_preferences','whatsapp_message_failures',
    'audio_messages','image_messages','financial_documents','multimodal_inputs',
    'multimodal_contexts','input_evidence','openfinance_connections',
    'openfinance_bank_accounts','openfinance_bank_transactions',
    'open_finance_sync_runs','open_finance_transaction_versions',
    'open_finance_reconciliation_exceptions','open_finance_balance_snapshots'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format(
      'create policy couple_isolation on public.%I for all to authenticated using (couple_id in (select public.app_couple_ids())) with check (couple_id in (select public.app_couple_ids()))',
      t);
  end loop;
end $$;

-- users: própria linha + membros do mesmo casal (nomes p/ parceiro).
create policy self_or_couple on public.users for all to authenticated
  using (id in (select public.app_user_ids())
     or id in (select m.user_id from public.members m where m.couple_id in (select public.app_couple_ids())))
  with check (id in (select public.app_user_ids()));
create policy own_couples on public.couples for all to authenticated
  using (id in (select public.app_couple_ids()))
  with check (id in (select public.app_couple_ids()));
create policy own_memberships on public.members for all to authenticated
  using (couple_id in (select public.app_couple_ids()))
  with check (couple_id in (select public.app_couple_ids()));
create policy own_profile on public.profiles for all to authenticated
  using (auth_id = auth.uid()) with check (auth_id = auth.uid());
-- invitations/resets/oauth: só o próprio usuário (server-side p/ resets em fase 2).
create policy own_oauth on public.oauth_identities for all to authenticated
  using (user_id in (select public.app_user_ids()))
  with check (user_id in (select public.app_user_ids()));

-- ============ índices (queries quentes do app) ============
create index if not exists idx_members_couple on public.members (couple_id);
create index if not exists idx_members_user on public.members (user_id);
create index if not exists idx_tx_couple_date on public.transactions (couple_id, date);
create index if not exists idx_tx_payer on public.transactions (payer_user_id);
create index if not exists idx_splits_tx on public.splits (transaction_id);
create index if not exists idx_inv_card_ref on public.invoices (credit_card_id, reference_year, reference_month);
create index if not exists idx_inst_due on public.installments (due_date, status);
create index if not exists idx_rec_occ on public.recurring_occurrences (recurring_transaction_id, due_date);
create index if not exists idx_tasks_owner on public.tasks (couple_id, owner_user_id, status);
create index if not exists idx_tasks_due on public.tasks (due_date, status);
create index if not exists idx_list_items on public.list_items (list_id, position);
create index if not exists idx_routine_exec on public.routine_executions (routine_id, scope_key, scheduled_date);
create index if not exists idx_project_links on public.project_links (project_id, entity_type);
create index if not exists idx_inbox_user on public.inbox_items (user_id, status);
create index if not exists idx_weekly on public.weekly_plans (couple_id, week_start_date);
create index if not exists idx_events_key on public.financial_events (idempotency_key);
create index if not exists idx_audit_couple on public.audit_logs (couple_id, created_at);
create index if not exists idx_wa_inbound on public.whatsapp_messages (provider, external_message_id, direction);
create index if not exists idx_ai_conv on public.ai_messages (conversation_id);
create index if not exists idx_notif_user on public.notifications (user_id, status);
