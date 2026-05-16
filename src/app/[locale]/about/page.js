import { setRequestLocale, getTranslations } from "next-intl/server";
import { site } from "../../../lib/site.js";

export async function generateMetadata() {
  const t = await getTranslations("about");
  return { title: t("heading") };
}

export default async function About({ params }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("about");

  return (
    <main className="container prose">
      <h1>
        {t("heading")} {site.name} {site.emoji}
      </h1>
      <p>
        {site.name} is an interactive world map of every {site.mappedNoun},
        sourced live from{" "}
        <a href="https://www.openstreetmap.org" target="_blank" rel="noreferrer">
          OpenStreetMap
        </a>{" "}
        (the <code>{site.osm.key}={site.osm.value}</code> tag).
      </p>
      <h2>How it works</h2>
      <p>
        Every point is fetched from the OpenStreetMap Overpass API, deduplicated,
        tagged by country and stored as a static GeoJSON file — no database,
        instant to load. Click any point to see a description from Wikipedia, a
        photo from Wikimedia Commons (or Mapillary as a fallback) and, where
        available, its Google rating.
      </p>
      <h2>Data freshness</h2>
      <p>
        The dataset is automatically refreshed once a month from OpenStreetMap
        via a scheduled GitHub Action, so the map stays current as the world is
        mapped.
      </p>
      <h2>Credits</h2>
      <ul>
        <li>Map data © OpenStreetMap contributors (ODbL)</li>
        <li>Descriptions &amp; images: Wikipedia / Wikimedia Commons</li>
        <li>Street-level photos: Mapillary</li>
        <li>Ratings: Google Places</li>
      </ul>
    </main>
  );
}
