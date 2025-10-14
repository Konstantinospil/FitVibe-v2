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
  deleted_at timestamptz
);

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
  algorithm_version text,
  points integer NOT NULL,
  awarded_at timestamptz NOT NULL
);

CREATE TABLE badges (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_type text NOT NULL,
  awarded_at timestamptz NOT NULL
);

CREATE TABLE followers (
  id uuid PRIMARY KEY,
  follower_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  following_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL
);

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


