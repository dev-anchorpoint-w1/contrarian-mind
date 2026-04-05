/**
 * seed-wikidata.js
 *
 * Queries Wikidata SPARQL endpoint for each thinker in The Contrarian Mind's
 * lineage. Outputs skeleton YAML files to /knowledge-graph/thinkers/.
 *
 * Usage: node knowledge-graph/scripts/seed-wikidata.js
 *
 * Rate limited: 1 request per second to respect Wikidata's API.
 */

import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const GRAPH_ROOT = join(__dirname, "..");

const SPARQL_ENDPOINT = "https://query.wikidata.org/sparql";

// ── Complete thinker registry with verified Wikidata Q-IDs ──

const THINKERS = {
  // Primary lineage (Ring 3)
  "socrates":              { qid: "Q913",       ring: "primary" },
  "epicurus":              { qid: "Q43216",     ring: "primary" },
  "david-hume":            { qid: "Q37160",     ring: "primary" },
  "voltaire":              { qid: "Q9068",      ring: "primary" },
  "thomas-paine":          { qid: "Q126462",    ring: "primary" },
  "john-stuart-mill":      { qid: "Q50020",     ring: "primary" },
  "harriet-taylor-mill":   { qid: "Q240782",    ring: "primary" },
  "frederick-douglass":    { qid: "Q215562",    ring: "primary" },
  "george-orwell":         { qid: "Q3335",      ring: "primary" },
  "bertrand-russell":      { qid: "Q33760",     ring: "primary" },
  "james-baldwin":         { qid: "Q273210",    ring: "primary" },
  "simone-de-beauvoir":    { qid: "Q7197",      ring: "primary" },
  "christopher-hitchens":  { qid: "Q49081",     ring: "primary" },
  "salman-rushdie":        { qid: "Q44306",     ring: "primary" },
  "noam-chomsky":          { qid: "Q9049",      ring: "primary" },

  // Extended lineage (Ring 4)
  "hypatia":               { qid: "Q11903",     ring: "extended" },
  "lucretius":             { qid: "Q47154",     ring: "extended" },
  "democritus":            { qid: "Q41980",     ring: "extended" },
  "diogenes-of-sinope":    { qid: "Q59180",     ring: "extended" },
  "zhuangzi":              { qid: "Q47739",     ring: "extended" },
  "confucius":             { qid: "Q4604",      ring: "extended" },
  "averroes":              { qid: "Q39837",     ring: "extended" },
  "al-razi":               { qid: "Q169234",    ring: "extended" },
  "al-maarri":             { qid: "Q277073",    ring: "extended" },
  "ibn-sina":              { qid: "Q8011",      ring: "extended" },
  "montaigne":             { qid: "Q41568",     ring: "extended" },
  "baruch-spinoza":        { qid: "Q35802",     ring: "extended" },
  "olympe-de-gouges":      { qid: "Q206972",    ring: "extended" },
  "mary-wollstonecraft":   { qid: "Q101638",    ring: "extended" },
  "diderot":               { qid: "Q448",       ring: "extended" },
  "b-r-ambedkar":          { qid: "Q231690",    ring: "extended" },
  "sojourner-truth":       { qid: "Q105180",    ring: "extended" },
  "friedrich-nietzsche":   { qid: "Q9358",      ring: "extended" },
  "oscar-wilde":           { qid: "Q30875",     ring: "extended" },
  "mark-twain":            { qid: "Q7245",      ring: "extended" },
  "karl-marx":             { qid: "Q9061",      ring: "extended" },
  "emma-goldman":          { qid: "Q79969",     ring: "extended" },
  "pandita-ramabai":       { qid: "Q94889",     ring: "extended" },
  "albert-camus":          { qid: "Q34670",     ring: "extended" },
  "h-l-mencken":           { qid: "Q439204",    ring: "extended" },
  "lu-xun":                { qid: "Q23114",     ring: "extended" },
  "langston-hughes":       { qid: "Q188093",    ring: "extended" },
  "simone-weil":           { qid: "Q157309",    ring: "extended" },
  "frantz-fanon":          { qid: "Q193670",    ring: "extended" },
  "audre-lorde":           { qid: "Q463319",    ring: "extended" },
  "vaclav-havel":          { qid: "Q36233",     ring: "extended" },
  "wole-soyinka":          { qid: "Q41488",     ring: "extended" },
  "taslima-nasreen":       { qid: "Q208468",    ring: "extended" },
  "galileo-galilei":       { qid: "Q307",       ring: "extended" },
  "charles-darwin":        { qid: "Q1035",      ring: "extended" },
  "rachel-carson":         { qid: "Q100948",    ring: "extended" },
  "carl-sagan":            { qid: "Q410",       ring: "extended" },
  "marie-curie":           { qid: "Q7186",      ring: "extended" },
  "ai-weiwei":             { qid: "Q160115",    ring: "extended" },
  "malala-yousafzai":      { qid: "Q32732",     ring: "extended" },
  "maryam-namazie":        { qid: "Q464924",    ring: "extended" },
  "ta-nehisi-coates":      { qid: "Q15452495",  ring: "extended" },
  "leon-trotsky":          { qid: "Q33391",     ring: "extended" },

  // Adversary tradition
  "thomas-hobbes":         { qid: "Q37621",     ring: "adversary" },
  "edmund-burke":          { qid: "Q165792",    ring: "adversary" },
  "fyodor-dostoevsky":     { qid: "Q991",       ring: "adversary" },
  "thomas-aquinas":        { qid: "Q9438",      ring: "adversary" },
  "augustine-of-hippo":    { qid: "Q8018",      ring: "adversary" },
  "soren-kierkegaard":     { qid: "Q6512",      ring: "adversary" },
  "al-ghazali":            { qid: "Q9546",      ring: "adversary" },
  "carl-schmitt":          { qid: "Q77148",     ring: "adversary" },
  "alasdair-macintyre":    { qid: "Q310178",    ring: "adversary" },
  "reinhold-niebuhr":      { qid: "Q358561",    ring: "adversary" },
  "isaiah-berlin":         { qid: "Q205162",    ring: "adversary" },
  "thucydides":            { qid: "Q41683",     ring: "adversary" },
  "alexis-de-tocqueville": { qid: "Q140694",    ring: "adversary" },
  "michael-sandel":        { qid: "Q381044",    ring: "adversary" },
  "gayatri-spivak":        { qid: "Q240851",    ring: "adversary" },
  "edward-said":           { qid: "Q201538",    ring: "adversary" },
};

// ── Build a reverse lookup: Q-ID → slug ──

const QID_TO_SLUG = {};
for (const [slug, { qid }] of Object.entries(THINKERS)) {
  QID_TO_SLUG[qid] = slug;
}

// ── SPARQL query builder ──

function buildQuery(qid) {
  return `
SELECT ?person ?personLabel ?birth ?death ?birthPlaceLabel
  ?occupationLabel ?movementLabel ?notableWorkLabel ?notableWork
  ?influencedByLabel ?influencedBy ?influencedLabel ?influenced
WHERE {
  VALUES ?person { wd:${qid} }

  OPTIONAL { ?person wdt:P569 ?birth. }
  OPTIONAL { ?person wdt:P570 ?death. }
  OPTIONAL { ?person wdt:P19 ?birthPlace. }
  OPTIONAL { ?person wdt:P106 ?occupation. }
  OPTIONAL { ?person wdt:P135 ?movement. }
  OPTIONAL { ?person wdt:P800 ?notableWork. }
  OPTIONAL { ?person wdt:P737 ?influencedBy. }
  OPTIONAL { ?influencedPerson wdt:P737 ?person.
             BIND(?influencedPerson AS ?influenced). }

  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}`;
}

// ── Query Wikidata ──

async function queryWikidata(sparql) {
  const url = `${SPARQL_ENDPOINT}?query=${encodeURIComponent(sparql)}`;
  const res = await fetch(url, {
    headers: {
      Accept: "application/sparql-results+json",
      "User-Agent": "ContrariamMindBot/1.0 (knowledge-graph seed)",
    },
  });
  if (!res.ok) {
    throw new Error(`SPARQL query failed: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

// ── Parse SPARQL results into structured data ──

function parseResults(bindings, slug) {
  if (bindings.length === 0) return null;

  const first = bindings[0];
  const name = first.personLabel?.value || slug;

  // Extract year from datetime
  const birthDate = first.birth?.value || "";
  const deathDate = first.death?.value || "";
  const birthYear = birthDate ? parseInt(birthDate.substring(0, 5)) : null;
  const deathYear = deathDate ? parseInt(deathDate.substring(0, 5)) : null;
  const birthPlace = first.birthPlaceLabel?.value || "";

  // Aggregate multi-valued fields (deduplicate)
  const occupations = new Set();
  const movements = new Set();
  const works = new Map(); // notableWork QID -> label
  const influencedBy = new Map(); // QID -> label
  const influences = new Map(); // QID -> label

  for (const row of bindings) {
    if (row.occupationLabel?.value) occupations.add(row.occupationLabel.value);
    if (row.movementLabel?.value) movements.add(row.movementLabel.value);
    if (row.notableWorkLabel?.value && row.notableWork?.value) {
      const workQid = row.notableWork.value.split("/").pop();
      works.set(workQid, row.notableWorkLabel.value);
    }
    if (row.influencedByLabel?.value && row.influencedBy?.value) {
      const ibQid = row.influencedBy.value.split("/").pop();
      influencedBy.set(ibQid, row.influencedByLabel.value);
    }
    if (row.influencedLabel?.value && row.influenced?.value) {
      const infQid = row.influenced.value.split("/").pop();
      influences.set(infQid, row.influencedLabel.value);
    }
  }

  return {
    name,
    birthYear,
    deathYear,
    birthPlace,
    occupations: [...occupations],
    movements: [...movements],
    works: [...works.entries()].map(([qid, title]) => ({ qid, title })),
    influencedBy: [...influencedBy.entries()].map(([qid, label]) => ({
      qid,
      label,
      slug: QID_TO_SLUG[qid] || null,
    })),
    influences: [...influences.entries()].map(([qid, label]) => ({
      qid,
      label,
      slug: QID_TO_SLUG[qid] || null,
    })),
  };
}

// ── Generate YAML ──

function yamlEscape(str) {
  if (!str) return '""';
  if (str.includes(":") || str.includes("#") || str.includes('"') || str.includes("'") || str.startsWith("-") || str.startsWith("{") || str.startsWith("[")) {
    return `"${str.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
  }
  return str;
}

function generateYaml(slug, qid, ring, data) {
  const lines = [];

  lines.push(`id: ${slug}`);
  lines.push(`name: ${yamlEscape(data.name)}`);
  lines.push(`wikidata: ${qid}`);

  const life = data.birthYear
    ? `${Math.abs(data.birthYear)}${data.birthYear < 0 ? " BCE" : ""}${data.deathYear ? "–" + Math.abs(data.deathYear) + (data.deathYear < 0 ? " BCE" : "") : ""}`
    : "unknown";
  lines.push(`life: ${yamlEscape(life)}`);
  lines.push(`ring: ${ring}`);
  lines.push("");

  // From Wikidata
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

  // Influence relationships — only include thinkers in our graph
  lines.push("");
  lines.push("influenced_by:");
  const ibInGraph = data.influencedBy.filter((ib) => ib.slug);
  if (ibInGraph.length > 0) {
    for (const ib of ibInGraph) {
      lines.push(`  - id: ${ib.slug}`);
      lines.push(`    nature: ""`);
    }
  } else {
    lines.push("  []");
  }

  lines.push("");
  lines.push("influences:");
  const infInGraph = data.influences.filter((inf) => inf.slug);
  if (infInGraph.length > 0) {
    for (const inf of infInGraph) {
      lines.push(`  - id: ${inf.slug}`);
      lines.push(`    nature: ""`);
    }
  } else {
    lines.push("  []");
  }

  // Key works
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

  // Empty fields for Phase 2 enrichment
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

// ── Main ──

async function main() {
  const entries = Object.entries(THINKERS);
  console.log(`Seeding ${entries.length} thinkers from Wikidata...\n`);

  let success = 0;
  let sparse = 0;
  let failed = 0;

  for (const [slug, { qid, ring }] of entries) {
    const dir = join(GRAPH_ROOT, "thinkers", ring);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

    process.stdout.write(`  ${slug} (${qid})...`);

    try {
      const sparql = buildQuery(qid);
      const result = await queryWikidata(sparql);
      const bindings = result?.results?.bindings || [];
      const data = parseResults(bindings, slug);

      if (!data) {
        // No results — write a minimal skeleton
        const minimal = {
          name: slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
          birthYear: null,
          deathYear: null,
          birthPlace: "",
          occupations: [],
          movements: [],
          works: [],
          influencedBy: [],
          influences: [],
        };
        const yaml = generateYaml(slug, qid, ring, minimal);
        writeFileSync(join(dir, `${slug}.yaml`), yaml);
        console.log(" sparse (no Wikidata results)");
        sparse++;
      } else {
        const yaml = generateYaml(slug, qid, ring, data);
        writeFileSync(join(dir, `${slug}.yaml`), yaml);
        const stats = `${data.occupations.length} occ, ${data.works.length} works, ${data.influencedBy.filter((i) => i.slug).length} in-edges, ${data.influences.filter((i) => i.slug).length} out-edges`;
        console.log(` ok (${stats})`);
        success++;
      }
    } catch (err) {
      console.log(` FAILED: ${err.message}`);
      // Write minimal file anyway so we have a skeleton
      const minimal = {
        name: slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        birthYear: null,
        deathYear: null,
        birthPlace: "",
        occupations: [],
        movements: [],
        works: [],
        influencedBy: [],
        influences: [],
      };
      const yaml = generateYaml(slug, qid, ring, minimal);
      const dir = join(GRAPH_ROOT, "thinkers", ring);
      writeFileSync(join(dir, `${slug}.yaml`), yaml);
      failed++;
    }

    // Rate limit: 1 request per second
    await new Promise((r) => setTimeout(r, 1100));
  }

  console.log(`\nDone. ${success} populated, ${sparse} sparse, ${failed} failed.`);
  console.log(`Total YAML files: ${success + sparse + failed}`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
