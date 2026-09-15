
CREATE TABLE public.alyssa_users (
  telegram_id BIGINT PRIMARY KEY,
  username TEXT,
  first_name TEXT,
  is_developer BOOLEAN NOT NULL DEFAULT false,
  lang TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT ALL ON public.alyssa_users TO service_role;
ALTER TABLE public.alyssa_users ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.alyssa_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id BIGINT NOT NULL,
  chat_id BIGINT,
  name TEXT NOT NULL,
  description TEXT,
  technology TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  state JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_alyssa_projects_owner ON public.alyssa_projects(owner_id, updated_at DESC);
GRANT ALL ON public.alyssa_projects TO service_role;
ALTER TABLE public.alyssa_projects ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.alyssa_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.alyssa_projects(id) ON DELETE CASCADE,
  path TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  language TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  bytes INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (project_id, path)
);
CREATE INDEX idx_alyssa_files_project ON public.alyssa_files(project_id);
GRANT ALL ON public.alyssa_files TO service_role;
ALTER TABLE public.alyssa_files ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.alyssa_file_versions (
  id BIGSERIAL PRIMARY KEY,
  file_id UUID NOT NULL REFERENCES public.alyssa_files(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  content TEXT NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_alyssa_file_versions_file ON public.alyssa_file_versions(file_id, version DESC);
GRANT ALL ON public.alyssa_file_versions TO service_role;
ALTER TABLE public.alyssa_file_versions ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.alyssa_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id BIGINT NOT NULL,
  chat_id BIGINT NOT NULL,
  project_id UUID REFERENCES public.alyssa_projects(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued',
  current_step TEXT,
  step_index INTEGER NOT NULL DEFAULT 0,
  total_steps INTEGER NOT NULL DEFAULT 0,
  progress INTEGER NOT NULL DEFAULT 0,
  plan JSONB NOT NULL DEFAULT '[]'::jsonb,
  last_successful_chunk TEXT,
  error TEXT,
  retry_count INTEGER NOT NULL DEFAULT 0,
  progress_message_id BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_alyssa_jobs_owner ON public.alyssa_jobs(owner_id, created_at DESC);
CREATE INDEX idx_alyssa_jobs_status ON public.alyssa_jobs(status);
GRANT ALL ON public.alyssa_jobs TO service_role;
ALTER TABLE public.alyssa_jobs ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.alyssa_job_steps (
  id BIGSERIAL PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES public.alyssa_jobs(id) ON DELETE CASCADE,
  idx INTEGER NOT NULL,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  output TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_alyssa_job_steps_job ON public.alyssa_job_steps(job_id, idx);
GRANT ALL ON public.alyssa_job_steps TO service_role;
ALTER TABLE public.alyssa_job_steps ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.alyssa_tool_calls (
  id BIGSERIAL PRIMARY KEY,
  owner_id BIGINT,
  project_id UUID,
  job_id UUID,
  tool TEXT NOT NULL,
  input JSONB,
  output_summary TEXT,
  ok BOOLEAN NOT NULL DEFAULT true,
  duration_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_alyssa_tool_calls_created ON public.alyssa_tool_calls(created_at DESC);
GRANT ALL ON public.alyssa_tool_calls TO service_role;
ALTER TABLE public.alyssa_tool_calls ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.alyssa_research (
  id BIGSERIAL PRIMARY KEY,
  owner_id BIGINT,
  query TEXT NOT NULL,
  results JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_alyssa_research_created ON public.alyssa_research(created_at DESC);
GRANT ALL ON public.alyssa_research TO service_role;
ALTER TABLE public.alyssa_research ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.alyssa_logs (
  id BIGSERIAL PRIMARY KEY,
  level TEXT NOT NULL DEFAULT 'info',
  scope TEXT,
  message TEXT NOT NULL,
  meta JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_alyssa_logs_created ON public.alyssa_logs(created_at DESC);
GRANT ALL ON public.alyssa_logs TO service_role;
ALTER TABLE public.alyssa_logs ENABLE ROW LEVEL SECURITY;
