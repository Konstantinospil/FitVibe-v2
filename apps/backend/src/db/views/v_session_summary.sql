CREATE OR REPLACE VIEW v_session_summary AS
SELECT
  ss.session_id,
  ss.owner_id,
  ss.exercise_count,
  ss.total_volume,
  ss.status,
  ss.planned_at,
  ss.completed_at,
  ss.refreshed_at
FROM session_summary ss;
