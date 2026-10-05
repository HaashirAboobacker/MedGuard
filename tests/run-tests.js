#!/usr/bin/env node
/**
 * MedGuard test suite - zero dependencies (Node >= 18).
 * Static + logic checks run against src/index.html.
 * Run: node tests/run-tests.js
 */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const file = path.join(__dirname, "..", "src", "index.html");
const html = fs.readFileSync(file, "utf8");
const script = (html.match(/<script>([\s\S]*?)<\/script>/) || [])[1] || "";

let pass = 0, fail = 0;
const results = [];
function test(id, name, fn) {
  try { fn(); pass++; results.push(`PASS  ${id}  ${name}`); }
  catch (e) { fail++; results.push(`FAIL  ${id}  ${name}\n        -> ${e.message}`); }
}
const assert = (c, m) => { if (!c) throw new Error(m || "assertion failed"); };

// ---- Load pure logic + seed data in a sandbox (no DOM needed) ----
function grab(re, label) { const m = script.match(re); assert(m, `could not find ${label}`); return m[0]; }
const mkCode = grab(/const mk = [^\n]*\n[^\n]*/, "mk helper");
const seedCode = mkCode + "\n" + ["MAIN_SEED", "NORTH_SEED", "WEST_SEED"].map(n =>
  grab(new RegExp(`const ${n} = \\[[\\s\\S]*?\\n\\];`), n)).join("\n");
const logicCode = [
  grab(/const RISK_ORDER = [^\n]*/, "RISK_ORDER"),
  grab(/const isVulnerable = [^\n]*/, "isVulnerable"),
  grab(/const needsApproval = [^\n]*/, "needsApproval"),
  grab(/function riskLevel\(a\) \{[\s\S]*?\n\}/, "riskLevel"),
].join("\n");
const ctx = {};
vm.createContext(ctx);
vm.runInContext(seedCode + "\n" + logicCode +
  "\nthis.api={MAIN_SEED,NORTH_SEED,WEST_SEED,isVulnerable,needsApproval,riskLevel};", ctx);
const { MAIN_SEED, NORTH_SEED, WEST_SEED, isVulnerable, needsApproval, riskLevel } = ctx.api;
const allSeeds = [...MAIN_SEED, ...NORTH_SEED, ...WEST_SEED];

// ---- Security / privacy (static) ----
test("SEC-01", "no network calls in app code (fetch/XHR/WebSocket/sendBeacon)", () => {
  assert(!/\b(fetch|XMLHttpRequest|WebSocket|sendBeacon)\b\s*\(/.test(script) &&
         !/new\s+(XMLHttpRequest|WebSocket)/.test(script), "network API found");
});
test("SEC-02", "no API keys / tokens / private keys committed", () => {
  const bad = /(AKIA[0-9A-Z]{16}|AIza[0-9A-Za-z\-_]{35}|sk-[A-Za-z0-9]{20,}|ghp_[A-Za-z0-9]{30,}|-----BEGIN [A-Z ]*PRIVATE KEY-----|xox[bp]-[A-Za-z0-9-]+)/;
  assert(!bad.test(html), "secret-like string found");
});
test("SEC-03", "only demo credentials present (admin123 / doctor123)", () => {
  const pw = [...script.matchAll(/password:\s*"([^"]+)"/g)].map(m => m[1]);
  assert(pw.length > 0 && pw.every(p => ["admin123", "doctor123"].includes(p)), `unexpected password(s): ${pw}`);
});
test("SEC-04", "only RFC1918 private IPs used in seed data (no real public IPs)", () => {
  const ips = allSeeds.map(a => a.ip).filter(Boolean);
  assert(ips.length > 0, "no ips");
  assert(ips.every(ip => /^10\./.test(ip)), "non-10.x IP present");
});
test("SEC-05", "synthetic-data disclosure shown in UI", () => {
  assert(/100% Synthetic Data/.test(html) && /No real hospital systems, medical devices, or patient data/.test(html));
});
test("SEC-06", "user-entered text is HTML-escaped before rendering", () => {
  assert(/function escapeHTML/.test(script) && (script.match(/escapeHTML\(/g) || []).length >= 10);
});
test("SEC-07", "no patient-identifier fields in seed data", () => {
  const banned = ["patient", "mrn", "dob", "ssn", "aadhaar", "phone", "email"];
  const keys = new Set(allSeeds.flatMap(a => Object.keys(a).map(k => k.toLowerCase())));
  assert(banned.every(b => !keys.has(b)), "patient-like field present");
});

// ---- Human-in-the-loop (logic) ----
test("HIL-01", "critical medical devices (pump/ventilator/imaging) require clinical approval", () => {
  for (const subtype of ["Infusion Pump", "Ventilator", "Imaging Machine"]) {
    const a = { category: "medicalDevice", subtype, current: "1.0", target: "2.0" };
    assert(riskLevel(a) === "critical" && needsApproval(a), `${subtype} should need approval`);
  }
});
test("HIL-02", "non-critical assets do not require approval", () => {
  const a = { category: "computer", subtype: "PC", current: "1", target: "2" };
  assert(!needsApproval(a));
});
test("HIL-03", "up-to-date asset is never flagged vulnerable and is low risk", () => {
  const a = { category: "medicalDevice", subtype: "Ventilator", current: "2", target: "2" };
  assert(!isVulnerable(a) && riskLevel(a) === "low");
});
test("HIL-04", "admin patch path blocks approval-gated devices", () => {
  assert(/if \(needsApproval\(a\)\) \{[^}]*require clinical approval/.test(script), "gate missing in patchAsset");
});
test("HIL-05", "only clinical role can approve / reject queue items", () => {
  for (const fn of ["approveFromQueue", "rejectFromQueue", "approveDirect"]) {
    const body = grab(new RegExp(`function ${fn}\\([^)]*\\) \\{[\\s\\S]{0,120}`), fn);
    assert(/if \(!isClinical\(\)\) return;/.test(body), `${fn} lacks role guard`);
  }
});
test("HIL-06", "clinical role cannot trigger the admin patch path", () => {
  const body = grab(/function patchAsset\([^)]*\) \{[\s\S]{0,120}/, "patchAsset");
  assert(/if \(isClinical\(\)\) return;/.test(body));
});
test("AUD-01", "patch, request, reject and add actions are written to the audit log", () => {
  for (const a of ['logEvent("request"', 'logEvent("reject"', 'logEvent("add"']) assert(script.includes(a), `${a} missing`);
  assert(/function logPatch/.test(script) && /approvedBy/.test(script));
});

// ---- Data integrity ----
test("DAT-01", "all seed assets have required fields", () => {
  for (const a of allSeeds)
    for (const f of ["id", "name", "category", "subtype", "department", "location", "current", "target"])
      assert(a[f], `asset ${a.id || "?"} missing ${f}`);
});
test("DAT-02", "asset IDs are unique within each branch", () => {
  for (const [n, seed] of Object.entries({ MAIN_SEED, NORTH_SEED, WEST_SEED })) {
    const ids = seed.map(a => a.id);
    assert(new Set(ids).size === ids.length, `duplicate id in ${n}`);
  }
});
test("DAT-03", "every branch contains at least one vulnerable and one up-to-date asset", () => {
  for (const [n, seed] of Object.entries({ MAIN_SEED, NORTH_SEED, WEST_SEED }))
    assert(seed.some(isVulnerable) && seed.some(a => !isVulnerable(a)), `${n} lacks variety`);
});
test("DAT-04", "categories are within the supported set", () => {
  const ok = new Set(["computer", "database", "medicalDevice", "tablet"]);
  assert(allSeeds.every(a => ok.has(a.category)));
});
test("DAT-05", "duplicate-ID and IP-format validation exist in the add-device form", () => {
  assert(/already exists/.test(script) && /\\d\{1,3\}/.test(script));
});

console.log("\nMedGuard test run\n=================");
results.forEach(r => console.log(r));
console.log(`\n${pass} passed, ${fail} failed, ${pass + fail} total`);
console.log(`Seed assets: MAIN=${MAIN_SEED.length} NORTH=${NORTH_SEED.length} WEST=${WEST_SEED.length}`);
process.exit(fail ? 1 : 0);
