CREATE OR REPLACE FUNCTION public.ensure_monthly_partitions()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  target_month date;
  table_spec text;
  base_table text;
  partition_column text;
  start_date date := date_trunc('month', now())::date;
  end_date date;
  partition_name text;
  sql text;
  partition_targets CONSTANT text[] := ARRAY[
    'sessions:planned_at',
    'user_points:awarded_at',
    'user_state_history:changed_at'
  ];
BEGIN
  FOREACH table_spec IN ARRAY partition_targets LOOP
    base_table := split_part(table_spec, ':', 1);
    partition_column := split_part(table_spec, ':', 2);

    FOR target_month IN
      SELECT (start_date + (interval '1 month' * idx))::date
      FROM generate_series(0, 2) AS idx
    LOOP
      partition_name := format('%I_%s', base_table, to_char(target_month, 'YYYYMM'));
      end_date := (target_month + interval '1 month')::date;
      sql := format(
        'CREATE TABLE IF NOT EXISTS %I PARTITION OF %I FOR VALUES FROM (%L) TO (%L);',
        partition_name,
        base_table,
        target_month,
        end_date
      );
      EXECUTE sql;
    END LOOP;
  END LOOP;
END;
$$;
