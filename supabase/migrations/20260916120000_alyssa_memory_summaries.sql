CREATE TABLE public.alyssa_memory_summaries (
  chat_id BIGINT PRIMARY KEY,
  summary TEXT NOT NULL,
  source_through TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_alyssa_memory_summaries_updated
  ON public.alyssa_memory_summaries(updated_at DESC);

GRANT ALL ON public.alyssa_memory_summaries TO service_role;
ALTER TABLE public.alyssa_memory_summaries ENABLE ROW LEVEL SECURITY;