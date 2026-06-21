# i18n EN/ES — estado del trabajo (WIP)

Rama: `feature/i18n-en-es` · NO mergear a `main` hasta terminar (no compila todavía).

Objetivo: app en **inglés por defecto** con un **toggle EN | ES**. Si el usuario
elige ES, se recuerda para la próxima visita.

---

## Hecho

- **Sistema i18n** sin dependencias nuevas: `src/lib/i18n.tsx`
  - `I18nProvider` + hook `useI18n()` → `{ lang, setLang, toggle, t, tCat }`.
  - Arranca en **EN**; persiste la elección en `localStorage` (`tablero.lang`).
  - `t(key, vars)` con interpolación `{var}` y soporte de **negrita** vía `**...**`
    usando el helper `rich()`.
  - `tCat(cat)` muestra la categoría traducida pero el valor guardado sigue siendo
    el canónico en español (no rompe el agrupado de datos existentes).
  - Actualiza `document.documentElement.lang` y `document.title` al cambiar de idioma.
- **Toggle EN | ES**: `src/components/LangToggle.tsx`
  - En la barra superior (siempre visible, también en mobile) y en el login
    (`variant="light"`).
- **Meses localizados**: `src/lib/months.ts`
  - `MONTHS` ahora tiene `{ es, en }` para `short`/`long` y conserva la `key`
    canónica (jul, ago, set…) para el match al importar planillas.
  - Helpers: `monthShort(idx, lang)`, `monthLong(idx, lang)` y
    `monthHeaderKeys(month)` (devuelve todos los encabezados posibles EN+ES+key
    para tolerar imports en cualquier idioma).
- **Pantallas traducidas** (todas las cadenas de UI):
  - `src/components/Layout.tsx` (nav, marca, selector de ejercicio, salir)
  - `src/auth/Login.tsx`
  - `src/pages/Dashboard.tsx` (incluye series del gráfico y tabla)
  - `src/pages/CargaSemanal.tsx`
  - `src/pages/Presupuesto.tsx` (+ modales Nuevo ejercicio y Copiar presupuesto)
  - `src/pages/Indicadores.tsx` (+ modal de indicador)
- **main.tsx**: la app está envuelta con `<I18nProvider>`.

### Decisiones tomadas
- Los **nombres de indicadores y unidades** NO se traducen: son datos cargados por
  el usuario en Supabase (en español). La UI/chrome va en inglés; los datos quedan
  como están.
- Las **categorías** se muestran traducidas pero se guardan con el valor canónico
  español, para no romper indicadores ya existentes.

---

## Pendiente

1. **`src/pages/ImportExport.tsx`** — NO migrado aún. Sigue usando `mo.short` /
   `mo.long`, que ya no existen en `months.ts`. **Por esto la rama no compila.**
   - Reemplazar por `monthShort(idx, lang)` / `monthLong(idx, lang)`.
   - Traducir la UI de la página (títulos, botones, mensajes de éxito/error).
   - Localizar los encabezados y nombres de hoja del Excel exportado
     (ya hay claves `xls.*` en `i18n.tsx` listas para usar).
   - Hacer el import tolerante a planillas EN o ES usando `monthHeaderKeys()` para
     hacer match de las columnas de meses, e incluir `Indicator`/`Indicador` y
     `/budget|presupuesto/i` en la detección de la hoja.
   - Las funciones helper `sheetResumen` / `sheetPresupuesto` son módulo-level:
     pasarles `t` y `lang` como parámetros.
2. **Opcional**: ajustar `<html lang="es">` y el `<title>` iniciales en `index.html`
   (el provider ya los actualiza en runtime, así que es solo cosmético para el
   primer render / SEO).
3. **Verificar build**: `npm run build` (o `tsc`) debe pasar antes de mergear.
4. **Merge a `main`** recién cuando compile → dispara el deploy automático
   (GitHub Actions) a https://juangori.github.io/tablero-lechero/

---

## Cómo retomar

```bash
git checkout feature/i18n-en-es
# editar src/pages/ImportExport.tsx (ver punto 1)
npm run build      # debe pasar sin errores
git add -A && git commit -m "i18n: migrar ImportExport + Excel bilingüe"
git push
# luego abrir PR o mergear a main
```
