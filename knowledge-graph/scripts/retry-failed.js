/**
 * retry-failed.js
 *
 * Retries thinkers that failed or were corrupted during the initial seed.
 * Uses a simplified SPARQL query without reverse influence lookup.
 */

import { writeFileSync, readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const GRAPH_ROOT = join(__dirname, "..");

const SPARQL_ENDPOINT = "https://query.wikidata.org/sparql";

const RETRIES = {
  // Originally failed (large result sets)
  "bertrand-russell":    { qid: "Q33760",  ring: "primary" },
  "noam-chomsky":        { qid: "Q9049",   ring: "primary" },
  "b-r-ambedkar":        { qid: "Q231690", ring: "extended" },
  "friedrich-nietzsche":  { qid: "Q9358",   ring: "extended" },
  "fyodor-dostoevsky":   { qid: "Q991",    ring: "adversary" },
  "thomas-aquinas":      { qid: "Q9438",   ring: "adversary" },
  // Corrupted by cartesian product label mixing
  "christopher-hitchens":  { qid: "Q164963", ring: "primary" },
  "epicurus":              { qid: "Q44532",  ring: "primary" },
  "harriet-taylor-mill":   { qid: "Q234944", ring: "primary" },
  "james-baldwin":         { qid: "Q228553", ring: "primary" },
  "isaiah-berlin":         { qid: "Q83443",  ring: "adversary" },
  "thomas-hobbes":         { qid: "Q37221",  ring: "adversary" },
  "edmund-burke":          { qid: "Q165257", ring: "adversary" },
  "democritus":            { qid: "Q41234",  ring: "extended" },
  "diogenes-of-sinope":    { qid: "Q58858",  ring: "extended" },
  "lucretius":             { qid: "Q53854",  ring: "extended" },
  "frantz-fanon":          { qid: "Q193458", ring: "extended" },
  "hypatia":               { qid: "Q170572", ring: "extended" },
  "mary-wollstonecraft":   { qid: "Q230673", ring: "extended" },
};

const QID_TO_SLUG = {
  "Q913": "socrates", "Q44532": "epicurus", "Q37160": "david-hume",
  "Q9068": "voltaire", "Q126462": "thomas-paine", "Q50020": "john-stuart-mill",
  "Q234944": "harriet-taylor-mill", "Q215562": "frederick-douglass",
  "Q3335": "george-orwell", "Q33760": "bertrand-russell",
  "Q228553": "james-baldwin", "Q7197": "simone-de-beauvoir",
  "Q164963": "christopher-hitchens", "Q44306": "salman-rushdie",
  "Q9049": "noam-chomsky", "Q170572": "hypatia", "Q53854": "lucretius",
  "Q41234": "democritus", "Q58858": "diogenes-of-sinope", "Q47739": "zhuangzi",
  "Q4604": "confucius", "Q39837": "averroes", "Q169234": "al-razi",
  "Q277073": "al-maarri", "Q8011": "ibn-sina", "Q41568": "montaigne",
  "Q35802": "baruch-spinoza", "Q206972": "olympe-de-gouges",
  "Q230673": "mary-wollstonecraft", "Q448": "diderot", "Q231690": "b-r-ambedkar",
  "Q105180": "sojourner-truth", "Q9358": "friedrich-nietzsche",
  "Q30875": "oscar-wilde", "Q7245": "mark-twain", "Q9061": "karl-marx",
  "Q79969": "emma-goldman", "Q94889": "pandita-ramabai", "Q34670": "albert-camus",
  "Q439204": "h-l-mencken", "Q23114": "lu-xun", "Q188093": "langston-hughes",
  "Q157309": "simone-weil", "Q193458": "frantz-fanon", "Q463319": "audre-lorde",
  "Q36233": "vaclav-havel", "Q41488": "wole-soyinka", "Q208468": "taslima-nasreen",
  "Q307": "galileo-galilei", "Q1035": "charles-darwin", "Q100948": "rachel-carson",
  "Q410": "carl-sagan", "Q7186": "marie-curie", "Q160115": "ai-weiwei",
  "Q32732": "malala-yousafzai", "Q464924": "maryam-namazie",
  "Q15452495": "ta-nehisi-coates", "Q33391": "leon-trotsky",
  "Q37221": "thomas-hobbes", "Q165257": "edmund-burke", "Q991": "fyodor-dostoevsky",
  "Q9438": "thomas-aquinas", "Q8018": "augustine-of-hippo",
  "Q6512": "soren-kierkegaard", "Q9546": "al-ghazali", "Q77148": "carl-schmitt",
  "Q310178": "alasdair-macintyre", "Q358561": "reinhold-niebuhr",
  "Q83443": "isaiah-berlin", "Q41683": "thucydides", "Q140694": "alexis-de-tocqueville",
  "Q381044": "michael-sandel", "Q240851": "gayatri-spivak", "Q201538": "edward-said",
};

function buildQuery(qid) {
  return `
SELECT ?person ?personLabel ?birth ?death ?birthPlaceLabel
  ?occupationLabel ?movementLabel ?notableWorkLabel ?notableWork
  ?influencedByLabel ?influencedBy
WHERE {
  VALUES ?person { wd:${qid} }
  OPTIONAL { ?person wdt:P569 ?birth. }
  OPTIONAL { ?person wdt:P570 ?death. }
  OPTIONAL { ?person wdt:P19 ?birthPlace. }
  OPTIONAL { ?person wdt:P106 ?occupation. }
  OPTIONAL { ?person wdt:P135 ?movement. }
  OPTIONAL { ?person wdt:P800 ?notableWork. }
  OPTIONAL { ?person wdt:P737 ?influencedBy. }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}`;
}

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
  console.log(`GRAPH_ROOT: ${GRAPH_ROOT}`);

  for (const [slug, { qid, ring }] of Object.entries(RETRIES)) {
    const outPath = join(GRAPH_ROOT, "thinkers", ring, `${slug}.yaml`);
    process.stdout.write(`  ${slug} (${qid}) -> ${outPath} ...`);

    try {
      const sparql = buildQuery(qid);
      const url = `${SPARQL_ENDPOINT}?query=${encodeURIComponent(sparql)}`;
      const res = await fetch(url, {
        headers: {
          Accept: "application/sparql-results+json",
          "User-Agent": "ContrariamMindBot/1.0",
        },
      });
      const data = await res.json();
      const bindings = data?.results?.bindings || [];
      const first = bindings[0] || {};

      const name = first.personLabel?.value || slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      const birthDate = first.birth?.value || "";
      const deathDate = first.death?.value || "";
      const birthYear = birthDate ? parseInt(birthDate.substring(0, 5)) : null;
      const deathYear = deathDate ? parseInt(deathDate.substring(0, 5)) : null;
      const birthPlace = first.birthPlaceLabel?.value || "";

      const occupations = new Set();
      const movements = new Set();
      const works = new Map();
      const influencedBySet = new Map();

      for (const row of bindings) {
        if (row.occupationLabel?.value) occupations.add(row.occupationLabel.value);
        if (row.movementLabel?.value) movements.add(row.movementLabel.value);
        if (row.notableWorkLabel?.value && row.notableWork?.value) {
          const wqid = row.notableWork.value.split("/").pop();
          works.set(wqid, row.notableWorkLabel.value);
        }
        if (row.influencedByLabel?.value && row.influencedBy?.value) {
          const ibQid = row.influencedBy.value.split("/").pop();
          if (QID_TO_SLUG[ibQid]) {
            influencedBySet.set(ibQid, QID_TO_SLUG[ibQid]);
          }
        }
      }

      const thinkerData = {
        name,
        birthYear,
        deathYear,
        birthPlace,
        occupations: [...occupations],
        movements: [...movements],
        works: [...works.entries()].map(([wqid, title]) => ({ qid: wqid, title })),
        influencedBy: [...influencedBySet.values()],
      };

      const yaml = generateYaml(slug, qid, ring, thinkerData);
      writeFileSync(outPath, yaml);

      // Verify the write
      const verify = readFileSync(outPath, "utf8");
      const writtenName = verify.split("\n")[1];
      console.log(` ok (${occupations.size} occ, ${works.size} works) — ${writtenName}`);
    } catch (err) {
      console.log(` FAILED: ${err.message}`);
    }
    await new Promise((r) => setTimeout(r, 1500));
  }
  console.log("\nRetry complete.");
}

main();
