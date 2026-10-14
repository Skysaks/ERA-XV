/**
 * Bulk data import for ERA XV: a spreadsheet (CSV, one row per player version) becomes a team module, validated
 * together with the existing dataset before anything is written. Nothing is guessed: a missing value stays missing
 * and the validator says so.
 *
 *   npx tsx scripts/import-teams.ts export <teamId,...> > sample.csv     round-trip an existing team (the template)
 *   npx tsx scripts/import-teams.ts check  <file.csv>                    validate only
 *   npx tsx scripts/import-teams.ts import <file.csv> <module-name>      validate, then write src/data/teams/<module>.ts
 *
 * After an import: add the module to src/data/index.ts, run `npm run check`. Every data change changes DATA_VERSION,
 * so older challenge links are refused as "made on another version" (see src/data/README.md).
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { TEAMS, PLAYER_OF_THE_YEAR, parseTeams, team, type RawTeam, type TeamMeta } from '../src/data/index';
import { CAPTAINS } from '../src/data/captains';
import { validateDataset } from '../src/data/validate';

const TEAM_COLS = ['team_id', 'team_key', 'team_name', 'era', 'year_from', 'year_to', 'kind', 'country', 'comp', 'color', 'titles', 'plan', 'team_conf'] as const;
const PLAYER_COLS = ['player_name', 'positions', 'rating', 'role', 'nat', 'id', 'short', 'conf', 'gk', 'sc', 'lo', 'bd', 'cr', 'df', 'pm', 'kk', 'st', 'pc', 'ae'] as const;
const COLS = [...TEAM_COLS, ...PLAYER_COLS];
const EXTRA = ['id', 'short', 'conf', 'gk', 'sc', 'lo', 'bd', 'cr', 'df', 'pm', 'kk', 'st', 'pc', 'ae'] as const;

function csvParse(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [], cell = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; } else if (c === '"') q = false; else cell += c;
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; row.push(cell); rows.push(row); row = []; cell = ''; }
    else cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  const [head, ...body] = rows.filter((r) => r.some((x) => x.trim()));
  const missing = COLS.filter((c) => !head.includes(c) && (TEAM_COLS as readonly string[]).includes(c) && c !== 'titles' && c !== 'plan' && c !== 'team_conf' && c !== 'color');
  if (missing.length) throw new Error(`missing columns: ${missing.join(', ')}`);
  return body.map((r) => Object.fromEntries(head.map((h, i) => [h.trim(), (r[i] ?? '').trim()])));
}
const csvCell = (v: unknown) => { const s = v === undefined || v === null ? '' : String(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };

export function rowsToRaw(rows: Record<string, string>[]): RawTeam[] {
  const byTeam = new Map<string, Record<string, string>[]>();
  for (const r of rows) {
    if (!r.team_id) throw new Error(`row without team_id: ${JSON.stringify(r).slice(0, 80)}`);
    const list = byTeam.get(r.team_id) ?? [];
    list.push(r); byTeam.set(r.team_id, list);
  }
  const out: RawTeam[] = [];
  for (const [id, rs] of byTeam) {
    const f = rs[0];
    const meta: TeamMeta = {
      id, team: f.team_key, name: f.team_name, era: f.era, years: [Number(f.year_from), Number(f.year_to)], kind: f.kind as TeamMeta['kind'],
      country: f.country, comp: f.comp as TeamMeta['comp'], color: f.color || '#888888',
      titles: f.titles ? f.titles.split(/[;|]/).map((x) => x.trim()).filter(Boolean) : undefined,
      plan: (f.plan || undefined) as TeamMeta['plan'], conf: (f.team_conf || undefined) as TeamMeta['conf'],
    };
    const lines = rs.map((r) => {
      const extras = EXTRA.filter((k) => r[k]).map((k) => (k === 'short' ? `short=${r[k]}` : `${k}=${r[k]}`));
      return `${r.player_name} | ${r.positions} | ${r.rating} | ${r.role} | ${[r.nat, ...extras].filter(Boolean).join(' ')}`;
    });
    out.push(team(meta, `\n${lines.join('\n')}\n`));
  }
  return out;
}

function exportTeams(ids: string[]): string {
  const lines = [COLS.join(',')];
  for (const id of ids) {
    const t = TEAMS.find((x) => x.id === id);
    if (!t) throw new Error(`unknown team-era ${id}`);
    for (const p of t.players) {
      const row: Record<string, unknown> = {
        team_id: t.id, team_key: t.team, team_name: t.name, era: t.era, year_from: t.years[0], year_to: t.years[1], kind: t.kind, country: t.country, comp: t.comp,
        color: t.color, titles: (t.titles ?? []).join(';'), plan: t.plan ?? '', team_conf: t.conf ?? '',
        player_name: p.name, positions: p.pos.join('/'), rating: p.rating, role: p.role, nat: p.nat, id: p.person, conf: p.conf !== (t.conf ?? 'high') ? p.conf : '',
        gk: p.kicker ? p.attrs.goalKick : '',
      };
      lines.push(COLS.map((c) => csvCell(row[c])).join(','));
    }
  }
  return lines.join('\n') + '\n';
}

function moduleSource(raws: RawTeam[], name: string): string {
  const body = raws.map((r) => `  team(${JSON.stringify(r.meta).replace(/"(\w+)":/g, '$1: ').replace(/"/g, "'")}, \`${r.body}\`),`).join('\n');
  return `import { team } from '../schema';\n\n/** Imported with scripts/import-teams.ts (${name}). */\nexport default [\n${body}\n];\n`;
}

function check(raws: RawTeam[]) {
  const incoming = parseTeams(raws); // throws on unreadable lines (bad position, role, rating)
  const clash = incoming.filter((t) => TEAMS.some((x) => x.id === t.id));
  const all = [...TEAMS.filter((x) => !clash.some((c) => c.id === x.id)), ...incoming];
  const rep = validateDataset(all, { captains: CAPTAINS, potyYears: PLAYER_OF_THE_YEAR });
  const mine = (w: { where: string }) => incoming.some((t) => w.where === t.id || w.where.startsWith(`${t.id} ·`)) || incoming.some((t) => t.players.some((p) => p.person === w.where));
  const errors = rep.errors.filter(mine), warnings = rep.warnings.filter(mine);
  console.log(`${incoming.length} team-era(s), ${incoming.reduce((a, t) => a + t.players.length, 0)} versions${clash.length ? ` (replacing ${clash.map((c) => c.id).join(', ')})` : ''}`);
  for (const e of errors) console.log(`ERROR   [${e.code}] ${e.where}: ${e.msg}`);
  for (const w of warnings) console.log(`review  [${w.code}] ${w.where}: ${w.msg}`);
  return errors.length === 0;
}

const [cmd, arg, name] = process.argv.slice(2);
if (cmd === 'export') process.stdout.write(exportTeams((arg ?? '').split(',').filter(Boolean)));
else if (cmd === 'check' || cmd === 'import') {
  if (!arg || !existsSync(arg)) { console.error('usage: import-teams.ts check|import <file.csv> [module]'); process.exit(2); }
  const raws = rowsToRaw(csvParse(readFileSync(arg, 'utf8')));
  let ok = false;
  try { ok = check(raws); } catch (e) { console.log(`ERROR   ${(e as Error).message}`); }
  if (!ok) { console.log('Nothing written.'); process.exit(1); }
  if (cmd === 'import') {
    if (!name || !/^[a-z0-9-]+$/.test(name)) { console.error('module name: lower-case slug'); process.exit(2); }
    const out = `src/data/teams/${name}.ts`;
    if (existsSync(out)) { console.error(`${out} exists: choose another module name`); process.exit(2); }
    writeFileSync(out, moduleSource(raws, name));
    console.log(`Written ${out}. Add it to src/data/index.ts, then run npm run check.`);
  }
} else if (cmd) { console.error(`unknown command ${cmd}`); process.exit(2); }
