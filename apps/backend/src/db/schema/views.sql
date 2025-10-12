-- Aggregated user performance view
CREATE OR REPLACE VIEW vw_user_performance AS
SELECT
  u.id AS user_id,
  u.username,
  COUNT(DISTINCT s.id) AS total_sessions,
  SUM(CASE WHEN s.status = 'completed' THEN 1 ELSE 0 END) AS completed_sessions,
  SUM(p.value) FILTER (WHERE p.metric = '1RM') AS total_strength_points
FROM users u
LEFT JOIN sessions s ON s.user_id = u.id
LEFT JOIN progress p ON p.user_id = u.id
GROUP BY u.id;

-- Feed summary view
CREATE OR REPLACE VIEW vw_feed_summary AS
SELECT
  p.id AS post_id,
  p.author_id,
  COUNT(DISTINCT c.id) AS comments,
  COUNT(DISTINCT l.id) AS likes
FROM feed_posts p
LEFT JOIN feed_comments c ON c.post_id = p.id
LEFT JOIN feed_likes l ON l.post_id = p.id
GROUP BY p.id;
