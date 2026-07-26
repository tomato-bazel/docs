/**
 * Typed access to src/data/conformance.json, plus the handful of derived views
 * more than one page needs.
 *
 * The types mirror `tomato.gate.v1` (gate/proto/tomato/gate/v1/conformance.proto)
 * in protobufjs's camelCase JSON form. They are hand-written rather than
 * generated: the shape is small and stable, and a codegen step would be a second
 * thing to keep in sync. The descriptor set that ships with the report is the
 * authority — if these disagree, the build shows it as a type error here.
 *
 * NOTHING IN THIS FILE RE-DERIVES A COUNT. `totals` comes from the report, and
 * the module order is the report's own remediation order. Recomputing either
 * would create a second implementation free to disagree with gate-report.
 */
import data from "../data/conformance.json";

export interface Row { cells: string[] }
export interface LiveVersion { version: string; count: number }

export interface Gate {
  id: string;
  code: string;
  title: string;
  family: string;
  moduleScoped: boolean;
  vars: string[];
  rows: Row[];
  sourceUrl: string;
}

export interface Finding { gateId: string; vars: string[]; rows: Row[] }

export interface Module {
  name: string;
  version: string;
  homepage: string;
  integrity: string;
  kind: string;
  findingCount: number;
  findings: Finding[];
  contested: { atom: string; resolvedHere: string; elsewhere: LiveVersion[] }[];
}

export interface Atom {
  name: string;
  declared: boolean;
  bomVersion: string;
  live: LiveVersion[];
  converged: boolean;
}

export interface Totals {
  findings: number;
  gates: number;
  cleanGates: number;
  modules: number;
  dirtyModules: number;
  atoms: number;
  multiVersionAtoms: number;
  declaredAtoms: number;
  pinnedDeclaredAtoms: number;
}

/** Grouped by tools/gen_conformance.mjs; `pairs` is the pre-collapse count. */
export interface SilentUpgrades {
  pairs: number;
  groups: { atom: string; declared: string; got: string; modules: string[] }[];
}

export interface Report {
  generatedAt: string;
  generatedFrom: string;
  totals: Totals;
  gates: Gate[];
  modules: Module[];
  atoms: Atom[];
  bomNotes: { atom: string; note: string }[];
  silentUpgrades: SilentUpgrades;
}

export const report = data as unknown as Report;

/** gate id -> `S4`, for the scoreboard chips and a module's finding headings. */
export const codeFor: Record<string, string> = Object.fromEntries(
  report.gates.map((g) => [g.id, g.code]),
);

export const gateById: Record<string, Gate> = Object.fromEntries(
  report.gates.map((g) => [g.id, g]),
);

export const moduleByName: Record<string, Module> = Object.fromEntries(
  report.modules.map((m) => [m.name, m]),
);

/**
 * How to describe the report's age.
 *
 * A missing `generatedAt` is UNKNOWN, never "now": the field is empty for an
 * unstamped local build, and defaulting it would make a stale report look fresh —
 * the exact failure the field exists to expose. The staleness threshold is 10
 * days against a weekly job, so one skipped run is tolerated and two is not.
 */
const STALE_DAYS = 10;

export function freshness(now: Date = new Date()) {
  const at = report.generatedAt;
  if (!at) return { known: false as const, stale: true, text: "generated locally, unstamped" };
  const then = new Date(at);
  if (Number.isNaN(then.getTime()))
    return { known: false as const, stale: true, text: `unparseable timestamp ${at}` };
  const days = Math.floor((now.getTime() - then.getTime()) / 86_400_000);
  return {
    known: true as const,
    stale: days > STALE_DAYS,
    days,
    iso: at,
    text: then.toISOString().slice(0, 10),
  };
}

/** The registry commit the report describes, as a link when we can make one. */
export function registryLink() {
  const from = report.generatedFrom;
  const m = /^(https:\/\/github\.com\/[^@]+)@([0-9a-f]{7,40})$/.exec(from);
  if (!m) return { href: from || null, label: from || null, sha: null };
  return { href: `${m[1]}/tree/${m[2]}`, label: m[1].replace("https://github.com/", ""), sha: m[2].slice(0, 7) };
}
