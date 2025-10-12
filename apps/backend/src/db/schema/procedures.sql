-- Stored procedure for awarding points on session completion
CREATE OR REPLACE FUNCTION award_points_on_completion()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status <> 'completed' THEN
    INSERT INTO points(id, user_id, delta, reason, created_at)
    VALUES (gen_random_uuid(), NEW.user_id, 10, 'workout_completed', NOW());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_award_points
AFTER UPDATE OF status ON sessions
FOR EACH ROW
EXECUTE PROCEDURE award_points_on_completion();
