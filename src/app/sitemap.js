import { site } from "../lib/site.js";
import { routing } from "../i18n/routing.js";
import { listCountries } from "../lib/data.js";
import { listPosts } from "../lib/blog.js";

export default async function sitemap() {
  const base = `https://${site.domain}`;
  const countries = await listCountries();
  const posts = await listPosts();
  const urls = [];

  for (const locale of routing.locales) {
    const prefix = locale === routing.defaultLocale ? "" : `/${locale}`;
    urls.push(
      { url: `${base}${prefix || "/"}`, changeFrequency: "monthly", priority: 1 },
      { url: `${base}${prefix}/map`, changeFrequency: "monthly", priority: 0.9 },
      { url: `${base}${prefix}/blog`, changeFrequency: "monthly", priority: 0.6 },
      { url: `${base}${prefix}/about`, changeFrequency: "yearly", priority: 0.4 }
    );
    for (const c of countries)
      urls.push({
        url: `${base}${prefix}/${c.slug}`,
        changeFrequency: "monthly",
        priority: 0.7,
      });
    for (const p of posts)
      urls.push({
        url: `${base}${prefix}/blog/${p.slug}`,
        changeFrequency: "yearly",
        priority: 0.5,
      });
  }
  return urls;
}
