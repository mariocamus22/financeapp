# FinanceAPP

App de finanzas personales (Next.js). Datos locales con Dexie; opcionalmente **Supabase** si inicias sesión en Configuración → Cuenta.

Repositorio: [github.com/mariocamus22/financeapp](https://github.com/mariocamus22/financeapp).

## Desarrollo

```bash
npm install
cp .env.example .env.local
# Edita .env.local con URL y clave pública de Supabase (no subas .env.local al repo).
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Supabase

1. En el [panel de Supabase](https://supabase.com/dashboard), abre tu proyecto → **SQL Editor** y ejecuta el contenido de `supabase/migrations/20260207120000_finance_tables.sql` (tablas `finance_*`, RLS por `auth.uid()`).
2. **Authentication → URL configuration**: añade en *Redirect URLs* tu dominio de Vercel (`https://tu-app.vercel.app/**`) y `http://localhost:3000/**` para desarrollo.
3. Copia **Project URL** y la clave **anon** (o publishable si tu proyecto la usa) a `.env.local` / Vercel como `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

Si alguna clave se compartió en un chat o issue, **rótala** en el panel de Supabase y actualiza Vercel.

## Vercel

1. Importa el repo desde GitHub.
2. Añade las mismas variables `NEXT_PUBLIC_*` en **Environment Variables** (Production y Preview).
3. Redeploy tras cambiar variables.

Más detalles: [documentación de despliegue de Next.js en Vercel](https://nextjs.org/docs/app/building-your-application/deploying).
