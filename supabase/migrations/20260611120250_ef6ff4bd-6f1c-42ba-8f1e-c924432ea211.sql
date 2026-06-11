
CREATE TABLE public.telegram_messages (
  id BIGSERIAL PRIMARY KEY,
  chat_id BIGINT NOT NULL,
  chat_type TEXT NOT NULL,
  user_id BIGINT,
  user_name TEXT,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_tg_messages_chat ON public.telegram_messages(chat_id, created_at DESC);
CREATE INDEX idx_tg_messages_user ON public.telegram_messages(user_id, created_at DESC);
GRANT ALL ON public.telegram_messages TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.telegram_messages_id_seq TO service_role;
ALTER TABLE public.telegram_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service only" ON public.telegram_messages FOR ALL USING (false);
