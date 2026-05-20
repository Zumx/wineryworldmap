import { notFound } from "next/navigation";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { MDXRemote } from "next-mdx-remote/rsc";
import { Link } from "../../../../i18n/navigation.js";
import { routing } from "../../../../i18n/routing.js";
import { listPosts, getPost } from "../../../../lib/blog.js";

export async function generateStaticParams() {
  // Union of slugs across all locales (incl. legacy root posts). Combinations
  // where the slug doesn't exist in the requested locale resolve to 404.
  const all = new Set();
  for (const locale of routing.locales) {
    const posts = await listPosts(locale);
    posts.forEach((p) => all.add(p.slug));
  }
  return [...all].map((slug) => ({ slug }));
}

export async function generateMetadata({ params }) {
  const { locale, slug } = await params;
  const post = await getPost(locale, slug);
  if (!post) return {};
  return {
    title: post.meta.title || slug,
    description: post.meta.description || post.meta.excerpt || undefined,
  };
}

export default async function BlogPost({ params }) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("blog");
  const post = await getPost(locale, slug);
  if (!post) notFound();

  return (
    <main className="container prose">
      <Link href="/blog">{t("back")}</Link>
      <h1>{post.meta.title || slug}</h1>
      {post.meta.date && <p className="post-meta">{post.meta.date}</p>}
      <MDXRemote source={post.content} />
    </main>
  );
}
