-- Agregación por indicador: cómo se combinan las semanas en el mes y los meses en el año.
--   avg  = promedio        (tasas/intensidades: litros/vaca, %grasa, RCS, costo…)
--   sum  = suma            (eventos acumulables: muertes en guachera / al parto)
--   last = último valor    (stock puntual: vacas en ordeñe, vacas masa)
--
-- Antes la vista monthly_actuals promediaba TODO, lo que subestimaba los conteos
-- (p.ej. muertes) y daba un "anual" engañoso para stocks. Esta migración agrega la
-- columna `aggregation` y reescribe la vista para respetarla por indicador.

ALTER TABLE tablero.indicators
  ADD COLUMN IF NOT EXISTS aggregation text NOT NULL DEFAULT 'avg'
  CHECK (aggregation IN ('avg', 'sum', 'last'));

-- Mapeo de los indicadores canónicos del establecimiento.
UPDATE tablero.indicators SET aggregation = 'sum'
  WHERE name IN ('Muertes en guachera', 'Muertes al parto');

UPDATE tablero.indicators SET aggregation = 'last'
  WHERE name IN ('Vacas en ordeñe', 'Vacas masa');
-- El resto queda en 'avg' por el DEFAULT.

-- Vista mensual: agrega las semanas (S1–S5) según el modo del indicador.
CREATE OR REPLACE VIEW tablero.monthly_actuals AS
SELECT
  w.season_id,
  w.indicator_id,
  w.month_index,
  CASE i.aggregation
    WHEN 'sum'  THEN sum(w.value)
    WHEN 'last' THEN (array_agg(w.value ORDER BY w.week_index DESC))[1]
    ELSE avg(w.value)
  END AS value,
  count(w.value) AS weeks_loaded
FROM tablero.weekly_entries w
JOIN tablero.indicators i ON i.id = w.indicator_id
WHERE w.value IS NOT NULL
GROUP BY w.season_id, w.indicator_id, w.month_index, i.aggregation;
