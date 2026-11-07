CREATE TABLE public.alisa_controls (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), chat_id bigint NOT NULL, owner_id bigint NOT NULL,
 message_id bigint, kind text NOT NULL, content text NOT NULL, file_id text,
 created_at timestamptz NOT NULL DEFAULT now(), busy boolean NOT NULL DEFAULT false
);
GRANT ALL ON public.alisa_controls TO service_role;
ALTER TABLE public.alisa_controls ENABLE ROW LEVEL SECURITY;
CREATE POLICY service_controls ON public.alisa_controls FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE TABLE public.alisa_conversations (chat_id bigint PRIMARY KEY, reset_at timestamptz NOT NULL DEFAULT now());
GRANT ALL ON public.alisa_conversations TO service_role;
ALTER TABLE public.alisa_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY service_conversations ON public.alisa_conversations FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE TABLE public.alisa_update_receipts (update_id bigint PRIMARY KEY, created_at timestamptz NOT NULL DEFAULT now());
GRANT ALL ON public.alisa_update_receipts TO service_role;
ALTER TABLE public.alisa_update_receipts ENABLE ROW LEVEL SECURITY;
CREATE POLICY service_receipts ON public.alisa_update_receipts FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE TABLE public.alisa_request_windows (user_id bigint PRIMARY KEY, requests timestamptz[] NOT NULL DEFAULT '{}');
GRANT ALL ON public.alisa_request_windows TO service_role;
ALTER TABLE public.alisa_request_windows ENABLE ROW LEVEL SECURITY;
CREATE POLICY service_windows ON public.alisa_request_windows FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE FUNCTION public.alisa_take_request(p_user_id bigint, p_limit integer DEFAULT 20) RETURNS boolean
LANGUAGE plpgsql SET search_path = public AS $$
DECLARE recent timestamptz[]; current_time_value timestamptz := clock_timestamp();
BEGIN
 IF p_user_id <= 0 OR p_limit < 1 THEN RETURN false; END IF;
 INSERT INTO public.alisa_request_windows(user_id) VALUES (p_user_id) ON CONFLICT DO NOTHING;
 SELECT ARRAY(SELECT unnest(requests) AS t WHERE unnest IS NOT NULL) INTO recent FROM public.alisa_request_windows WHERE false;
 SELECT requests INTO recent FROM public.alisa_request_windows WHERE user_id = p_user_id FOR UPDATE;
 SELECT coalesce(array_agg(t), '{}') INTO recent FROM unnest(recent) t WHERE t > current_time_value - interval '60 seconds';
 IF cardinality(recent) >= p_limit THEN RETURN false; END IF;
 UPDATE public.alisa_request_windows SET requests = array_append(recent, current_time_value) WHERE user_id = p_user_id;
 RETURN true;
END; $$;
REVOKE ALL ON FUNCTION public.alisa_take_request(bigint, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.alisa_take_request(bigint, integer) TO service_role;