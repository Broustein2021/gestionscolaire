// scripts/dump-schema.mjs
// Capture le schéma complet d'un projet Supabase (tables, contraintes, index,
// types, fonctions, triggers, RLS et politiques) et l'écrit en migration de
// référence `0001_base_schema.sql`. Utilise uniquement l'API Management.
//
// Usage :
//   SUPABASE_MANAGEMENT_TOKEN=... SUPABASE_PROJECT_REF=... node scripts/dump-schema.mjs
//
// Le fichier produit est destiné à recréer un environnement à l'identique
// (base d'un nouveau client), dans le même ordre que Supabase l'initialise.
// Les grants par défaut (anon/authenticated/service_role) sont posés
// automatiquement par le socle Supabase sur un projet neuf.

import { writeFile } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import { writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const TOKEN = process.env.SUPABASE_MANAGEMENT_TOKEN
const REF = process.env.SUPABASE_PROJECT_REF

if (!TOKEN || !REF) {
  console.error('Variables requises : SUPABASE_MANAGEMENT_TOKEN, SUPABASE_PROJECT_REF')
  process.exit(1)
}

const CURL = process.env.CURL_EXE ?? 'curl.exe'

function runQuery(sql) {
  const url = `https://api.supabase.com/v1/projects/${REF}/database/query`
  const body = JSON.stringify({ query: sql })
  const tmp = join(tmpdir(), `dump-schema-${process.pid}.json`)
  writeFileSync(tmp, body, 'utf8')
  try {
    const res = spawnSync(CURL, ['-s', '-X', 'POST', url, '-H', `Authorization: Bearer ${TOKEN}`, '-H', 'Content-Type: application/json', '--data-binary', `@${tmp}`], { encoding: 'utf8', timeout: 90000 })
    if (res.status !== 0) throw new Error(`curl ${res.status}\n${res.stderr ?? ''}`)
    if (!res.stdout || res.stdout.trim() === '') {
      throw new Error(`réponse vide pour ${sql.slice(0, 80)}`)
    }
    return JSON.parse(res.stdout)
  } finally {
    rmSync(tmp, { force: true })
  }
}

const q = (sql) => `
  SELECT json_agg(t) AS rows FROM (${sql}) t
`

async function load(sql) {
  const r = await runQuery(q(sql))
  return r?.[0]?.rows ?? []
}

const enums = await load(`
  SELECT n.nspname AS schema_name, t.typname AS type_name,
         array_agg(e.enumlabel ORDER BY e.enumsortorder) AS labels
  FROM pg_type t
  JOIN pg_enum e ON e.enumtypid = t.oid
  JOIN pg_namespace n ON n.oid = t.typnamespace
  WHERE t.typtype = 'e'
    AND n.nspname = 'public'
  GROUP BY n.nspname, t.typname
  ORDER BY n.nspname, t.typname
`)

const tables = await load(`
  SELECT n.nspname AS schema_name, c.relname AS table_name
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname IN ('public', 'private')
    AND c.relkind IN ('r', 'p')
    AND c.relname NOT LIKE 'pg_%'
  ORDER BY n.nspname, c.relname
`)

const columns = await load(`
  SELECT c.relname AS table_name,
         a.attname AS column_name,
         pg_catalog.format_type(a.atttypid, a.atttypmod) AS data_type,
         a.attnotnull AS not_null,
         a.attidentity AS identity,
         pg_get_expr(d.adbin, d.adrelid) AS default_expr
  FROM pg_attribute a
  JOIN pg_class c ON c.oid = a.attrelid
  JOIN pg_namespace n ON n.oid = c.relnamespace
  LEFT JOIN pg_attrdef d ON d.adrelid = a.attrelid AND d.adnum = a.attnum
  WHERE n.nspname IN ('public', 'private')
    AND c.relkind IN ('r', 'p')
    AND a.attnum > 0
    AND NOT a.attisdropped
  ORDER BY c.relname, a.attnum
`)

const constraints = await load(`
  SELECT c.relname AS table_name, con.conname, con.contype,
         pg_get_constraintdef(con.oid, true) AS def
  FROM pg_constraint con
  JOIN pg_class c ON c.oid = con.conrelid
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname IN ('public', 'private')
    AND con.contype IN ('p', 'u', 'f', 'c')
  ORDER BY c.relname, con.conname
`)

const indexes = await load(`
  SELECT i.relname AS index_name, pg_get_indexdef(idx.indexrelid) AS def
  FROM pg_index idx
  JOIN pg_class i ON i.oid = idx.indexrelid
  JOIN pg_class t ON t.oid = idx.indrelid
  JOIN pg_namespace n ON n.oid = t.relnamespace
  WHERE n.nspname IN ('public', 'private')
    AND NOT EXISTS (
      SELECT 1 FROM pg_constraint con WHERE con.conindid = idx.indexrelid
    )
  ORDER BY i.relname
`)

const sequences = await load(`
  SELECT n.nspname AS schema_name, c.relname AS sequence_name
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname IN ('public')
    AND c.relkind = 'S'
  ORDER BY n.nspname, c.relname
`)

const functions = await load(`
  SELECT n.nspname || '.' || p.proname AS name,
         pg_get_functiondef(p.oid) AS def
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname IN ('public', 'private')
    AND p.prokind = 'f'
  ORDER BY n.nspname, p.proname
`)

const triggers = await load(`
  SELECT c.relname AS table_name, tg.tgname,
         pg_get_triggerdef(tg.oid, true) AS def
  FROM pg_trigger tg
  JOIN pg_class c ON c.oid = tg.tgrelid
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND NOT tg.tgisinternal
  ORDER BY c.relname, tg.tgname
`)

const eventTriggers = await load(`
  SELECT evtname, evtevent, p.proname AS function_name
  FROM pg_event_trigger
  JOIN pg_proc p ON p.oid = evtfoid
  ORDER BY evtname
`)

const rlsTables = await load(`
  SELECT c.relname AS table_name, c.relrowsecurity AS rls
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public'
    AND c.relkind = 'r'
    AND c.relrowsecurity
  ORDER BY c.relname
`)

const policies = await load(`
  SELECT tablename, policyname, cmd, qual, with_check, roles::text AS roles
  FROM pg_policies
  WHERE schemaname = 'public'
  ORDER BY tablename, policyname
`)

const out = []
out.push('-- ============================================================')
out.push('-- 0001_base_schema.sql — recréé par scripts/dump-schema.mjs')
out.push('-- Snapshoot du schéma complet (sans les données) à la date du jour.')
out.push('-- Ordre : types → tables → contraintes → index → fonctions →')
out.push('-- triggers → RLS/politiques. Reproduit un environnement à l’identique.')
out.push('-- ============================================================')
out.push('')
out.push('SET search_path = public;')
out.push('')
out.push('BEGIN;')
  // Les corps de fonctions peuvent se référencer mutuellement (sans ordre topologique) :
  // on diffère la validation à la création, les flags sont résolus à l'exécution.
  out.push('SET check_function_bodies = off;')
out.push('')

for (const t of enums) {
  out.push(`CREATE TYPE ${t.schema_name}.${t.type_name} AS ENUM (${t.labels.map((l) => `'${l.replaceAll("'", "''")}'`).join(', ')});`)
}
if (enums.length) out.push('')

for (const s of sequences) {
  out.push(`CREATE SEQUENCE IF NOT EXISTS ${s.schema_name}.${s.sequence_name};`)
}
if (sequences.length) out.push('')

const colsByTable = new Map()
for (const c of columns) {
  if (!colsByTable.has(c.table_name)) colsByTable.set(c.table_name, [])
  colsByTable.get(c.table_name).push(c)
}

for (const t of tables) {
  const cols = colsByTable.get(t.table_name) ?? []
  const lines = cols.map((c) => {
    let def = `  ${c.column_name} ${c.data_type}`
    if (c.identity === 'a') def += ' GENERATED ALWAYS AS IDENTITY'
    else if (c.identity === 'd') def += ' GENERATED BY DEFAULT AS IDENTITY'
    if (c.default_expr) def += ` DEFAULT ${c.default_expr}`
    if (c.not_null) def += ' NOT NULL'
    return def
  })
  out.push(`CREATE TABLE ${t.schema_name}.${t.table_name} (`)
  out.push(lines.join(',\n'))
  out.push(');')
  out.push('')
}

// Les clés référentielles exigent que toutes les PK/unique existent déjà :
// deux passes globales — 1) PK/unique de toutes les tables, 2) FK/check.
const emitConstraintPass = (contypePredicate) => {
  const cons = constraints
    .filter((c) => contypePredicate(c.contype))
    .sort((a, b) => (a.table_name < b.table_name ? -1 : a.table_name > b.table_name ? 1 : 0))
  if (!cons.length) return
  for (const c of cons) {
    out.push(`ALTER TABLE public.${c.table_name} ADD CONSTRAINT ${c.conname} ${c.def};`)
  }
  out.push('')
}
emitConstraintPass((t) => t === 'p' || t === 'u')
emitConstraintPass((t) => t === 'f' || t === 'c')

for (const i of indexes) out.push(`${i.def};`)
if (indexes.length) out.push('')

out.push('CREATE SCHEMA IF NOT EXISTS private;')
out.push('')

for (const f of functions) {
  out.push(`${f.def.trimEnd()};`)
  out.push('')
}

for (const t of triggers) {
  out.push(`${t.def.trimEnd()};`)
  out.push('')
}

const funcByName = new Map(functions.map((f) => [f.name.split('.').pop(), f.name]))
for (const et of eventTriggers) {
  // Nos event triggers seulement (ceux dont la fonction est dans notre base).
  if (!et.function_name.startsWith('public.') && !funcByName.has(et.function_name)) continue
  const fn = funcByName.get(et.function_name) ?? et.function_name
  out.push(`DO $$ BEGIN`)
  out.push(`  IF NOT EXISTS (SELECT 1 FROM pg_event_trigger WHERE evtname = '${et.evtname}') THEN`)
  out.push(`    CREATE EVENT TRIGGER ${et.evtname} ON ${et.evtevent} EXECUTE FUNCTION ${fn}();`)
  out.push(`  END IF;`)
  out.push(`END $$;`)
}
if (eventTriggers.length) out.push('')

const policiesByTable = new Map()
for (const p of policies) {
  if (!policiesByTable.has(p.tablename)) policiesByTable.set(p.tablename, [])
  policiesByTable.get(p.tablename).push(p)
}

for (const t of rlsTables) {
  out.push(`ALTER TABLE public.${t.table_name} ENABLE ROW LEVEL SECURITY;`)
  for (const p of policiesByTable.get(t.table_name) ?? []) {
    const cmd = p.cmd === 'SELECT' || p.cmd === 'INSERT' || p.cmd === 'UPDATE' || p.cmd === 'DELETE' ? p.cmd : 'ALL'
    const roles = p.roles
      .replace(/^{|}$/g, '')
      .split(',')
      .map((r) => r.trim())
      .join(', ')
    const using = p.qual
    const check = p.with_check
    out.push(`CREATE POLICY ${p.policyname} ON public.${p.tablename}`)
    out.push(`  FOR ${cmd} TO ${roles}`)
    if (using) out.push(`  USING (${using})`)
    if (check) out.push(`  WITH CHECK (${check});`)
    if (!check) out.push(';')
  }
  out.push('')
}

out.push('COMMIT;')
out.push('')

const dir = new URL('../supabase/migrations/', import.meta.url)
const path = new URL('0001_base_schema.sql', dir).pathname.replace(/^\/([A-Za-z]):\//, '$1:/')
await writeFile(path, `${out.join('\n')}\n`, 'utf8')

console.log(
  `OK -> supabase/migrations/0001_base_schema.sql\n` +
    `  enums=${enums.length} tables=${tables.length} contraintes=${constraints.length} index=${indexes.length}\n` +
    `  sequences=${sequences.length} fonctions=${functions.length} triggers=${triggers.length}\n` +
    `  event_triggers=${eventTriggers.length} rls_tables=${rlsTables.length} politiques=${policies.length}`,
)