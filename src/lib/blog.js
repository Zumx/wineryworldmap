// Reads MDX blog posts from src/content/blog/.
//
// Layout:
//   src/content/blog/welcome.mdx           legacy root posts (English fallback)
//   src/content/blog/en/<slug>.mdx         English posts
//   src/content/blog/de/<slug>.mdx         German posts
//   src/content/blog/fr/<slug>.mdx         French posts
//   src/content/blog/it/<slug>.mdx         Italian posts
//
// listPosts(locale) returns posts in <locale>/, plus any legacy root posts
// when locale === defaultLocale (so existing English posts stay visible).
// Slug collisions resolve in favour of the locale-specific file.
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import matter from "gray-matter";
import { routing } from "../i18n/routing.js";

const DIR = join(process.cwd(), "src", "content", "blog");

async function readPostsFrom(dir) {
  let files = [];
  try {
    files = (await readdir(dir)).filter((f) => f.endsWith(".mdx"));
  } catch {
    return [];
  }
  return Promise.all(
    files.map(async (file) => {
      const raw = await readFile(join(dir, file), "utf8");
      const { data } = matter(raw);
      return {
        slug: file.replace(/\.mdx$/, ""),
        title: data.title || file,
        date: data.date || "",
        excerpt: data.excerpt || data.description || "",
      };
    })
  );
}

export async function listPosts(locale) {
  const localePosts = await readPostsFrom(join(DIR, locale));
  const seen = new Set(localePosts.map((p) => p.slug));

  let rootPosts = [];
  if (locale === routing.defaultLocale) {
    const all = await readPostsFrom(DIR);
    rootPosts = all.filter((p) => !seen.has(p.slug));
  }

  return [...localePosts, ...rootPosts].sort((a, b) =>
    String(b.date).localeCompare(String(a.date))
  );
}

export async function getPost(locale, slug) {
  try {
    const raw = await readFile(join(DIR, locale, `${slug}.mdx`), "utf8");
    const { data, content } = matter(raw);
    return { meta: data, content };
  } catch {}

  if (locale === routing.defaultLocale) {
    try {
      const raw = await readFile(join(DIR, `${slug}.mdx`), "utf8");
      const { data, content } = matter(raw);
      return { meta: data, content };
    } catch {}
  }

  return null;
}
