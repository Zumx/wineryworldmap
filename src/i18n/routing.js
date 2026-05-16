import { defineRouting } from "next-intl/routing";
import { site } from "../lib/site.js";

export const routing = defineRouting({
  locales: site.locales && site.locales.length ? site.locales : ["en"],
  defaultLocale: site.defaultLocale || "en",
  // English (default) has clean URLs with no prefix; other locales get
  // /sv, /de, ... — good for SEO and easy to extend via site.json.
  localePrefix: "as-needed",
});
