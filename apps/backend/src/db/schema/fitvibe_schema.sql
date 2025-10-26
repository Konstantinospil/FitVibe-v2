-- FitVibe schema snapshot generated 2025-10-13T22:36:57Z

CREATE TABLE roles (
  code text PRIMARY KEY,
  description text NOT NULL,
  created_at timestamptz NOT NULL
);

CREATE TABLE genders (
  code text PRIMARY KEY,
  description text NOT NULL,
  created_at timestamptz NOT NULL
);

CREATE TABLE fitness_levels (
  code text PRIMARY KEY,
  description text NOT NULL,
  created_at timestamptz NOT NULL
);

CREATE TABLE exercise_types (
  code text PRIMARY KEY,
  description text NOT NULL,
  created_at timestamptz NOT NULL
);

CREATE TABLE users (
  id uuid PRIMARY KEY,
  username citext UNIQUE NOT NULL,
  display_name text NOT NULL,
  locale text NOT NULL,
  preferred_lang text NOT NULL,
  status text NOT NULL,
  role_code text NOT NULL REFERENCES roles(code),
  password_hash text NOT NULL,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  deleted_at timestamptz
);

CREATE TABLE user_static (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  date_of_birth date,
  gender_code text REFERENCES genders(code),
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL
);

CREATE TABLE user_contacts (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type text NOT NULL,
  value text NOT NULL,
  is_primary boolean NOT NULL,
  is_recovery boolean NOT NULL,
  is_verified boolean NOT NULL,
  verified_at timestamptz,
  created_at timestamptz NOT NULL
);

CREATE TABLE auth_sessions (
  jti uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_agent text,
  ip inet,
  created_at timestamptz NOT NULL,
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz
);

CREATE TABLE user_state_history (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  field text NOT NULL,
  old_value jsonb,
  new_value jsonb,
  changed_at timestamptz NOT NULL
);

CREATE TABLE user_metrics (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  weight numeric,
  unit text NOT NULL,
  fitness_level_code text REFERENCES fitness_levels(code),
  training_frequency text,
  photo_url text,
  recorded_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL
);

CREATE TABLE exercises (
  id uuid PRIMARY KEY,
  owner_id uuid REFERENCES users(id),
  name text NOT NULL,
  type_code text REFERENCES exercise_types(code),
  muscle_group text,
  equipment text,
  tags jsonb NOT NULL,
  is_public boolean NOT NULL,
  description_en text,
  description_de text,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  archived_at timestamptz,
  deleted_at timestamptz
);

CREATE INDEX exercises_owner_active_idx
  ON exercises(owner_id)
  WHERE archived_at IS NULL;

CREATE TABLE sessions (
  id uuid PRIMARY KEY,
  owner_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title text NOT NULL,
  planned_at timestamptz NOT NULL,
  recurrence_rule text,
  started_at timestamptz,
  completed_at timestamptz,
  status text NOT NULL,
  visibility text NOT NULL,
  calories integer,
  points integer,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  deleted_at timestamptz
);

CREATE TABLE plans (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  progress_percent numeric(5,2) NOT NULL DEFAULT 0,
  session_count integer NOT NULL DEFAULT 0,
  completed_count integer NOT NULL DEFAULT 0,
  start_date date,
  end_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  archived_at timestamptz
);

CREATE INDEX idx_plans_owner ON plans(user_id);
CREATE INDEX idx_plans_status ON plans(status);
CREATE INDEX idx_plans_owner_active
  ON plans(user_id)
  WHERE archived_at IS NULL;

CREATE TABLE session_exercises (
  id uuid PRIMARY KEY,
  session_id uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  exercise_id uuid REFERENCES exercises(id),
  order_index integer NOT NULL,
  notes text,
  created_at timestamptz NOT NULL
);

CREATE TABLE planned_exercise_attributes (
  id uuid PRIMARY KEY,
  session_exercise_id uuid UNIQUE NOT NULL REFERENCES session_exercises(id) ON DELETE CASCADE,
  sets integer,
  reps integer,
  load numeric,
  distance numeric,
  duration interval,
  rpe integer,
  rest interval,
  extras jsonb NOT NULL,
  created_at timestamptz NOT NULL
);

CREATE TABLE actual_exercise_attributes (
  id uuid PRIMARY KEY,
  session_exercise_id uuid UNIQUE NOT NULL REFERENCES session_exercises(id) ON DELETE CASCADE,
  sets integer,
  reps integer,
  load numeric,
  distance numeric,
  duration interval,
  rpe integer,
  rest interval,
  extras jsonb NOT NULL,
  recorded_at timestamptz NOT NULL
);

CREATE TABLE user_points (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  source_type text NOT NULL,
  source_id uuid,
  algorithm_version text,
  points integer NOT NULL,
  calories integer,
  metadata jsonb NOT NULL,
  awarded_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL
);

CREATE UNIQUE INDEX user_points_source_unique_idx
  ON user_points(user_id, source_type, source_id)
  WHERE source_id IS NOT NULL;

CREATE TABLE badge_catalog (
  code text PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL,
  category text NOT NULL,
  icon text,
  priority integer NOT NULL,
  criteria jsonb NOT NULL,
  created_at timestamptz NOT NULL
);

CREATE TABLE badges (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_type text NOT NULL,
  awarded_at timestamptz NOT NULL,
  metadata jsonb NOT NULL,
  CONSTRAINT badges_badge_type_fk FOREIGN KEY (badge_type) REFERENCES badge_catalog(code) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE UNIQUE INDEX badges_user_badge_unique_idx
  ON badges(user_id, badge_type);

CREATE TABLE followers (
  follower_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  following_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL,
  CONSTRAINT followers_no_self CHECK (follower_id <> following_id),
  PRIMARY KEY (follower_id, following_id)
);

CREATE TABLE feed_items (
  id uuid PRIMARY KEY,
  owner_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_id uuid REFERENCES sessions(id) ON DELETE SET NULL,
  kind text NOT NULL DEFAULT 'session',
  target_type text,
  target_id uuid,
  visibility text NOT NULL DEFAULT 'private',
  score numeric(10,2) NOT NULL DEFAULT 0,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE INDEX idx_feed_items_visibility_published
  ON feed_items(visibility, published_at DESC);

CREATE INDEX idx_feed_items_owner
  ON feed_items(owner_id, published_at DESC);

CREATE TABLE feed_likes (
  feed_item_id uuid NOT NULL REFERENCES feed_items(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (feed_item_id, user_id)
);

CREATE INDEX idx_feed_likes_item
  ON feed_likes(feed_item_id, created_at DESC);

CREATE TABLE session_bookmarks (
  session_id uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (session_id, user_id)
);

CREATE TABLE feed_comments (
  id uuid PRIMARY KEY,
  feed_item_id uuid NOT NULL REFERENCES feed_items(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES feed_comments(id) ON DELETE SET NULL,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  edited_at timestamptz,
  deleted_at timestamptz
);

CREATE INDEX idx_feed_comments_item
  ON feed_comments(feed_item_id, created_at);

CREATE TABLE share_links (
  id uuid PRIMARY KEY,
  session_id uuid REFERENCES sessions(id) ON DELETE CASCADE,
  feed_item_id uuid REFERENCES feed_items(id) ON DELETE SET NULL,
  token text NOT NULL UNIQUE,
  view_count integer NOT NULL DEFAULT 0,
  max_views integer,
  expires_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT share_links_target_check
    CHECK (
      (feed_item_id IS NOT NULL AND session_id IS NULL)
      OR (session_id IS NOT NULL)
    )
);

CREATE INDEX share_links_session_idx ON share_links(session_id);

CREATE TABLE user_blocks (
  blocker_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  blocked_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT user_blocks_no_self CHECK (blocker_id <> blocked_id),
  PRIMARY KEY (blocker_id, blocked_id)
);

CREATE INDEX user_blocks_blocker_idx
  ON user_blocks(blocker_id);

CREATE INDEX user_blocks_blocked_idx
  ON user_blocks(blocked_id);

CREATE TABLE feed_reports (
  id uuid PRIMARY KEY,
  reporter_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  feed_item_id uuid REFERENCES feed_items(id) ON DELETE SET NULL,
  comment_id uuid REFERENCES feed_comments(id) ON DELETE SET NULL,
  reason text NOT NULL,
  details text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  resolved_by uuid REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX feed_reports_item_idx
  ON feed_reports(feed_item_id, status);

CREATE INDEX feed_reports_comment_idx
  ON feed_reports(comment_id, status);

CREATE TABLE media (
  id uuid PRIMARY KEY,
  owner_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_type text NOT NULL,
  target_id uuid NOT NULL,
  storage_key text NOT NULL,
  file_url text NOT NULL,
  mime_type text,
  media_type text,
  bytes integer,
  created_at timestamptz NOT NULL
);

CREATE TABLE translation_cache (
  id uuid PRIMARY KEY,
  source text NOT NULL,
  lang text NOT NULL,
  translated text NOT NULL,
  hash uuid NOT NULL,
  created_at timestamptz NOT NULL
);

-- materialized view session_summary is defined in db/views/mv_session_summary.sql


