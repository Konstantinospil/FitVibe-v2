CREATE OR REPLACE FUNCTION public.refresh_session_summary(p_concurrent boolean DEFAULT true)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  target text;
  view_exists boolean;
BEGIN
  FOR target IN SELECT unnest(ARRAY['session_summary', 'weekly_aggregates']) LOOP
    SELECT EXISTS (
      SELECT 1
      FROM pg_catalog.pg_matviews
      WHERE schemaname = 'public' AND matviewname = target
    ) INTO view_exists;

    IF NOT view_exists THEN
      RAISE NOTICE 'Materialized view % does not exist, skipping refresh.', target;
      CONTINUE;
    END IF;

    IF p_concurrent THEN
      BEGIN
        EXECUTE format('REFRESH MATERIALIZED VIEW CONCURRENTLY %I', target);
      EXCEPTION
        WHEN feature_not_supported THEN
          RAISE NOTICE 'Concurrent refresh not supported for %, running non-concurrent refresh instead.', target;
          EXECUTE format('REFRESH MATERIALIZED VIEW %I', target);
      END;
    ELSE
      EXECUTE format('REFRESH MATERIALIZED VIEW %I', target);
    END IF;
  END LOOP;
END;
$$;
