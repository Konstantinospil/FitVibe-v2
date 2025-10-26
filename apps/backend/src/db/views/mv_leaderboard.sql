CREATE MATERIALIZED VIEW IF NOT EXISTS mv_leaderboard AS
WITH badge_counts AS (
  SELECT user_id, COUNT(*)::int AS badges_count
  FROM badges
  GROUP BY user_id
),
period_points AS (
  SELECT
    user_id,
    'week'::text AS period_type,
    date_trunc('week', awarded_at)::date AS period_start,
    points
  FROM user_points
  UNION ALL
  SELECT
    user_id,
    'month'::text AS period_type,
    date_trunc('month', awarded_at)::date AS period_start,
    points
  FROM user_points
)
SELECT
  pp.period_type,
  pp.period_start,
  u.id AS user_id,
  u.username,
  u.display_name,
  SUM(pp.points)::int AS points,
  COALESCE(bc.badges_count, 0)::int AS badges_count
FROM period_points pp
JOIN users u ON u.id = pp.user_id
LEFT JOIN badge_counts bc ON bc.user_id = pp.user_id
GROUP BY
  pp.period_type,
  pp.period_start,
  u.id,
  u.username,
  u.display_name,
  bc.badges_count;
