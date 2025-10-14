CREATE OR REPLACE FUNCTION public.refresh_session_summary(p_concurrent boolean DEFAULT true)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_catalog.pg_matviews
    WHERE schemaname = 'public' AND matviewname = 'session_summary'
  ) THEN
    RAISE NOTICE 'Materialized view session_summary does not exist, skipping refresh.';
    RETURN;
  END IF;

  IF p_concurrent THEN
    BEGIN
      EXECUTE 'REFRESH MATERIALIZED VIEW CONCURRENTLY session_summary';
    EXCEPTION
      WHEN feature_not_supported THEN
        RAISE NOTICE 'Concurrent refresh not supported, running non-concurrent refresh instead.';
        EXECUTE 'REFRESH MATERIALIZED VIEW session_summary';
    END;
  ELSE
    EXECUTE 'REFRESH MATERIALIZED VIEW session_summary';
  END IF;
END;
$$;
