// Datos públicos de Supabase (la key publishable está pensada para ir en el cliente;
// la seguridad real la da RLS + el login). Se pueden sobreescribir por variables de entorno.
export const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL ?? 'https://hybpvalcfzqpfufpdeyt.supabase.co'

export const SUPABASE_KEY =
  import.meta.env.VITE_SUPABASE_KEY ?? 'sb_publishable_6CZ1-YhF_XfbiCilwAfMGA_cJTQvMtE'

// Esquema aislado dentro del proyecto reporte-tambo
export const DB_SCHEMA = 'tablero'
