-- Indices for performance optimization
CREATE INDEX IF NOT EXISTS idx_sessions_user_date ON sessions (owner_id, planned_at);
CREATE INDEX IF NOT EXISTS idx_points_user_date ON points (user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_feed_posts_author ON feed_posts (author_id);
CREATE INDEX IF NOT EXISTS idx_progress_metric_date ON progress (user_id, metric, measured_at);
CREATE INDEX IF NOT EXISTS idx_audit_log_actor ON audit_log (actor_user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_translations_key_locale ON translations (key, locale);
