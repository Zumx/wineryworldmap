"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useLocale, useTranslations } from "next-intl";
import L from "leaflet";
import "leaflet.markercluster";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import { site } from "../lib/site.js";

// LocationCard is only pulled in the first time a pin is clicked.
const LocationCard = dynamic(() => import("./LocationCard.js"), {
  ssr: false,
});

const LS_KEY = `${site.slug}:showAll`;
const CLUSTER_COLOR = site.colors.primary;

export default function MapView({ embedded = false }) {
  const t = useTranslations("map");
  const locale = useLocale();
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    if (mapRef.current || !containerRef.current) return;

    const map = L.map(containerRef.current, {
      center: [25, 10],
      zoom: embedded ? 2 : 3,
      worldCopyJump: true,
      preferCanvas: true,
    });
    mapRef.current = map;
    if (typeof window !== "undefined") window.__wmMap = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    // tolerance expands the clickable area around each canvas circle so
    // small 5–6px markers are actually hittable (default 0 = must click the
    // exact center, which made pins feel "unclickable").
    const renderer = L.canvas({ padding: 0.5, tolerance: 12 });
    const popup = L.popup();

    const makeCluster = () =>
      L.markerClusterGroup({
        chunkedLoading: true,
        maxClusterRadius: 55,
        iconCreateFunction: (c) => {
          const n = c.getChildCount();
          const size = n < 100 ? 36 : n < 1000 ? 44 : 54;
          return L.divIcon({
            html: `<div style="background:${CLUSTER_COLOR};color:#fff;width:${size}px;height:${size}px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;border:3px solid rgba(255,255,255,.8)">${n}</div>`,
            className: "",
            iconSize: [size, size],
          });
        },
      });

    const mkMarker = (f) => {
      const c = f.geometry.coordinates;
      const m = L.circleMarker([c[1], c[0]], {
        renderer,
        radius: 6,
        weight: 2,
        color: "#ffffff",
        fillColor: CLUSTER_COLOR,
        fillOpacity: 0.9,
        bubblingMouseEvents: false,
      });
      m.feature = f;
      return m;
    };

    const namedCluster = makeCluster();
    const unnamedCluster = makeCluster();
    // One delegated click handler for both clusters → opens LocationCard.
    const onClick = (e) => {
      const f = e.layer && e.layer.feature;
      if (f) setSelected(f);
    };
    // Cursor affordance: canvas circle markers don't change the cursor on
    // their own, so users can't tell a pin is clickable.
    const setCursor = (c) => {
      if (containerRef.current) containerRef.current.style.cursor = c;
    };
    const onOver = (e) => {
      if (e.layer && e.layer.feature) setCursor("pointer");
    };
    const onOut = () => setCursor("");
    for (const cl of [namedCluster, unnamedCluster]) {
      cl.on("click", onClick);
      cl.on("mouseover", onOver);
      cl.on("mouseout", onOut);
    }

    const NOUN = site.mappedNoun;
    let showAll =
      typeof window !== "undefined" && localStorage.getItem(LS_KEY) === "1";

    fetch("/data/points.geojson")
      .then((r) => r.json())
      .then((geo) => {
        const feats = geo.features || [];
        const named = [];
        const unnamed = [];
        for (const f of feats) {
          if (f.properties && f.properties.name) named.push(f);
          else unnamed.push(f);
        }
        namedCluster.addLayers(named.map(mkMarker));
        map.addLayer(namedCluster);

        const countEl = document.getElementById("point-count");
        let unnamedBuilt = false;
        const setCount = () => {
          if (!countEl) return;
          countEl.textContent = showAll
            ? t("allCount", { count: named.length + unnamed.length, noun: NOUN })
            : t("namedCount", { count: named.length, noun: NOUN });
        };
        const applyShowAll = () => {
          if (showAll && unnamed.length) {
            if (!unnamedBuilt) {
              unnamedCluster.addLayers(unnamed.map(mkMarker));
              unnamedBuilt = true;
            }
            map.addLayer(unnamedCluster);
          } else if (map.hasLayer(unnamedCluster)) {
            map.removeLayer(unnamedCluster);
          }
          setCount();
        };
        applyShowAll();

        if (unnamed.length) {
          const Toggle = L.Control.extend({
            onAdd() {
              const b = L.DomUtil.create("button", "map-toggle");
              const label = () => {
                b.textContent = showAll ? t("namedOnly") : t("showAll");
              };
              label();
              L.DomEvent.disableClickPropagation(b);
              b.addEventListener("click", () => {
                showAll = !showAll;
                localStorage.setItem(LS_KEY, showAll ? "1" : "0");
                label();
                applyShowAll();
              });
              return b;
            },
          });
          map.addControl(new Toggle({ position: "topright" }));
        }
      })
      .catch(() => {
        const el = document.getElementById("point-count");
        if (el) el.textContent = t("couldNotLoad");
      });

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <div
        ref={containerRef}
        className={embedded ? "" : "leaflet-fill"}
        style={{ width: "100%", height: "100%" }}
      />
      {!embedded && (
        <div className="map-overlay">
          <h1>
            {site.emoji} {site.name}
          </h1>
          <span className="count" id="point-count">
            {t("loading")}
          </span>
        </div>
      )}
      {selected && (
        <LocationCard
          feature={selected}
          locale={locale}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  );
}
