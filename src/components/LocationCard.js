"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { enrichLocation } from "../lib/enrich.js";
import { metaFieldsFor } from "../lib/site.js";

// Lazily mounted (next/dynamic) the first time a pin is clicked.
export default function LocationCard({ feature, locale, onClose }) {
  const t = useTranslations("card");
  const p = feature.properties || {};
  const [lon, lat] = feature.geometry.coordinates;
  const [enriched, setEnriched] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    enrichLocation({ name: p.name, lat, lon, locale }).then((r) => {
      if (alive) {
        setEnriched(r);
        setLoading(false);
      }
    });
    return () => {
      alive = false;
    };
  }, [p.name, lat, lon, locale]);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Common OSM tags carried through by scripts/fetch-data.mjs.
  const rows = [];
  if (p.website)
    rows.push([
      t("website"),
      <a key="w" href={p.website} target="_blank" rel="noreferrer">
        {p.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
      </a>,
    ]);
  if (p.opening_hours) rows.push([t("openingHours"), p.opening_hours]);
  if (p.capacity) rows.push([t("capacity"), p.capacity]);
  if (p.phone) rows.push([t("phone"), p.phone]);
  // Site-specific slot fields (ski: elevation/activities, wine: grape/region…).
  for (const f of metaFieldsFor(p)) rows.push([f.label, f.value]);

  const image = enriched && enriched.image;

  return (
    <div className="loc-backdrop" onClick={onClose}>
      <div
        className="loc-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label={p.name || "Location"}
        style={{ position: "relative" }}
      >
        <button className="loc-close" onClick={onClose} aria-label={t("close")}>
          ×
        </button>
        {image ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img className="loc-img" src={image} alt={p.name || ""} />
        ) : (
          <div className="loc-img" />
        )}
        <div className="loc-body">
          <h2>{p.name || feature.properties.unnamed || "—"}</h2>
          {p.country && <div className="loc-country">{p.country}</div>}

          {p.googleRating != null && (
            <div className="loc-rating">
              {t("googleRating", {
                rating: p.googleRating,
                count: p.googleReviews || 0,
              })}
            </div>
          )}

          {loading ? (
            <>
              <div className="loc-skeleton" style={{ width: "90%" }} />
              <div className="loc-skeleton" style={{ width: "75%" }} />
              <div className="loc-skeleton" style={{ width: "82%" }} />
            </>
          ) : (
            <p className="loc-extract">
              {(enriched && enriched.extract) || t("noDescription")}
            </p>
          )}

          {rows.length > 0 && (
            <ul className="loc-fields">
              {rows.map(([k, v], i) => (
                <li key={i}>
                  <span className="k">{k}</span>
                  <span className="v">{v}</span>
                </li>
              ))}
            </ul>
          )}

          <div style={{ marginTop: 14, fontSize: 13 }}>
            {enriched && enriched.wikiUrl && (
              <a href={enriched.wikiUrl} target="_blank" rel="noreferrer">
                {t("wikipedia")}
              </a>
            )}
            {p.osmType && p.osmId && (
              <>
                {enriched && enriched.wikiUrl ? " · " : ""}
                <a
                  href={`https://www.openstreetmap.org/${p.osmType}/${p.osmId}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  {t("viewOnOsm")}
                </a>
              </>
            )}
          </div>

          {/* Reviews — intentionally disabled; activated later. */}
          <div className="loc-reviews">
            <h3>{t("reviewsHeading")}</h3>
            <p className="disabled-note">{t("reviewsDisabled")}</p>
          </div>
        </div>
        {image && enriched.source && (
          <div className="loc-photo-credit">
            {t("photoVia", { source: enriched.source })}
          </div>
        )}
      </div>
    </div>
  );
}
