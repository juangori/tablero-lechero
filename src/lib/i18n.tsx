import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

export type Lang = 'en' | 'es'

const STORAGE_KEY = 'tablero.lang'

/* ------------------------------------------------------------------ *
 * Diccionarios. Claves planas con namespaces por punto.
 * El texto puede llevar **negrita** y {variables} de interpolación.
 * ------------------------------------------------------------------ */
type Dict = Record<string, string>

const en: Dict = {
  // App / común
  'app.name': 'Dairy Dashboard',
  'app.place': 'Campo Norte',
  'app.docTitle': 'Dairy Dashboard — Campo Norte',
  'common.cancel': 'Cancel',
  'common.save': 'Save',
  'common.create': 'Create',
  'common.copy': 'Copy',
  'common.signOut': 'Sign out',
  'season.label': 'Season',

  // Nav
  'nav.dashboard': 'Dashboard',
  'nav.weekly': 'Weekly entry',
  'nav.budget': 'Budget',
  'nav.indicators': 'Indicators',
  'nav.data': 'Import / Export',

  // Login
  'login.brandSub': 'Campo Norte · La Elvira',
  'login.email': 'Email',
  'login.password': 'Password',
  'login.submit': 'Sign in',
  'login.footer': 'Private access. Your data is protected.',
  'login.err.invalid': 'Incorrect email or password.',
  'login.err.unconfirmed': 'Email not confirmed.',

  // Dashboard
  'dash.title': 'Dashboard',
  'dash.welcome.title': 'Welcome to your Dairy Dashboard',
  'dash.welcome.body':
    "Start by creating a season under **{budget}** and adding indicators. You'll see the whole picture here.",
  'dash.loading': 'Loading dashboard…',
  'dash.subtitle': 'Season {name}',
  'dash.comparedWith': ' · compared with {prev}',
  'dash.kpi.bud': 'Bud {value}',
  'dash.table.month': 'Month',
  'dash.table.budget': 'Budget',
  'dash.table.actual': 'Actual',
  'dash.table.deviation': 'Deviation',
  'dash.table.pct': '%',
  'chart.budget': 'Budget',
  'chart.actual': 'Actual',
  'chart.prevYear': 'Previous year',
  'chart.actualPrev': 'Actual {name}',

  // Weekly
  'weekly.title': 'Weekly entry',
  'weekly.empty.title': 'First create a season',
  'weekly.empty.body':
    'Go to **{budget}** to create this year’s season. Then load the data here, week by week.',
  'weekly.subtitle': 'Season {name} · {month}',
  'weekly.loading': 'Loading data…',
  'weekly.noind.title': 'No active indicators',
  'weekly.noind.body': 'Create indicators in the **{indicators}** section.',
  'weekly.col.indicator': 'Indicator',
  'weekly.col.week': 'W{n}',
  'weekly.col.month': 'Month',
  'weekly.col.budget': 'Budget',
  'weekly.col.deviation': 'Deviation',
  'weekly.footer':
    'Enter each week (W1–W5). The **monthly average** uses only the weeks you fill in. Saved when you leave the cell.',

  // Budget
  'budget.title': 'Budget',
  'budget.title2': 'Annual budget',
  'budget.empty.title': 'Create your first season',
  'budget.empty.body':
    'The budget is set once a year, month by month. Start by creating a season (e.g. 24-25).',
  'budget.empty.new': 'New season',
  'budget.subtitle': 'Season {name} · monthly values (Jul → Jun)',
  'budget.copyBtn': 'Copy from another year',
  'budget.newBtn': 'New season',
  'budget.loading': 'Loading budget…',
  'budget.noind.title': 'No active indicators',
  'budget.noind.body':
    'Go to **{indicators}** and create or activate the ones you want to budget.',
  'budget.col.indicator': 'Indicator',
  'budget.col.annual': 'Annual',
  'budget.footer':
    'Saved automatically when you leave each cell. Tip: press **Enter** to confirm and move on.',

  // New season modal
  'season.new.title': 'New season',
  'season.new.startYear': 'Start year (July)',
  'season.new.info': 'Season **{name}** · from July {y0} to June {y1}',

  // Copy budget modal
  'copy.title': 'Copy budget → {name}',
  'copy.desc':
    'Copies budget values from another season into the current one. You can adjust them afterward.',
  'copy.from': 'Copy from',
  'copy.choose': 'Choose a season…',

  // Indicators
  'ind.title': 'Indicators',
  'ind.loading': 'Loading indicators…',
  'ind.subtitle':
    'Choose what to measure. Add, edit, or deactivate the indicators you want.',
  'ind.new': 'New indicator',
  'ind.empty.title': 'No indicators yet',
  'ind.empty.body':
    'Create them one by one, or load a typical dairy list to get started.',
  'ind.empty.seed': 'Load typical indicators',
  'ind.activate': 'Activate',
  'ind.deactivate': 'Deactivate',
  'ind.delete.confirm': 'Delete "{name}"? Its budgets and saved data will be removed.',
  'ind.modal.edit': 'Edit indicator',
  'ind.modal.new': 'New indicator',
  'ind.f.name': 'Name',
  'ind.f.unit': 'Unit',
  'ind.f.unit.ph': 'kg DM, %, US$…',
  'ind.f.category': 'Category',
  'ind.f.decimals': 'Decimals',
  'ind.f.direction': 'Direction',
  'ind.f.aggregation': 'Aggregation',
  'dir.higher': 'Higher is better',
  'dir.lower': 'Lower is better',
  'dir.none': 'Neutral',
  'agg.avg': 'Monthly average',
  'agg.sum': 'Sum (total)',
  'agg.last': 'Last value',

  // Categories (display labels; canonical value stays Spanish)
  'cat.Producción': 'Production',
  'cat.Alimentación': 'Feeding',
  'cat.Sanidad': 'Health',
  'cat.Rodeo': 'Herd',
  'cat.Reproducción': 'Reproduction',
  'cat.Otros': 'Other',

  // Import / Export
  'data.title': 'Import / Export',
  'data.subtitle': 'Excel backups and bulk budget upload',
  'data.export': 'Export',
  'data.export.desc': 'Download your data in Excel. Handy as a backup and for sharing.',
  'data.export.season': 'Season {name} summary',
  'data.export.backup': 'Full backup (all years)',
  'data.import': 'Import budget',
  'data.import.desc':
    'Upload an Excel file with a **{budget}** sheet (an **{indicator}** column and Jul…Jun columns) to load the budget for season **{name}**. Tip: export the summary first to get the template.',
  'data.import.choose': 'Choose .xlsx file',
  'data.msg.backup': 'Backup downloaded.',
  'data.msg.season': 'Summary downloaded.',
  'data.msg.import': 'Imported: {ind} indicators, {vals} budget values into {name}.',
  'data.msg.error': 'Import error: {msg}',

  // Excel headers / tabs
  'xls.tab.indicators': 'Indicators',
  'xls.tab.weekly': 'Weekly',
  'xls.tab.season': 'Season {name}',
  'xls.tab.summary': 'Summary {name}',
  'xls.tab.budget': 'Budget',
  'xls.h.indicator': 'Indicator',
  'xls.h.unit': 'Unit',
  'xls.h.category': 'Category',
  'xls.h.decimals': 'Decimals',
  'xls.h.direction': 'Direction',
  'xls.h.active': 'Active',
  'xls.h.season': 'Season',
  'xls.h.monthIdx': 'MonthIdx',
  'xls.h.month': 'Month',
  'xls.h.week': 'Week',
  'xls.h.value': 'Value',
  'xls.h.budget': 'Budget',
  'xls.h.actual': 'Actual',
  'xls.h.deviation': 'Deviation',
  'xls.h.pct': '%',
  'xls.h.prevYear': 'Prev. yr',
  'xls.yes': 'yes',
  'xls.no': 'no',
}

const es: Dict = {
  // App / común
  'app.name': 'Tablero Lechero',
  'app.place': 'Campo Norte',
  'app.docTitle': 'Tablero Lechero — Campo Norte',
  'common.cancel': 'Cancelar',
  'common.save': 'Guardar',
  'common.create': 'Crear',
  'common.copy': 'Copiar',
  'common.signOut': 'Salir',
  'season.label': 'Ejercicio',

  // Nav
  'nav.dashboard': 'Dashboard',
  'nav.weekly': 'Carga semanal',
  'nav.budget': 'Presupuesto',
  'nav.indicators': 'Indicadores',
  'nav.data': 'Importar / Exportar',

  // Login
  'login.brandSub': 'Campo Norte · La Elvira',
  'login.email': 'Email',
  'login.password': 'Contraseña',
  'login.submit': 'Entrar',
  'login.footer': 'Acceso privado. Tus datos están protegidos.',
  'login.err.invalid': 'Email o contraseña incorrectos.',
  'login.err.unconfirmed': 'El email no está confirmado.',

  // Dashboard
  'dash.title': 'Dashboard',
  'dash.welcome.title': 'Bienvenido al Tablero Lechero',
  'dash.welcome.body':
    'Empezá creando un ejercicio en **{budget}** y cargando indicadores. Acá vas a ver todo el panorama.',
  'dash.loading': 'Cargando tablero…',
  'dash.subtitle': 'Ejercicio {name}',
  'dash.comparedWith': ' · comparado con {prev}',
  'dash.kpi.bud': 'Pres {value}',
  'dash.table.month': 'Mes',
  'dash.table.budget': 'Presup.',
  'dash.table.actual': 'Real',
  'dash.table.deviation': 'Desvío',
  'dash.table.pct': '%',
  'chart.budget': 'Presupuesto',
  'chart.actual': 'Real',
  'chart.prevYear': 'Año anterior',
  'chart.actualPrev': 'Real {name}',

  // Weekly
  'weekly.title': 'Carga semanal',
  'weekly.empty.title': 'Primero creá un ejercicio',
  'weekly.empty.body':
    'Andá a **{budget}** para crear el ejercicio del año. Después cargás acá los datos semana a semana.',
  'weekly.subtitle': 'Ejercicio {name} · {month}',
  'weekly.loading': 'Cargando datos…',
  'weekly.noind.title': 'No hay indicadores activos',
  'weekly.noind.body': 'Creá indicadores en la sección **{indicators}**.',
  'weekly.col.indicator': 'Indicador',
  'weekly.col.week': 'S{n}',
  'weekly.col.month': 'Mes',
  'weekly.col.budget': 'Presup',
  'weekly.col.deviation': 'Desvío',
  'weekly.footer':
    'Cargá cada semana (S1–S5). El **promedio mensual** se calcula solo con las semanas que cargues. Se guarda al salir de la celda.',

  // Budget
  'budget.title': 'Presupuesto',
  'budget.title2': 'Presupuesto anual',
  'budget.empty.title': 'Creá tu primer ejercicio',
  'budget.empty.body':
    'El presupuesto se arma una vez al año, mes a mes. Empezá creando un ejercicio (ej. 24-25).',
  'budget.empty.new': 'Nuevo ejercicio',
  'budget.subtitle': 'Ejercicio {name} · valores mensuales (jul → jun)',
  'budget.copyBtn': 'Copiar de otro año',
  'budget.newBtn': 'Nuevo ejercicio',
  'budget.loading': 'Cargando presupuesto…',
  'budget.noind.title': 'No hay indicadores activos',
  'budget.noind.body':
    'Andá a **{indicators}** y creá o activá los que quieras presupuestar.',
  'budget.col.indicator': 'Indicador',
  'budget.col.annual': 'Anual',
  'budget.footer':
    'Se guarda solo al salir de cada celda. Tip: presioná **Enter** para confirmar y pasar.',

  // New season modal
  'season.new.title': 'Nuevo ejercicio',
  'season.new.startYear': 'Año de inicio (julio)',
  'season.new.info': 'Ejercicio **{name}** · de julio {y0} a junio {y1}',

  // Copy budget modal
  'copy.title': 'Copiar presupuesto → {name}',
  'copy.desc':
    'Copia los valores de presupuesto de otro ejercicio al actual. Después podés ajustarlos.',
  'copy.from': 'Copiar desde',
  'copy.choose': 'Elegí un ejercicio…',

  // Indicators
  'ind.title': 'Indicadores',
  'ind.loading': 'Cargando indicadores…',
  'ind.subtitle':
    'Elegí qué medir. Agregá, editá o desactivá los indicadores que quieras.',
  'ind.new': 'Nuevo indicador',
  'ind.empty.title': 'Todavía no hay indicadores',
  'ind.empty.body':
    'Podés crear uno a uno, o cargar la lista típica de un tambo para arrancar.',
  'ind.empty.seed': 'Cargar indicadores típicos',
  'ind.activate': 'Activar',
  'ind.deactivate': 'Desactivar',
  'ind.delete.confirm':
    '¿Eliminar "{name}"? Se borran sus presupuestos y datos cargados.',
  'ind.modal.edit': 'Editar indicador',
  'ind.modal.new': 'Nuevo indicador',
  'ind.f.name': 'Nombre',
  'ind.f.unit': 'Unidad',
  'ind.f.unit.ph': 'kg MS, %, US$…',
  'ind.f.category': 'Categoría',
  'ind.f.decimals': 'Decimales',
  'ind.f.direction': 'Sentido',
  'ind.f.aggregation': 'Agregación',
  'dir.higher': 'Más es mejor',
  'dir.lower': 'Menos es mejor',
  'dir.none': 'Neutro',
  'agg.avg': 'Promedio mensual',
  'agg.sum': 'Suma (total)',
  'agg.last': 'Último valor',

  // Categories
  'cat.Producción': 'Producción',
  'cat.Alimentación': 'Alimentación',
  'cat.Sanidad': 'Sanidad',
  'cat.Rodeo': 'Rodeo',
  'cat.Reproducción': 'Reproducción',
  'cat.Otros': 'Otros',

  // Import / Export
  'data.title': 'Importar / Exportar',
  'data.subtitle': 'Backups en Excel y carga masiva de presupuesto',
  'data.export': 'Exportar',
  'data.export.desc': 'Descargá tus datos en Excel. Sirve de respaldo y para compartir.',
  'data.export.season': 'Resumen del ejercicio {name}',
  'data.export.backup': 'Backup completo (todos los años)',
  'data.import': 'Importar presupuesto',
  'data.import.desc':
    'Subí un Excel con una hoja **{budget}** (columna **{indicator}** y columnas Jul…Jun) para cargar el presupuesto del ejercicio **{name}**. Tip: exportá el resumen primero para tener la plantilla.',
  'data.import.choose': 'Elegir archivo .xlsx',
  'data.msg.backup': 'Backup descargado.',
  'data.msg.season': 'Resumen descargado.',
  'data.msg.import':
    'Importado: {ind} indicadores, {vals} valores de presupuesto en {name}.',
  'data.msg.error': 'Error al importar: {msg}',

  // Excel headers / tabs
  'xls.tab.indicators': 'Indicadores',
  'xls.tab.weekly': 'Semanal',
  'xls.tab.season': 'Ejercicio {name}',
  'xls.tab.summary': 'Resumen {name}',
  'xls.tab.budget': 'Presupuesto',
  'xls.h.indicator': 'Indicador',
  'xls.h.unit': 'Unidad',
  'xls.h.category': 'Categoría',
  'xls.h.decimals': 'Decimales',
  'xls.h.direction': 'Sentido',
  'xls.h.active': 'Activo',
  'xls.h.season': 'Ejercicio',
  'xls.h.monthIdx': 'MesIdx',
  'xls.h.month': 'Mes',
  'xls.h.week': 'Semana',
  'xls.h.value': 'Valor',
  'xls.h.budget': 'Presupuesto',
  'xls.h.actual': 'Real',
  'xls.h.deviation': 'Desvío',
  'xls.h.pct': '%',
  'xls.h.prevYear': 'Año ant.',
  'xls.yes': 'sí',
  'xls.no': 'no',
}

const DICTS: Record<Lang, Dict> = { en, es }

function interpolate(str: string, vars?: Record<string, string | number>): string {
  if (!vars) return str
  return str.replace(/\{(\w+)\}/g, (_m, k) =>
    k in vars ? String(vars[k]) : `{${k}}`,
  )
}

/** Convierte **negrita** en <b>. Útil con t() para textos enfatizados. */
export function rich(s: string): ReactNode[] {
  return s.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith('**') && part.endsWith('**') ? (
      <b key={i}>{part.slice(2, -2)}</b>
    ) : (
      part
    ),
  )
}

export type TFn = (key: string, vars?: Record<string, string | number>) => string

interface I18nCtx {
  lang: Lang
  setLang: (l: Lang) => void
  toggle: () => void
  t: TFn
  /** Etiqueta visible de una categoría (el valor guardado sigue en español). */
  tCat: (cat: string) => string
}

const Ctx = createContext<I18nCtx>(null as unknown as I18nCtx)

function readInitial(): Lang {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'en' || saved === 'es') return saved
  } catch {
    /* ignore */
  }
  return 'en' // arranca en inglés por defecto
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(readInitial)

  const setLang = useCallback((l: Lang) => {
    setLangState(l)
    try {
      localStorage.setItem(STORAGE_KEY, l)
    } catch {
      /* ignore */
    }
  }, [])

  const toggle = useCallback(
    () => setLang(lang === 'en' ? 'es' : 'en'),
    [lang, setLang],
  )

  const t = useCallback<TFn>(
    (key, vars) => {
      const raw = DICTS[lang][key] ?? DICTS.en[key] ?? key
      return interpolate(raw, vars)
    },
    [lang],
  )

  const tCat = useCallback(
    (cat: string) => DICTS[lang]['cat.' + cat] ?? DICTS.en['cat.' + cat] ?? cat,
    [lang],
  )

  useEffect(() => {
    document.documentElement.lang = lang
    document.title = t('app.docTitle')
  }, [lang, t])

  const value = useMemo<I18nCtx>(
    () => ({ lang, setLang, toggle, t, tCat }),
    [lang, setLang, toggle, t, tCat],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export const useI18n = () => useContext(Ctx)
