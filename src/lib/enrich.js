// Client-side, lazy enrichment for LocationCard. All calls are best-effort
// and degrade silently. Wikipedia + Wikimedia need no key; Mapillary uses
// NEXT_PUBLIC_MAPILLARY_TOKEN when present.

const MAPILLARY_TOKEN = process.env.NEXT_PUBLIC_MAPILLARY_TOKEN || "";

async function wikipediaSummary(name, locale) {
  const lang = (locale || "en").split("-")[0];
  // Resolve the best-matching article title, then fetch its summary.
  const searchUrl =
    `https://${lang}.wikipedia.org/w/rest.php/v1/search/title` +
    `?q=${encodeURIComponent(name)}&limit=1`;
  const sRes = await fetch(searchUrl, { headers: { Accept: "application/json" } });
  if (!sRes.ok) return null;
  const sJson = await sRes.json();
  const page = sJson.pages && sJson.pages[0];
  if (!page) return null;
  const sumUrl =
    `https://${lang}.wikipedia.org/api/rest_v1/page/summary/` +
    encodeURIComponent(page.key || page.title);
  const res = await fetch(sumUrl, { headers: { Accept: "application/json" } });
  if (!res.ok) return null;
  const j = await res.json();
  if (j.type === "disambiguation") return null;
  return {
    extract: j.extract || null,
    image:
      (j.originalimage && j.originalimage.source) ||
      (j.thumbnail && j.thumbnail.source) ||
      null,
    url:
      (j.content_urls &&
        j.content_urls.desktop &&
        j.content_urls.desktop.page) ||
      null,
  };
}

async function commonsImage(lat, lon) {
  // Geosearch Wikimedia Commons for a nearby image as a secondary source.
  const url =
    "https://commons.wikimedia.org/w/api.php?origin=*&format=json" +
    "&action=query&generator=geosearch&ggsnamespace=6&ggslimit=1" +
    `&ggscoord=${lat}|${lon}&ggsradius=2000` +
    "&prop=imageinfo&iiprop=url&iiurlwidth=1024";
  const res = await fetch(url);
  if (!res.ok) return null;
  const j = await res.json();
  const pages = j.query && j.query.pages;
  if (!pages) return null;
  const first = Object.values(pages)[0];
  const info = first && first.imageinfo && first.imageinfo[0];
  return info ? info.thumburl || info.url : null;
}

async function mapillaryImage(lat, lon) {
  if (!MAPILLARY_TOKEN) return null;
  const d = 0.01;
  const bbox = `${lon - d},${lat - d},${lon + d},${lat + d}`;
  const url =
    "https://graph.mapillary.com/images" +
    `?access_token=${MAPILLARY_TOKEN}` +
    `&fields=thumb_1024_url&bbox=${bbox}&limit=1`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const j = await res.json();
  const img = j.data && j.data[0];
  return img ? img.thumb_1024_url : null;
}

export async function enrichLocation({ name, lat, lon, locale }) {
  const result = { extract: null, image: null, source: null, wikiUrl: null };
  try {
    if (name) {
      const wiki = await wikipediaSummary(name, locale);
      if (wiki) {
        result.extract = wiki.extract;
        result.wikiUrl = wiki.url;
        if (wiki.image) {
          result.image = wiki.image;
          result.source = "wikipedia";
        }
      }
    }
    if (!result.image) {
      const cm = await commonsImage(lat, lon);
      if (cm) {
        result.image = cm;
        result.source = "commons";
      }
    }
    if (!result.image) {
      const mp = await mapillaryImage(lat, lon);
      if (mp) {
        result.image = mp;
        result.source = "mapillary";
      }
    }
  } catch {
    /* best-effort: leave whatever we have */
  }
  return result;
}
