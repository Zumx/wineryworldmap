// Derives a tiny per-country index from the big points.geojson so the
// Next.js build never has to parse the full (potentially 30MB+, 200k+
// feature) dataset — that caused build-worker OOM on large sites.
//
// Output: public/data/countries.json
//   [{ name, slug, count,
//      names:  [up to 300 sample names],
//      places: [up to 500 { name, lat, lon }] }]  (count desc)
//
// `places` powers the per-country SEO landing pages (name + coordinates +
// link to the map). Capped so the index stays tiny on huge datasets.
//
// Used as an npm "prebuild" step and also called directly by
// fetch-data.mjs after a fresh fetch.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export function countrySlug(name) {
  return String(name)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function buildCountryIndex(features) {
  const map = new Map();
  for (const f of features) {
    const c = f.properties && f.properties.country;
    if (!c) continue;
    let e = map.get(c);
    if (!e) {
      e = { name: c, slug: countrySlug(c), count: 0, names: [], places: [] };
      map.set(c, e);
    }
    e.count += 1;
    const nm = f.properties.name;
    if (nm && e.names.length < 300) e.names.push(nm);
    const g = f.geometry && f.geometry.coordinates;
    if (nm && g && e.places.length < 500) {
      const lon = Number(g[0]);
      const lat = Number(g[1]);
      if (Number.isFinite(lat) && Number.isFinite(lon))
        e.places.push({
          name: nm,
          lat: Math.round(lat * 1e5) / 1e5,
          lon: Math.round(lon * 1e5) / 1e5,
        });
    }
  }
  const list = [...map.values()].sort((a, b) => b.count - a.count);
  for (const e of list) {
    e.names.sort((a, b) => a.localeCompare(b));
    e.places.sort((a, b) => a.name.localeCompare(b.name));
  }
  return list;
}

export function writeCountryIndex(features, dataDir) {
  mkdirSync(dataDir, { recursive: true });
  const list = buildCountryIndex(features);
  writeFileSync(join(dataDir, "countries.json"), JSON.stringify(list));
  return list;
}

// CLI: derive the index from an existing points.geojson.
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const dataDir = join(__dirname, "..", "public", "data");
  const geo = join(dataDir, "points.geojson");
  if (!existsSync(geo)) {
    console.log("No points.geojson — writing empty country index.");
    mkdirSync(dataDir, { recursive: true });
    writeFileSync(join(dataDir, "countries.json"), "[]");
    process.exitCode = 0;
  } else {
    const { features = [] } = JSON.parse(readFileSync(geo, "utf8"));
    const list = writeCountryIndex(features, dataDir);
    console.log(
      `Country index: ${list.length} countries from ${features.length} features.`
    );
    process.exitCode = 0;
  }
}
