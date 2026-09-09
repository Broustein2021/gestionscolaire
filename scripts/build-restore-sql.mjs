import fs from 'node:fs';

const SRC = process.argv[2];
const OUT_DATA = process.argv[3];
const OUT_AUTH = process.argv[4];

const text = fs.readFileSync(SRC, 'utf8');
const lines = text.split('\n');

const OBJ_HEADER = /^-- Name: (.+); Type: (.+); Schema: (.+);/;
const KEEP_SCHEMA = (s) => s === 'public' || s === 'private';

const kindsOrder = [];
const byKind = {};

let current = null;

function flush() {
  if (!current) return;
  if (current.kind === 'DATA') {
    if (current.keep) {
      byKind.DATA.push(current);
      kindsOrder.push(current);
    }
    if (current.schema === 'auth' && (current.table === 'users' || current.table === 'identities')) {
      current.conflict = true;
      byKind.DATA.push(current);
      kindsOrder.push(current);
      byKind.AUTH.push(current);
    }
  } else if (current.kind === 'DDL') {
    if (current.keep) {
      byKind[current.typeKind].push(current);
      kindsOrder.push(current);
    }
  }
  current = null;
}

for (const key of ['TYPE', 'TABLE', 'FUNCTION', 'VIEW', 'OTHER', 'DATA', 'AUTH']) byKind[key] = [];
byKind.AUTH = [];

const DATA_ORDER = [
  'users', 'identities', 'organizations', 'schools', 'academic_years', 'levels',
  'subjects', 'terms', 'fee_categories', 'permissions', 'profiles', 'guardians',
  'teachers', 'classes', 'students', 'fee_structures', 'enrollments',
  'teacher_assignments', 'assessments', 'grades', 'payments', 'receipts',
  'student_guardians', 'role_permissions', 'school_members',
  'school_role_permissions', 'audit_logs',
];
function dataOrder(b) {
  const i = DATA_ORDER.indexOf(b.table);
  return i === -1 ? 1000 : i;
}

function quoteIdent(s) {
  return '"' + String(s).replace(/"/g, '""') + '"';
}

function sqlValue(f) {
  if (f === '\\N') return 'NULL';
  if (f.startsWith('"') && f.endsWith('"')) {
    return "'" + f.slice(1, -1).replace(/""/g, '"').replace(/'/g, "''") + "'";
  }
  return "'" + f.replace(/'/g, "''") + "'";
}

function parseCopyBody(s) {
  const rows = [];
  let row = [];
  let cur = '';
  let quoted = false;
  const pushField = () => { row.push(cur); cur = ''; quoted = false; };
  const pushRow = () => { pushField(); rows.push(row); row = []; };
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (!quoted && cur === '') {
      if (c === '"') { quoted = true; continue; }
      if (c === '\t') { pushField(); continue; }
      if (c === '\n') { pushRow(); continue; }
      cur += c;
      continue;
    }
    if (quoted) {
      if (c === '"') {
        if (s[i + 1] === '"') { cur += '"'; i++; }
        else quoted = false;
      } else {
        cur += c;
      }
      continue;
    }
    if (c === '\t') { pushField(); continue; }
    if (c === '\n') { pushRow(); continue; }
    cur += c;
  }
  if (cur !== '' || row.length) { pushField(); if (row.length) rows.push(row); }
  return rows;
}

function tableTypeKind(name) {
  if (name === 'TYPE' || name === 'DOMAIN') return 'TYPE';
  if (name === 'TABLE') return 'TABLE';
  if (name === 'FUNCTION' || name === 'PROCEDURE' || name === 'AGGREGATE') return 'FUNCTION';
  if (name === 'VIEW' || name === 'MATERIALIZED VIEW') return 'VIEW';
  return 'OTHER';
}

for (let i = 0; i < lines.length; i++) {
  const line = lines[i].replace(/\r$/, '');
  if (line.startsWith('\\') && line !== '\\.') continue;

  const dh = line.match(/^-- Data for Name: (.+); Type: TABLE DATA; Schema: (.+);/);
  if (dh) {
    flush();
    current = { kind: 'DATA', schema: dh[2], keep: KEEP_SCHEMA(dh[2]), table: null, cols: null, body: [] };
    continue;
  }

  if (current && current.kind === 'DATA') {
    if (current.table === null) {
      const m = line.match(/^COPY ([a-zA-Z_][\w.]*)\.([a-zA-Z_][\w]*) \((.*)\) FROM stdin;/);
      if (m) {
        current.schema = m[1].replace(/"/g, '');
        current.table = m[2].replace(/"/g, '');
        current.cols = m[3].split(',').map((c) => c.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));
      }
      continue;
    }
    if (line === '\\.') { flush(); continue; }
    current.body.push(line);
    continue;
  }

  const oh = line.match(OBJ_HEADER);
  if (oh) {
    flush();
    const [ , name, type, schema ] = oh;
    const typeKind = tableTypeKind(type);
    current = {
      kind: 'DDL',
      typeKind,
      keep: KEEP_SCHEMA(schema),
      name,
      type,
      schema,
      lines: [],
    };
    if (current.keep) current.lines.push(line);
    continue;
  }

  if (current && current.kind === 'DDL' && current.keep) {
    current.lines.push(line);
  }
}
flush();

function buildData(block) {
  const table = quoteIdent(block.schema) + '.' + quoteIdent(block.table);
  const cols = block.cols.map(quoteIdent).join(', ');
  const rows = parseCopyBody(block.body.join('\n'));
  if (!rows.length || (rows.length === 1 && rows[0].length === 1 && rows[0][0] === '')) return null;
  const values = rows
    .map((r) => '(' + r.map(sqlValue).join(', ') + ')')
    .join(',\n');
  const tail = block.conflict ? '\nON CONFLICT DO NOTHING;' : ';';
  return `INSERT INTO ${table} (${cols})\nVALUES\n${values}${tail}`;
}

function emit(blocks) {
  const parts = [];
  for (const b of blocks) {
    if (b.kind === 'DATA') {
      const sql = buildData(b);
      if (sql) { parts.push('-- Data pour ' + b.schema + '.' + b.table); parts.push(sql); }
    } else {
      let lines = b.lines.filter((l) => !/^\s*ALTER\s+DEFAULT\s+PRIVILEGES\b/i.test(l));
      if (b.typeKind === 'FUNCTION') {
        lines = lines.map((l) => l.replace(/^CREATE FUNCTION\b/, 'CREATE OR REPLACE FUNCTION'));
      }
      parts.push(lines.join('\n'));
    }
  }
  return parts.join('\n\n');
}

function buildDrops() {
  const drops = [];
  drops.push('CREATE SCHEMA IF NOT EXISTS private;');
  for (const b of byKind.VIEW) drops.push(`DROP VIEW IF EXISTS public.${b.name} CASCADE;`);
  for (const b of byKind.TABLE) drops.push(`DROP TABLE IF EXISTS public.${b.name} CASCADE;`);
  for (const b of byKind.FUNCTION) {
    if (b.schema === 'public' && b.name.indexOf('rls_auto_enable') === 0) continue;
    drops.push(`DROP FUNCTION IF EXISTS ${b.schema}.${b.name} CASCADE;`);
  }
  for (const b of byKind.TYPE) drops.push(`DROP TYPE IF EXISTS public.${b.name} CASCADE;`);
  return drops;
}

const outData = [];
outData.push('-- Restauration Gestion Globale Scolaire : schemas public + private');
outData.push('-- Genere le ' + new Date().toISOString().split('T')[0] + ' depuis le backup cluster Supabase');
outData.push('-- 1) Ouvrir: supabase.com/dashboard -> projet wrqmctnalccnxtvygqzq -> SQL Editor');
outData.push('-- 2) Coller TOUT ce fichier dans une nouvelle requete et cliquer sur Run.');
outData.push('--    Le script est idempotent : il remet a zero puis recharge. Pas d erreur attendue.');
outData.push('');
outData.push('SET check_function_bodies = false;');
outData.push(buildDrops().join('\n'));
outData.push('GRANT USAGE ON SCHEMA private TO anon, authenticated, service_role;');

const ordered = [
  ...byKind.TYPE,
  ...byKind.TABLE,
  ...byKind.FUNCTION,
  ...byKind.VIEW,
  ...byKind.DATA.slice().sort((a, b) => dataOrder(a) - dataOrder(b)),
  ...byKind.OTHER,
];
outData.push(emit(ordered) + '');

fs.writeFileSync(OUT_DATA, outData.join('\n\n'), 'utf8');

const auth = byKind.AUTH;
const users = auth.find((b) => b.table === 'users');
const identities = auth.find((b) => b.table === 'identities');
const authParts = [];
authParts.push('-- Restauration des comptes utilisateurs (auth.users + auth.identities)');
authParts.push('-- OPTIONNEL : les comptes sont deja inclus dans restaurer-donnees.sql.');
authParts.push('-- A executer uniquement si restaurer-donnees.sql ne contient pas les comptes.');
authParts.push('-- Si ce script echoue (colonnes differentes), recreer les comptes via Auth > Users.');
for (const b of [users, identities]) {
  if (!b) continue;
  authParts.push('\n-- Comptes: ' + b.table);
  const table = quoteIdent(b.schema) + '.' + quoteIdent(b.table);
  const cols = b.cols.map(quoteIdent).join(', ');
  const rows = parseCopyBody(b.body.join('\n'));
  if (!rows.length) continue;
  const values = rows
    .map((r) => '(' + r.map(sqlValue).join(', ') + ')')
    .join(',\n');
  authParts.push(`INSERT INTO ${table} (${cols})\nVALUES\n${values}\nON CONFLICT DO NOTHING;`);
}
fs.writeFileSync(OUT_AUTH, authParts.join('\n\n'), 'utf8');

console.log('OK');
console.log('DATA  -> ' + OUT_DATA + ' (' + byKind.TYPE.length + ' types, ' + byKind.TABLE.length + ' tables, ' + byKind.FUNCTION.length + ' fonctions, ' + byKind.VIEW.length + ' vues, ' + byKind.DATA.length + ' lots de donnees, ' + byKind.OTHER.length + ' autres)');
console.log('AUTH  -> ' + OUT_AUTH + ' (' + auth.length + ' lots : ' + auth.map((b) => b.table).join(', ') + ')');