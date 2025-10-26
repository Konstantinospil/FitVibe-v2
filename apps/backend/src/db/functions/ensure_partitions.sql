CREATE OR REPLACE FUNCTION public.ensure_monthly_partitions()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  table_spec text;
  base_table text;
  partition_column text;
  retention_months int;
  start_date date := date_trunc('month', now())::date;
  target_month date;
  end_date date;
  partition_name text;
  drop_before date;
  partition_expr text;
  bounds text[];
  bound_start date;
  bound_end date;
  partition_targets CONSTANT text[] := ARRAY[
    'sessions:planned_at:24',
    'user_points:awarded_at:18',
    'user_state_history:changed_at:12'
  ];
BEGIN
  FOREACH table_spec IN ARRAY partition_targets LOOP
    base_table := split_part(table_spec, ':', 1);
    partition_column := split_part(table_spec, ':', 2);
    retention_months := split_part(table_spec, ':', 3)::int;

    EXECUTE format(
      'CREATE TABLE IF NOT EXISTS %I_default PARTITION OF %I DEFAULT;',
      base_table,
      base_table
    );

    FOR target_month IN
      SELECT (start_date + (interval '1 month' * idx))::date
      FROM generate_series(-1, 2) AS idx
    LOOP
      partition_name := format('%I_%s', base_table, to_char(target_month, 'YYYYMM'));
      end_date := (target_month + interval '1 month')::date;
      EXECUTE format(
        'CREATE TABLE IF NOT EXISTS %I PARTITION OF %I FOR VALUES FROM (%L) TO (%L);',
        partition_name,
        base_table,
        target_month,
        end_date
      );
    END LOOP;

    drop_before := (start_date - make_interval(months => retention_months))::date;

    FOR partition_expr, partition_name IN
      SELECT
        pg_catalog.pg_get_expr(child.relpartbound, child.oid),
        child.relname
      FROM pg_class parent
        JOIN pg_inherits i ON i.inhparent = parent.oid
        JOIN pg_class child ON child.oid = i.inhrelid
      WHERE parent.relname = base_table
        AND child.relkind IN ('r', 'p')
    LOOP
      IF partition_expr NOT LIKE 'DEFAULT' THEN
        bounds := regexp_matches(partition_expr, $$FROM \('(.*)'\) TO \('(.*)'\)$$);
        IF bounds IS NOT NULL AND array_length(bounds, 1) = 2 THEN
          bound_start := bounds[1]::date;
          bound_end := bounds[2]::date;
          IF bound_end <= drop_before THEN
            EXECUTE format('ALTER TABLE %I DETACH PARTITION %I;', base_table, partition_name);
            EXECUTE format('DROP TABLE IF EXISTS %I;', partition_name);
          END IF;
        END IF;
      END IF;
    END LOOP;
  END LOOP;
END;
$$;
