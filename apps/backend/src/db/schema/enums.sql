-- ENUMS for FitVibe
CREATE TYPE session_status AS ENUM ('planned', 'in_progress', 'completed', 'canceled');
CREATE TYPE visibility_enum AS ENUM ('public', 'friends', 'private');
CREATE TYPE health_status AS ENUM ('ok', 'degraded', 'down');
