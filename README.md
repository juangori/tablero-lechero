# 🐄 Tablero Lechero — Campo Norte

App web que reemplaza el Excel de KPIs lecheros de **La Elvira – Campo Norte**.
Presupuesto anual (mes a mes), carga semanal del dato real, y comparación
**presupuesto vs real vs año anterior**, todo en tablas y gráficos.

🔗 **App:** https://juangori.github.io/tablero-lechero/

## Qué hace

- **Dashboard** — tarjetas KPI + gráfico de evolución mensual (presupuesto / real / año anterior) + tabla de desvíos.
- **Carga semanal** — cargás S1–S5 de cada mes; el promedio mensual se calcula solo.
- **Presupuesto** — las 12 columnas mensuales por indicador (una vez al año), con "copiar de otro año".
- **Indicadores** — catálogo configurable: agregás, editás o desactivás los que quieras.
- **Importar / Exportar** — backup a Excel y carga masiva de presupuesto desde planilla.

Año agrícola **julio → junio**. Indicadores históricos migrados: 2020-21 a 2024-25.

## Acceso

- Login con email + contraseña (usuario único: el ingeniero).
- Los datos viven en **Supabase** (nube), protegidos por login + RLS. Se entra desde cualquier dispositivo.

## Tecnología

- **Frontend:** React + TypeScript + Vite + TailwindCSS + Recharts. Hospedado gratis en **GitHub Pages**.
- **Backend:** **Supabase** (Postgres + Auth), esquema aislado `tablero`.
- **PWA:** instalable en el celular (ícono en pantalla de inicio).

## Desarrollo

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # genera dist/
```

El deploy es automático: cada push a `main` publica vía GitHub Actions.

La configuración de Supabase (URL + key pública) está en `src/lib/config.ts`.
La key publishable es pública por diseño; la seguridad la dan el login y las
políticas RLS de la base.
