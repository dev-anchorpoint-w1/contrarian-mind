/**
 * fix-corrupted.js
 *
 * Fixes thinkers whose SPARQL results had corrupted labels.
 * Uses the Wikidata REST API (wbgetentities) which is reliable.
 */

import { writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const GRAPH_ROOT = join(__dirname, "..");

const API_BASE = "https://www.wikidata.org/w/api.php";

const QID_TO_SLUG = {
  "Q913": "socrates", "Q43216": "epicurus", "Q37160": "david-hume",
  "Q9068": "voltaire", "Q126462": "thomas-paine", "Q50020": "john-stuart-mill",
  "Q240782": "harriet-taylor-mill", "Q215562": "frederick-douglass",
  "Q3335": "george-orwell", "Q33760": "bertrand-russell",
  "Q273210": "james-baldwin", "Q7197": "simone-de-beauvoir",
  "Q49081": "christopher-hitchens", "Q44306": "salman-rushdie",
  "Q9049": "noam-chomsky", "Q11903": "hypatia", "Q47154": "lucretius",
  "Q41980": "democritus", "Q59180": "diogenes-of-sinope", "Q47739": "zhuangzi",
  "Q4604": "confucius", "Q39837": "averroes", "Q169234": "al-razi",
  "Q277073": "al-maarri", "Q8011": "ibn-sina", "Q41568": "montaigne",
  "Q35802": "baruch-spinoza", "Q206972": "olympe-de-gouges",
  "Q101638": "mary-wollstonecraft", "Q448": "diderot", "Q231690": "b-r-ambedkar",
  "Q105180": "sojourner-truth", "Q9358": "friedrich-nietzsche",
  "Q30875": "oscar-wilde", "Q7245": "mark-twain", "Q9061": "karl-marx",
  "Q79969": "emma-goldman", "Q94889": "pandita-ramabai", "Q34670": "albert-camus",
  "Q439204": "h-l-mencken", "Q23114": "lu-xun", "Q188093": "langston-hughes",
  "Q157309": "simone-weil", "Q193670": "frantz-fanon", "Q463319": "audre-lorde",
  "Q36233": "vaclav-havel", "Q41488": "wole-soyinka", "Q208468": "taslima-nasreen",
  "Q307": "galileo-galilei", "Q1035": "charles-darwin", "Q100948": "rachel-carson",
  "Q410": "carl-sagan", "Q7186": "marie-curie", "Q160115": "ai-weiwei",
  "Q32732": "malala-yousafzai", "Q464924": "maryam-namazie",
  "Q15452495": "ta-nehisi-coates", "Q33391": "leon-trotsky",
  "Q37621": "thomas-hobbes", "Q165792": "edmund-burke", "Q991": "fyodor-dostoevsky",
  "Q9438": "thomas-aquinas", "Q8018": "augustine-of-hippo",
  "Q6512": "soren-kierkegaard", "Q9546": "al-ghazali", "Q77148": "carl-schmitt",
  "Q310178": "alasdair-macintyre", "Q358561": "reinhold-niebuhr",
  "Q205162": "isaiah-berlin", "Q41683": "thucydides", "Q140694": "alexis-de-tocqueville",
  "Q381044": "michael-sandel", "Q240851": "gayatri-spivak", "Q201538": "edward-said",
};

// Correct Q-IDs (spec-provided ones were wrong for these 13)
const CORRUPTED = {
  "christopher-hitchens":  { qid: "Q49081",  ring: "primary" },
  "epicurus":              { qid: "Q43216",  ring: "primary" },
  "harriet-taylor-mill":   { qid: "Q240782", ring: "primary" },
  "james-baldwin":         { qid: "Q273210", ring: "primary" },
  "isaiah-berlin":         { qid: "Q205162", ring: "adversary" },
  "thomas-hobbes":         { qid: "Q37621",  ring: "adversary" },
  "edmund-burke":          { qid: "Q165792", ring: "adversary" },
  "democritus":            { qid: "Q41980",  ring: "extended" },
  "diogenes-of-sinope":    { qid: "Q59180",  ring: "extended" },
  "lucretius":             { qid: "Q47154",  ring: "extended" },
  "frantz-fanon":          { qid: "Q193670", ring: "extended" },
  "hypatia":               { qid: "Q11903",  ring: "extended" },
  "mary-wollstonecraft":   { qid: "Q101638", ring: "extended" },
};

function yamlEscape(str) {
  if (!str) return '""';
  if (str.includes(":") || str.includes("#") || str.includes('"') || str.includes("'") || str.startsWith("-") || str.startsWith("{") || str.startsWith("[")) {
    return `"${str.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
  }
  return str;
}

function getClaimValues(entity, propId) {
  const claims = entity.claims?.[propId] || [];
  return claims
    .map((c) => c.mainsnak?.datavalue?.value)
    .filter(Boolean);
}

function getTimeYear(timeValue) {
  if (!timeValue?.time) return null;
  // Wikidata time format: +YYYY-MM-DDT00:00:00Z or -YYYY-...
  const match = timeValue.time.match(/^([+-]\d+)/);
  if (!match) return null;
  return parseInt(match[1]);
}

async function fetchEntity(qid) {
  const url = `${API_BASE}?action=wbgetentities&ids=${qid}&props=labels|claims&languages=en&format=json`;
  const res = await fetch(url, {
    headers: { "User-Agent": "ContrariamMindBot/1.0" },
  });
  const data = await res.json();
  return data.entities?.[qid];
}

async function resolveLabel(qid) {
  try {
    const entity = await fetchEntity(qid);
    return entity?.labels?.en?.value || qid;
  } catch {
    return qid;
  }
}

async function processEntity(slug, qid, ring) {
  const entity = await fetchEntity(qid);
  if (!entity) return null;

  const name = entity.labels?.en?.value || slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  // Birth/death
  const birthValues = getClaimValues(entity, "P569");
  const deathValues = getClaimValues(entity, "P570");
  const birthYear = birthValues.length > 0 ? getTimeYear(birthValues[0]) : null;
  const deathYear = deathValues.length > 0 ? getTimeYear(deathValues[0]) : null;

  // Birth place
  const birthPlaceValues = getClaimValues(entity, "P19");
  let birthPlace = "";
  if (birthPlaceValues.length > 0 && birthPlaceValues[0].id) {
    birthPlace = await resolveLabel(birthPlaceValues[0].id);
  }

  // Occupations
  const occValues = getClaimValues(entity, "P106");
  const occupations = [];
  for (const occ of occValues.slice(0, 15)) {
    if (occ.id) {
      const label = await resolveLabel(occ.id);
      occupations.push(label);
      await new Promise((r) => setTimeout(r, 100));
    }
  }

  // Movements
  const movValues = getClaimValues(entity, "P135");
  const movements = [];
  for (const mov of movValues.slice(0, 10)) {
    if (mov.id) {
      const label = await resolveLabel(mov.id);
      movements.push(label);
      await new Promise((r) => setTimeout(r, 100));
    }
  }

  // Notable works
  const workValues = getClaimValues(entity, "P800");
  const works = [];
  for (const work of workValues.slice(0, 20)) {
    if (work.id) {
      const label = await resolveLabel(work.id);
      works.push({ qid: work.id, title: label });
      await new Promise((r) => setTimeout(r, 100));
    }
  }

  // Influenced by
  const ibValues = getClaimValues(entity, "P737");
  const influencedBy = [];
  for (const ib of ibValues) {
    if (ib.id && QID_TO_SLUG[ib.id]) {
      influencedBy.push(QID_TO_SLUG[ib.id]);
    }
  }

  return { name, birthYear, deathYear, birthPlace, occupations, movements, works, influencedBy };
}

function generateYaml(slug, qid, ring, data) {
  const lines = [];
  lines.push(`id: ${slug}`);
  lines.push(`name: ${yamlEscape(data.name)}`);
  lines.push(`wikidata: ${qid}`);

  const life = data.birthYear
    ? `${Math.abs(data.birthYear)}${data.birthYear < 0 ? " BCE" : ""}${data.deathYear ? "\u2013" + Math.abs(data.deathYear) + (data.deathYear < 0 ? " BCE" : "") : ""}`
    : "unknown";
  lines.push(`life: ${yamlEscape(life)}`);
  lines.push(`ring: ${ring}`);
  lines.push("");
  lines.push(`birth_year: ${data.birthYear ?? ""}`);
  lines.push(`death_year: ${data.deathYear ?? ""}`);
  lines.push(`birth_place: ${yamlEscape(data.birthPlace)}`);

  lines.push("occupations:");
  if (data.occupations.length > 0) {
    for (const o of data.occupations) lines.push(`  - ${yamlEscape(o)}`);
  } else {
    lines.push("  []");
  }

  lines.push("movements:");
  if (data.movements.length > 0) {
    for (const m of data.movements) lines.push(`  - ${yamlEscape(m)}`);
  } else {
    lines.push("  []");
  }

  lines.push("");
  lines.push("influenced_by:");
  if (data.influencedBy.length > 0) {
    for (const ib of data.influencedBy) {
      lines.push(`  - id: ${ib}`);
      lines.push('    nature: ""');
    }
  } else {
    lines.push("  []");
  }

  lines.push("");
  lines.push("influences:");
  lines.push("  []");

  lines.push("");
  lines.push("key_works:");
  if (data.works.length > 0) {
    for (const w of data.works) {
      lines.push(`  - title: ${yamlEscape(w.title)}`);
      lines.push(`    wikidata: ${w.qid}`);
    }
  } else {
    lines.push("  []");
  }

  lines.push("");
  lines.push("# === FIELDS BELOW ARE EMPTY UNTIL SEP ENRICHMENT (Phase 2) ===");
  lines.push("");
  lines.push('role_in_mind: ""');
  lines.push("");
  lines.push("positions: []");
  lines.push("");
  lines.push("blind_spots: []");
  lines.push("");
  lines.push("relationships: []");
  lines.push("");
  lines.push('reasoning_contribution: ""');

  return lines.join("\n") + "\n";
}

async function main() {
  console.log(`Fixing ${Object.keys(CORRUPTED).length} corrupted thinkers via Wikidata REST API...\n`);

  for (const [slug, { qid, ring }] of Object.entries(CORRUPTED)) {
    const outPath = join(GRAPH_ROOT, "thinkers", ring, `${slug}.yaml`);
    process.stdout.write(`  ${slug} (${qid})...`);

    try {
      const data = await processEntity(slug, qid, ring);
      if (!data) {
        console.log(" no entity found");
        continue;
      }

      const yaml = generateYaml(slug, qid, ring, data);
      writeFileSync(outPath, yaml);
      console.log(` ok — ${data.name} (${data.occupations.length} occ, ${data.works.length} works)`);
    } catch (err) {
      console.log(` FAILED: ${err.message}`);
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  console.log("\nDone.");
}

main();
