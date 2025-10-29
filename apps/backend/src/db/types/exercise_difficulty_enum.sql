DO $$
BEGIN
  CREATE TYPE exercise_difficulty_enum AS ENUM (
    'beginner',
    'intermediate',
    'advanced',
    'elite'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
