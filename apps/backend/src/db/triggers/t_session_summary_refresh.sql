CREATE OR REPLACE FUNCTION public.session_summary_refresh_trigger()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;

  IF NEW.status = 'completed' THEN
    PERFORM public.refresh_session_summary(TRUE);
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_session_summary_refresh ON sessions;
CREATE TRIGGER trg_session_summary_refresh
AFTER INSERT OR UPDATE OF status, completed_at ON sessions
FOR EACH STATEMENT
EXECUTE FUNCTION public.session_summary_refresh_trigger();
