-- Trigger to auto-update updated_at on row update
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach to tables with updated_at columns
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT table_name FROM information_schema.columns WHERE column_name = 'updated_at' LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_update_%I ON %I;', r.table_name, r.table_name);
    EXECUTE format('CREATE TRIGGER trg_update_%I BEFORE UPDATE ON %I FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();', r.table_name, r.table_name);
  END LOOP;
END $$;
