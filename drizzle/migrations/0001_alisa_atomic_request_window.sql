CREATE OR REPLACE FUNCTION public.alisa_take_request(p_user_id bigint, p_limit integer DEFAULT 20) RETURNS boolean
LANGUAGE plpgsql SET search_path = public AS $$
DECLARE recent timestamptz[]; current_time_value timestamptz := clock_timestamp();
BEGIN
 IF p_user_id <= 0 OR p_limit < 1 THEN RETURN false; END IF;
 INSERT INTO public.alisa_request_windows(user_id) VALUES (p_user_id) ON CONFLICT DO NOTHING;
 SELECT requests INTO recent FROM public.alisa_request_windows WHERE user_id = p_user_id FOR UPDATE;
 SELECT coalesce(array_agg(t), '{}') INTO recent FROM unnest(recent) t WHERE t > current_time_value - interval '60 seconds';
 IF cardinality(recent) >= p_limit THEN RETURN false; END IF;
 UPDATE public.alisa_request_windows SET requests = array_append(recent, current_time_value) WHERE user_id = p_user_id;
 RETURN true;
END; $$;
REVOKE ALL ON FUNCTION public.alisa_take_request(bigint, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.alisa_take_request(bigint, integer) TO service_role;